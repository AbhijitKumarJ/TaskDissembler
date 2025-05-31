Okay, here's a Phase 2 Product Requirements Document (PRD) focusing on the enhancements identified to make the Angular Task Analyser a more powerful analysis and breakdown tool. This assumes Phase 1 (the initial Angular rebuild as per the previous PRD) is complete or well underway.

## Product Requirements Document: Angular Task Analyser - Phase 2 Enhancements

**1. Introduction**

This document outlines the requirements for Phase 2 of the Angular Task Analyser project. Building upon the foundational Angular application established in Phase 1, Phase 2 aims to significantly enhance the tool's capabilities for in-depth task analysis, LLM interaction, and insightful visualization. The focus remains on augmenting the user's ability to understand, explore, and refine task breakdowns, rather than adding project management features.

**2. Goals**

*   Provide users with finer control over LLM-driven task subdivision.
*   Enable deeper understanding of LLM-generated breakdowns.
*   Improve the visualization of complex task structures for better analytical insight.
*   Offer richer ways to capture and review analytical metadata and notes.
*   Streamline the user experience for analysis-focused workflows.

**3. Target Audience**

(Same as Phase 1: Project Managers, Software Developers, Students, Content Creators, anyone needing to break down complex tasks.)
The enhancements in Phase 2 will particularly benefit users who engage in detailed, iterative analysis and want to leverage LLMs more interactively.

**4. User Stories (Phase 2)**

**Enhancing LLM Interaction & Prompt Engineering:**

*   **US-P2-01 (Dynamic Prompt Preview):** As an analyst, I want to see the LLM prompt before it's sent for task subdivision and be able to make minor, one-time modifications so I can guide the LLM more precisely for a specific node.
*   **US-P2-02 (LLM Rationale):** As an analyst, after an LLM generates subtasks, I want an option to ask the LLM to explain its reasoning or assumptions for that specific breakdown so I can better understand and validate the output.
*   **US-P2-03 (Alternative Breakdowns):** As an analyst, I want to request an alternative set of subtasks from the LLM for a given node, potentially with a hint (e.g., "focus on technical aspects"), so I can explore different analytical perspectives.
*   **US-P2-04 (Granular Node Typing):** As an analyst, I want to optionally assign a more specific "task type" to an individual node before subdivision so the system can use a more tailored LLM prompt for that node.

**Improving Visualization & Analytical Insight:**

*   **US-P2-05 (Visual Complexity Cues):** As an analyst, I want subtle visual cues on nodes (e.g., based on child count or property density) so I can quickly identify "analysis-heavy" areas in the task tree.
*   **US-P2-06 (Focus Mode):** As an analyst, I want to activate a "focus mode" on a selected node that visually de-emphasizes other parts of the tree so I can concentrate on a specific sub-tree without distraction.
*   **US-P2-07 (Enhanced Property Display):** As an analyst, I want to easily expand/collapse the properties section of a node directly in the flowchart view and see predefined analytical properties (e.g., "effort category") displayed in a more structured way for quick understanding.

**Enhancing Data & Structure for Analysis:**

*   **US-P2-08 (LLM History Review):** As an analyst, I want to easily review the history of LLM prompts and responses associated with a specific node's generation or its children's generation so I can trace the analytical process.
*   **US-P2-09 (Node Annotation):** As an analyst, I want a dedicated field for "Analysis Notes" or "Observations" on each node, separate from structured properties, so I can capture free-form thoughts and qualitative insights.

**Improving User Experience for Analysis Flow:**

*   **US-P2-10 (Keyboard Shortcuts):** As an analyst, I want to use keyboard shortcuts for common analysis actions (e.g., subdivide, edit, add child) so I can work more efficiently.
*   **US-P2-11 (Mark for Review Flag):** As an analyst, I want a simple visual flag I can toggle on a node to mark it for my own future review or further analytical thought.
*   **US-P2-12 (Node Search/Filter):** As an analyst, I want to search or filter nodes by their text or property content so I can quickly locate specific points of analysis within a large tree.

**5. Proposed Features (Building on Phase 1 Angular Components)**

**5.1. Core/Shared Service Enhancements**

    *   **`LlmService`:**
        *   **Dynamic Prompt Generation:** Modify `createPrompt` to accept optional user overrides or context.
        *   **Rationale Prompt:** Add a new method/prompt type to ask for LLM's reasoning.
        *   **Alternative Prompt Strategy:** Logic to slightly alter prompts to solicit different breakdown perspectives.
        *   Support for more granular task types from `llm_prompts.js` based on node-specific input.
    *   **`TaskTreeService`:**
        *   Store LLM rationale alongside `prompts_and_responses`.
        *   Add a dedicated `analysisNotes: string` field to the `TaskNode` data structure.
        *   Add a `markedForReview: boolean` field to the `TaskNode` data structure.
        *   Implement search/filter logic across the `taskTree`.
    *   **`ConfigService` / Local Storage:**
        *   Consider storing user preferences for visual cues or focus mode behavior.

**5.2. Component Enhancements**

    *   **`TaskNodeComponent`:**
        *   **Visual Cues:** Implement CSS classes or dynamic styles based on node properties (e.g., `node.children.length`, `Object.keys(node.properties).length`).
        *   **Focus Mode Interaction:** Emit events or interact with a shared service to trigger focus mode. Its own styling will change based on global focus state.
        *   **Expandable Properties:** Add a toggle button to show/hide properties inline.
        *   **New Action Icons/Buttons:**
            *   "Explain Breakdown" (triggers `LlmService` for rationale).
            *   "Suggest Alternative" (triggers `LlmService` for alternative breakdown).
            *   "Mark for Review" (toggles `node.markedForReview` and updates display).
            *   Button to view LLM Prompt/Response History (opens `LlmHistoryModalComponent`).
        *   Integrate display for `analysisNotes`.
    *   **Modal Components:**
        *   **`PromptPreviewModalComponent`:**
            *   Input: Generated prompt string.
            *   Displays prompt in a textarea, allowing edits.
            *   "Proceed with this prompt" / "Cancel" buttons.
        *   **`AlternativeBreakdownOptionsModalComponent` (Optional):**
            *   Input: `nodeId`.
            *   Offers a few predefined strategies or a small text input for a hint to guide the alternative breakdown.
        *   **`LlmRationaleModalComponent`:**
            *   Input: Node's LLM rationale string.
            *   Displays the rationale.
        *   **`LlmHistoryModalComponent`:**
            *   Input: `node.prompts_and_responses` array.
            *   Displays a chronological list of prompts sent and responses received for that node.
        *   **`EditNodeModalComponent` (Enhancement):**
            *   Add a dedicated textarea for `analysisNotes`.
    *   **New Global UI Elements:**
        *   **`SearchBarComponent` (likely part of `TaskAnalyserComponent` or a header):**
            *   Input field for search terms.
            *   Optional filters (e.g., "Only show 'marked for review'").
            *   Interacts with `TaskTreeService` to filter the displayed tree or highlight matching nodes.

**5.3. Data Structure Enhancements (TaskNode Object)**
    *   `analysisNotes: string` (for free-form observations)
    *   `markedForReview: boolean` (user-set flag)
    *   `llmRationale: string` (if separate from general responses)
    *   Potentially `nodeSpecificTaskType: string[]` (for granular prompting)

**6. Non-Functional Requirements**

*   **Performance:** Ensure new visualizations and LLM interactions do not significantly degrade performance, especially for large trees. Search/filter should be efficient.
*   **Intuuitiveness:** New features should be discoverable and easy to understand. Tooltips or brief help text might be necessary.
*   **Modularity:** Continue to build with well-encapsulated Angular components and services.

**7. Out of Scope (for Phase 2)**

*   (Same as Phase 1, unless specific items from Phase 1's "Future Considerations" are being pulled in.)
*   Full natural language interaction for prompt modification (stick to textarea edits).
*   Advanced AI-driven insights beyond sub-task generation and rationale (e.g., predicting task duration, identifying complex dependencies automatically).
*   Visual diffing of alternative breakdowns (user will manually compare).

**8. Success Metrics (Phase 2)**

*   Users actively utilize the prompt preview and LLM rationale features.
*   Increased user satisfaction with the depth and relevance of LLM-generated breakdowns.
*   Positive feedback on the utility of focus mode, visual cues, and node annotations for analysis.
*   Smooth performance of search/filter and new visual elements.
*   Demonstrable improvement in the user's ability to analyze and refine complex task structures.

**9. Technical Considerations & Challenges**

*   **LLM API Costs/Rate Limits:** More frequent/complex LLM interactions could increase costs or hit rate limits. Clear user feedback on LLM call status is important.
*   **State Management for UI:** Managing focus mode state, search/filter results, and dynamic visual cues across potentially many `TaskNodeComponent` instances will require careful state management (e.g. using RxJS with services).
*   **Prompt Engineering Complexity:** Designing effective prompts for "rationale" or "alternative breakdowns" will require iteration.
*   **UI Complexity:** Adding more icons and options to each node needs to be done carefully to avoid clutter. Inline property display and modals must be well-designed.

This Phase 2 PRD sets the stage for transforming the Task Analyser into a significantly more powerful analytical aid. The key is to empower the user with more control and insight into the LLM-driven breakdown process.