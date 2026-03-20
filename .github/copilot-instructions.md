# Copilot Instructions for SmartLearning

## Big Picture Architecture
- **Monorepo Structure**: Contains `backend` (Node.js/Express/MongoDB) and `frontend` (React/Vite) apps. Each has its own `package.json` and build/test workflows.
- **Backend**: RESTful API with modular routes for `auth`, `courses`, `quiz`, `admin`, `teacher`, `recommendation`, and `student`. Security via `helmet`, CORS, and custom headers. MongoDB models for core entities (Course, Quiz, User, etc.).
- **Frontend**: SPA in `frontend/frontendPage` using React, React Router, and Vite. API calls are abstracted in `src/api/*Api.js` files, matching backend routes. Contexts for auth/user state, reusable components for cards, navigation, and error boundaries.

## Developer Workflows
- **Backend**:
  - Start: `npm run dev` (nodemon) or `npm start` in `backend/`
  - Environment: `.env` required for DB and CLIENT_URL
  - Debug: `/debug/echo` endpoint for POST body/headers echo
- **Frontend**:
  - Start: `npm run dev` in `frontend/frontendPage/`
  - Build: `npm run build`
  - Preview: `npm run preview`
- **Shared**:
  - Static uploads served from `/uploads` (backend)
  - Health check: GET `/` on backend

## Project-Specific Patterns & Conventions
- **API Layer**: Frontend API modules (e.g., `teacherApi.js`) use a shared `axiosConfig.js` for base config and error handling. Backend routes are grouped by role/function.
- **Error Handling**: Frontend extracts error from `err.response.data` and throws for catch blocks. Backend uses middleware for error and role-based auth.
- **Security**: Backend disables some default headers and enforces strict CORS. Only whitelisted origins allowed.
- **Data Flow**: Most frontend API calls map directly to backend REST endpoints (e.g., `/teacher/courses`, `/quiz`).
- **Component Structure**: Frontend uses folders for each major component/page, with CSS colocated. Contexts in `src/context/`.

## Integration Points & External Dependencies
- **Backend**: Uses `express`, `mongoose`, `jsonwebtoken`, `multer` (uploads), `helmet`, `cors`, `dotenv`, `bcryptjs`.
- **Frontend**: Uses `react`, `react-router-dom`, `axios`, `react-toastify`, `recharts`, `bootstrap`.
- **Environment Variables**: Backend expects `.env` for DB and client URL config.

## Examples & Key Files
- **Backend Entrypoint**: `backend/index.js` (shows middleware, route setup, security)
- **Frontend API Example**: `frontend/frontendPage/src/api/teacherApi.js` (shows REST mapping, error handling)
- **Frontend Context Example**: `frontend/frontendPage/src/context/AuthContext.jsx`
- **Backend Model Example**: `backend/models/User.js`, `backend/models/Course.js`

## Tips for AI Agents
- Always match frontend API endpoints to backend route structure.
- Use provided error handling patterns in both frontend and backend.
- Respect CORS and security headers when testing locally.
- For new features, follow the modular structure (new routes/controllers/models in backend, new API/component/context in frontend).
- Reference health/debug endpoints for quick backend checks.

---
For questions or missing conventions, ask for clarification or examples from maintainers.