/**
 * budgetAllocations.js
 * --------------------
 * Budget allocation shares for the "Your Taxes → Services" feature (F1/F6).
 *
 * Local allocations are now county-specific (Feature 6), derived from
 * NC DST County AFIR FY2025. State and federal remain statewide static values.
 *
 * Sources:
 *   State:   NC Expenditures by Committee CSV (OSBM / Fiscal Research Division)
 *            File: "potential state data source/Expenditures by Committee (1).csv"
 *            All-funds expenditures by appropriations committee.
 *            BUDGET_ALLOCATIONS_STATE top-level splits (K-12 38%, HHS 20%, etc.)
 *            are derived from this file; STATE_OTHER_BREAKDOWN committee shares
 *            are computed directly via pipeline/government_spending.py.
 *   Local:   NC DST County AFIR FY2025, extracted via pipeline/county_expenditures.py
 *            (78 counties from AFIR; 22 missing counties use statewide weighted-average fallback)
 *   Federal: USASpending.gov FY2025 Federal Account Balances (DATA Act)
 *            File: "potential federal data source/
 *                   FY2025P01-P12_All_FA_AccountBalances_2026-06-02_H15M14S40_1.csv"
 *            Gross outlays aggregated by budget_function, FY2025 full year.
 *            FEDERAL_OTHER_BREAKDOWN shares computed via pipeline/government_spending.py.
 *            BUDGET_ALLOCATIONS_FEDERAL top-level (k12/HHS/roads/CC) reflect program-level
 *            filtering; "other" (84.5%) covers SS, Medicare, defense, net interest, etc.
 *
 * IMPORTANT: Local allocations are loaded at runtime from county_local_allocations.json.
 * This file provides state and federal constants + the fallback local values.
 */

// State budget allocations (of NC General Fund expenditures)
// Source: NC Expenditures by Committee CSV (OSBM / Fiscal Research Division)
// Top-level splits derived from committee totals; see pipeline/government_spending.py
export const BUDGET_ALLOCATIONS_STATE = {
  k12:               0.38,
  human_services:    0.20,  // primarily Medicaid at state level
  roads:             0.09,
  community_college: 0.07,
  other:             0.26,
}

// Federal budget allocations (of federal outlays)
// Source: USASpending.gov FY2025 Federal Account Balances (DATA Act), full year
// Top-level program-specific splits (k12/HHS/roads/CC) require account-level filtering.
// Note: "other" includes SS, Medicare, defense, debt service (~84.5% of federal outlays)
export const BUDGET_ALLOCATIONS_FEDERAL = {
  k12:               0.02,
  human_services:    0.10,  // primarily Medicaid at federal level
  roads:             0.03,
  community_college: 0.005,
  other:             0.845,
}

// Statewide weighted-average local allocation fallback.
// Used for 22 counties not in the AFIR and as a reference value.
// Source: NC DST County AFIR FY2025, weighted average of 78 counties with data.
export const BUDGET_ALLOCATIONS_LOCAL_FALLBACK = {
  k12:               0.2824,
  community_college: 0.0219,
  human_services:    0.1459,
  roads:             0.0,    // not separately tracked in county AFIR; embedded in Other
  other:             0.5498,
}

// State "Other" drill-down categories — committee shares of total all-funds expenditures.
// Source: NC Expenditures by Committee CSV (OSBM / Fiscal Research Division)
// Computed by pipeline/government_spending.py. Shares sum to 1.0.
export const STATE_OTHER_BREAKDOWN = [
  { key: 'health_human_services',     label: 'Health and Human Services',        share: 0.526178 },
  { key: 'education',                 label: 'Education',                         share: 0.286658 },
  { key: 'transportation',            label: 'Transportation',                    share: 0.108995 },
  { key: 'justice_public_safety',     label: 'Justice and Public Safety',         share: 0.050620 },
  { key: 'natural_economic_resources',label: 'Natural and Economic Resources',    share: 0.016752 },
  { key: 'general_government',        label: 'General Government',                share: 0.010798 },
]

// Federal "Other" drill-down — budget function shares of total gross outlays, FY2025.
// Source: USASpending.gov FY2025 Federal Account Balances (DATA Act), full year.
// Computed by pipeline/government_spending.py. Shares normalized to sum to 1.0.
// "other_federal_programs" captures: Administration of Justice, Community and Regional
// Development, Commerce and Housing Credit, Agriculture, General Science, and Energy.
export const FEDERAL_OTHER_BREAKDOWN = [
  { key: 'medicare',              label: 'Medicare',                                              share: 0.181230 },
  { key: 'social_security',       label: 'Social Security',                                       share: 0.168054 },
  { key: 'national_defense',      label: 'National Defense',                                      share: 0.132405 },
  { key: 'net_interest',          label: 'Net Interest',                                          share: 0.126868 },
  { key: 'health',                label: 'Health',                                                share: 0.113739 },
  { key: 'income_security',       label: 'Income Security',                                       share: 0.076384 },
  { key: 'general_government',    label: 'General Government',                                    share: 0.051907 },
  { key: 'veterans_benefits',     label: 'Veterans Benefits and Services',                        share: 0.041185 },
  { key: 'other_federal_programs',label: 'Other Federal Programs',                                share: 0.041053 },
  { key: 'education_workforce',   label: 'Education, Training, Employment, and Social Services',  share: 0.023338 },
  { key: 'transportation',        label: 'Transportation',                                        share: 0.017302 },
  { key: 'international_affairs', label: 'International Affairs',                                 share: 0.013296 },
  { key: 'natural_resources',     label: 'Natural Resources and Environment',                     share: 0.013239 },
]

// Public-purpose taxonomy for "Where your taxes go".
// These buckets are designed to be understandable to a general audience while
// still keeping local, state, and federal spending distinct in the UI.
export const PURPOSE_BUCKETS = [
  { key: 'education', label: 'Education' },
  { key: 'health_human_services', label: 'Health & Human Services' },
  { key: 'transportation_infrastructure', label: 'Transportation & Infrastructure' },
  { key: 'public_safety_justice', label: 'Public Safety & Justice' },
  { key: 'government_operations_debt', label: 'Government Operations & Debt' },
  { key: 'retirement_insurance_transfers', label: 'Retirement, Insurance & Transfers' },
  { key: 'defense_veterans', label: 'Defense & Veterans' },
  { key: 'environment_natural_resources', label: 'Environment & Natural Resources' },
  { key: 'other_residual', label: 'Other / Residual' },
]

// Legacy service definitions kept for the Who Funds What panel and any other
// parts of the app that still use the older summary model.
export const SERVICES = [
  { key: 'k12',               label: 'K–12 Education' },
  { key: 'human_services',    label: 'Human Services (incl. Medicaid)' },
  { key: 'roads',             label: 'Roads & Transportation' },
  { key: 'community_college', label: 'Community Colleges' },
  { key: 'other',             label: 'All Other Government Functions' },
]
