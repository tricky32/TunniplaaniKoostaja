// src/pages/DataPage.jsx
import React from 'react';
import DataCollector from '../components/DataCollector';

export default function DataPage() {
  return (
    <div>
      <h1>Andmete kogumine</h1>
      <DataCollector departmentId={50001} timetableId={6} />
    </div>
  );
}
