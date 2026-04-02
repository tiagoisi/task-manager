import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/tasks';
import { TaskForm } from '../TaskForm/TaskForm';
import type { Task } from '../../types';
import { TaskStatus, TaskPriority } from '../../types';

const STATUS_COLOR: Record<string, string> = { todo: '#4e9af1', in_progress: '#f0a050', done: '#52c27a' };
const PRIORITY_COLOR: Record<string, string> = { low: '#52c27a', medium: '#7c6af7', high: '#f0a050', urgent: '#f05070' };

function SubtaskTree({ task, depth = 0, onRefresh }: { task: Task; depth?: number; onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);

  const handleAddSub = async (data: Partial<Task>) => {
    await api.createTask({ ...data, parentId: task.id });
    setShowForm(false);
    onRefresh();
  };

  const handleEdit = async (data: Partial<Task>) => {
    await api.updateTask(task.id, data);
    setEditing(false);
    onRefresh();
  };

  const handleDelete = async () => {
    if (confirm(`Delete "${task.title}"?`)) {
      await api.deleteTask(task.id);
      onRefresh();
    }
  };

  const handleStatus = async (status: TaskStatus) => {
    await api.updateTask(task.id, { status });
    onRefresh();
  };

  const indent = depth * 20;

  return (
    <div style={{ marginLeft: indent, borderLeft: depth > 0 ? '2px solid #35353f' : 'none', paddingLeft: depth > 0 ? 16 : 0, marginTop: 8 }}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_COLOR[task.priority], flexShrink: 0 }} />
            <strong style={{ fontSize: 14, fontWeight: 500 }}>{task.title}</strong>
          </div>
          {task.description && <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>{task.description}</p>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={task.status}
              onChange={e => handleStatus(e.target.value as TaskStatus)}
              style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, color: STATUS_COLOR[task.status], fontSize: 12, padding: '3px 8px', cursor: 'pointer' }}
            >
              <option value="todo">To do</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
            </select>
            {task.estimate != null && <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text3)' }}>{task.estimate} pts</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button onClick={() => setShowForm(true)} style={{ background: 'var(--surface)', border: 'none', borderRadius: 6, color: 'var(--text2)', fontSize: 12, padding: '4px 8px', cursor: 'pointer' }}>+ sub</button>
          <button onClick={() => setEditing(true)} style={{ background: 'var(--surface)', border: 'none', borderRadius: 6, color: 'var(--text2)', fontSize: 12, padding: '4px 8px', cursor: 'pointer' }}>Edit</button>
          <button onClick={handleDelete} style={{ background: 'transparent', border: 'none', borderRadius: 6, color: 'var(--urgent)', fontSize: 12, padding: '4px 8px', cursor: 'pointer' }}>✕</button>
        </div>
      </div>
      {task.subtasks?.map(sub => <SubtaskTree key={sub.id} task={sub} depth={depth + 1} onRefresh={onRefresh} />)}
      {showForm && <TaskForm title="Add subtask" parentId={task.id} onSubmit={handleAddSub} onCancel={() => setShowForm(false)} />}
      {editing && <TaskForm title="Edit subtask" initial={task} onSubmit={handleEdit} onCancel={() => setEditing(false)} />}
    </div>
  );
}

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [editing, setEditing] = useState(false);
  const [showSubForm, setShowSubForm] = useState(false);

  const load = async () => {
    if (!id) return;
    const t = await api.getTask(id);
    setTask(t);
  };

  useEffect(() => { load(); }, [id]);

  const handleUpdate = async (data: Partial<Task>) => {
    await api.updateTask(id!, data);
    setEditing(false);
    load();
  };

  const handleDelete = async () => {
    if (confirm(`Delete "${task?.title}"?`)) {
      await api.deleteTask(id!);
      navigate('/');
    }
  };

  const handleAddSub = async (data: Partial<Task>) => {
    await api.createTask({ ...data, parentId: id });
    setShowSubForm(false);
    load();
  };

  const handleStatus = async (status: TaskStatus) => {
    await api.updateTask(id!, { status });
    load();
  };

  if (!task) return <div style={{ color: 'var(--text3)', padding: 32 }}>Loading…</div>;

  return (
    <div>
      {/* breadcrumb */}
      <div style={{ marginBottom: 20, fontSize: 13, color: 'var(--text3)' }}>
        <Link to="/" style={{ color: 'var(--accent2)' }}>All tasks</Link>
        {/* {task.parent && <> → <Link to={`/tasks/${task.parent.id}`} style={{ color: 'var(--accent2)' }}>{task.parent.id.slice(0, 8)}…</Link></>} {' → '}{task.title} */}
        {task.parentId && <> → <Link to={`/tasks/${task.parentId}`} style={{ color: 'var(--accent2)' }}>{task.parentId.slice(0, 8)}…</Link></>}
        {' → '}{task.title}
      </div>

      {/* header */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: '28px 32px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: PRIORITY_COLOR[task.priority], flexShrink: 0, marginTop: 6 }} />
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.04em', marginBottom: 8 }}>{task.title}</h1>
            {task.description && <p style={{ color: 'var(--text2)', lineHeight: 1.6, marginBottom: 12 }}>{task.description}</p>}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <select value={task.status} onChange={e => handleStatus(e.target.value as TaskStatus)}
                style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: STATUS_COLOR[task.status], fontSize: 13, padding: '5px 10px', cursor: 'pointer', fontWeight: 500 }}>
                <option value="todo">To do</option>
                <option value="in_progress">In progress</option>
                <option value="done">Done</option>
              </select>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>Priority: <strong style={{ color: PRIORITY_COLOR[task.priority] }}>{task.priority}</strong></span>
              {task.estimate != null && <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text2)' }}>{task.estimate} pts</span>}
              <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 'auto' }}>Created {new Date(task.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setEditing(true)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, padding: '7px 14px', cursor: 'pointer' }}>Edit</button>
          <button onClick={() => setShowSubForm(true)} style={{ background: 'var(--accent)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, padding: '7px 14px', cursor: 'pointer' }}>+ Add subtask</button>
          <button onClick={handleDelete} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--urgent)', fontSize: 13, padding: '7px 14px', cursor: 'pointer', marginLeft: 'auto' }}>Delete task</button>
        </div>
      </div>

      {/* subtasks */}
      {(task.subtasks?.length ?? 0) > 0 && (
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 12, color: 'var(--text2)' }}>
            Subtasks ({task.subtasks.length})
          </h2>
          {task.subtasks.map(sub => <SubtaskTree key={sub.id} task={sub} depth={0} onRefresh={load} />)}
        </div>
      )}

      {editing && <TaskForm title="Edit task" initial={task} onSubmit={handleUpdate} onCancel={() => setEditing(false)} />}
      {showSubForm && <TaskForm title="Add subtask" parentId={task.id} onSubmit={handleAddSub} onCancel={() => setShowSubForm(false)} />}
    </div>
  );
}