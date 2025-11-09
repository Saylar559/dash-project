import React, { useEffect, useState } from 'react';
import { listSavedDashboards } from '../services/dashboards';
import { Link } from 'react-router-dom';

// Гарантированный показ только опубликованных дашбордов
export default function SavedDashboardsPage(){
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => { 
    listSavedDashboards().then(data => {
      // Лог для дебага структуры массива
      console.log('RAW DASHBOARDS:', data);
      setItems(Array.isArray(data) ? data : []);
    }); 
  }, []);
  
  // Корректно фильтруем только где is_published === true (с учётом всех вариантов)
  const published = items.filter(d => d && (
    d.is_published === true ||
    d.is_published === "true" // если вдруг с backend приходит строка
  ));

  // Доп. лог в консоль для прозрачной отладки
  useEffect(() => {
    console.log('PUBLISHED DASHBOARDS:', published);
  }, [items]);

  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {published.map(d => (
        <Link key={d.id} to={`/dashboards/${d.id}`} className="border rounded p-3 hover:shadow">
          <div className="text-base font-semibold">{d.title || 'Без названия'}</div>
          <div className="text-xs text-gray-500">{d.description || 'Без описания'}</div>
        </Link>
      ))}
      {published.length === 0 &&
        <div className="text-gray-500 col-span-full">
          Нет опубликованных дашбордов
        </div>
      }
    </div>
  );
}
