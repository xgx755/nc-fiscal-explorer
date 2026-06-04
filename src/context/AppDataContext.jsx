import { createContext, useContext } from 'react'
import { useTaxData } from '../hooks/useTaxData'

const AppDataContext = createContext(null)

export function AppDataProvider({ children }) {
  const data = useTaxData()
  return <AppDataContext.Provider value={data}>{children}</AppDataContext.Provider>
}

export function useAppData() {
  return useContext(AppDataContext)
}
