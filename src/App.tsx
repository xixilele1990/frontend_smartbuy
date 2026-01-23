import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Houses from './pages/Houses';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/houses" element={<Houses />} />
      </Routes>
      <Footer projectName="SmartBuy" teamName="Lexy/Li/Xi" />
    </BrowserRouter>
  );
}

export default App;
