# NC Fiscal Explorer — *Where do my taxes go?*

An open-source civic tool for North Carolina residents to see how their state, county, and local taxes are collected and spent.

**Live site:** https://xgx755.github.io/nc-fiscal-explorer/

---

## What it does

- **Revenue tab** — Estimates your annual tax burden (property tax, state income tax, sales tax, federal income tax) for any NC county, broken down by income bracket and housing status (owner vs. renter).
- **Expenditures tab** — Shows how county, state, and federal dollars are allocated across services like education, public safety, health, and infrastructure.
- **Methodology page** — Full documentation of data sources, assumptions, and known limitations.

All data is pre-computed at build time from official sources; the browser loads a static JSON lookup table.

---

## Data sources

| Data | Source | Vintage |
|---|---|---|
| County property tax rates | NCDOR *2024–2025 County Tax Rates* | FY 2024–25 |
| County sales tax rates | NCDOR Current S&U Tax Rates | Effective 7/1/2024 |
| NC income tax rate | NCDOR / NCGS § 105-153.7 | 2026 tax year |
| Median home value / rent by county | ACS 5-year 2023 (CensusReporter.org) | 2019–2023 |
| Taxable consumption by bracket | BLS Consumer Expenditure Survey 2024 | Calendar 2024 |
| Federal income tax effective rates | ITEP (2024) + IRS Statistics of Income (2022) | 2024 / 2022 |
| State budget allocations | NC OSBM / Fiscal Research Division | FY2025 |
| Federal budget allocations | USASpending.gov Federal Account Balances | FY2025 |
| Local county budget allocations | NC DST County AFIR | FY2025 |

See the full [Methodology page](https://xgx755.github.io/nc-fiscal-explorer/#/methodology) or download the [pipeline audit CSV](https://xgx755.github.io/nc-fiscal-explorer/pipeline_audit.csv) for source-by-source detail.

---

## Running locally

```bash
npm install
npm run dev
```

Requires Node 20+.

---

## Deploying

GitHub Actions automatically builds and deploys to GitHub Pages on every push to `main`. See [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

---

## Contributing

Found a data error or methodology issue? Open an issue or PR. The items most open to scrutiny are listed on the Methodology page.

---

## License

MIT
