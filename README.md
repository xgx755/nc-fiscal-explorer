# NC Fiscal Explorer — *Where do my taxes go?*

An open-source civic tool that shows North Carolina residents how their state, county, and local taxes are collected — and where the money goes.

**Live site:** https://xgx755.github.io/nc-fiscal-explorer/

---

## What it does

- **Revenue (Calculator)** — Estimates your annual tax burden — property tax, NC state income tax, sales tax, federal income tax, and employee-side payroll tax — for any NC county, broken down by income bracket ($25K / $50K / $100K / $200K+) and housing status (owner vs. renter). Includes a side-by-side bracket comparison view.
- **Expenditures (Spending)** — Shows how county, state, and federal dollars are allocated across services such as education, public safety, health and human services, and infrastructure, and connects your estimated tax bill directly to those service categories ("Your taxes → services").
- **Historical trends** — Tracks NC's state income tax rate and standard deduction from 2020–2026.
- **Policy simulation** — Lets users explore "what if" scenarios against the baseline estimates.
- **Methodology page** — Full documentation of data sources, formulas, assumptions, and known limitations, including an explanation of tax *incidence* vs. tax *liability*.

All figures are pre-computed at build time by a Python pipeline from official public sources; the browser loads a static JSON lookup table, so the site is fast and works without a backend.

---

## Data sources

| Data | Source | Vintage |
|---|---|---|
| County property tax rates | NCDOR *2024–2025 County Tax Rates and Reappraisal Schedules* | FY 2024–25 |
| County sales tax rates | NCDOR Current Sales and Use Tax Rates | Effective 7/1/2024 |
| NC income tax rate + standard deduction (current & historical) | NCDOR / NCGS § 105-153.7 | 2020–2026 |
| Employee-side payroll tax (Social Security + Medicare) | Federal statutory rates (FICA) | 2026 |
| Median home value / rent by county | ACS 5-year 2023 (via CensusReporter.org) | 2019–2023 |
| Taxable consumption by income bracket | BLS Consumer Expenditure Survey 2024 | Calendar 2024 |
| Federal income tax effective rates | ITEP *Who Pays Taxes in America* (2024) + IRS Statistics of Income (2022) | 2024 / 2022 |
| State budget allocations | NC Expenditures by Committee (OSBM / Fiscal Research Division) | FY2025 |
| Federal budget allocations | USASpending.gov Federal Account Balances (DATA Act) | FY2025 |
| County budget allocations | NC DST County AFIR | FY2025 |

See the full [Methodology page](https://xgx755.github.io/nc-fiscal-explorer/#/methodology) or download the [pipeline audit CSV](https://xgx755.github.io/nc-fiscal-explorer/pipeline_audit.csv) for source-by-source detail, formulas, and known limitations.

---

## Running locally

```bash
npm install
npm run dev
```

Requires Node 20+.

Other scripts:

```bash
npm run build    # production build to dist/
npm run preview  # preview the production build
npm run lint     # run ESLint
```

---

## Project structure

```
nc-fiscal-explorer/   # React + Vite frontend (this app)
pipeline/             # Python scripts that generate the static JSON data used by the app
output/               # Generated JSON lookup tables and pipeline audit CSV
```

The pipeline scripts in `pipeline/` are run independently to regenerate the data files in `output/` (and `nc-fiscal-explorer/public/`) from the raw source files. The frontend itself only reads the pre-generated JSON.

---

## Deploying

GitHub Actions automatically builds and deploys to GitHub Pages on every push to `main`. See [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

---

## Contributing

Found a data error or methodology issue? Open an issue or pull request. The items most open to scrutiny are listed on the Methodology page — these include the income-bracket home value multipliers, the rental cap rate assumption, the CEX consumption estimates at the income extremes, and the federal effective tax rates.

---

## Disclaimer

This tool produces **estimates for educational and civic-engagement purposes**. It is not tax advice and should not be used to calculate actual tax liability. See the Methodology page for the full set of assumptions and limitations.

---

## License

MIT
