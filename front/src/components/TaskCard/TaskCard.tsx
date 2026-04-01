import { Link } from 'react-router-dom';
import type { Task } from '../types';
import s from './TaskCard.module.css';

const STATUS_LABEL: Record<string, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
};
const PRIORITY_LABEL: Record<string, string> = {
  low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent',
};

function countSubtasks(task: Task): number {
  if (!task.subtasks?.length) return 0;
  return task.subtasks.reduce((n, s) => n + 1 + countSubtasks(s), 0);
}

interface Props { task: Task }

export function TaskCard({ task }: Props) {
  const total = countSubtasks(task);
  return (
    <Link to={`/tasks/${task.id}`} className={s.card}>
      <div className={s.top}>
        <span className={`${s.priorityDot} ${s[task.priority]}`} title={PRIORITY_LABEL[task.priority]} />
        <span className={s.title}>{task.title}</span>
      </div>
      {task.description && <p className={s.desc}>{task.description}</p>}
      <div className={s.meta}>
        <span className={`${s.badge} ${s[task.status]}`}>
          {STATUS_LABEL[task.status]}
        </span>
        {total > 0 && <span className={s.subtaskCount}>{total} subtask{total !== 1 ? 's' : ''}</span>}
        {task.estimate != null && (
          <span className={s.estimate}>{task.estimate} pts</span>
        )}
      </div>
    </Link>
  );
}