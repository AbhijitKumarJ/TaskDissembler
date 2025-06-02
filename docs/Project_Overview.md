# Project Overview: Task Analyzer

## Purpose

The Task Analyzer is a frontend-only Angular application designed to help users in analyzing and breaking down complex tasks into smaller, more manageable sub-tasks. It leverages Artificial Intelligence (AI) to facilitate this process, allowing for a structured approach to task management and analysis.

## Key Features

- **Hierarchical Task Management:** Create and manage hierarchical task structures for in-depth analysis.
- **Manual and AI-Powered Task Breakdown:** Create tasks manually or leverage LLMs to break down complex tasks into smaller, manageable sub-tasks.
- **Dynamic Prompt Preview & Editing (Phase 2):** View and modify LLM prompts before they are sent, allowing for precise, one-time guidance for task subdivision.
- **LLM Rationale (Phase 2):** After a breakdown, request an explanation from the LLM about its reasoning and assumptions for that specific set of subtasks.
- **Alternative Breakdowns (Phase 2):** Request different sets of subtasks from the LLM for any given node, with the option to provide hints (e.g., "focus on technical aspects") to explore varied analytical perspectives.
- **Granular Node Typing (Phase 2):** Optionally assign a specific "task type" (e.g., "Research", "Development") to a node before subdivision to receive more tailored LLM prompts and results.
- **Save/Load Functionality:** Save complete task analyses as JSON files and load them back into the application.
- **Configurable LLM Providers:** Configure and switch between different Large Language Model (LLM) providers (OpenAI, Groq, Ollama, Custom) with specific models and parameters.
- **User-Friendly Interface:** Features a dark theme UI and responsive design for an improved user experience.
- **Data Export:** Export your task analysis as a JSON file.

For a detailed guide on how to use these features, please see the [User Guide](User_Guide.md).

## License

This project is licensed under the Apache License, Version 2.0. See the [LICENSE](../../LICENSE) file in the root directory for the full license text.
