import { useSearchParams } from 'react-router-dom'

export function useAppState() {
  const [searchParams, setSearchParams] = useSearchParams()

  const county  = searchParams.get('county')  ?? 'Mecklenburg'
  const bracket = searchParams.get('bracket') ?? '$50K'
  const housing = searchParams.get('housing') ?? 'owner'
  const muni    = searchParams.get('muni')    ?? ''

  function update(patch) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      Object.entries(patch).forEach(([k, v]) => {
        if (v === '' || v == null) next.delete(k)
        else next.set(k, v)
      })
      return next
    })
  }

  return { county, bracket, housing, muni, update }
}
