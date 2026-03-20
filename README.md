# AI - Driven Smart Learning Platform

AI-Driven Smart Learning Platform is a full-stack learning management / course platform with teacher, student and Admin roles. It includes features such as course creation, video lessons, notes (PDF) uploads, Ai Generate quizzes, results tracking, and a teacher dashboard with analytics and result viewing.

This repository contains two main apps:
- backend/ — Node.js + Express API and admin/teacher/student routes, MongoDB models, and uploads.
- frontend/frontendPage/ — React (Vite) single page app used by students and teachers.

---

## Project Overview

AI - Driven Smart Learning Platform was built to provide an online learning platform where teachers can create courses (video lessons, downloadable notes), add quizzes, review quiz results, and see analytics about students. Students can enroll in courses, watch lessons, download notes, take quizzes, and view progress.

Key capabilities:
- Teacher flows: create/update courses, upload notes/videos, create quizzes, view enrolled students and quiz attempts.
- Student flows: browse courses, enroll, watch lessons, download course notes, take quizzes, track progress.
- File uploads: video and note uploads stored under `uploads/` and served statically.
- Role-based API access and basic security headers.

---

## Tech Stack — What and Why

Backend
- Node.js + Express
  - Why: lightweight, fast to iterate and integrate with many JS stacks. Express provides a minimal, well-known HTTP framework.
- MongoDB (via mongoose)
  - Why: flexible document model suits course/lesson/quiz schemas and nested enrollment arrays; easy to evolve schema during development.
- Multer
  - Why: simple file upload handling to disk for videos and notes.
- Helmet, CORS
  - Why: security headers and origin control for the API.
- JSON Web Tokens (JWT) & middleware
  - Why: stateless authentication for API routes (teacher/admin/student role checks).

Frontend
- React + Vite
  - Why: React provides modular UI components; Vite gives very fast dev server and build times.
- Axios (via `src/api/axiosConfig.js`)
  - Why: promise-based HTTP client with easy interceptors for auth and base URL handling.
- react-router
  - Why: client-side routing for pages (course details, teacher dashboard, quizzes, etc.).
- react-toastify
  - Why: user-friendly notification toasts for actions and errors.

Why these choices overall
- Full-JS stack (Node + React) simplifies sharing conventions, middlewares, and object shapes between frontend and backend.
- MongoDB naturally models collections like users, courses, quizzes and results with nested documents (e.g. enrollment progress).
- Vite + React speeds up development feedback loops and provides a modern build pipeline.

---

## Architecture & Folder Map (high level)

- backend/
  - index.js — server entry, route registration, static uploads serving
  - controllers/ — request handlers (courseController, quizController, authController, etc.)
  - routes/ — express routes (teacherRoutes, studentRoutes, uploadRoutes, etc.)
  - models/ — mongoose models (User, Course, Quiz, Result, etc.)
  - middleware/ — `authMiddleware`, `roleMiddleware`, `errorHandler`
  - uploads/ — saved files (videos, notes, thumbnails)
  - utils/ — helpers (token generation, LLM client, scoring utility)

- frontend/frontendPage/
  - src/
    - pages/ — React pages (CourseDetails, TeacherDashboard, Quizzes, Login, etc.)
    - components/ — reusable components (Loader, PaymentModal, DraggablePlayer)
    - api/ — wrappers around HTTP calls (`teacherApi.js`, `courseApi.js`, `authApi.js`)
    - context/ — auth & user contexts
    - styles/ — global and page styles

---

## Key Models (summary)

- User
  - fields: name, email, password (hashed), role (student|teacher|admin), avatar, enrolledCourses (array), teachingCourses (array)
  - enrolledCourses holds per-course progress entries and percentComplete.

- Course
  - fields: title, description, instructor, sections[], lessons (legacy array), topics, category, thumbnail, price, totalLessons, totalDuration
  - Lessons may include `notes` which can be URLs to uploaded PDFs.

- Quiz
  - fields: title, courseId, createdBy, difficulty, questions[], passingScore

- Result
  - fields: userId, quizId, score, total, percentage, details[] (per-question user answer + correctness)

---

## Important API Endpoints (examples)

Backend base: `/api`
- Auth: `/api/auth/*` — login, register
- Courses: `/api/courses`
  - `GET /api/courses/:id` — get course (flattened lessons provided for frontend compatibility). This response was extended to include `notes` aggregated from lessons/sections so students can download teacher-uploaded PDFs.
- Uploads: `/api/upload/notes` and `/api/upload/video` — POST file uploads (multer) returning a URL to saved file in `/uploads/notes/...` or `/uploads/videos/...`.
- Teacher (protected): `/api/teacher/*`
  - `GET /api/teacher/courses` — list teacher courses (returns `totalLessons` normalized using `sections`/`lessons`).
  - `GET /api/teacher/quizzes/:id/results` — list quiz results for that quiz (includes `courseTitle`, `courseCategory`, and `passingScore` to enable teacher UI to show pass/fail).
  - `GET /api/teacher/students` — list students enrolled in teacher's courses (enrolledCourses counts are computed by comparing enrollment.course ids with teacher course ids).
- Quiz: `/api/quiz/*` — create/submit quiz; when a student submits answers a `Result` is created.
- Student: `/api/student/*` — endpoints for student stats, recent activity, results lookup (`GET /api/student/results/:id`).

---

## How the teacher dashboard shows notes & quiz results (verification)
- Course notes
  - Teacher uploads notes via `POST /api/upload/notes` which returns `{ url: '/uploads/notes/<file>' }`.
  - When a lesson includes a `notes` link (URL), the course response aggregates those links into `course.notes`. The frontend `CourseDetailsSimple.jsx` renders `course.notes` under the Overview tab as download links.
- Quiz results
  - Teachers open a quiz's results via `GET /api/teacher/quizzes/:id/results`. The backend maps results and includes `courseTitle`, `courseCategory`, and `passingScore` so the frontend can show rank, name, score, percentage, pass/fail.
  - The teacher dashboard displays results row-wise in a table (rank | student | email | score | % | status | completed).

---

## Running the project (development)

Prerequisites
- Node.js (v16+ recommended)
- npm
- MongoDB running locally (or provide `MONGODB_URI` to a hosted DB)

Backend
```bash
cd backend
npm install
# create a .env file with at least: MONGODB_URI, JWT_SECRET, CLIENT_URL
npm run dev   # starts the Express server (nodemon)
```

Frontend
```bash
cd frontend/frontendPage
npm install
# ensure VITE_API_URL in .env (or default to http://localhost:5000/api)
npm run dev   # starts Vite dev server (http://localhost:5173 or 5174)
```

Notes
- Backend serves uploads via `/uploads` (e.g. `http://localhost:5000/uploads/notes/<file.pdf>`).
- CORS is configured to allow the frontend origins defined in `.env` (or localhost ports in `index.js`).

---

## Environment variables (examples)
- backend/.env
  - MONGODB_URI=mongodb://localhost:27017/smartlearning
  - JWT_SECRET=your_jwt_secret
  - CLIENT_URL=http://localhost:5173
  - PORT=5000

- frontend/.env
  - VITE_API_URL=http://localhost:5000/api

---

## Testing & Verification steps (manual)
1. Start backend and frontend.
2. Register/login as a teacher account (or run `scripts/createAdmin.js` to create an admin).
3. Create a course with lessons; add `notes` property to a lesson using the upload flow (upload note PDF via the UI or attach the returned `/uploads/notes/...` url).
4. As a student, enroll and verify `GET /api/courses/:id` shows `notes` array and that the `CourseDetails` Overview renders the download links.
5. Create a quiz for a course and submit answers as a student. Verify `GET /api/teacher/quizzes/:id/results` includes the student result objects with `percentage` and that teacher dashboard shows row-wise results and pass/fail.

---

## Development notes & common customizations
- Legacy compatibility: the backend populates a legacy `lessons` array for frontend compatibility, even when using `sections` internally. This avoided large frontend refactors.
- Course `totalLessons` is computed from `sections` or fallback to `lessons` — ensure it’s updated when adding lessons programmatically.
- File paths returned by upload endpoints are relative (e.g. `/uploads/notes/...`). The frontend resolves those using `VITE_API_URL` to form fully qualified URLs.

---

## Future improvements (suggestions)
- Move file uploads to cloud storage (S3) for scalability; serve signed URLs and offload disk I/O.
- Add comprehensive integration tests for teacher endpoints (courses, students, results).
- Add pagination and filters to teacher results and student lists for large datasets.
- Improve RBAC and audit logging for teacher actions.
- Add role-based UI access tests and E2E tests (Cypress / Playwright).

---

## Where to find things quickly
- Server entry: [backend/index.js](backend/index.js)
- Course logic: [backend/controllers/courseController.js](backend/controllers/courseController.js)
- Teacher routes: [backend/routes/teacherRoutes.js](backend/routes/teacherRoutes.js)
- Models: [backend/models](backend/models)
- Frontend main app: [frontend/frontendPage/src/main.jsx](frontend/frontendPage/src/main.jsx)
- Teacher dashboard page: [frontend/frontendPage/src/pages/TeacherDashboard/TeacherDashboard.jsx](frontend/frontendPage/src/pages/TeacherDashboard/TeacherDashboard.jsx)
- Course details page: [frontend/frontendPage/src/pages/CourseDetails/CourseDetailsSimple.jsx](frontend/frontendPage/src/pages/CourseDetails/CourseDetailsSimple.jsx)

---

## Contribution
If you want to extend or improve the project:
1. Fork and clone the repo.
2. Create a feature branch: `git checkout -b feat/your-feature`.
3. Run and test locally.
4. Open a PR with a clear description.

---

## License & Credits
- Add license details here if needed (MIT or project-specific terms).
- Credits: built as part of SmartLearning project template combining React + Node + MongoDB patterns.

---

If you want, I can also:
- Generate a shortened academic-format summary for your final report.
- Produce diagrams (architecture, ER) to include in the report.
- Create a `docs/` folder with step-by-step screenshots for submission.

