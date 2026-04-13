# Requirements Document

## Introduction

This feature adds role-based user management to the college attendance management system. The system currently supports three roles — admin, teacher, and student — authenticated via JWT. This feature defines who can create which types of accounts, enforces strict access control, and introduces an Excel-based bulk student creation workflow for teachers. Passwords for students created via Excel upload are automatically set to their roll number.

---

## Glossary

- **System**: The college attendance management system (Vue 3 frontend + Node.js/Express backend + MongoDB).
- **RBAC_Guard**: The middleware layer (`protect` + `authorize`) that enforces role-based access control on every protected API route.
- **Admin**: A user with role `admin`. Has full control over user management.
- **Teacher**: A user with role `teacher`. Can create student accounts only.
- **Student**: A user with role `student`. Has no user-management permissions.
- **User_Account**: A record in the `User` collection containing `username`, `password` (hashed), `role`, and a reference to the role-specific profile document.
- **Student_Profile**: A record in the `Student` collection containing `name`, `roll`, `class`, and optional `email`/`phone`.
- **Teacher_Profile**: A record in the `Teacher` collection containing `name`, `department`, and optional `email`/`phone`.
- **Roll_Number**: A unique alphanumeric identifier assigned to each student. Used as the student's login username.
- **Excel_Parser**: The backend service that reads an uploaded `.xlsx` or `.xls` file and extracts student records.
- **Pretty_Printer**: The component that formats validation error details back into a human-readable response.
- **Bulk_Import**: The process of creating multiple Student_Accounts from a single Excel file upload.
- **Manual_Entry**: The process of creating a single Student_Account by submitting a form with individual fields.

---

## Requirements

### Requirement 1: Admin Creates Teacher Accounts

**User Story:** As an admin, I want to create teacher accounts, so that new faculty members can log in and manage attendance.

#### Acceptance Criteria

1. WHEN an authenticated Admin submits a valid teacher creation request, THE System SHALL create a Teacher_Profile and a linked User_Account with role `teacher`.
2. WHEN an authenticated Admin submits a teacher creation request with a username that already exists, THE System SHALL reject the request with HTTP 400 and a descriptive error message.
3. IF the requester's role is not `admin`, THEN THE RBAC_Guard SHALL reject the request with HTTP 403 before the creation logic executes.
4. THE System SHALL store the teacher's `name`, `department` (optional), `email` (optional), and `phone` (optional) in the Teacher_Profile.
5. WHEN a Teacher_Profile is created, THE System SHALL link the Teacher_Profile to the User_Account via the `teacherRef` field.

---

### Requirement 2: Admin Creates Student Accounts (Manual Entry)

**User Story:** As an admin, I want to manually create individual student accounts, so that I can onboard students one at a time with full control over their details.

#### Acceptance Criteria

1. WHEN an authenticated Admin submits a valid student creation request, THE System SHALL create a Student_Profile and a linked User_Account with role `student`.
2. WHEN an authenticated Admin submits a student creation request with a Roll_Number that already exists, THE System SHALL reject the request with HTTP 400 and a descriptive error message.
3. WHEN an authenticated Admin submits a student creation request with a username that already exists, THE System SHALL reject the request with HTTP 400 and a descriptive error message.
4. IF the requester's role is not `admin`, THEN THE RBAC_Guard SHALL reject the request with HTTP 403 before the creation logic executes.
5. THE System SHALL require `name`, `roll`, and `class` fields for every student creation request.
6. WHEN a Student_Profile is created, THE System SHALL link the Student_Profile to the User_Account via the `studentRef` field.

---

### Requirement 3: Teacher Creates Student Accounts (Manual Entry)

**User Story:** As a teacher, I want to manually create individual student accounts, so that I can add students who are not yet in the system.

#### Acceptance Criteria

1. WHEN an authenticated Teacher submits a valid student creation request, THE System SHALL create a Student_Profile and a linked User_Account with role `student`.
2. WHEN an authenticated Teacher submits a student creation request, THE System SHALL automatically set the User_Account password equal to the student's Roll_Number.
3. WHEN an authenticated Teacher submits a student creation request with a Roll_Number that already exists, THE System SHALL reject the request with HTTP 400 and a descriptive error message.
4. IF the requester's role is `teacher`, THEN THE RBAC_Guard SHALL permit the student creation request and deny any request to create an `admin` or `teacher` account.
5. THE System SHALL require `name`, `roll`, and `class` fields for every teacher-initiated student creation request.

---

### Requirement 4: Teacher Creates Student Accounts via Excel Upload (Bulk Import)

**User Story:** As a teacher, I want to upload an Excel file to create multiple student accounts at once, so that I can onboard an entire class efficiently.

#### Acceptance Criteria

1. WHEN an authenticated Teacher uploads a valid Excel file, THE System SHALL parse the file and attempt to create a Student_Profile and User_Account for each row.
2. THE Excel_Parser SHALL accept files with the `.xlsx` or `.xls` extension only; IF a file with any other extension is uploaded, THEN THE System SHALL reject the request with HTTP 400 and a descriptive error message.
3. THE Excel_Parser SHALL require the columns `Roll Number` and `Name` to be present in the uploaded file; IF either column is missing, THEN THE System SHALL reject the entire file with HTTP 400 and list the missing columns.
4. WHEN the Excel_Parser processes a row, THE System SHALL automatically set the User_Account password equal to the Roll_Number value in that row.
5. WHEN the Excel_Parser encounters a row with a missing `Roll Number` or missing `Name` value, THE System SHALL skip that row and record it as a failed entry.
6. WHEN the Excel_Parser encounters a row whose Roll_Number already exists in the database, THE System SHALL skip that row and record it as a duplicate entry.
7. WHEN the Excel_Parser finishes processing all rows, THE System SHALL return a summary containing: total rows processed, count of successfully created accounts, count of skipped rows with reasons (missing fields, duplicate roll number).
8. IF all rows in the uploaded file are invalid or duplicate, THEN THE System SHALL return HTTP 207 (Multi-Status) with the full failure summary and zero created accounts.
9. THE Pretty_Printer SHALL format the Bulk_Import result summary as a structured JSON response with `created`, `skipped`, and `errors` arrays.
10. FOR ALL valid Excel files, parsing the file then extracting records then re-serialising those records SHALL produce an equivalent set of student data (round-trip property).

---

### Requirement 5: Role-Based Access Control Enforcement

**User Story:** As a system administrator, I want strict RBAC enforcement on all user-management endpoints, so that no role can perform actions beyond its permitted scope.

#### Acceptance Criteria

1. WHILE a request is authenticated with role `student`, THE RBAC_Guard SHALL deny all user creation, update, and deletion requests with HTTP 403.
2. WHILE a request is authenticated with role `teacher`, THE RBAC_Guard SHALL deny any request to create, update, or delete a User_Account with role `admin` or `teacher`.
3. WHILE a request is authenticated with role `teacher`, THE RBAC_Guard SHALL permit requests to create Student_Profiles and User_Accounts with role `student` only.
4. WHILE a request is authenticated with role `admin`, THE RBAC_Guard SHALL permit requests to create, update, and delete User_Accounts of any role.
5. IF a request arrives without a valid JWT token, THEN THE RBAC_Guard SHALL reject the request with HTTP 401 before any business logic executes.
6. IF a request arrives with an expired JWT token, THEN THE RBAC_Guard SHALL reject the request with HTTP 401 and a descriptive error message.

---

### Requirement 6: Duplicate Roll Number Prevention

**User Story:** As a system administrator, I want the system to prevent duplicate roll numbers, so that every student has a unique identifier across all creation methods.

#### Acceptance Criteria

1. WHEN any user creation request (manual or bulk) includes a Roll_Number, THE System SHALL check the `Student` collection for an existing document with the same `roll` field before creating a new record.
2. IF a duplicate Roll_Number is detected during manual entry, THEN THE System SHALL reject the request with HTTP 400 and include the duplicate Roll_Number in the error message.
3. IF a duplicate Roll_Number is detected during Bulk_Import, THEN THE System SHALL skip that row, record it in the `errors` array of the import summary, and continue processing remaining rows.
4. THE System SHALL enforce the `roll` field uniqueness constraint at the database level via a MongoDB unique index on the `Student` collection.

---

### Requirement 7: Excel File Format Validation

**User Story:** As a teacher, I want the system to validate my Excel file before processing, so that I receive clear feedback when the file is malformed or missing required data.

#### Acceptance Criteria

1. WHEN an Excel file is uploaded, THE Excel_Parser SHALL validate the file extension before reading its contents.
2. WHEN an Excel file is uploaded, THE Excel_Parser SHALL validate that the header row contains both `Roll Number` and `Name` columns (case-insensitive matching).
3. IF the uploaded file is empty (zero data rows after the header), THEN THE System SHALL reject the request with HTTP 400 and the message "The uploaded file contains no student records."
4. IF the uploaded file exceeds 5 MB in size, THEN THE System SHALL reject the request with HTTP 400 and the message "File size exceeds the 5 MB limit."
5. WHEN the Excel_Parser successfully validates the file format, THE System SHALL proceed to row-level processing without re-validating the file structure.

---

### Requirement 8: Auto-Password Assignment for Student Accounts

**User Story:** As a teacher, I want student passwords to be automatically set to their roll number, so that students can log in immediately without a separate password setup step.

#### Acceptance Criteria

1. WHEN a Teacher creates a student account via Manual_Entry, THE System SHALL set the User_Account password to the value of the Roll_Number field provided in the request.
2. WHEN a Teacher creates student accounts via Bulk_Import, THE System SHALL set each User_Account password to the Roll_Number value from the corresponding Excel row.
3. THE System SHALL hash the auto-assigned password using bcrypt before storing it in the database, consistent with the existing password hashing behaviour.
4. WHEN an Admin creates a student account, THE System SHALL accept an explicit password from the request body and SHALL NOT override it with the Roll_Number.
