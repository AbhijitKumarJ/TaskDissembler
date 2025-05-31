Okay, here is a consolidated single instruction document for an LLM/coding agent to build the Angular Task Analyser, incorporating all previously discussed points.

---

**LLM/Agent Coding Instructions: Angular Task Analyser**

**I. Project Core Objective & Philosophy**

*   **Primary Goal:** Develop a **frontend-only Angular application** designed to help users **analyze, deconstruct, and understand complex tasks**. It uses Large Language Models (LLMs) for suggesting sub-task breakdowns.
*   **Core Purpose: ANALYSIS & UNDERSTANDING.** This application is **NOT** a project management, task assignment, progress tracking, or team collaboration tool.
*   **Guiding Principle:** Every feature and design choice must support the user's ability to think through, break down, and visualize task structures. Avoid features that imply execution management.

**II. Key Technical & Architectural Constraints**

1.  **Frontend-Only:**
    *   The entire application must run in the user's browser. No backend server-side code is to be written or relied upon.
    *   LLM interactions will be direct client-side HTTP calls (using Angular's `HttpClient`) to user-configured LLM APIs.
    *   Data persistence is primarily through **JSON file import/export**. Browser local storage may be used for user preferences (e.g., LLM provider/model) but **NOT** for API keys by default (unless explicitly requested with strong user warnings).

2.  **Angular (Latest Stable Version):**
    *   **Standalone Components:** **Strongly prefer and prioritize standalone components, directives, and pipes.** Minimize reliance on `NgModule`s for feature organization.
    *   **Simple Project Structure (Flat & Beginner-Friendly):**
        *   **No Sub-Modules (for Phase 1 & 2):** Avoid creating Angular feature modules (`@NgModule`) within the main `app` directory.
        *   **Organize by Feature/Type Directly Under `app/`:**
            *   `app/components/`: For all UI components (e.g., `home/`, `llm-settings/`, `task-node/`, modal components). Each component in its own subfolder (`component-name/component-name.component.ts`, `.html`, `.scss`).
            *   `app/services/`: For all Angular services (e.g., `task-tree.service.ts`, `llm.service.ts`).
            *   `app/models/` (or `app/interfaces/`): For TypeScript interface definitions (e.g., `task-node.interface.ts`).
        *   **Routing:** Define all routes directly in `app.routes.ts` (or `app-routing.module.ts` if not using fully standalone app bootstrap). Avoid nested routing modules.
    *   **Declarative UI (HTML-First):**
        *   **Prioritize defining UI elements and their structure directly within component HTML templates (`.html` files).**
        *   **Minimize dynamic UI generation from TypeScript code.** Use Angular's structural (`*ngIf`, `*ngFor`) and attribute directives in templates.
        *   **If UI logic becomes complex in one template, break it into smaller, dedicated child components.**
    *   **Reactive Programming (RxJS):** Use Observables, Subjects, and BehaviorSubjects for managing asynchronous operations and shared state within services. Keep RxJS patterns clear and straightforward.
    *   **Services for Logic & State:** All business logic, data manipulation (e.g., task tree operations), API calls, and shared application state must reside in Angular services.
    *   **Strong Typing (TypeScript):** Define and use clear TypeScript interfaces for all data models.
    *   **Immutability:** When updating shared state managed by services (especially the `taskTree`), always emit new object/array references to ensure reliable change detection.
    *   **Change Detection:** Consider `ChangeDetectionStrategy.OnPush` for components where appropriate (especially recursive ones like `TaskNodeComponent`), but ensure it's correctly implemented.
    *   **Dependency Injection:** Utilize Angular's built-in DI system.

3.  **UI & Styling:**
    *   **Dark Theme First:** The application must have a dark theme as its primary visual style (dark backgrounds, light text).
    *   **Lightweight CSS Framework:** Use **Bootstrap 5** for basic layout (grid), form styling, and simple UI elements (buttons, basic modal structure).
    *   **NO Bulky UI Component Libraries:** **Do NOT use comprehensive UI libraries like Angular Material, PrimeNG, Kendo UI, Nebular, etc.** The goal is a lightweight application with custom styling.
    *   **Icons:** Use **Font Awesome** for all icons, consistent with the original project's design.
    *   **Custom Styling (SCSS):** All component-specific styling and theme overrides should be done using SCSS (`.scss` files).

**III. Adherence to Product Requirements Documents (PRDs)**

*   Strictly follow the user stories, features, and technical implementation details outlined in the provided **Phase 1 PRD** and subsequently the **Phase 2 PRD**.
*   Implement components and services as described in the PRDs (e.g., `HomeComponent`, `LlmSettingsComponent`, `TaskAnalyserComponent`, `TaskNodeComponent`, `TaskTreeService`, `LlmService`, `ConfigService`).

**IV. Functionality: Analysis Focus ("DOs" and "DON'Ts")**

*   **Focus ON:**
    *   Hierarchical task breakdown and visualization.
    *   LLM-driven sub-task generation and suggestions.
    *   Editing node text and properties (where properties store analytical metadata like LLM tags, complexity assessments, user-defined analytical categories, LLM prompt/response history, analyst notes).
    *   Manual node manipulation (add, delete, move children/siblings) to refine the analysis structure.
    *   Import/Export of the entire task tree and relevant LLM configuration (excluding API keys) via JSON.
    *   Features that enhance understanding of LLM outputs (e.g., prompt previews, rationale requests – as per Phase 2).
    *   UI features that aid analysis (e.g., focus mode, visual cues for analytical depth – as per Phase 2).

*   **Explicitly AVOID (Not a Project Management Tool):**
    *   Task assignment to users.
    *   Due dates, deadlines, or timelines.
    *   Progress tracking (e.g., "to-do," "in-progress," "completed" states meant for execution).
    *   User accounts, login, or real-time collaboration.
    *   Time tracking, effort estimation for task *execution*.
    *   Gantt charts, Kanban boards, or similar PM visualizations.
    *   Features like "priority" if they imply execution order for a team (analytical "importance" or "complexity" is acceptable).
    *   Fields for "assignee," "reporter," or other PM-specific roles.

**V. Code Quality & Agent Interaction**

*   **Readability:** Write clean, well-commented (especially for complex logic or non-obvious decisions), and easy-to-understand code. Templates should be particularly clear.
*   **Modularity:** Ensure components and services have a single, well-defined responsibility.
*   **Error Handling:** Implement basic, user-friendly error handling and notifications (e.g., for API call failures, file parsing issues) using a simple `NotificationService`.
*   **Clarification:** If any PRD requirement or instruction appears to conflict with these core principles (especially the "Analysis Tool, Not PM Tool" or architectural constraints), **halt and request clarification** before proceeding.
*   **Simplicity:** When faced with a choice between a complex and a simple architectural or implementation pattern (that still meets requirements), **choose the simpler, more beginner-friendly option.**

**This document is the single source of truth for guiding development. All generated code must align with these instructions.**