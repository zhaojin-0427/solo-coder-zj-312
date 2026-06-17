import React from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import StudentProfiles from './pages/StudentProfiles';
import ShoeFittings from './pages/ShoeFittings';
import TrainingLogs from './pages/TrainingLogs';
import WearAlerts from './pages/WearAlerts';
import Statistics from './pages/Statistics';
import './App.css';

const navItems = [
  { path: '/profiles', label: '学员足型档案' },
  { path: '/fittings', label: '试鞋记录' },
  { path: '/training', label: '训练日志' },
  { path: '/alerts', label: '磨损预警' },
  { path: '/statistics', label: '统计分析' },
];

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <span className="header-icon">🩰</span>
          <h1>芭蕾足尖鞋适配与训练磨损追踪系统</h1>
        </div>
      </header>
      <nav className="app-nav">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <main className="app-main">
        <Routes>
          <Route path="/profiles" element={<StudentProfiles />} />
          <Route path="/fittings" element={<ShoeFittings />} />
          <Route path="/training" element={<TrainingLogs />} />
          <Route path="/alerts" element={<WearAlerts />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="*" element={<Navigate to="/profiles" replace />} />
        </Routes>
      </main>
    </div>
  );
}
