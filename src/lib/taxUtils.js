/**
 * taxUtils.js
 * -----------
 * Core utility constants and functions for the NC Fiscal Federalism Explorer.
 * V2 additions: payroll tax, service allocations, policy simulation, local Other drill-down.
 */

import {
  BUDGET_ALLOCATIONS_STATE,
  BUDGET_ALLOCATIONS_FEDERAL,
  BUDGET_ALLOCATIONS_LOCAL_FALLBACK,
  SERVICES,
} from './budgetAllocations'

// ── Income brackets ─────────────────────────────────────────────────────────

export const BRACKETS = [
  { key: '$25K',   label: '$25K',   sublabel: 'Lower-income' },
  { key: '$50K',   label: '$50K',   sublabel: 'Moderate-income' },
  { key: '$100K',  label: '$100K',  sublabel: 'Middle/upper-middle' },
  { key: '$200K+', label: '$200K+', sublabel: 'Higher-income' },
]

export const BRACKET_INCOMES = {
  '$25K':   25_000,
  '$50K':   50_000,
  '$100K': 100_000,
  '$200K+': 200_000,
}

// ── Tax row definitions ──────────────────────────────────────────────────────

// V1 rows (without payroll — payroll is handled separately with expand/collapse)
export const TAX_ROWS = [
  { key: 'property_tax',       label: 'Property tax',              level: 'Local',   note: 'Based on county rate' },
  { key: 'sales_tax_local',    label: 'Sales tax (local portion)', level: 'Local',   note: 'Consumption based' },
  { key: 'sales_tax_state',    label: 'Sales tax (state portion)', level: 'State',   note: 'Consumption based' },
  { key: 'state_income_tax',   label: 'NC State income tax',       level: 'State',   note: 'Flat rate applied' },
  { key: 'federal_income_tax', label: 'Federal income tax',        level: 'Federal', note: null },
  // payroll_tax is a V2 row — rendered separately with collapse/expand behavior
  { key: 'payroll_tax',        label: 'Payroll taxes (employee share)', level: 'Federal', note: null, v2: true },
]

// ── Colors ───────────────────────────────────────────────────────────────────

export const LEVEL_COLORS = {
  Local:   '#2d6a30',
  State:   '#c05600',
  Federal: '#1a4480',
}

export const LEVEL_LABELS = ['Local', 'State', 'Federal']

// ── Data quality ─────────────────────────────────────────────────────────────

export function getTaxQualityFlag(taxKey, flags = []) {
  if (taxKey === 'sales_tax_local' || taxKey === 'sales_tax_state') {
    if (flags.includes('cex_tail_reliability_lower')) return 'ESTIMATED'
  }
  return 'RELIABLE'
}

// ── Lookup ───────────────────────────────────────────────────────────────────

export function getTaxRecord(data, county, bracket, housing) {
  return data?.[county]?.[bracket]?.[housing] ?? null
}

// ── Formatting ───────────────────────────────────────────────────────────────

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

// ── Stacked bar ──────────────────────────────────────────────────────────────

/**
 * Returns data for the stacked bar chart.
 * V2: federal segment includes payroll_tax.
 * municipalRate: per-$100 AV extra rate (optional, for F5)
 * homeValue: estimated home value for the selected record (for F5 municipal calc)
 */
export function getStackedBarData(record, municipalRate = 0, homeValue = 0) {
  if (!record) return []
  const { taxes, total } = record
  const local =
    (taxes.property_tax?.annual_burden ?? 0) +
    (taxes.sales_tax_local?.annual_burden ?? 0) +
    (municipalRate > 0 ? (municipalRate / 100) * homeValue : 0)
  const state =
    (taxes.sales_tax_state?.annual_burden ?? 0) +
    (taxes.state_income_tax?.annual_burden ?? 0)
  const federal =
    (taxes.federal_income_tax?.annual_burden ?? 0) +
    (taxes.payroll_tax?.annual_burden ?? 0)
  return [{ name: 'Burden', Local: local, State: state, Federal: federal }]
}

// ── Property tax with municipal overlay (F5) ─────────────────────────────────

/**
 * Computes additional municipal property tax burden at runtime.
 * No pipeline change — rate applied to the same estimated home value used in the record.
 * homeValue must be derived from the property_tax burden and the county rate.
 */
export function getMunicipalPropertyTaxAddition(record, county, countyRate, municipalRate) {
  if (!record || !municipalRate || municipalRate === 0) return 0
  // Back-calculate home value from the property_tax burden and county rate
  const countyBurden = record.taxes.property_tax?.annual_burden ?? 0
  if (!countyRate || countyRate === 0) return 0
  const estimatedHomeValue = (countyBurden / countyRate) * 100
  return Math.round((municipalRate / 100) * estimatedHomeValue)
}

// ── Payroll tax (F2) ─────────────────────────────────────────────────────────

// 2026 parameters — update annually
const SS_RATE        = 0.062
const SS_WAGE_BASE   = 176_100
const MEDICARE_RATE  = 0.0145
const ADD_MEDICARE_RATE      = 0.009
const ADD_MEDICARE_THRESHOLD = 200_000

/**
 * Returns employee-side payroll tax breakdown for a gross income amount.
 * County-invariant (federal tax, same for all NC counties).
 */
export function getPayrollTax(grossIncome) {
  const ssTax       = Math.min(grossIncome, SS_WAGE_BASE) * SS_RATE
  const medicareTax = grossIncome * MEDICARE_RATE
  const addMedicare = Math.max(0, grossIncome - ADD_MEDICARE_THRESHOLD) * ADD_MEDICARE_RATE
  return {
    social_security: Math.round(ssTax),
    medicare:        Math.round(medicareTax + addMedicare),
    annual_burden:   Math.round(ssTax + medicareTax + addMedicare),
    level:           'federal',
  }
}

// ── Service allocations (F1 + F6) ────────────────────────────────────────────

/**
 * Computes estimated dollars from this household going to each public service.
 * localAllocations: the county's allocation object from county_local_allocations.json,
 *   or null to use the statewide fallback.
 *
 * Also accepts optional municipalAddition (dollars) to add to local total (F5).
 */
export function getServiceAllocations(record, localAllocations, municipalAddition = 0) {
  if (!record) return null
  const { taxes } = record
  const localAlloc = localAllocations ?? BUDGET_ALLOCATIONS_LOCAL_FALLBACK

  const localTotal =
    (taxes.property_tax?.annual_burden ?? 0) +
    (taxes.sales_tax_local?.annual_burden ?? 0) +
    municipalAddition

  const stateTotal =
    (taxes.sales_tax_state?.annual_burden ?? 0) +
    (taxes.state_income_tax?.annual_burden ?? 0)

  // Federal total includes payroll tax (V2)
  const federalTotal =
    (taxes.federal_income_tax?.annual_burden ?? 0) +
    (taxes.payroll_tax?.annual_burden ?? 0)

  const grandTotal = localTotal + stateTotal + federalTotal

  return SERVICES.map(service => {
    const amount =
      (localTotal   * (localAlloc[service.key]                   ?? 0)) +
      (stateTotal   * (BUDGET_ALLOCATIONS_STATE[service.key]     ?? 0)) +
      (federalTotal * (BUDGET_ALLOCATIONS_FEDERAL[service.key]   ?? 0))
    return {
      key:             service.key,
      label:           service.label,
      amount:          Math.round(amount),
      pct:             grandTotal > 0 ? amount / grandTotal : 0,
      localDataFlag:   localAlloc._data_quality_flag ?? 'ok',
    }
  })
}

// ── Local Other drill-down (F7) ───────────────────────────────────────────────

/**
 * Splits the local Other dollar amount into AFIR sub-categories.
 * localOtherAmount: the local portion of "All Other Government Functions"
 * localAlloc: county allocation object (must have other_* sub-fields)
 */
export function getLocalOtherBreakdown(localOtherAmount, localAlloc) {
  if (!localAlloc || !localOtherAmount) return null

  const totalOtherShare = localAlloc.other
  if (!totalOtherShare || totalOtherShare === 0) return null

  // Sum the four AFIR sub-categories as a share of total budget
  const pubSafety  = localAlloc.other_public_safety  ?? 0
  const debtSvc    = localAlloc.other_debt_service   ?? 0
  const genGovt    = localAlloc.other_general_govt   ?? 0
  const afirOther  = localAlloc.other_afir_remainder ?? 0
  const subTotal   = pubSafety + debtSvc + genGovt + afirOther

  if (subTotal === 0) return null

  return [
    { key: 'public_safety',  label: 'Public Safety',       amount: Math.round(localOtherAmount * pubSafety  / subTotal) },
    { key: 'debt_service',   label: 'Debt Service',        amount: Math.round(localOtherAmount * debtSvc    / subTotal) },
    { key: 'general_govt',   label: 'General Government',  amount: Math.round(localOtherAmount * genGovt    / subTotal) },
    { key: 'other_other',    label: 'All Other Programs',  amount: Math.round(localOtherAmount * afirOther  / subTotal) },
  ]
}

// ── Policy simulation (F4) ───────────────────────────────────────────────────

/**
 * Computes simulated NC state income tax under user-specified parameters.
 */
export function simulateStateIncomeTax(grossIncome, rate, stdDeduction) {
  return Math.round(Math.max(0, grossIncome - stdDeduction) * rate)
}

/**
 * Returns the delta between simulated and current state income tax.
 * bracketIncome: the dollar income for the selected bracket.
 */
export function getSimulationDelta(currentRecord, bracketIncome, rate, stdDeduction) {
  if (!currentRecord) return null
  const simulated = simulateStateIncomeTax(bracketIncome, rate, stdDeduction)
  const current   = currentRecord.taxes.state_income_tax?.annual_burden ?? 0
  const delta     = simulated - current
  return {
    state_income_tax_simulated: simulated,
    state_income_tax_delta:     delta,
    total_simulated:            Math.round(currentRecord.total.annual_burden + delta),
    total_delta:                delta,
  }
}
