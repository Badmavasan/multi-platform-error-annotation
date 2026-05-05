# Error Annotation Platform

Full-stack annotation tool for reviewing student code submissions. Admins create contexts (platform + submission + answer + predefined errors), assign them to annotators, who then flag additional/missing errors.

## Stack

- **Backend**: FastAPI + SQLAlchemy (sync) + PostgreSQL 16, JWT auth (python-jose), bcrypt
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS, axios, lucide-react, react-router-dom v6
- **Infrastructure**: Docker Compose — PostgreSQL, FastAPI backend, nginx frontend

## Ports

| Service  | Host port | Container port |
|----------|-----------|----------------|
| Frontend | 4000      | 80             |
| Backend  | 8002      | 8000           |
| Postgres | (internal)| 5432           |

## Default credentials

- Admin: `username=admin` / `password=admin` (seeded on first start via `backend/app/seed.py`)

## Key architectural decisions

### Backend
- `backend/requirements.txt` pins `passlib==1.7.4` and `bcrypt==4.0.1` separately — **do not use `passlib[bcrypt]` and do not upgrade bcrypt** (bcrypt ≥4.1 breaks passlib with `ValueError: password cannot be longer than 72 bytes`)
- JWT `sub` claim must be a string: auth.py uses `str(user.id)`, deps.py converts back with `int(sub)`
- Uploaded images stored at `/app/uploads` (Docker volume `uploads_data`), served via FastAPI `StaticFiles` at `/uploads/`
- Nginx proxies both `/api/` and `/uploads/` to the backend container

### Frontend
- No Zustand, no react-query — plain `useState`/`useEffect` + axios
- Auth stored in `localStorage`: `token`, `role`, `user_name`
- Design system: CSS custom properties (`--bg-base`, `--bg-surface`, `--bg-elevated`, `--border`, `--accent`, `--text-primary/secondary/muted`), Space Grotesk (`font-display`), JetBrains Mono (`font-mono`)
- Animations: `animate-fade-up` + `stagger-1` through `stagger-5` classes

## Data model

- `User`: id, username, name, email (nullable), hashed_password, role (admin/annotator), is_active
- `PredefinedError`: id, platform (enum), name, description, display_order
- `Context`: id, platform, title, description, image_url (nullable), student_submission, correct_answer
- `ContextError`: junction — context_id + error_id
- `Assignment`: id, context_id, annotator_id (unique together)
- `Annotation`: id, assignment_id (unique), has_additional_errors, has_missing_errors, missing_errors_text
- `AnnotationAdditionalError`: junction — annotation_id + error_id

## Platforms

`Algopython`, `Pyrates`, `SPY` — platform enum used throughout. Each has 12 predefined errors seeded on startup (only if the errors table is empty).

## API routes

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/login` | Login → JWT |
| GET/POST/PUT/DELETE | `/api/v1/errors` | Predefined error CRUD (admin) |
| POST | `/api/v1/upload/image` | Image upload (admin), returns `{"url": "/uploads/..."}` |
| GET/POST/PUT/DELETE | `/api/v1/contexts` | Context CRUD (admin) |
| GET/POST/DELETE | `/api/v1/assignments` | Assignment management (admin) |
| GET/POST/DELETE | `/api/v1/users` | Annotator management (admin) |
| GET | `/api/v1/annotator/queue` | Annotator's assigned contexts |
| GET | `/api/v1/annotator/queue/:id` | Single queue item |
| POST | `/api/v1/annotator/queue/:id/annotate` | Submit annotation |

## Common commands

```bash
# Full rebuild (reset DB + volumes)
docker compose down -v && docker compose up --build

# Logs
docker compose logs -f backend
docker compose logs -f frontend

# Shell into backend
docker compose exec backend bash
```

## Frontend page structure

```
src/
  pages/
    Login.tsx
    admin/
      Dashboard.tsx       — stat cards + recent contexts
      Contexts.tsx        — list + delete
      ContextForm.tsx     — create/edit with image upload + error selection
      Errors.tsx          — per-platform predefined error CRUD
      Annotators.tsx      — create/delete annotators
      Assignments.tsx     — assign contexts to annotators
    annotator/
      Queue.tsx           — pending + completed assignment list
      AnnotateContext.tsx — annotation form (additional errors, missing errors)
  components/
    AdminLayout.tsx
    AnnotatorLayout.tsx
  api/client.ts           — axios instance with auth interceptor
  types/index.ts
```
