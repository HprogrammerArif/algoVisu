# API Reference — QuantumViz

> REST API contract. Base URL: `http://localhost:3000/api/v1`. All bodies and responses
> are JSON. Protected endpoints require `Authorization: Bearer <jwt>`.

---

## Conventions

- **Content type:** `application/json` for requests and responses.
- **Auth:** `Authorization: Bearer <token>` where noted (🔒 = auth required, 👑 = admin only).
- **Errors:** uniform shape — `{ "error": { "code": "STRING_CODE", "message": "human text" } }`.
- **IDs:** numeric (`algorithmId`); algorithms are also addressable by `slug`.
- **Timestamps:** ISO-8601 strings.

### Standard status codes
| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Validation error |
| 401 | Missing/invalid token |
| 403 | Authenticated but not allowed (role) |
| 404 | Not found |
| 409 | Conflict (e.g. duplicate email/bookmark) |
| 500 | Unexpected server error |

---

## Health

### `GET /api/v1/health`
Liveness probe.
```json
200 → { "status": "ok", "uptime": 123.4 }
```

---

## Auth

### `POST /api/v1/auth/register`
Create a `student` account.
```jsonc
// request
{ "fullName": "Ada Lovelace", "email": "ada@uni.edu", "password": "min8chars" }
// 201
{ "user": { "id": 7, "fullName": "Ada Lovelace", "email": "ada@uni.edu", "role": "student" } }
```
Errors: `400 VALIDATION_ERROR`, `409 EMAIL_TAKEN`.

### `POST /api/v1/auth/login`
```jsonc
// request
{ "email": "ada@uni.edu", "password": "min8chars" }
// 200
{ "token": "eyJhbGci…",
  "user": { "id": 7, "fullName": "Ada Lovelace", "email": "ada@uni.edu", "role": "student" } }
```
Errors: `400 VALIDATION_ERROR`, `401 INVALID_CREDENTIALS`.

### `GET /api/v1/auth/me` 🔒
Return the current user from the token.
```json
200 → { "user": { "id": 7, "fullName": "Ada Lovelace", "email": "ada@uni.edu", "role": "student" } }
```
Errors: `401 UNAUTHENTICATED`.

---

## Categories

### `GET /api/v1/categories`
Public. List all categories (ordered by `display_order`).
```json
200 → { "categories": [
  { "id": 1, "slug": "sorting", "name": "Sorting", "description": "…", "displayOrder": 1 },
  { "id": 2, "slug": "searching", "name": "Searching", "description": "…", "displayOrder": 2 }
] }
```

### `POST /api/v1/categories` 👑
```jsonc
{ "slug": "greedy", "name": "Greedy", "description": "…", "displayOrder": 8 }
// 201 → { "category": { … } }
```

### `PUT /api/v1/categories/:id` 👑 · `DELETE /api/v1/categories/:id` 👑
Update / delete a category. `409 CATEGORY_IN_USE` if it still has algorithms.

---

## Algorithms

### `GET /api/v1/algorithms`
Public. List/browse. Query params (all optional):

| Param | Example | Effect |
|---|---|---|
| `category` | `sorting` | filter by category slug |
| `difficulty` | `easy` | filter by difficulty |
| `search` | `bin` | match name/summary |

```json
200 → { "algorithms": [
  { "id": 12, "slug": "binary-search", "name": "Binary Search",
    "summary": "Find a target in a sorted array in O(log n).",
    "category": "searching", "difficulty": "easy", "visualizerType": "array" }
] }
```

### `GET /api/v1/algorithms/:slug`
Public. Full detail used to render the panels and drive the visualizer.
```json
200 → { "algorithm": {
  "id": 12, "slug": "binary-search", "name": "Binary Search",
  "category": "searching", "difficulty": "easy", "visualizerType": "array",
  "summary": "Find a target in a sorted array in O(log n).",
  "description": "Binary search repeatedly halves the search interval …",
  "spaceComplexity": "O(1)",
  "timeComplexities": { "best": "O(1)", "average": "O(log n)", "worst": "O(log n)" },
  "codeSnippets": [
    { "language": "javascript", "code": "function binarySearch(a, t){ … }" },
    { "language": "pseudocode", "code": "lo=0; hi=n-1; while lo<=hi …" }
  ],
  "explanation": [
    { "heading": "What problem it solves", "body": "Binary search finds a target in a sorted collection …" },
    { "heading": "How it works", "body": "It tracks low/high bounds and compares the middle element …" },
    { "heading": "Why & when to use it", "body": "Use it whenever data is sorted and searched repeatedly …" },
    { "heading": "Complexity intuition", "body": "Halving the range each step gives O(log n) …" },
    { "heading": "Real-world uses", "body": "Database indexes, dictionary lookups, git bisect …" }
  ]
} }
```
`explanation` is an ordered list of the in-depth sections shown in the UI's **Explain** modal
(empty `[]` for an algorithm with no authored explanation). Errors: `404 ALGORITHM_NOT_FOUND`.

### `POST /api/v1/algorithms` 👑
Create an algorithm with its complexities and snippets (one transaction).
```jsonc
{ "categoryId": 2, "slug": "binary-search", "name": "Binary Search",
  "summary": "…", "description": "…", "visualizerType": "array",
  "difficulty": "easy", "spaceComplexity": "O(1)",
  "timeComplexities": { "best": "O(1)", "average": "O(log n)", "worst": "O(log n)" },
  "codeSnippets": [ { "language": "javascript", "code": "…" } ] }
// 201 → { "algorithm": { … } }
```
Errors: `400 VALIDATION_ERROR`, `409 SLUG_TAKEN`.

### `PUT /api/v1/algorithms/:id` 👑 · `DELETE /api/v1/algorithms/:id` 👑
Update / delete (cascades to its complexities, snippets, bookmarks, progress).

---

## Bookmarks 🔒

### `GET /api/v1/bookmarks`
Current user's bookmarked algorithms.
```json
200 → { "bookmarks": [
  { "id": 3, "algorithmId": 12, "slug": "binary-search", "name": "Binary Search", "createdAt": "…" }
] }
```

### `POST /api/v1/bookmarks`
```jsonc
{ "algorithmId": 12 }
// 201 → { "bookmark": { "id": 3, "algorithmId": 12, "createdAt": "…" } }
```
Idempotent: re-bookmarking returns the existing row. Errors: `404 ALGORITHM_NOT_FOUND`.

### `DELETE /api/v1/bookmarks/:algorithmId`
```json
204 → (no content)
```

---

## Progress 🔒

### `GET /api/v1/progress`
Current user's progress across algorithms.
```json
200 → { "progress": [
  { "algorithmId": 12, "slug": "binary-search", "status": "completed", "lastViewedAt": "…" }
] }
```

### `PUT /api/v1/progress/:algorithmId`
Create or update (upsert) progress for one algorithm.
```jsonc
{ "status": "in_progress" }   // one of: not_started | in_progress | completed
// 200 → { "progress": { "algorithmId": 12, "status": "in_progress", "lastViewedAt": "…" } }
```
Errors: `400 VALIDATION_ERROR` (bad status), `404 ALGORITHM_NOT_FOUND`.

---

## Endpoint summary

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | — | liveness |
| POST | `/auth/register` | — | sign up (student) |
| POST | `/auth/login` | — | log in → JWT |
| GET | `/auth/me` | 🔒 | current user |
| GET | `/categories` | — | list categories |
| POST/PUT/DELETE | `/categories[/:id]` | 👑 | manage categories |
| GET | `/algorithms` | — | browse/filter |
| GET | `/algorithms/:slug` | — | full detail |
| POST/PUT/DELETE | `/algorithms[/:id]` | 👑 | manage algorithms |
| GET | `/bookmarks` | 🔒 | list my bookmarks |
| POST | `/bookmarks` | 🔒 | add bookmark |
| DELETE | `/bookmarks/:algorithmId` | 🔒 | remove bookmark |
| GET | `/progress` | 🔒 | list my progress |
| PUT | `/progress/:algorithmId` | 🔒 | upsert progress |

> Optional stretch endpoints (`/notes`, `/tags`) follow the same patterns if those tables
> are implemented.
