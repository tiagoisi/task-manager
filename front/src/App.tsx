import { Routes, Route } from 'react-router-dom';
import { TaskListPage } from './components/TaskListPage/TaskListPage';
import { TaskDetailPage } from './components/TaskDetailPage/TaskDetailPage';
import { Layout } from './components/Layout/Layout';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<TaskListPage />} />
        <Route path="/tasks/:id" element={<TaskDetailPage />} />
      </Route>
    </Routes>
  );
}