import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Telemetria from './pages/Telemetria';
import Validacion from './pages/Validacion';
import Conversor from './pages/Conversor';
import './App.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/telemetria" element={<Telemetria />} />
          <Route path="/validacion" element={<Validacion />} />
          <Route path="/conversor" element={<Conversor />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
