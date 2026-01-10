import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './components/Beranda.jsx';
import Absensi from './components/Absensi';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/absensi" element={<Absensi />} />
      </Routes>
    </Router>
  );
}

export default App;