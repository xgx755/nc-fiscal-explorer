/**
 * PolicySimulation.jsx
 * --------------------
 * Feature 4: NC state income tax "What If" simulation panel.
 *
 * Allows users to adjust NC flat rate and standard deduction to see the
 * dollar delta vs. current parameters. Clearly labeled as SIMULATION.
 * Does not modify the main breakdown table — shows delta row only.
 * No revenue scoring — household incidence only.
 */

import { useState } from 'react'
import { getSimulationDelta, BRACKET_INCOMES, formatCurrency } from '../lib/taxUtils'

// 2026 defaults — must match pipeline values
const DEFAULT_RATE       = 3.99
const DEFAULT_DEDUCTION  = 13_000

const RATE_MIN    = 0
const RATE_MAX    = 8
const RATE_STEP   = 0.1
const DED_MIN     = 0
const DED_MAX     = 30_000
const DED_STEP    = 500

export default function PolicySimulation({ record, bracket }) {
  const [active, setActive] = useState(false)
  const [rate,       setRate]       = useState(DEFAULT_RATE)
  const [deduction,  setDeduction]  = useState(DEFAULT_DEDUCTION)

  const bracketIncome = BRACKET_INCOMES[bracket] ?? 50_000

  const delta = active && record
    ? getSimulationDelta(record, bracketIncome, rate / 100, deduction)
    : null

  const deltaAmount = delta?.state_income_tax_delta ?? 0
  const totalDelta  = delta?.total_delta ?? 0

  function reset() {
    setRate(DEFAULT_RATE)
    setDeduction(DEFAULT_DEDUCTION)
  }

  return (
    <section className="sim-section" aria-labelledby="sim-heading">
      <div className="sim-header">
        <h2 className="section-heading" id="sim-heading">What if?</h2>
        <button
          type="button"
          className={`sim-toggle-btn${active ? ' sim-toggle-btn--active' : ''}`}
          onClick={() => setActive(a => !a)}
          aria-expanded={active}
        >
          {active ? 'Hide simulation' : 'Open simulation mode'}
        </button>
      </div>

      {active && (
        <div className="sim-body">
          <div className="sim-label-row">
            <span className="sim-badge">SIMULATION</span>
            <span className="sim-frame-note">
              Only NC state income tax parameters are adjusted. All other taxes reflect current estimates.
            </span>
          </div>

          <div className="sim-controls">
            <div className="sim-control">
              <label className="sim-control__label" htmlFor="sim-rate">
                NC Income Tax Rate
                <span className="sim-control__value">{rate.toFixed(2)}%</span>
              </label>
              <input
                id="sim-rate"
                type="range"
                className="sim-slider"
                min={RATE_MIN}
                max={RATE_MAX}
                step={RATE_STEP}
                value={rate}
                onChange={e => setRate(Number(e.target.value))}
              />
              <div className="sim-control__bounds">
                <span>0%</span><span>8%</span>
              </div>
            </div>

            <div className="sim-control">
              <label className="sim-control__label" htmlFor="sim-deduction">
                Standard Deduction (single)
                <span className="sim-control__value">{formatCurrency(deduction)}</span>
              </label>
              <input
                id="sim-deduction"
                type="range"
                className="sim-slider"
                min={DED_MIN}
                max={DED_MAX}
                step={DED_STEP}
                value={deduction}
                onChange={e => setDeduction(Number(e.target.value))}
              />
              <div className="sim-control__bounds">
                <span>$0</span><span>$30,000</span>
              </div>
            </div>
          </div>

          {delta && (
            <div className="sim-results" aria-live="polite" aria-label="Simulation results">
              <p className="sim-results__label">Under these parameters:</p>
              <table className="sim-table">
                <tbody>
                  <tr>
                    <td>State income tax</td>
                    <td className="sim-table__amount">{formatCurrency(delta.state_income_tax_simulated)}</td>
                    <td className={`sim-table__delta ${deltaAmount < 0 ? 'delta--down' : deltaAmount > 0 ? 'delta--up' : ''}`}>
                      {deltaAmount === 0
                        ? '— no change'
                        : deltaAmount < 0
                          ? `↓ ${formatCurrency(Math.abs(deltaAmount))} from current`
                          : `↑ ${formatCurrency(deltaAmount)} from current`
                      }
                    </td>
                  </tr>
                  <tr>
                    <td>Total estimated burden</td>
                    <td className="sim-table__amount">{formatCurrency(delta.total_simulated)}</td>
                    <td className={`sim-table__delta ${totalDelta < 0 ? 'delta--down' : totalDelta > 0 ? 'delta--up' : ''}`}>
                      {totalDelta === 0
                        ? '— no change'
                        : totalDelta < 0
                          ? `↓ ${formatCurrency(Math.abs(totalDelta))} from current`
                          : `↑ ${formatCurrency(totalDelta)} from current`
                      }
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <div className="sim-footer">
            <button type="button" className="sim-reset-btn" onClick={reset}>
              Reset to 2026 values
            </button>
            <p className="sim-disclaimer">
              Simulation mode shows how a representative household at this bracket would be affected.
              This is not a tax calculator and does not model individual liability, itemized deductions,
              or the state's revenue impact.
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
