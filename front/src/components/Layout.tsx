import { Outlet, Link } from 'react-router-dom';
import s from './Layout.module.css';

export function Layout() {
  return (
    <div className={s.shell}>
      <header className={s.header}>
        <Link to="/" className={s.logo}>
          <span className={s.logoIcon}>⬡</span>
          TaskFlow
        </Link>
      </header>
      <main className={s.main}>
        <Outlet />
      </main>
    </div>
  );
}