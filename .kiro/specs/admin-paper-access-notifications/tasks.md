# Implementation Plan: Admin Paper Access & Notifications

## Overview

Three focused improvements implemented across 6 files: admin paper view/print modal in `AdminPapers.vue`, a new `ReadStatus` Mongoose model + backend route enrichment in `announcementRoutes.js`, a `markRead` API method in `api.js`, and a dark-neon restyle with unread badge in `StudentAnnouncements.vue`. Each task is self-contained and builds on the previous.

## Tasks

- [x] 1. Admin Paper View/Print modal (`src/views/admin/AdminPapers.vue`)
  - Add `viewingPaper` ref (initially `null`) and `loadingPaper` ref (initially `false`) to the `<script setup>` block
  - Add a "View / Print" eye-icon button to each paper card; on click call `paperAPI.getOne(p._id)`, set `loadingPaper` during fetch, store result in `viewingPaper`; show toast alert "Failed to load paper" if the fetch throws
  - Add the modal overlay (`fixed inset-0 bg-black/60 z-50`) rendered when `viewingPaper !== null`:
    - Centered white container, max-width 900 px, scrollable
    - Header row: paper title on the left, **Print** button and **Close (×)** button on the right
    - Body: A4 preview `div` with the same HTML structure as `#paper-preview` in `TeacherPaperPrint.vue` (college header, meta table, instructions box, dynamic sections loop)
    - Hidden `<iframe id="admin-print-frame">` for iframe-print logic
  - Add `sectionTotal(section)` helper (identical formula to `TeacherPaperPrint.vue`)
  - Add `printAdminPaper()` function using the same iframe-print logic as `printPaper()` in `TeacherPaperPrint.vue`, targeting `#admin-print-frame` and the modal's preview div
  - Close button sets `viewingPaper = null`; no `<input>`, `<select>`, `<textarea>`, or edit/save/generate buttons inside the modal
  - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.6_

  - [ ]* 1.1 Write property test for admin paper fetch (Property 1)
    - **Property 1: Admin paper fetch returns full document**
    - Generate random paper payloads, insert into DB, fetch as admin, assert HTTP 200 and all fields match
    - **Validates: Requirements 1.1**

  - [ ]* 1.2 Write unit tests for AdminPapers.vue modal behaviour
    - Modal open: `viewingPaper` is set, no edit controls rendered (Requirement 1.5)
    - Modal close: `viewingPaper` is `null`, `papers` array unchanged (Requirement 1.6)
    - Fetch failure: toast alert shown, modal does not open
    - _Requirements: 1.4, 1.5, 1.6_

- [ ] 2. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. ReadStatus model + announcement route enrichment
  - [x] 3.1 Create `backend/models/ReadStatus.js`
    - Define schema: `announcementId` (ObjectId, ref `Announcement`, required), `studentId` (ObjectId, ref `Student`, required), `readAt` (Date, default `Date.now`)
    - Add compound unique index `{ announcementId: 1, studentId: 1 }` to prevent duplicates
    - Export as `mongoose.model('ReadStatus', readStatusSchema)`
    - _Requirements: 2.2, 2.3_

  - [x] 3.2 Modify `backend/routes/announcementRoutes.js` — enrich GET with `isRead`
    - `require` the new `ReadStatus` model at the top of the file
    - In the student branch of `GET /`: after fetching announcements, collect their `_id` values; query `ReadStatus.find({ studentId: student._id, announcementId: { $in: ids } })`; build a `Set` of read IDs; map each announcement (already `.lean()`) to add `isRead: readSet.has(ann._id.toString())`
    - Admin/teacher path: leave unchanged — no `isRead` field attached
    - _Requirements: 2.4, 2.5, 3.1, 3.2, 3.3, 3.4_

  - [x] 3.3 Add `POST /:id/read` route to `backend/routes/announcementRoutes.js`
    - Route: `protect → authorize('student')`
    - Find `Student` by `{ userId: req.user._id }`; return 404 `{ success: false, message: "Student profile not found." }` if missing
    - `ReadStatus.findOneAndUpdate({ announcementId: req.params.id, studentId: student._id }, { $setOnInsert: { readAt: new Date() } }, { upsert: true, new: true })`
    - Return `{ success: true }` with HTTP 200 in all success cases
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.4 Add `markRead` to `announcementAPI` in `src/services/api.js`
    - Add `markRead: (id) => api.post(\`/announcements/${id}/read\`)` to the `announcementAPI` object
    - _Requirements: 2.7_

  - [ ]* 3.5 Write property test for ReadStatus upsert idempotence (Property 2)
    - **Property 2: ReadStatus upsert is idempotent**
    - Generate random (announcementId, studentId) pairs and random repeat count N (1–10); call `POST /announcements/:id/read` N times; assert exactly 1 ReadStatus document exists in DB
    - **Validates: Requirements 2.2, 2.3**

  - [ ]* 3.6 Write property test for isRead enrichment correctness (Property 3)
    - **Property 3: isRead enrichment is correct for students**
    - Generate random student + set of announcements (some with ReadStatus docs, some without); call `GET /announcements`; assert each announcement's `isRead` matches whether a ReadStatus exists for that student
    - **Validates: Requirements 2.4**

  - [ ]* 3.7 Write property test for announcement class filter (Property 4)
    - **Property 4: Announcement class filter excludes other classes**
    - Generate random student class string and random announcements with varying `targetClass` values; call `GET /announcements` as that student; assert every returned announcement has `targetClass === 'All'` or `targetClass === studentClass`, and no announcement for a different class is present
    - **Validates: Requirements 3.1**

  - [ ]* 3.8 Write unit tests for announcement route edge cases
    - `POST /:id/read` with teacher token → 403 (Requirement 2.1)
    - `GET /announcements` with admin token → no `isRead` field on any announcement (Requirement 2.5)
    - `GET /announcements` with student having no linked Student doc → empty array (Requirement 3.2)
    - `GET /announcements` with admin/teacher → all announcements, no class filter (Requirement 3.3)
    - _Requirements: 2.1, 2.5, 3.2, 3.3_

- [ ] 4. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Student Announcements UI restyle + unread badge (`src/views/student/StudentAnnouncements.vue`)
  - [x] 5.1 Apply dark-neon purple theme
    - Restyle page wrapper background to `#121026`
    - Restyle announcement cards: background `#1b163d`, border `1px solid #2d2660`
    - Apply accent colour `#7148fc` to icons and relevant text elements
    - Preserve priority border-left colours (red for Urgent, blue for Event)
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 5.2 Add red pulsing unread badge and `markAsRead` logic
    - Add a red pulsing badge element inside each card: `v-if="!ann.isRead"`, absolutely positioned, `animate-pulse`, colour `#ef4444` (red-500), with sufficient contrast against `#1b163d`
    - Add `markAsRead(ann)` method: call `announcementAPI.markRead(ann._id)` fire-and-forget (no `await`, no error blocking), immediately set `ann.isRead = true` in local state
    - Wire `markAsRead` to a "View" button or card click event
    - If `markRead` call fails, badge remains on next page load (server state wins on refresh); no blocking error shown
    - Preserve all existing fields in the restyled layout: `title`, `content`, `priority`, `targetClass`, `createdByName`, `createdAt`
    - _Requirements: 2.6, 2.7, 2.8, 2.9, 4.4, 4.5_

  - [ ]* 5.3 Write property test for unread badge presence (Property 5)
    - **Property 5: Unread badge presence matches isRead state**
    - Generate random announcement objects with `isRead` set to `true` or `false`; mount `StudentAnnouncements.vue` with the generated list; assert badge element is present if and only if `ann.isRead === false`
    - **Validates: Requirements 2.6, 2.8**

  - [ ]* 5.4 Write property test for view action marking as read (Property 6)
    - **Property 6: View action marks announcement as read in local state**
    - Generate random announcement objects with `isRead === false`; mount component with mocked `announcementAPI.markRead`; trigger view action; assert `ann.isRead === true` immediately without page reload
    - **Validates: Requirements 2.7**

  - [ ]* 5.5 Write property test for restyled card field preservation (Property 7)
    - **Property 7: Restyled card preserves all announcement fields**
    - Generate random announcement objects with arbitrary `title`, `content`, `priority`, `targetClass`, `createdByName`, `createdAt`; mount component; assert all six fields appear in the rendered output
    - **Validates: Requirements 4.5**

- [x] 6. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests use [fast-check](https://github.com/dubzzz/fast-check) with a minimum of 100 iterations each
- Unit tests use the existing test framework in the project
- Each task references specific requirements for traceability
- The backend paper route (`GET /api/papers/:id`) already grants admin access — no backend change needed for Task 1
- `announcementAPI.markRead` is fire-and-forget; badge state is optimistic and server state wins on refresh
