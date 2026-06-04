import { HashRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { AppDataProvider } from './context/AppDataContext'
import CalculatorPage from './pages/CalculatorPage'
import SpendingPage from './pages/SpendingPage'
import MethodologyPage from './pages/MethodologyPage'
import './App.css'


function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function SiteHeader() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <NavLink to="/" end className="site-brand">Where do my taxes go?</NavLink>
        <nav className="site-nav" aria-label="Site navigation">
          <NavLink
            to="/"
            end
            className={({ isActive }) => isActive ? 'nav-link nav-link--active' : 'nav-link'}
          >
            Revenue
          </NavLink>
          <NavLink
            to="/spending"
            className={({ isActive }) => isActive ? 'nav-link nav-link--active' : 'nav-link'}
          >
            Expenditures
          </NavLink>
          <NavLink
            to="/methodology"
            className={({ isActive }) => isActive ? 'nav-link nav-link--active' : 'nav-link'}
          >
            Methodology
          </NavLink>
        </nav>
      </div>
    </header>
  )
}

function SiteFooter() {
  return (
    <footer className="site-footer" id="about">
      <div className="footer-inner">
        <div className="footer-brand">Where do my taxes go?</div>
        <p className="footer-body">
          An open-source civic tool. Data sourced from official state reporting.
        </p>
        <nav className="footer-nav" aria-label="Footer navigation">
          <a href="./pipeline_audit.csv" download>Data Sources</a>
          <a href="https://github.com/xgx755/nc-fiscal-explorer" target="_blank" rel="noopener noreferrer">GitHub</a>
        </nav>
      </div>
    </footer>
  )
}

export default function App() {
  return (
    <HashRouter>
      <ScrollToTop />
      <AppDataProvider>
        <div className="app">
          <SiteHeader />
          <Routes>
            <Route path="/"            element={<CalculatorPage />} />
            <Route path="/spending"    element={<SpendingPage />} />
            <Route path="/methodology" element={<MethodologyPage />} />
          </Routes>
          <SiteFooter />
        </div>
      </AppDataProvider>
    </HashRouter>
  )
}
