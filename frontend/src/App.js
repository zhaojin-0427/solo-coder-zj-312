import React from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import StudentProfiles from './pages/StudentProfiles';
import ShoeFittings from './pages/ShoeFittings';
import TrainingLogs from './pages/TrainingLogs';
import WearAlerts from './pages/WearAlerts';
import Statistics from './pages/Statistics';
import ShoeInventory from './pages/ShoeInventory';
import ShoeBorrowings from './pages/ShoeBorrowings';
import ReturnChecks from './pages/ReturnChecks';
import InventoryAlerts from './pages/InventoryAlerts';
import InventoryStatistics from './pages/InventoryStatistics';
import TrainingPlans from './pages/TrainingPlans';
import WeeklyExecutionRecords from './pages/WeeklyExecutionRecords';
import PhaseEvaluations from './pages/PhaseEvaluations';
import PlanRiskAlerts from './pages/PlanRiskAlerts';
import PlanStatistics from './pages/PlanStatistics';
import InjuryInterventions from './pages/InjuryInterventions';
import RehabilitationReviews from './pages/RehabilitationReviews';
import InterventionReminders from './pages/InterventionReminders';
import RehabilitationStatistics from './pages/RehabilitationStatistics';
import './App.css';

const navItems = [
  { path: '/profiles', label: '学员足型档案' },
  { path: '/fittings', label: '试鞋记录' },
  { path: '/training', label: '训练日志' },
  { path: '/alerts', label: '磨损预警' },
  { path: '/training-plans', label: '训练计划' },
  { path: '/weekly-records', label: '周执行记录' },
  { path: '/phase-evaluations', label: '阶段评估' },
  { path: '/plan-risk-alerts', label: '计划风险提醒' },
  { path: '/injury-interventions', label: '伤痛干预' },
  { path: '/rehabilitation-reviews', label: '康复复查' },
  { path: '/intervention-reminders', label: '干预提醒' },
  { path: '/inventory', label: '鞋款库存' },
  { path: '/borrowings', label: '借用排班' },
  { path: '/returns', label: '归还检查' },
  { path: '/inventory-alerts', label: '库存提醒' },
  { path: '/statistics', label: '统计分析' },
  { path: '/plan-statistics', label: '计划统计' },
  { path: '/inventory-statistics', label: '库存统计' },
  { path: '/rehabilitation-statistics', label: '康复统计' },
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
      <nav className="app-nav nav-scroll">
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
          <Route path="/inventory" element={<ShoeInventory />} />
          <Route path="/borrowings" element={<ShoeBorrowings />} />
          <Route path="/returns" element={<ReturnChecks />} />
          <Route path="/inventory-alerts" element={<InventoryAlerts />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/inventory-statistics" element={<InventoryStatistics />} />
          <Route path="/training-plans" element={<TrainingPlans />} />
          <Route path="/weekly-records" element={<WeeklyExecutionRecords />} />
          <Route path="/phase-evaluations" element={<PhaseEvaluations />} />
          <Route path="/plan-risk-alerts" element={<PlanRiskAlerts />} />
          <Route path="/plan-statistics" element={<PlanStatistics />} />
          <Route path="/injury-interventions" element={<InjuryInterventions />} />
          <Route path="/rehabilitation-reviews" element={<RehabilitationReviews />} />
          <Route path="/intervention-reminders" element={<InterventionReminders />} />
          <Route path="/rehabilitation-statistics" element={<RehabilitationStatistics />} />
          <Route path="*" element={<Navigate to="/profiles" replace />} />
        </Routes>
      </main>
    </div>
  );
}
