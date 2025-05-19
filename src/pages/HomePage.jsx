// src/pages/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <span style={{ fontSize: '4rem', marginBottom: '1rem', color: '#007bff' }}>
        
      </span>
      <Link
        to="/data"
        style={{
          padding: '1rem 2rem',
          fontSize: '1.5rem',
          backgroundColor: '#007bff',
          color: '#fff',
          borderRadius: '8px',
          textDecoration: 'none',
        }}
      >
        Optimeerimine
      </Link>
    </div>
  );
}
