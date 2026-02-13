import { BrowserRouter, Routes, Route } from 'react-router-dom'
import DashboardLayout from './components/DashboardLayout'
import Home from './pages/Home'
import TelemetriaPage from './pages/TelemetriaPage'
import ConversorPage from './pages/ConversorPage'
import ValidacionPage from './pages/ValidacionPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/telemetria" element={<TelemetriaPage />} />
          <Route path="/conversor" element={<ConversorPage />} />
          <Route path="/validacion" element={<ValidacionPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
