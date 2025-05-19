// src/App.js
import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/HomePage';
import DataPage from './pages/DataPage';

export default function App() {
  return (
    <div className="App">
      <nav style={{ padding: '0.5rem 1rem' }}>
        <Link
          to="/"
          style={{
            fontSize: '1.5rem',
            color: '#007bff',
            textDecoration: 'none',
          }}
        >
           Tunniplaani Optimeerija
        </Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/data" element={<DataPage />} />
        <Route path="*" element={<h2>404 – Lehte ei leitud</h2>} />
      </Routes>
    </div>
  );
}
