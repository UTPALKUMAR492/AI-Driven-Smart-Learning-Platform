# Diagrams (Mermaid)

## System Architecture

```mermaid
flowchart LR
  Browser[Browser (React SPA)] -->|API calls| Frontend{Vite dev server}
  Frontend -->|HTTP| API[Express API (Node.js)]
  API -->|DB queries| MongoDB[(MongoDB)]
  API -->|serves files| Files[/uploads/*]
  API -->|uploads| Multer[Multer]
  subgraph Backend
    API
    Multer
  end
```

## Data Model (simplified ER)

```mermaid
erDiagram
  USER ||--o{ ENROLLMENT : has
  USER ||--o{ RESULT : takes
  USER }|..|{ COURSE : teaches

  COURSE ||--o{ SECTION : contains
  SECTION ||--o{ LESSON : contains
  COURSE ||--o{ QUIZ : has
  QUIZ ||--o{ QUESTION : contains
  QUIZ ||--o{ RESULT : has

  USER {
    ObjectId _id
    string name
    string email
    string role
  }
  COURSE {
    ObjectId _id
    string title
    string category
    number totalLessons
  }
  QUIZ {
    ObjectId _id
    string title
    ObjectId courseId
    number passingScore
  }
  RESULT {
    ObjectId _id
    ObjectId userId
    ObjectId quizId
    number percentage
  }
```

## Sequence: Student takes quiz → teacher views result

```mermaid
sequenceDiagram
  participant S as Student (Browser)
  participant F as Frontend (React)
  participant A as API (Express)
  participant DB as MongoDB
  S->>F: Submit quiz answers
  F->>A: POST /api/quiz/:id/submit {responses}
  A->>DB: Create Result doc
  DB-->>A: Result saved
  A-->>F: Return score/percentage
  Note over A,F: Teacher later views results
  Teacher->>F: Request results (click "View Results")
  F->>A: GET /api/teacher/quizzes/:id/results
  A->>DB: Query Result documents for quiz
  DB-->>A: Returns results
  A-->>F: Returns mapped results (with courseTitle, category, passingScore)
  F-->>Teacher: Render row-wise results table
```

---

Note: The Mermaid diagrams can be rendered in supported Markdown viewers or by using mermaid.live. You may export them as PNG/SVG for inclusion in your report.