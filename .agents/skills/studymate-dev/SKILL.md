---
name: studymate-dev
description: StudyMate project development rules, backend architecture conventions, DB mappings, AI prompts, and testing patterns.
---

# StudyMate Development Guidelines & Standards

## 1. Tech Stack Architecture
- **Framework:** Spring Boot 4.1 / Java 21
- **Database:** PostgreSQL (Cloud/Local) via Spring Data JPA (Hibernate 7.x)
- **Security:** Spring Security (Stateless JWT + Refresh Token Rotation)
- **AI Integration:** Google Gemini 2.0 Flash REST API
- **Document Processing:** Apache PDFBox 3.0.3 (PDF) & Apache POI 5.3.0 (Word/PPTX)

## 2. Database & JPA Rules
- **Schema Management:** `spring.jpa.hibernate.ddl-auto=validate` (Schema is pre-created via SQL scripts).
- **PostgreSQL Connection URL:** Must include `?stringtype=unspecified` to allow automatic string-to-enum casting for custom PostgreSQL `ENUM` types.
- **Entity Enum Mapping:** All Java enums in Entity classes MUST use `@Enumerated(EnumType.STRING)`.
- **JSONB Column Mapping:** JSON columns (e.g. `Mindmap.structure`) MUST use `@JdbcTypeCode(SqlTypes.JSON)`.
- **Primary Keys:** `@GeneratedValue(strategy = GenerationType.SEQUENCE)` with corresponding PostgreSQL sequence generators (`allocationSize = 1`).

## 3. Security & REST API Standards
- **Endpoint Protection:** All endpoints except `/api/auth/**`, `/actuator/health`, and Swagger are protected.
- **Current User Access:** Always retrieve the logged-in User entity using `securityUtil.getCurrentUser()`.
- **Response Format:** Wrap all REST controller responses in `ApiResponse<T>`:
  - `ApiResponse.ok(data)` for 200/201 OK
  - `ApiResponse.error(message)` for error responses
- **Error Handling:** Standardized via `GlobalExceptionHandler` returning clean JSON errors.

## 4. AI Gemini Integration Rules
- **Model:** `gemini-2.0-flash`
- **JSON Output Mode:** For Quiz and Mindmap generation, include `"generationConfig": {"response_mime_type": "application/json"}` in the request payload to ensure clean JSON responses.

## 5. Testing Guidelines
- Automated integration tests belong in `src/test/java/com/huyberos/studymate/controller/`.
- Test properties are managed in `src/test/resources/application.properties`.
- Postman Collection is maintained at `StudyMate_Postman_Collection.json`.
