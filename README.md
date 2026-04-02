# TaskFlow — Team Task Manager

A web application to manage tasks for small development teams. Tasks can be organized hierarchically, prioritized, and estimated so the team can understand their workload at a glance.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS · TypeORM · PostgreSQL |
| Frontend | React · Vite · CSS Modules |
| Testing | Jest (unit tests) |

---

## Features

- **Full CRUD** for tasks (create, view, update, delete)
- **Unlimited subtask hierarchy** — subtasks can contain subtasks recursively
- **Status lifecycle** — `todo` → `in progress` → `done`
- **Priority levels** — `low`, `medium`, `high`, `urgent`
- **Effort estimation** — optional story points per task
- **Workload stats** — pending count, in-progress count, total estimated effort (computed across the full subtask tree)
- **Pagination, filtering, and sorting** on the task list
- **Circular reference prevention** at the service layer
- **Input validation** with `class-validator`

---

## Project Structure

```
task-manager/
├── back/       # NestJS API
└── front/      # React + Vite UI
```

---

## Prerequisites

- Node.js 18+
- PostgreSQL running locally

---

## Getting Started

### 1. Database

```sql
CREATE DATABASE task_system;
```

### 2. Backend

```bash
cd back
cp .env.example .env
# Fill in your DB credentials in .env
npm install
npm run start:dev
```

API will be available at `http://localhost:3000/api`

### 3. Frontend

```bash
cd front
cp .env.example .env
npm install
npm run dev
```

UI will be available at `http://localhost:5173`

---

## Environment Variables

### `back/.env`

```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=task_system
FRONTEND_URL=http://localhost:5173
```

### `front/.env`

```env
VITE_API_URL=http://localhost:3000
```

---

## Running Tests

```bash
cd back
npm test              # run all unit tests
npm run test:cov      # with coverage report
```

Tests cover the service layer: task creation, updates, deletion, stats calculation, recursive tree estimates, status counting, and circular reference prevention.

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tasks` | List root tasks (paginated, filterable) |
| `GET` | `/api/tasks/stats` | Workload statistics |
| `GET` | `/api/tasks/:id` | Task detail with full subtask tree |
| `POST` | `/api/tasks` | Create a task |
| `PATCH` | `/api/tasks/:id` | Update a task |
| `DELETE` | `/api/tasks/:id` | Delete a task (cascades to subtasks) |

### Query parameters for `GET /api/tasks`

| Param | Type | Description |
|-------|------|-------------|
| `status` | `todo` \| `in_progress` \| `done` | Filter by status |
| `priority` | `low` \| `medium` \| `high` \| `urgent` | Filter by priority |
| `search` | `string` | Search in title and description |
| `page` | `number` | Page number (default: 1) |
| `limit` | `number` | Items per page (default: 20) |
| `sortBy` | `string` | Field to sort by |
| `sortOrder` | `ASC` \| `DESC` | Sort direction |

---

## AI Usage

This project was developed with the assistance of Claude (Anthropic) as a coding agent. The repository includes a `CLAUDE.md` file with the project configuration used during development.
