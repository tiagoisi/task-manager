import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/tasks';
import { TaskCard } from '../TaskCard/TaskCard';
import { StatBar } from '../Statbar/Statbar';
import { TaskForm } from '../TaskForm/TaskForm';
import type { Task, TaskStats, PaginatedTasks, TaskQuery } from '../../types';
import { TaskStatus, TaskPriority } from '../../types';
import s from './TaskListPage.module.css';

export function TaskListPage() {
  const [result, setResult] = useState<PaginatedTasks | null>(null);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [query, setQuery] = useState<TaskQuery>({ page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'DESC' });
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    const [tasks, st] = await Promise.all([api.getTasks(query), api.getStats()]);
    setResult(tasks);
    setStats(st);
  }, [query]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setSearch(v);
    setQuery(q => ({ ...q, search: v || undefined, page: 1 }));
  };

  const handleCreate = async (data: Partial<Task>) => {
    await api.createTask(data);
    setShowForm(false);
    load();
  };

  return (
    <>
      {stats && <StatBar stats={stats} />}
      <div className={s.header}>
        <h1 className={s.heading}>All tasks</h1>
        <div className={s.controls}>
          <input className={s.search} placeholder="Search…" value={search} onChange={handleSearch} />
          <select className={s.select} value={query.status ?? ''} onChange={e => setQuery(q => ({ ...q, status: (e.target.value as TaskStatus) || undefined, page: 1 }))}>
            <option value="">All statuses</option>
            <option value="todo">To do</option>
            <option value="in_progress">In progress</option>
            <option value="done">Done</option>
          </select>
          <select className={s.select} value={query.priority ?? ''} onChange={e => setQuery(q => ({ ...q, priority: (e.target.value as TaskPriority) || undefined, page: 1 }))}>
            <option value="">All priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select className={s.select} value={`${query.sortBy}_${query.sortOrder}`} onChange={e => {
            const [by, ord] = e.target.value.split('_');
            setQuery(q => ({ ...q, sortBy: by, sortOrder: ord as 'ASC' | 'DESC' }));
          }}>
            <option value="createdAt_DESC">Newest first</option>
            <option value="createdAt_ASC">Oldest first</option>
            <option value="priority_DESC">Priority ↓</option>
            <option value="title_ASC">Title A–Z</option>
          </select>
          <button className={s.btn} onClick={() => setShowForm(true)}>+ New task</button>
        </div>
      </div>

      {result?.data.length === 0 ? (
        <div className={s.empty}>No tasks found. Create one!</div>
      ) : (
        <div className={s.grid}>
          {result?.data.map(task => <TaskCard key={task.id} task={task} />)}
        </div>
      )}

      {result && result.totalPages > 1 && (
        <div className={s.pagination}>
          <button className={s.pageBtn} disabled={query.page === 1} onClick={() => setQuery(q => ({ ...q, page: q.page! - 1 }))}>← Prev</button>
          <span className={s.pageInfo}>Page {query.page} of {result.totalPages}</span>
          <button className={s.pageBtn} disabled={query.page === result.totalPages} onClick={() => setQuery(q => ({ ...q, page: q.page! + 1 }))}>Next →</button>
        </div>
      )}

      {showForm && <TaskForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />}
    </>
  );
}