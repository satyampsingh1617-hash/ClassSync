# Requirements Document

## Introduction

This feature covers three improvements to the AttendPro college attendance management system:

1. **Admin Global Paper Access** — Admins can currently list all exam papers but are blocked from opening individual papers due to strict teacher-ownership checks. The fix grants admins read-only access to any paper's full JSON content and renders it using the shared `PaperPrintView` component.

2. **Persistent Red-Dot Notification Logic** — Students currently have no visual indicator for unread announcements. A new `ReadStatus` collection tracks which announcements each student has opened. The backend enriches announcement responses with an `isRead` flag, and the frontend shows a glowing red badge on unread items that disappears instantly when the student clicks "View".

3. **Security & UI Polish** — Announcement filtering for students is hardened so only announcements matching `targetClass === 'All'` or the student's own class are returned. The student announcements page is restyled with a dark-neon purple theme.

---

## Glossary

- **AttendPro**: The college attendance management system being modified.
- **Admin**: A user with `role === 'admin'` in the User collection.
- **Teacher**: A user with `role === 'teacher'` linked to a Teacher document via `teacherRef`.
- **Student**: A user with `role === 'student'` linked to a Student document via `userId`.
- **Paper**: A MongoDB document in the `papers` collection representing a generated exam question paper, owned by a Teacher via `teacherId`.
- **PaperPrintView**: The shared Vue 3 component that renders a Paper document as a formatted A4 preview (currently embedded in `TeacherPaperPrint.vue`).
- **Announcement**: A MongoDB document in the `announcements` collection with fields `title`, `content`, `priority`, `targetClass`, `createdBy`, `createdByName`, `createdByRole`.
- **ReadStatus**: A new MongoDB collection with fields `announcementId` (ObjectId), `studentId` (ObjectId), `readAt` (Date) that records when a student has opened an announcement.
- **isRead**: A boolean field added to announcement response objects indicating whether the requesting student has a corresponding ReadStatus record.
- **targetClass**: A field on Announcement set to `'All'` or a specific class string (e.g., `'FYCS'`, `'SYIT'`).
- **studentClass**: The `class` field on the Student document linked to the authenticated student user.
- **Red-Dot Badge**: A pulsing red circular indicator rendered via Tailwind's `animate-pulse` class, shown on announcement cards when `isRead === false`.
- **Paper_Controller**: The Express route handler in `backend/routes/paperRoutes.js` that processes `GET /api/papers/:id`.
- **Announcement_Controller**: The Express route handler in `backend/routes/announcementRoutes.js`.
- **ReadStatus_Controller**: The new Express route handler for `POST /api/announcements/:id/read`.
- **API_Service**: The frontend Axios wrapper in `src/services/api.js`.
- **AdminPapers_View**: The Vue 3 component at `src/views/admin/AdminPapers.vue`.
- **StudentAnnouncements_View**: The Vue 3 component at `src/views/student/StudentAnnouncements.vue`.

---

## Requirements

### Requirement 1: Admin Read-Only Access to Individual Papers

**User Story:** As an admin, I want to open and view the full content of any teacher's exam paper, so that I can review question papers for quality assurance without being blocked by ownership checks.

#### Acceptance Criteria

1. WHEN a request with `role === 'admin'` is received by `GET /api/papers/:id`, THE Paper_Controller SHALL return the full Paper document regardless of which teacher owns it.
2. WHEN a request with `role === 'teacher'` is received by `GET /api/papers/:id` and the paper's `teacherId` does not match `req.user.teacherRef`, THE Paper_Controller SHALL return HTTP 403 with `{ success: false, message: "Access denied." }`.
3. WHEN a request with `role === 'admin'` is received by `GET /api/papers/:id` and the paper does not exist, THE Paper_Controller SHALL return HTTP 404 with `{ success: false, message: "Paper not found." }`.
4. WHEN the admin clicks a paper card in AdminPapers_View, THE AdminPapers_View SHALL fetch the paper via `GET /api/papers/:id` and display the PaperPrintView component in a modal overlay with read-only rendering.
5. THE AdminPapers_View SHALL NOT render edit controls (subject input, section builder, auto-generate button, save button) when displaying a paper in admin view mode.
6. WHEN the admin closes the paper modal in AdminPapers_View, THE AdminPapers_View SHALL return to the paper list without modifying any paper data.
7. THE Paper_Controller SHALL NOT permit a request with `role === 'admin'` to modify or delete a paper via the `POST /api/papers/save` or `DELETE /api/papers/:id` endpoints unless the admin is explicitly the owner (admin-created papers are out of scope; this requirement preserves existing delete behaviour for admins).

---

### Requirement 2: Persistent Read-Status Tracking for Announcements

**User Story:** As a student, I want to see a visual badge on announcements I have not yet opened, so that I can quickly identify new updates without having to read every card.

#### Acceptance Criteria

1. THE ReadStatus_Controller SHALL expose a `POST /api/announcements/:id/read` endpoint that is accessible only to users with `role === 'student'`.
2. WHEN a student sends `POST /api/announcements/:id/read`, THE ReadStatus_Controller SHALL create a ReadStatus document with `announcementId`, `studentId` (derived from the student profile linked to `req.user._id`), and `readAt` set to the current UTC timestamp, if no such document already exists.
3. WHEN a student sends `POST /api/announcements/:id/read` and a ReadStatus document already exists for that `announcementId` and `studentId` pair, THE ReadStatus_Controller SHALL return HTTP 200 with `{ success: true }` without creating a duplicate document.
4. WHEN the Announcement_Controller processes `GET /api/announcements` for a student, THE Announcement_Controller SHALL perform a `$lookup` (or equivalent query) against the ReadStatus collection and attach `isRead: true` to each announcement for which a matching ReadStatus document exists, and `isRead: false` otherwise.
5. WHEN the Announcement_Controller processes `GET /api/announcements` for an admin or teacher, THE Announcement_Controller SHALL return announcements without the `isRead` field (or with `isRead` omitted).
6. WHEN StudentAnnouncements_View renders an announcement with `isRead === false`, THE StudentAnnouncements_View SHALL display a red pulsing badge using Tailwind class `animate-pulse` on the announcement card.
7. WHEN a student clicks the "View" action on an announcement card in StudentAnnouncements_View, THE StudentAnnouncements_View SHALL call `POST /api/announcements/:id/read` and immediately set `ann.isRead = true` in local component state without triggering a full page reload.
8. WHEN `ann.isRead` transitions to `true` in StudentAnnouncements_View local state, THE StudentAnnouncements_View SHALL remove the red pulsing badge from that announcement card without a page refresh.
9. IF the `POST /api/announcements/:id/read` request fails, THE StudentAnnouncements_View SHALL retain the badge on the announcement card and SHALL NOT display a blocking error to the student.

---

### Requirement 3: Announcement Class-Based Filtering Security

**User Story:** As a student, I want to see only announcements that are relevant to my class or addressed to all students, so that I am not shown information intended for other classes.

#### Acceptance Criteria

1. WHEN the Announcement_Controller processes `GET /api/announcements` for a student, THE Announcement_Controller SHALL query only announcements where `targetClass === 'All'` OR `targetClass === studentClass`.
2. WHEN the Announcement_Controller processes `GET /api/announcements` for a student and no Student document is linked to `req.user._id`, THE Announcement_Controller SHALL return `{ success: true, announcements: [] }`.
3. WHEN the Announcement_Controller processes `GET /api/announcements` for an admin or teacher, THE Announcement_Controller SHALL return all announcements without class filtering.
4. THE Announcement_Controller SHALL enforce the class filter at the database query level (not in application-layer post-processing) to prevent over-fetching of data.

---

### Requirement 4: Dark-Neon Purple UI Theme for Student Announcements

**User Story:** As a student, I want the announcements page to use the dark-neon purple theme consistent with the app's design language, so that the page feels visually cohesive.

#### Acceptance Criteria

1. THE StudentAnnouncements_View SHALL render the page background using colour `#121026`.
2. THE StudentAnnouncements_View SHALL render announcement cards using background colour `#1b163d`.
3. THE StudentAnnouncements_View SHALL render accent elements (badges, borders, icons) using colour `#7148fc`.
4. WHILE an announcement has `isRead === false`, THE StudentAnnouncements_View SHALL render the red pulsing badge with sufficient contrast against the `#1b163d` card background to be clearly visible.
5. THE StudentAnnouncements_View SHALL preserve all existing announcement data fields (title, content, priority, targetClass, createdByName, createdAt) in the restyled layout.
