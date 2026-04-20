import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Centros from './pages/Centros';
import TelemetriaDetail from './pages/TelemetriaDetail';
import Telemetria from './pages/Telemetria';
import Conversor from './pages/Conversor';
import Monitor from './pages/Monitor';
import SelectorCentros from './pages/SelectorCentros';
import Informacion from './pages/Informacion';
import Diagnostico from './pages/Diagnostico';
import { MqttStatusProvider } from './contexts/MqttStatusContext.jsx';
import './App.css';

function App() {
  return (
    <MqttStatusProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/centros" element={<Centros />} />
            <Route path="/telemetria/:centroId" element={<TelemetriaDetail />} />
            <Route path="/telemetria" element={<Telemetria />} />
            <Route path="/conversor" element={<Conversor />} />
            <Route path="/monitor" element={<Monitor />} />
            <Route path="/selector-centros" element={<SelectorCentros />} />
            <Route path="/informacion" element={<Informacion />} />
            <Route path="/diagnostico" element={<Diagnostico />} />
          </Routes>
        </Layout>
      </Router>
    </MqttStatusProvider>
  );
}

export default App;
