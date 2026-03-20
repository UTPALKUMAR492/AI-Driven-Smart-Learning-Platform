# Verification & Step-by-step Guide

This guide walks through the key user flows you will include in your final submission to demonstrate functionality.

Prerequisites
- Backend started (`backend`):

```bash
cd backend
npm install
# set up .env with MONGODB_URI and JWT_SECRET
npm run dev
```

- Frontend started (`frontend/frontendPage`):

```bash
cd frontend/frontendPage
npm install
# optionally set VITE_API_URL in .env
npm run dev
```

Default local URLs
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173` (or 5174 if 5173 in use)

Flow 1 — Teacher uploads notes and creates course
1. Login as teacher (or create an account and set role to `teacher`).
2. Create a course via the Teacher Dashboard `My Courses` → `+ Create Course`.
3. Add lessons in the course form. For notes:
   - Upload a PDF via the upload UI which POSTs to `/api/upload/notes`.
   - Copy the returned URL (like `/uploads/notes/<file>`) into the lesson `notes` field.
4. Submit course creation. Verify the course `totalLessons` shows the number of lessons added in the `My Courses` table.

Expected: course row shows `N lessons` under course meta and category is visible.

Flow 2 — Student downloads course notes
1. As student, navigate to a course page (`/courses/:id`).
2. Open Overview tab: verify a `Course Notes` section listing downloadable links.
3. Click a note link; it should download or open the PDF (served from backend `/uploads/...`).

Flow 3 — Quiz submission and teacher results
1. Teacher creates a quiz attached to a course.
2. Student opens the quiz and submits answers.
3. Backend creates a `Result` document (verify in MongoDB or via `GET /api/student/quiz-history`).
4. Teacher opens `My Quizzes` → Results (modal). Verify rows display horizontally: Rank | Student | Email | Score | % | Status | Completed.

Notes for screenshots
- For each flow above capture a screenshot showing the important elements: upload response, course notes in Overview, quiz results modal showing rows.
- Save screenshots to `docs/screenshots/` with descriptive names (e.g., `teacher_create_course.png`, `student_course_notes.png`, `teacher_quiz_results.png`).

Troubleshooting
- If a note link returns 404, ensure the backend serves static files (server `index.js` uses `app.use('/uploads', express.static('uploads'))`) and file is present under `backend/uploads/notes`.
- If `totalLessons` shows 0 after adding lessons, ensure the course was saved with `lessons` or `sections`; refresh the Teacher Dashboard to see recalculated `totalLessons`.

Verification checklist (to include in submission)
- [ ] Teacher can upload notes and attach to lessons.
- [ ] Student can access/download course notes.
- [ ] Teacher creates quiz and student can submit answers.
- [ ] Teacher sees quiz results row-wise with pass/fail status.

