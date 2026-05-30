import { useState, useEffect } from 'react'

export function useTaxData() {
  const [data,           setData]           = useState(null)
  const [municipalRates, setMunicipalRates] = useState(null)
  const [localAllocs,    setLocalAllocs]    = useState(null)
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState(null)

  useEffect(() => {
    Promise.all([
      fetch('./tax_burden.json').then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() }),
      fetch('./municipal_rates.json').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('./county_local_allocations.json').then(r => r.ok ? r.json() : null).catch(() => null),
    ])
      .then(([taxData, muniData, localData]) => {
        setData(taxData)
        setMunicipalRates(muniData)
        setLocalAllocs(localData)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  return { data, municipalRates, localAllocs, loading, error }
}
