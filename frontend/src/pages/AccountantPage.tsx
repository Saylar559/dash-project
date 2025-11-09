import React from 'react';
import { useNavigate } from 'react-router-dom';
import CardBlock from './CardBlock';
import "./style_page/AccountantPage.css";

// Импортируй Footer один раз (путь скорректируй под проект)
import Footer from './Footer';

const cards = [
  {
    title: "Анализ Эскроу",
    icon: "📊",
    desc: "Анализируйте отчёты строительных объектов",
    route: "/accountant/escrow"
  },
  {
    title: "Движение по счетам",
    icon: "💸",
    desc: "Просматривайте списания и поступления средств",
    route: "/accountant/flow"
  },
  {
    title: "Отчёты",
    icon: "🗂️",
    desc: "Скачайте отчёты для руководства",
    route: "/accountant/reports"
  },
  {
    title: "Загрузка Excel",
    icon: "📁",
    desc: "Импортируйте новые файлы — быстро и просто",
    route: "/accountant/import"
  }
];

export default function AccountantPage() {
  const navigate = useNavigate();
  const logout = () => navigate('/login');

  return (
    <div className="accountant-app">
      <header className="accountant-header">
        <h1 className="accountant-title">Панель бухгалтера</h1>
        <button className="accountant-logout-btn" onClick={logout}>Выйти</button>
      </header>
      <main className="accountant-cards-row">
        {cards.map((card) =>
          <CardBlock
            key={card.title}
            title={card.title}
            icon={card.icon}
            onClick={() => {
              if (card.title === "Загрузка Excel") {
                window.open("http://10.10.3.58:5000/", "_blank");
              } else {
                navigate(card.route);
              }
            }}
            className="accountant-card"
          >
            {card.desc}
          </CardBlock>
        )}
      </main>
      <Footer />
    </div>
  );
}
