import React from 'react';
import { useNavigate } from 'react-router-dom';
import CardBlock from './CardBlock';

// Apple-style emoji icons для панели
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
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: 'linear-gradient(135deg,#F8FBFF 2%,#F2F7FC 50%,#EAEAEA 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '0', // Apple-like, no explicit padding
      position: 'relative'
    }}>
      {/* Шапка с "safe area" отступами */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        minHeight: 80,
        maxHeight: 110,
        background: 'rgba(255,255,255,0.91)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1.5px solid #e3e8f4',
        boxShadow: '0 6px 32px rgba(110,120,170,0.09)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10,
        padding: "0 24px 0 24px",
        transition: 'background 0.32s'
      }}>
        <h1 style={{
          margin: 0,
          color: "#222C51",
          fontWeight: 700,
          fontSize: "2.07rem",
          letterSpacing: "0.01em",
          textShadow: '0 1px 0 #ffffff5a'
        }}>
          Панель бухгалтера
        </h1>
        <button
          onClick={logout}
          style={{
            background: 'linear-gradient(90deg,#ff6579 4%,#fd7d5a 95%)',
            color: "#fff",
            fontWeight: 600,
            fontSize: 17,
            padding: "12px 38px",
            borderRadius: 17,
            border: "none",
            boxShadow: "0 2px 24px rgba(254,74,96,0.11)",
            cursor: "pointer",
            transition: "background .16s, box-shadow .14s",
            outline: "none",
            marginRight: "0"
          }}
        >
          Выйти
        </button>
      </div>

      {/* Cетка квадратов-карточек, Apple-style */}
      <div style={{
        width: "100%",
        maxWidth: 940,
        margin: "0 auto",
        marginTop: 120, // отступ до шапки
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        gap: 32, // Apple-style большие промежутки
        paddingLeft: 22,
        paddingRight: 22
      }}>
        {cards.map((card) =>
          <CardBlock
            key={card.title}
            title={card.title}
            icon={card.icon}
            onClick={() => navigate(card.route)}
            style={{
              flex: "1 1 210px",
              minWidth: 210,
              maxWidth: 300,
              margin: "0",
              borderRadius: 24,
              boxShadow: "0 10px 36px rgba(149,168,202,0.09)",
              background:
                "linear-gradient(120deg,#FFF 62%,#F5F9FF 100%)",
              border: "none",
              transition: "transform .16s, box-shadow .14s",
              cursor: "pointer"
            }}
          >
            {card.desc}
          </CardBlock>
        )}
      </div>
    </div>
  );
}
