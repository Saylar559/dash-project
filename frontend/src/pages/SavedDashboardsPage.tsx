// src/pages/SavedDashboardsPage.tsx
import React, { useEffect, useState } from 'react';
import { listSavedDashboards } from '../services/dashboards';
import { Link } from 'react-router-dom';

export default function SavedDashboardsPage(){
  const [items, setItems] = useState<any[]>([]);
  useEffect(()=>{ listSavedDashboards().then(setItems); },[]);
  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map(d => (
        <Link key={d.id} to={`/dashboards/${d.id}`} className="border rounded p-3 hover:shadow">
          <div className="text-base font-semibold">{d.title}</div>
          <div className="text-xs text-gray-500">{d.description || 'Без описания'}</div>
        </Link>
      ))}
      {items.length===0 && <div className="text-gray-500">Нет сохранённых дашбордов</div>}
    </div>
  );
}
