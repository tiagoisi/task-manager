import type { TaskStats } from '../types';
import s from './StatBar.module.css';

interface Props { stats: TaskStats }

export function StatBar({ stats }: Props) {
  return (
    <div className={s.grid}>
      <div className={s.card}>
        <span className={s.label}>To do</span>
        <span className={`${s.value} ${s.todo}`}>{stats.todoCount}</span>
        <span className={s.sub}>est. {stats.pendingEstimate.toFixed(1)} pts</span>
      </div>
      <div className={s.card}>
        <span className={s.label}>In progress</span>
        <span className={`${s.value} ${s.progress}`}>{stats.inProgressCount}</span>
        <span className={s.sub}>est. {stats.inProgressEstimate.toFixed(1)} pts</span>
      </div>
      <div className={s.card}>
        <span className={s.label}>Done</span>
        <span className={`${s.value} ${s.done}`}>{stats.doneCount}</span>
        <span className={s.sub}>of {stats.totalTasks} total</span>
      </div>
      <div className={s.card}>
        <span className={s.label}>Total effort</span>
        <span className={`${s.value} ${s.accent}`}>{stats.totalEstimate.toFixed(1)}</span>
        <span className={s.sub}>story points</span>
      </div>
    </div>
  );
}