# Technical Description: Task Analyzer

This document provides a technical overview of the Task Analyzer application, focusing on its architecture, technologies, and file structure.

## Application Architecture

The Task Analyzer is a frontend-only application built using Angular. It is designed to help users analyze and break down complex tasks into manageable sub-tasks. The application can interact with various Large Language Model (LLM) providers through their APIs to assist in task breakdown. User data, specifically task analyses, can be saved to and loaded from local JSON files.

For a detailed description of user-facing features and how to use the application, please refer to the [User Guide](User_Guide.md).

## Technologies Used

Based on the project's root `README.md`:

- **Framework:** [Angular](https://angular.io/) (The README mentions Angular CLI v15 or later)
- **Styling:** [Bootstrap 5](https://getbootstrap.com/), [Font Awesome](https://fontawesome.com/) (for icons)
- **State Management/Reactivity:** [RxJS](https://rxjs.dev/)
- **Package Management:** npm (v8 or later) or yarn
- **Build Tool:** Angular CLI

## Project Structure (`task-analyzer` directory)

The main application code for the Task Analyzer resides within the `task-analyzer` directory. The structure below outlines the key parts of a typical Angular application, with specific details drawn from the project's `README.md` for the `src/app` directory.

```
task-analyzer/
├── src/
│   ├── app/
│   │   ├── components/           # Reusable UI components
│   │   │   ├── home/            # Home page component
│   │   │   ├── llm-settings/    # LLM settings component
│   │   │   ├── task-analyzer/   # Main task analyzer component (core UI)
│   │   │   └── task-node/       # Component for individual task nodes (recursive)
│   │   ├── models/              # TypeScript interfaces defining data structures
│   │   └── services/            # Angular services for business logic (e.g., LLM interaction, file handling)
│   ├── assets/                  # Static assets like images, icons, or global JSON files
│   ├── environments/            # Environment-specific configurations (e.g., development, production)
│   ├── index.html               # The main HTML page that hosts the Angular application
│   ├── main.ts                  # The main entry point for the Angular application
│   └── styles.scss              # Global styles and imports for the application (or .css)
├── angular.json                 # Angular CLI configuration file (build, serve, test settings)
├── package.json                 # Project dependencies (npm/yarn) and scripts
├── tsconfig.json                # TypeScript compiler configuration for the project
└── README.md                    # Readme specific to the task-analyzer application
```

**Note:** The root of the repository also contains a `README.md` (which this technical description is based on), a `LICENSE` file, and a `docs/` directory for documentation.

## Key Components and Files (within `task-analyzer/src/app/`)

- **`app.component.ts/html/scss` (Implicit):** Typically the root component of the Angular application.
- **`app.routes.ts` or `app-routing.module.ts` (Implicit):** Defines the navigation routes for the application.
- **`components/task-analyzer/task-analyzer.component.ts`:** Likely the core component managing the task breakdown interface and logic.
- **`components/llm-settings/llm-settings.component.ts`:** Handles configuration of LLM providers and API keys.
- **`components/home/home.component.ts`:** Manages the home page, possibly including options to start new or load existing analyses.
- **`components/task-node/task-node.component.ts`:** Represents an individual task in the hierarchy, likely used recursively.
- **Services within `services/`:**
    - **LLM Service:** Encapsulates logic for interacting with different LLM APIs.
    - **File Service:** Handles saving and loading of task analysis JSON files.
    - **State Management Service:** Could be used to manage application-wide state if not using a dedicated library like NgRx or NGXS beyond RxJS.
- **Models within `models/`:** TypeScript interfaces defining the structure of tasks, LLM configurations, etc.

This technical description provides a high-level overview. For more detailed information, direct inspection of the `task-analyzer` source code is recommended.

## License

This project is licensed under the Apache License, Version 2.0. See the [LICENSE](../../LICENSE) file in the root directory for the full license text.
