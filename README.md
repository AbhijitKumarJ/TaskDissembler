# Task Dissembler / Task Analyzer

A frontend-only Angular application for analyzing and breaking down complex tasks into manageable sub-tasks using AI.

## Features

- Create and manage hierarchical task structures for in-depth analysis.
- Manual task creation and editing (text, description, custom properties).
- LLM-powered task subdivision to break down complex tasks.
- **Dynamic Prompt Preview & Editing:** View and modify LLM prompts before they are sent, allowing for precise, one-time guidance for task subdivision (US-P2-01).
- **LLM Rationale:** After a breakdown, request an explanation from the LLM about its reasoning and assumptions for that specific set of subtasks (US-P2-02).
- **Alternative Breakdowns:** Request different sets of subtasks from the LLM for any given node, with the option to provide hints (e.g., "focus on technical aspects") to explore varied analytical perspectives (US-P2-03).
- **Granular Node Typing:** Optionally assign a specific "task type" (e.g., "Research", "Development", "Testing") to a node before subdivision to receive more tailored LLM prompts and results (US-P2-04).
- Save and load complete task analyses as JSON files.
- Configure various LLM providers (OpenAI, Groq, Ollama, Custom) with specific models and parameters.
- User-friendly dark theme UI with a responsive design.

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm (v8 or later) or yarn
- Angular CLI (v15 or later)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd task-analyzer
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Start the development server:
   ```bash
   ng serve
   ```

4. Open your browser and navigate to `http://localhost:4200/`

## Usage

For detailed instructions on using all features, please refer to the [User Guide](docs/User_Guide.md).

1. **Home Page**
   - Create a new task analysis project
   - Load an existing task analysis from a JSON file

2. **LLM Settings**
   - Configure your preferred LLM provider (OpenAI, Groq, etc.)
   - Set your API key and model preferences

3. **Task Analyzer**
   - Create and edit tasks and sub-tasks
   - Organize tasks hierarchically
   - Export your task analysis as a JSON file

## Project Structure

This section describes the structure of the `task-analyzer` directory.

```
src/app/
├── components/           # Reusable components
│   ├── home/            # Home page component
│   ├── llm-settings/    # LLM settings component
│   ├── task-analyzer/   # Main task analyzer component
│   └── task-node/       # Task node component (recursive)
├── models/              # TypeScript interfaces
└── services/            # Application services
```

## Built With

- [Angular](https://angular.io/) - The web framework used
- [Bootstrap 5](https://getbootstrap.com/) - CSS framework
- [Font Awesome](https://fontawesome.com/) - Icons
- [RxJS](https://rxjs.dev/) - Reactive programming library

## License

This project is licensed under the Apache License, Version 2.0. See the [LICENSE](LICENSE) file for details.

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
