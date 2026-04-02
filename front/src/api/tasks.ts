import type { Task, TaskStats, PaginatedTasks, TaskQuery } from '../types';

const BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/tasks`;

const q = (params: Record<string, any>) => {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') p.set(k, String(v));
  });
  const s = p.toString();
  return s ? `?${s}` : '';
};

export const api = {
  getTasks: async (query: TaskQuery = {}): Promise<PaginatedTasks> => {
    const res = await fetch(`${BASE}${q(query)}`);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  },

  getTask: async (id: string): Promise<Task> => {
    const res = await fetch(`${BASE}/${id}`);
    if (!res.ok) throw new Error('Task not found');
    return res.json();
  },

  getStats: async (): Promise<TaskStats> => {
    const res = await fetch(`${BASE}/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  createTask: async (data: Partial<Task>): Promise<Task> => {
    const res = await fetch(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create task');
    return res.json();
  },

  updateTask: async (id: string, data: Partial<Task>): Promise<Task> => {
    const res = await fetch(`${BASE}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update task');
    return res.json();
  },

  deleteTask: async (id: string): Promise<void> => {
    const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete task');
  },
};