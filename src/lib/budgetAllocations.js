/**
 * budgetAllocations.js
 * --------------------
 * Budget allocation shares for the "Your Taxes → Services" feature (F1/F6).
 *
 * Local allocations are now county-specific (Feature 6), derived from
 * NC DST County AFIR FY2025. State and federal remain statewide static values.
 *
 * Sources:
 *   State:   NC OSBM FY2024 Budget Summary, expenditures by function
 *            (K-12 38%, Medicaid/Human Services 20%, NCDOT 9%, Community Colleges 7%, Other 26%)
 *   Local:   NC DST County AFIR FY2025, extracted via pipeline/county_expenditures.py
 *            (78 counties from AFIR; 22 missing counties use statewide weighted-average fallback)
 *   Federal: OMB Historical Table 3.2 FY2023, outlays by function and subfunction
 *            (K-12 2%, Human Services/Medicaid 10%, Roads/Transp 3%, Comm Colleges <1%, Other 84.5%)
 *            Note: federal "Other" includes Social Security, Medicare, defense, and net interest —
 *            together ~75% of federal outlays. Only ~15% flows to named services below.
 *
 * IMPORTANT: Local allocations are loaded at runtime from county_local_allocations.json.
 * This file provides state and federal constants + the fallback local values.
 */

// State budget allocations (of NC General Fund expenditures)
// Source: OSBM FY2024 Budget Summary
export const BUDGET_ALLOCATIONS_STATE = {
  k12:               0.38,
  human_services:    0.20,  // primarily Medicaid at state level
  roads:             0.09,
  community_college: 0.07,
  other:             0.26,
}

// Federal budget allocations (of federal outlays)
// Source: OMB Historical Table 3.2 FY2023
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

// Service definitions (order = display order; Other always last in UI)
export const SERVICES = [
  { key: 'k12',               label: 'K–12 Education' },
  { key: 'human_services',    label: 'Human Services (incl. Medicaid)' },
  { key: 'roads',             label: 'Roads & Transportation' },
  { key: 'community_college', label: 'Community Colleges' },
  { key: 'other',             label: 'All Other Government Functions' },
]
