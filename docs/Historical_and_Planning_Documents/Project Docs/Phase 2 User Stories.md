Okay, here are the User Stories for Phase 2 of the Angular Task Analyser, building upon the Phase 1 foundation and focusing on the enhancements for deeper analysis and LLM interaction.

---

**User Stories for Phase 2: Angular Task Analyser Enhancements**

**Theme 1: Enhancing LLM Interaction & Prompt Engineering**

*   **US-P2-01 (Dynamic Prompt Preview & Edit):**
    *   **As an Analyst,** I want to see the exact LLM prompt that will be used for subdividing a specific task node *before* it is sent,
    *   **So that** I can review it and make minor, one-time modifications to the prompt content if needed,
    *   **In order to** guide the LLM more precisely and obtain more relevant sub-task suggestions for that particular node.

*   **US-P2-02 (LLM Rationale Request):**
    *   **As an Analyst,** after an LLM has generated sub-tasks for a node, I want an option to ask the LLM to "Explain the reasoning" or "Describe the assumptions" behind that specific breakdown,
    *   **So that** I can better understand the LLM's output and assess its validity for my analysis.

*   **US-P2-03 (Alternative Breakdown Suggestions):**
    *   **As an Analyst,** when viewing a task node, I want an option to request an "Alternative Breakdown" from the LLM,
    *   **So that** I can explore different analytical perspectives or decomposition strategies for that task,
    *   **In order to** make a more informed decision about the most suitable sub-task structure.
    *   *(Optional Sub-Story: As an Analyst, when requesting an alternative breakdown, I want to provide a brief hint or focus area to guide the LLM, e.g., "focus on technical challenges" or "consider user experience aspects.")*

*   **US-P2-04 (Granular Node Typing for Prompts):**
    *   **As an Analyst,** I want the option to assign a more specific "Task Type" (e.g., "API Endpoint Design," "UI Component Styling") to an individual task node *before* requesting LLM subdivision,
    *   **So that** the system can use a more specialized and contextually appropriate LLM prompt template,
    *   **In order to** generate highly relevant and domain-specific sub-tasks.

**Theme 2: Improving Visualization & Analytical Insight**

*   **US-P2-05 (Visual Cues for Node Analytical Weight):**
    *   **As an Analyst,** I want subtle visual cues (e.g., a small badge, border variation, or color intensity) on task nodes within the flowchart,
    *   **So that** I can quickly identify nodes that represent analytically "heavy" areas, such as those with many children, extensive properties, or very detailed descriptions,
    *   **In order to** direct my attention to complex or information-rich parts of the task tree.

*   **US-P2-06 (Focus Mode for Sub-Tree Analysis):**
    *   **As an Analyst,** when working with a large task tree, I want to activate a "Focus Mode" on a selected task node,
    *   **So that** all other parts of the tree are visually de-emphasized (e.g., dimmed or collapsed), bringing the selected node and its direct lineage (parents and children) to the forefront,
    *   **In order to** reduce cognitive load and concentrate on analyzing a specific branch of the task structure without distraction.

*   **US-P2-07 (Enhanced Inline Property Display):**
    *   **As an Analyst,** I want to easily expand or collapse the properties section of a task node directly within the flowchart view (without opening a modal),
    *   **And** I want predefined analytical properties (e.g., "Effort Category: [Small, Medium, Large]", "Key Conceptual Dependencies") to be displayed in a more structured and readable format if present,
    *   **So that** I can quickly access and digest important analytical metadata associated with a task.

**Theme 3: Enhancing Data & Structure for Analysis**

*   **US-P2-08 (Review LLM Interaction History):**
    *   **As an Analyst,** for any task node (especially those generated or subdivided by an LLM), I want to easily access and review the chronological history of LLM prompts sent and the corresponding responses received,
    *   **So that** I can trace the evolution of that node's analysis and understand the context of its current state or its children's generation.

*   **US-P2-09 (Dedicated Node Annotation Field):**
    *   **As an Analyst,** I want a dedicated, easily accessible multi-line text field for "Analysis Notes" or "Observations" on each task node, separate from the structured JSON properties,
    *   **So that** I can capture my free-form qualitative insights, questions, or analytical thoughts directly against the relevant task component.

**Theme 4: Improving User Experience for Analysis Flow**

*   **US-P2-10 (Keyboard Shortcuts for Analysis Actions):**
    *   **As an Analyst,** I want to use common keyboard shortcuts for frequent analysis-focused actions such as subdividing a node, editing a node, adding a child node, or toggling "Mark for Review,"
    *   **So that** I can interact with the task tree more rapidly and keep my analysis flow uninterrupted.

*   **US-P2-11 (Personal "Mark for Review" Flag):**
    *   **As an Analyst,** I want a simple, toggleable visual flag (e.g., a question mark or eye icon) that I can apply to any task node,
    *   **So that** I can personally mark nodes that I need to revisit for further analytical thought, or whose breakdown seems incomplete or questionable, without altering the core task data.

*   **US-P2-12 (Node Search & Filter for Analysis):**
    *   **As an Analyst,** when working with a large or complex task tree, I want a simple search bar to find task nodes based on their text content or the content of their properties,
    *   **And** I want basic filtering capabilities (e.g., "show only nodes marked for review," "show nodes with 'risk' in properties"),
    *   **So that** I can efficiently navigate to and isolate specific points of analysis within the overall structure.

---

These user stories for Phase 2 are designed to build upon the Phase 1 foundation, adding layers of sophistication to the analysis capabilities of the tool. Each story aims to empower the user to interact more deeply with both the task structure and the LLM.