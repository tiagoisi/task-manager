import { useState } from 'react';
import type { Task } from '../../types';
import { TaskStatus, TaskPriority } from '../../types';
import s from './TaskForm.module.css';

interface Props {
  initial?: Partial<Task>;
  parentId?: string;
  onSubmit: (data: Partial<Task>) => Promise<void>;
  onCancel: () => void;
  title?: string;
}

export function TaskForm({ initial = {}, parentId, onSubmit, onCancel, title = 'New task' }: Props) {
  const [form, setForm] = useState({
    title: initial.title ?? '',
    description: initial.description ?? '',
    status: initial.status ?? TaskStatus.TODO,
    priority: initial.priority ?? TaskPriority.MEDIUM,
    estimate: initial.estimate != null ? String(initial.estimate) : '',
  });
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setLoading(true);
    try {
      await onSubmit({
        title: form.title.trim(),
        description: form.description || undefined,
        status: form.status as TaskStatus,
        priority: form.priority as TaskPriority,
        estimate: form.estimate !== '' ? parseFloat(form.estimate) : undefined,
        ...(parentId ? { parentId } : {}),
      });
    } finally { setLoading(false); }
  };

  return (
    <div className={s.overlay} onClick={e => e.target === e.currentTarget && onCancel()}>
      <form className={s.dialog} onSubmit={handle}>
        <span className={s.title}>{title}</span>
        <div className={s.field}>
          <label className={s.label}>Title *</label>
          <input className={s.input} value={form.title} onChange={set('title')} placeholder="What needs to be done?" autoFocus required />
        </div>
        <div className={s.field}>
          <label className={s.label}>Description</label>
          <textarea className={s.textarea} value={form.description} onChange={set('description')} placeholder="Add more context…" />
        </div>
        <div className={s.row}>
          <div className={s.field}>
            <label className={s.label}>Status</label>
            <select className={s.select} value={form.status} onChange={set('status')}>
              <option value="todo">To do</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div className={s.field}>
            <label className={s.label}>Priority</label>
            <select className={s.select} value={form.priority} onChange={set('priority')}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
        <div className={s.field}>
          <label className={s.label}>Estimate (story points)</label>
          <input className={s.input} type="number" min="0" step="0.5" value={form.estimate} onChange={set('estimate')} placeholder="e.g. 3" />
        </div>
        <div className={s.actions}>
          <button type="button" className={`${s.btn} ${s.btnSecondary}`} onClick={onCancel}>Cancel</button>
          <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={loading}>
            {loading ? 'Saving…' : 'Save task'}
          </button>
        </div>
      </form>
    </div>
  );
}