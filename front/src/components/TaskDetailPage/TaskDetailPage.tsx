import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/tasks';
import { TaskForm } from '../TaskForm/TaskForm';
import type { Task } from '../../types';
import { TaskStatus } from '../../types';
import styles from './TaskDetailPage.module.css';

const STATUS_COLOR: Record<string, string> = { todo: '#4e9af1', in_progress: '#f0a050', done: '#52c27a' };
const PRIORITY_COLOR: Record<string, string> = { low: '#52c27a', medium: '#7c6af7', high: '#f0a050', urgent: '#f05070' };

function SubtaskTree({ task, depth = 0, onRefresh }: { task: Task; depth?: number; onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);

  const indent = depth * 20;

  return (
    <div
      className={styles.subtaskWrapper}
      style={{
        marginLeft: indent,
        borderLeft: depth > 0 ? '2px solid #35353f' : 'none',
        paddingLeft: depth > 0 ? 16 : 0
      }}
    >
      <div className={styles.subtaskInner}>
        <div className={styles.subtaskContent}>
          <div className={styles.subtaskHeader}>
            <span
              className={styles.subtaskDot}
              style={{ background: PRIORITY_COLOR[task.priority] }}
            />
            <strong className={styles.subtaskTitle}>{task.title}</strong>
          </div>

          {task.description && (
            <p className={styles.subtaskDesc}>{task.description}</p>
          )}

          <div className={styles.subtaskMeta}>
            <select
              value={task.status}
              onChange={e => api.updateTask(task.id, { status: e.target.value as TaskStatus }).then(onRefresh)}
              className={styles.select}
              style={{ color: STATUS_COLOR[task.status] }}
            >
              <option value="todo">To do</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
            </select>

            {task.estimate != null && (
              <span className={styles.estimate}>{task.estimate} pts</span>
            )}
          </div>
        </div>

        <div className={styles.subtaskActions}>
          <button onClick={() => setShowForm(true)} className={styles.subtaskBtn}>+ sub</button>
          <button onClick={() => setEditing(true)} className={styles.subtaskBtn}>Edit</button>
          <button
            onClick={() => {
              if (confirm(`Delete "${task.title}"?`)) {
                api.deleteTask(task.id).then(onRefresh);
              }
            }}
            className={`${styles.subtaskBtn} ${styles.subtaskDelete}`}
          >
            ✕
          </button>
        </div>
      </div>

      {task.subtasks?.map(sub => (
        <SubtaskTree key={sub.id} task={sub} depth={depth + 1} onRefresh={onRefresh} />
      ))}

      {showForm && (
        <TaskForm
          title="Add subtask"
          parentId={task.id}
          onSubmit={async data => {
            await api.createTask({ ...data, parentId: task.id });
            setShowForm(false);
            onRefresh();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editing && (
        <TaskForm
          title="Edit subtask"
          initial={task}
          onSubmit={async data => {
            await api.updateTask(task.id, data);
            setEditing(false);
            onRefresh();
          }}
          onCancel={() => setEditing(false)}
        />
      )}
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

  if (!task) return <div className={styles.empty}>Loading…</div>;

  return (
    <div className={styles.container}>
      {/* breadcrumb */}
      <div className={styles.breadcrumb}>
        <Link to="/" className={styles.link}>All tasks</Link>
        {task.parentId && (
          <> → <Link to={`/tasks/${task.parentId}`} className={styles.link}>
            {task.parentId.slice(0, 8)}…
          </Link></>
        )}
        {' → '}{task.title}
      </div>

      {/* header */}
      <div className={styles.card}>
        <div className={styles.headerRow}>
          <span
            className={styles.priorityDot}
            style={{ background: PRIORITY_COLOR[task.priority] }}
          />

          <div style={{ flex: 1 }}>
            <h1 className={styles.title}>{task.title}</h1>

            {task.description && (
              <p className={styles.description}>{task.description}</p>
            )}

            <div className={styles.metaRow}>
              <select
                value={task.status}
                onChange={e => api.updateTask(id!, { status: e.target.value as TaskStatus }).then(load)}
                className={styles.select}
                style={{ color: STATUS_COLOR[task.status] }}
              >
                <option value="todo">To do</option>
                <option value="in_progress">In progress</option>
                <option value="done">Done</option>
              </select>

              <span className={styles.priorityText}>
                Priority: <strong style={{ color: PRIORITY_COLOR[task.priority] }}>{task.priority}</strong>
              </span>

              {task.estimate != null && (
                <span className={styles.estimate}>{task.estimate} pts</span>
              )}

              <span className={styles.created}>
                Created {new Date(task.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button onClick={() => setEditing(true)} className={`${styles.btn} ${styles.btnEdit}`}>
            Edit
          </button>

          <button onClick={() => setShowSubForm(true)} className={`${styles.btn} ${styles.btnPrimary}`}>
            + Add subtask
          </button>

          <button
            onClick={async () => {
              if (confirm(`Delete "${task.title}"?`)) {
                await api.deleteTask(id!);
                navigate('/');
              }
            }}
            className={`${styles.btn} ${styles.btnDelete}`}
          >
            Delete task
          </button>
        </div>
      </div>

      {/* subtasks */}
      {(task.subtasks?.length ?? 0) > 0 && (
        <div>
          <h2 className={styles.subtasksTitle}>
            Subtasks ({task.subtasks.length})
          </h2>

          {task.subtasks.map(sub => (
            <SubtaskTree key={sub.id} task={sub} depth={0} onRefresh={load} />
          ))}
        </div>
      )}

      {editing && (
        <TaskForm
          title="Edit task"
          initial={task}
          onSubmit={async data => {
            await api.updateTask(id!, data);
            setEditing(false);
            load();
          }}
          onCancel={() => setEditing(false)}
        />
      )}

      {showSubForm && (
        <TaskForm
          title="Add subtask"
          parentId={task.id}
          onSubmit={async data => {
            await api.createTask({ ...data, parentId: id });
            setShowSubForm(false);
            load();
          }}
          onCancel={() => setShowSubForm(false)}
        />
      )}
    </div>
  );
}