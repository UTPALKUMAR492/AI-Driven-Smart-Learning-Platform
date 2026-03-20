# SmartLearning — Final Project Report

## Abstract
SmartLearning is a web-based learning management platform enabling instructors to create video-based courses with downloadable notes and quizzes, and allowing students to enroll, complete lessons, and take assessments. The system provides teacher dashboards with course analytics and quiz result reporting.

## Objectives
- Provide a simple, scalable platform for delivering self-paced courses.
- Support multimedia lessons (video + downloadable notes) and quizzes with result tracking.
- Offer teachers actionable analytics and an easy-to-use course/quiz management UI.

## System Overview
SmartLearning is implemented as a two-tier web application:
- Backend API: Node.js + Express + MongoDB (Mongoose)
- Frontend SPA: React + Vite

The backend exposes REST endpoints for authentication, courses, uploads, quizzes, results, teacher analytics and student data. Files uploaded (videos, notes) are stored on disk under `uploads/` and served statically by the server.

## Architecture
See `docs/diagrams.md` for high-level architecture and data model diagrams (Mermaid). In short:
- Client (browser) → Frontend (React) → Backend API (Express) → MongoDB
- File uploads are handled by Multer and saved under `uploads/`.

## Data Model (summary)
- User: name, email, role (student|teacher|admin), avatar, enrolledCourses (with progress), teachingCourses
- Course: title, description, instructor, sections (lessons), legacy `lessons` array for frontend compatibility, category, thumbnail, totalLessons
- Quiz: title, courseId, createdBy, difficulty, questions[], passingScore
- Result: userId, quizId, score, total, percentage, details[]

Rationale: MongoDB's document model fits the nested enrollment/progress structure and allows evolving the schema without heavy migrations.

## Technology Choices (What and Why)
- Node.js + Express: fast JavaScript stack with broad ecosystem; easy to integrate with the frontend which is also JS.
- MongoDB (Mongoose): flexible schema for documents like courses and user enrollments that contain arrays of nested objects.
- React + Vite: component-based UI and fast developer experience (Vite hot-reload).
- Axios: robust HTTP client with interceptors for auth.
- Multer: reliable disk-based uploads for files during development.
- Helmet + CORS: provide basic security hardening and origin restrictions.

## Key Implementation Details
- Course compatibility: backend flattens `sections` into `lessons` when returning course details so the existing frontend can consume a legacy `lessons` array.
- Notes aggregation: `GET /api/courses/:id` now includes `notes` aggregated from lesson and section `notes` fields, enabling a single list of downloadable course resources.
- Teacher results: `GET /api/teacher/quizzes/:id/results` returns enriched result objects with `courseTitle`, `courseCategory`, and `passingScore` to make pass/fail computation and display straightforward on the frontend.

## API Overview (selected endpoints)
- `POST /api/auth/login` — login
- `POST /api/upload/notes` — upload note (returns URL)
- `GET /api/courses/:id` — get course details (includes `notes` array)
- `GET /api/teacher/courses` — teacher's course list (normalized `totalLessons`)
- `GET /api/teacher/quizzes/:id/results` — quiz results for teacher with pass/fail metadata
- `POST /api/quiz/:id/submit` — submit quiz answers (creates Result)

## Security & Roles
- Authentication via JWT stored client-side; `protect` middleware enforces authentication for protected routes.
- Role-based middleware (`isTeacherOrAdmin`) restricts teacher/admin-only endpoints.
- Helmet is used to add safe HTTP headers; CORS restricts allowed origins configured in `index.js`.

## Testing & Verification
Manual verification steps and screenshots are provided in `docs/VERIFICATION_STEPS.md`.
Automated testing: the project includes some tests in `backend/tests/` (integration tests). Adding E2E tests with Cypress is recommended for the full flow.

## Limitations & Future Work
- File storage on disk is suitable for development but should be replaced by cloud object storage (S3/GCS) for production.
- Add pagination for large teacher result lists and student lists.
- Improve role/audit logging, rate limiting, and more robust input validation for production-readiness.

## Conclusion
SmartLearning delivers a functional full-stack platform for self-paced learning with teacher management and analytics. The stack was chosen for developer productivity and for its suitability to the problem domain (nested documents and frequent schema iteration).

---

For diagrams, verification steps, and screenshots see the `docs/` folder.
