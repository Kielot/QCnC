import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import NewTest from './pages/NewTest';
import TestMonitoring from './pages/TestMonitoring';
import TestHistory from './pages/TestHistory';
import EvaluationResults from './pages/EvaluationResults';
import SystemConfiguration from './pages/SystemConfiguration';
export default function App() {
  return <BrowserRouter><Routes><Route element={<Layout />}>
    <Route index element={<Dashboard />} /><Route path="new" element={<NewTest />} /><Route path="monitor" element={<TestMonitoring />} /><Route path="monitor/:id" element={<TestMonitoring />} />
    <Route path="history" element={<TestHistory />} /><Route path="results" element={<EvaluationResults />} /><Route path="config" element={<SystemConfiguration />} /><Route path="*" element={<Navigate to="/" replace />} />
  </Route></Routes></BrowserRouter>;
}
