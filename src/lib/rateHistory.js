/**
 * rateHistory.js
 * --------------
 * Historical NC state income tax rates and standard deductions (2020–2026).
 * Used by Feature 3 (Historical / Longitudinal Data trend chart).
 *
 * V2 scope: confirmed historical rates only (2020–2026).
 * Projected future reductions (2027–2028) are deferred to V3 — see v3-notes.md.
 *
 * Sources:
 *   - NCDOR rate schedules (confirmed per tax year)
 *   - NCGS § 105-153.7 (NC income tax rate and standard deduction)
 *
 * Standard deduction values confirmed from NCDOR:
 *   2020–2021: $10,750 (single filer)
 *   2022–2023: $12,750
 *   2024–2026: $13,000
 */

export const NC_INCOME_TAX_HISTORY = [
  { year: 2020, rate: 0.0525, std_deduction_single: 10_750 },
  { year: 2021, rate: 0.0525, std_deduction_single: 10_750 },
  { year: 2022, rate: 0.0499, std_deduction_single: 12_750 },
  { year: 2023, rate: 0.0475, std_deduction_single: 12_750 },
  { year: 2024, rate: 0.0450, std_deduction_single: 13_000 },
  { year: 2025, rate: 0.0425, std_deduction_single: 13_000 },
  { year: 2026, rate: 0.0399, std_deduction_single: 13_000 },
]

// Bracket income values (must stay in sync with pipeline/data_sources.py)
export const BRACKET_INCOMES = {
  '$25K':   25_000,
  '$50K':   50_000,
  '$100K': 100_000,
  '$200K+': 200_000,
}

/**
 * Computes estimated state income tax for a given bracket and historical year.
 * Formula: max(0, income - std_deduction) × rate
 * All other factors held constant at current values — only rate and std deduction vary.
 */
export function getHistoricalStateIncomeTax(bracket, year) {
  const entry = NC_INCOME_TAX_HISTORY.find(h => h.year === year)
  if (!entry) return null
  const income = BRACKET_INCOMES[bracket]
  if (income == null) return null
  return Math.round(Math.max(0, income - entry.std_deduction_single) * entry.rate)
}

/**
 * Returns the full trend series for a bracket: [{year, amount}, ...]
 */
export function getStateTaxTrend(bracket) {
  return NC_INCOME_TAX_HISTORY.map(entry => ({
    year: entry.year,
    amount: getHistoricalStateIncomeTax(bracket, entry.year),
    rate: entry.rate,
    std_deduction: entry.std_deduction_single,
  }))
}
