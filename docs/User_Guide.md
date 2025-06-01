# Angular Task Analyser - User Guide

## 1. Introduction

Welcome to the Angular Task Analyser! This tool is designed to help you break down, analyze, and understand complex tasks in a structured way. By leveraging Large Language Models (LLMs), the Task Analyser assists in subdividing tasks into smaller, more manageable pieces, allowing for deeper insight and exploration.

**Core Purpose:** The primary goal of this application is to serve as an **analytical tool**. It helps you think through task structures, explore different breakdown perspectives, and document your analysis. It is **not** a project management tool for tracking progress, assigning tasks, or managing deadlines.

---

## 2. Core Concepts

Understanding these core concepts will help you get the most out of the Task Analyser:

-   **Tasks & Subtasks:** The application organizes work in a hierarchical manner. A main task can be broken down into multiple subtasks, which can themselves be further subdivided.
-   **Nodes:** Each task or subtask in the hierarchy is represented as a "node" in the visual tree.
-   **LLM Interaction:** The tool can communicate with configured Large Language Models (e.g., GPT, Llama models via Groq, Ollama) to suggest subtask breakdowns for a selected node.
-   **JSON Files:** Your entire task analysis, including all tasks, subtasks, properties, and LLM interaction history, can be saved to your local computer as a JSON file and loaded back into the application later.
-   **Task Properties:** Each node can have associated properties (metadata) that you can define and edit. This is useful for storing analytical notes, LLM responses, or any other relevant information.

---

## 3. Getting Started

### Launching the Application
*(This guide assumes you have the application running, typically via `ng serve` for local development, or accessed via a deployed URL).*

### Home Screen
When you first open the Task Analyser, you'll be greeted by the Home Screen, which provides two main options:

-   **Create New Task Analysis:** Starts a new, empty analysis project. You'll be prompted to give your root task a name.
-   **Load Existing Task Analysis:** Allows you to load a previously saved task analysis from a JSON file on your computer.

### LLM Settings
Before using LLM-powered features, you'll need to configure your LLM provider settings.

1.  **Accessing LLM Settings:** Navigate to the "LLM Settings" page (usually via a link or icon in the application header or menu).
2.  **Configuration Options:**
    *   **Provider:** Choose your LLM provider from the dropdown (e.g., OpenAI, Groq, Ollama, Custom).
    *   **API Key:** Enter your API key for the selected provider (not needed for local Ollama unless Ollama itself is configured to require it).
        *   **Important:** Your API key is stored in your browser's local storage for convenience during your session but is not exported in the JSON task files by default. Be mindful of API key security.
    *   **Model:** Specify the model you wish to use (e.g., `gpt-3.5-turbo` for OpenAI, `llama3-8b-8192` for Groq). Ensure the model is compatible with your provider.
    *   **Base URL (for Custom/Ollama):** If using a custom LLM provider or a self-hosted Ollama instance with a specific API endpoint, enter the full Base URL here.
    *   **Temperature:** (Typically 0 to 1) Controls the randomness of the LLM's output. Higher values (e.g., 0.8) make the output more random, while lower values (e.g., 0.2) make it more deterministic. Default is usually around 0.7.
    *   **Max Tokens:** The maximum number of tokens (pieces of words) the LLM should generate in its response.
3.  **Save Settings:** Once configured, save your settings. These are typically stored in your browser's local storage.

---

## 4. Main Interface Overview

### Task Analyser View
This is where you'll spend most of your time. It primarily displays:

-   **The Task Tree:** A visual representation of your tasks and subtasks in a hierarchical tree structure. The first task you create or load is the "root node" of this tree.
-   **Global Actions:** Buttons to Save the entire analysis, Load an existing one, or navigate to Home/Settings.

### Node Actions/Controls
Each node in the tree will have a set of controls (often appearing on hover or when the node is selected). Common actions include:

-   **Edit:** Modify the node's text, description, properties, and task type.
-   **Add Child:** Manually add a new subtask under the selected node.
-   **Subdivide (LLM):** Request the LLM to break down the selected node into subtasks.
-   **Delete:** Remove the node (and all its children).
-   **Move:** (If implemented) Arrows to reorder the node among its siblings or change its parent.
-   **Expand/Collapse:** Toggle the visibility of a node's children.
-   **(Phase 2) Get Rationale:** Ask the LLM why it produced a particular breakdown.
-   **(Phase 2) Get Alternative:** Request a different set of subtasks from the LLM.

---

## 5. Working with Tasks (Nodes)

### Creating the Root Task
When you start a new analysis, you'll define the main (root) task. This is the top-level item you want to break down.

### Viewing Node Details
Each node displays its text. You can typically click on a node or an "edit" icon to see more details like its description and custom properties.

### Editing Node Content
1.  Click the "Edit" icon/button on a node.
2.  An editing interface will appear, allowing you to change:
    *   **Text:** The main title or summary of the task.
    *   **Description:** A more detailed explanation of the task.
    *   **Properties (JSON):** A flexible way to add custom metadata. Enter valid JSON (e.g., `{"complexity": "high", "status": "researching"}`).
    *   **(Phase 2) Task Type (Granular Node Typing - US-P2-04):**
        *   **Purpose:** Assigning a specific type to a task helps the LLM generate more relevant and tailored subtasks during subdivision. For example, selecting "Development" for a task will guide the LLM to suggest development-focused subtasks.
        *   **How to Select:** In the edit view, you'll find a "Task Type" dropdown. Choose a type from the predefined list (e.g., General Task, Research, Development, Testing, Documentation). Selecting "-- Select Type --" or leaving it as "General Task" means no specific type is emphasized to the LLM beyond the default.
        *   **Impact:** The selected task type (if not "General") will be included in the prompt sent to the LLM during subdivision.
3.  Save your changes.

### Adding Child Tasks Manually
1.  Select the parent node.
2.  Click the "Add Child" icon/button.
3.  Enter the text and (optionally) description for the new subtask.
4.  The new subtask will appear under the selected parent.

### Deleting Tasks
1.  Select the node you wish to delete.
2.  Click the "Delete" icon/button.
3.  Confirm the deletion. **Caution:** Deleting a node also deletes all its subtasks (children).

### Moving Tasks
If move controls (up/down arrows, outdent) are available:
-   Use the **up/down arrows** to reorder a node among its siblings.
-   Use the **outdent arrow** (if available) to move a child node up one level, making it a sibling of its former parent.

### Expanding/Collapsing Nodes
Nodes with children will have a toggle (often a `+` or `-` icon, or an arrow) to show or hide their subtasks. This helps manage the view of large task trees.

---

## 6. LLM-Powered Task Subdivision

This is a core feature of the Task Analyser.

### Basic Subdivision
1.  Select the node you want to break down.
2.  Ensure your LLM Settings are configured correctly.
3.  Click the "Subdivide" (or similar) button, often represented by an icon like a magic wand or branching lines.
4.  The application will then (subject to features below) send a prompt to the configured LLM.
5.  The LLM will process the request and return a list of suggested subtasks, which will automatically be added as children to the selected node.
    *   If you've assigned a specific **Task Type** to the node (see section 5), this type will be included in the prompt to guide the LLM.

### (Phase 2) Dynamic Prompt Preview & Editing (US-P2-01)
To give you more control over the LLM's output:
1.  After clicking "Subdivide" (and before the request is sent to the LLM), a **Prompt Preview Modal** will appear.
2.  **Review:** This modal displays the exact prompt that the system has constructed based on your task's details (text, description, task type) and project context.
3.  **Edit (Optional):** You can make one-time modifications directly to the prompt in the textarea provided. This is useful for:
    *   Adding specific constraints (e.g., "Focus on user interface aspects").
    *   Requesting a different number of subtasks.
    *   Rephrasing parts of the prompt for clarity.
4.  **Confirm or Cancel:**
    *   Click "Confirm and Subdivide" (or similar) to send the (potentially edited) prompt to the LLM.
    *   Click "Cancel" to close the modal and abort the subdivision process for now.

### (Phase 2) LLM Rationale (US-P2-02)
To understand the "why" behind an LLM's breakdown:
1.  After an LLM has generated subtasks for a node, a **"Get Rationale" button** (or similar icon) may become available on that parent node.
    *   This button typically appears if the node has children generated by an LLM and a rationale hasn't been fetched for that specific breakdown yet.
2.  Click "Get Rationale".
3.  The system sends a new request to the LLM, asking it to explain its reasoning for the previous breakdown (it will usually provide the original task and the subtasks it generated as context for this rationale request).
4.  A **Rationale Display Modal** will appear, showing the LLM's explanation.
5.  This helps you validate the LLM's output and understand its assumptions. The rationale prompt and response are stored in the node's properties for later review.

### (Phase 2) Alternative Breakdowns (US-P2-03)
To explore different ways a task can be structured:
1.  Select a node.
2.  Click the **"Get Alternative" button** (or "Alt" or similar icon).
3.  An **input field for a "hint"** will appear. This is optional.
    *   You can type a brief instruction to guide the LLM for the alternative, e.g., "focus on testing", "simpler steps", "more technical detail".
4.  Click "Fetch" (or press Enter in the hint input).
5.  The system sends a request to the LLM, asking for an *alternative* set of subtasks for the original node, incorporating your hint if provided.
6.  An **Alternative Breakdown Modal** appears, displaying:
    *   The original task text.
    *   The hint you used (if any).
    *   The list of alternative subtasks generated by the LLM.
7.  **Options in the Modal:**
    *   **"Apply this Breakdown":** If you like the alternative, clicking this will replace the current children of your selected node with this new set of subtasks. This action is recorded in the node's LLM interaction history.
    *   **"Close":** Discards the suggested alternative without changing your current task tree.
    *The prompt and response for fetched alternatives are temporarily stored and will be part of the node's history if an alternative is applied.*

### Reviewing LLM Interaction History
Each time you use an LLM feature (subdivision, rationale, applying an alternative), the prompt sent and the raw response received are stored within the `prompts_and_responses` array in the selected node's `properties`.
-   You can view this by editing the node and inspecting its properties JSON.
-   This history is valuable for:
    *   Understanding how the LLM is interpreting requests.
    *   Debugging or refining prompts.
    *   Keeping a trace of the analytical process.
*(A dedicated UI for more easily viewing this history (US-P2-08) is planned for future enhancements).*

---

## 7. Managing Your Analysis

### Saving to JSON
1.  Click the "Save" or "Export" button (usually in the main application header or menu).
2.  Your entire task tree, including all node details, properties, and LLM interaction history, will be compiled into a JSON format.
3.  Your browser will download this as a `.json` file to your computer. Choose a name and location for the file.

### Loading from JSON
1.  From the Home Screen, choose "Load Existing Task Analysis" OR if you are in the analyser view, use the "Load" button.
2.  Select the JSON file you previously saved.
3.  The application will parse the file and reconstruct your task tree.
    *   **Note:** If loading a file from an older version of the application, there might be compatibility considerations, though the application aims to handle this gracefully.

---

## 8. Troubleshooting / FAQ (Example)

-   **Q: LLM calls are failing or giving errors.**
    *   **A:** Double-check your LLM Settings. Ensure the API Key is correct and valid for the selected provider and model. Verify the Base URL if using Ollama or a custom provider. Check your internet connection. Some LLMs might also have rate limits.
-   **Q: The LLM breakdown isn't what I expected.**
    *   **A:**
        *   Use the **Dynamic Prompt Preview** to see what's being sent and try editing the prompt.
        *   Try using a more specific **Task Type** for the node.
        *   Use the **Alternative Breakdowns** feature with a hint to guide the LLM differently.
        *   Ensure the parent task's text and description are clear and provide enough context.
-   **Q: How are my API keys stored?**
    *   **A:** API keys are typically stored in your browser's local storage for the current session for ease of use. They are generally not included when you export the task analysis to a JSON file to protect your key if you share the file. Always be cautious with API key security.

---

This guide should help you get started and make the most of the Angular Task Analyser. Happy analyzing!
