Okay, let's break down the Phase 1 User Stories for the Angular Task Analyser and detail the technical implementation for each. We'll focus on building the core application structure.

**Assumptions for Phase 1 Technical Implementation:**

*   **Angular Version:** Latest stable (e.g., Angular 17+ with standalone components).
*   **UI Library:** Bootstrap 5 for layout and basic components (can be integrated with ng-bootstrap or PrimeNG if preferred, but we'll assume direct Bootstrap usage for simplicity here).
*   **State Management:** Angular Services with RxJS (BehaviorSubjects/Subjects) for reactive state.
*   **Styling:** SCSS for component-specific styles.
*   **LLM Interaction:** Direct `HttpClient` calls from Angular services.

---

**User Stories for Phase 1 & Technical Implementation Details**

**US01 (LLM Config): As a user, I want to configure my preferred LLM provider, model name, API key, and API endpoint (if applicable) so that the application can use my chosen LLM for task breakdown.**

*   **Technical Implementation:**
    *   **Component:** `LlmSettingsComponent`
        *   **Template (`llm-settings.component.html`):**
            *   Form with fields:
                *   Dropdown for "LLM Provider" (e.g., `['OpenAI', 'Groq', 'Ollama', 'Other (Manual Endpoint)']`).
                *   Text input for "Model Name".
                *   Password input for "API Key" with a toggle button for visibility (using `[type]="showApiKey ? 'text' : 'password'"` and an icon).
                *   Text input for "API Endpoint" (conditionally shown if "Other" provider is selected using `*ngIf`).
            *   "Save Settings" button.
        *   **Component Logic (`llm-settings.component.ts`):**
            *   Uses Angular's `ReactiveFormsModule` or `FormsModule` for form handling.
            *   Inject `ConfigService`.
            *   On initialization (`ngOnInit`), load existing settings from `ConfigService` and populate the form.
            *   On "Save Settings" click:
                *   Retrieve form values.
                *   Call `ConfigService.saveLlmConfig(config)` to store the provider, model, and endpoint.
                *   **API Key Handling:** The API key should ideally be stored ephemerally in a service (e.g., `LlmService`) for the current session and *not* persistently in local storage unless the user explicitly consents with a strong warning. For Phase 1, let's assume it's passed to `LlmService` and held in memory.
                *   Show a success notification (e.g., via `NotificationService`).
    *   **Service:** `ConfigService`
        *   `llmConfig$: BehaviorSubject<LlmConfig | null>` to hold the current LLM configuration (provider, model, endpoint).
        *   `loadLlmConfig(): LlmConfig | null`: Loads config from local storage (key: `llmUserConfig`).
        *   `saveLlmConfig(config: { provider: string, modelName: string, apiEndpoint?: string }): void`: Saves the given config (provider, model, endpoint) to local storage.
        *   `getApiKey(): string | null` and `setApiKey(key: string): void` (if API key is managed here ephemerally, though `LlmService` might be better).
    *   **Service:** `LlmService`
        *   Will hold the API key in a private variable for the session, set via a method called by `LlmSettingsComponent`.
        *   Will subscribe to `ConfigService.llmConfig$` to get provider, model, and endpoint when making API calls.
    *   **Routing:** Add a route `/settings` to `app.routes.ts` pointing to `LlmSettingsComponent`.

---

**US02 (LLM Config Save): As a user, I want my LLM configuration (excluding API key) to be saved (e.g., in local storage) so I don't have to re-enter it every time.**

*   **Technical Implementation:**
    *   **Service:** `ConfigService` (as detailed in US01)
        *   `saveLlmConfig` will explicitly save only provider, model name, and API endpoint (if present) to local storage.
        *   `loadLlmConfig` will retrieve these from local storage.
    *   **Component:** `LlmSettingsComponent`
        *   On `ngOnInit`, it calls `ConfigService.loadLlmConfig()` to pre-fill the form.
        *   The API Key field will always be empty on load for security.
    *   **Local Storage Key:** e.g., `taskAnalyserLlmConfig`.

---

**US03 (New Task): As a user, I want to create a new task analysis project by providing a project name, project description, an overall task summary, and optionally, the target technology stack, so the LLM can generate relevant sub-tasks.**

*   **Technical Implementation:**
    *   **Component:** `NewTaskFormComponent`
        *   **Template (`new-task-form.component.html`):**
            *   Form with fields:
                *   Text input for "Project Name".
                *   Textarea for "Project Description".
                *   Textarea for "Overall Task Summary" (root node text).
                *   Text input or multi-select for "Target Technology Stack" (e.g., Angular, React, Python).
            *   "Start Dissembling" button.
        *   **Component Logic (`new-task-form.component.ts`):**
            *   Inject `TaskTreeService`, `LlmService`, `Router`.
            *   Uses `ReactiveFormsModule`.
            *   On "Start Dissembling":
                1.  Validate form inputs.
                2.  Call `TaskTreeService.initializeNewTree(projectName, projectDesc, rootTaskSummary, techStack)`. This method will:
                    *   Create the root node: `{ id: 'root', text: rootTaskSummary, description: projectDesc, children: [], properties: { projectName, techStack }, prompts_and_responses: [] }`.
                    *   Set this root node as the current tree in `TaskTreeService`.
                3.  Trigger initial subdivision:
                    *   Get the root node from `TaskTreeService`.
                    *   Call `LlmService.subDivideTaskLLM(rootNode, true, projectDesc, techStack)` (or similar, passing necessary context).
                    *   The `subDivideTaskLLM` method will handle prompt creation based on `techStack` if provided.
                    *   On successful LLM response:
                        *   Parse subtasks.
                        *   Call `TaskTreeService.addChildrenToNode('root', subtasks)` (or a method that adds multiple children with their properties).
                        *   Store the prompt and response in the root node's `prompts_and_responses`.
                4.  Navigate to the main task analyser view (`/analyser`) using `Router.navigate(['/analyser'])`.
    *   **Service:** `TaskTreeService`
        *   `taskTree$: BehaviorSubject<TaskNode | null>` to hold the current root task node.
        *   `currentTechStack$: BehaviorSubject<string[] | null>`
        *   `initializeNewTree(projectName: string, projectDesc: string, rootTaskSummary: string, techStack: string[]): void`.
        *   Methods to add children, update properties (will be expanded later).
    *   **Service:** `LlmService`
        *   `subDivideTaskLLM(node: TaskNode, isRoot: boolean, projectContext: string, techStack?: string[]): Observable<SubTask[]>`.
        *   Internal logic to select/build prompt based on `isRoot` and `techStack`.
    *   **Routing:** A route like `/new-task` to `NewTaskFormComponent`.

---

**US04 (Load Existing): As a user, I want to load an existing task breakdown from a `task_tree.json` file so I can continue working on a previous project.**

*   **Technical Implementation:**
    *   **Component:** `HomeComponent` (or a dedicated file input component if preferred)
        *   **Template (`home.component.html`):**
            *   `<input type="file" (change)="onFileSelected($event)" accept=".json">`
        *   **Component Logic (`home.component.ts`):**
            *   Inject `TaskTreeService`, `ConfigService`, `Router`, `NotificationService`.
            *   `onFileSelected(event: Event): void`:
                1.  Get the selected file from `event.target.files[0]`.
                2.  Use `FileReader` to read the file content as text.
                3.  On `reader.onload`:
                    *   Parse the JSON content: `JSON.parse(reader.result as string)`.
                    *   Validate the structure (e.g., presence of `taskTree` and `llmConfig` for new format, or just the tree for old format).
                    *   Call `TaskTreeService.loadTree(parsedJson.taskTree || parsedJson)`.
                    *   If `parsedJson.llmConfig` exists, call `ConfigService.setLlmConfigManually(parsedJson.llmConfig)` to update provider, model, endpoint (API key field in settings remains blank).
                    *   Navigate to `/analyser`.
                    *   Show success/error notification.
    *   **Service:** `TaskTreeService`
        *   `loadTree(treeData: TaskNode): void`: Sets `this.taskTree$.next(treeData)`.
    *   **Service:** `ConfigService`
        *   `setLlmConfigManually(config: { provider: string, modelName: string, apiEndpoint?: string, taskType?: string[] }): void`: Updates the `llmConfig$` and saves to local storage (excluding API key). `taskType` (from old `rootFunctions.js` export) can be stored or mapped.
    *   **Routing:** `HomeComponent` is likely the default route (`/`).

---

**US05 (View Hierarchy): As a user, I want to see the task hierarchy displayed as a nested, flowchart-like structure so I can easily understand the relationships between tasks.**
**US06 (Node Details): As a user, I want to see the text and properties of each task node clearly displayed.**
**US15 (Visual Consistency): As a user, I want the task nodes (icons, actions, layout) to look and feel the same as in the original application for familiarity.**

*   **Technical Implementation (Combined):**
    *   **Component:** `TaskAnalyserComponent` (Main view)
        *   **Template (`task-analyser.component.html`):**
            *   Container div for the flowchart.
            *   `<app-task-node [nodeData]="taskTreeService.taskTree$ | async"></app-task-node>` (renders the root node).
        *   **Component Logic (`task-analyser.component.ts`):**
            *   Inject `TaskTreeService`.
            *   Expose `taskTreeService.taskTree$` to the template.
    *   **Component:** `TaskNodeComponent` (Recursive)
        *   **Template (`task-node.component.html`):**
            *   Main `div.task-node` (styles from original `styles.css` adapted to SCSS).
            *   `div.node-content`:
                *   `span.node-text`: Displays `nodeData.text`.
                *   `div.node-actions`: Contains all action icons (`<i>` tags with Font Awesome classes). Each icon will have a `(click)` handler (to be implemented in later stories).
                    *   `<i class="fas fa-edit" (click)="onEdit()"></i>`
                    *   ... (all other icons from original `flowchartRenderer.js`)
            *   `div.node-properties` (conditionally shown or expandable):
                *   Iterate over `nodeData.properties` using `*ngFor="let prop of objectKeys(nodeData.properties)"` and display `{{ prop }}: {{ nodeData.properties[prop] }}`.
                *   `objectKeys(obj)` would be a helper method in the component to get keys for `*ngFor`.
            *   `div.node-children` (if `nodeData.children && nodeData.children.length > 0`):
                *   Loop through children: `<div *ngFor="let child of nodeData.children"> <app-task-node [nodeData]="child"></app-task-node> </div>`.
                *   CSS for connecting lines (adapting original `styles.css` logic for `::before` pseudo-elements).
        *   **Component Logic (`task-node.component.ts`):**
            *   `@Input() nodeData!: TaskNode;`
            *   Placeholder methods for each action icon's `(click)` handler (e.g., `onEdit()`, `onDelete()`, `onSubdivide()`, etc.). These will later interact with services or modals.
            *   `objectKeys = Object.keys;` (to use in template for iterating properties).
        *   **Styling (`task-node.component.scss`):**
            *   Migrate relevant styles from `styles.css` (for `.task-node`, `.node-content`, `.node-text`, `.node-actions`, `.node-children`, `.node-properties`, `.action-icon`, connecting lines).
    *   **Global Styles (`styles.scss`):**
        *   Dark theme, body background, default text color.
    *   **Routing:** `/analyser` route to `TaskAnalyserComponent`.

---

**US16 (Navigation): As a user, I want a clear home page with navigation to LLM settings, creating a new task, or loading an existing task.**

*   **Technical Implementation:**
    *   **Component:** `HomeComponent`
        *   **Template (`home.component.html`):**
            *   Links/Buttons with `routerLink`:
                *   `<a routerLink="/settings">LLM Provider Settings</a>`
                *   `<a routerLink="/new-task">Create New Task Analysis</a>`
            *   File input for loading existing tasks (as in US04).
        *   **Component Logic (`home.component.ts`):**
            *   (Primarily handles file loading as per US04).
    *   **Component:** `AppComponent` (Shell)
        *   **Template (`app.component.html`):**
            *   Optional: A simple header with a "Home" link (`<a routerLink="/">Task Analyser Home</a>`) if persistent navigation is desired outside the `HomeComponent`.
            *   `<router-outlet></router-outlet>`
    *   **Routing (`app.routes.ts`):**
        *   `{ path: '', component: HomeComponent, pathMatch: 'full' }`
        *   `{ path: 'settings', component: LlmSettingsComponent }`
        *   `{ path: 'new-task', component: NewTaskFormComponent }`
        *   `{ path: 'analyser', component: TaskAnalyserComponent }`
        *   Consider a wildcard route `{ path: '**', redirectTo: '' }` or a `NotFoundComponent`.

---

**Remaining User Stories for Phase 1 (mostly involving node actions - implementation details will involve modals and service calls):**

These will build upon the `TaskNodeComponent` and `TaskTreeService`.

*   **US07 (Edit Node):**
    *   `TaskNodeComponent.onEdit()` opens `EditNodeModalComponent` (new Angular modal component) passing `nodeData`.
    *   `EditNodeModalComponent` allows editing text and properties (as JSON string).
    *   On save, calls `TaskTreeService.updateNode(nodeId, newText, newProperties)`.
*   **US08 (Delete Node):**
    *   `TaskNodeComponent.onDelete()`: Show confirmation. If confirmed, call `TaskTreeService.deleteNode(nodeId)`.
*   **US09 (Subdivide Node - LLM):**
    *   `TaskNodeComponent.onSubdivide()` (for default) / `onSubdivideWithOptions()`:
        *   Collect necessary context (parent node, project info).
        *   Call `LlmService.subDivideTaskLLM(...)`.
        *   On success, call `TaskTreeService.addChildrenToNode(parentNodeId, llmSubtasks)`.
*   **US10 (Add Child Node):**
    *   `TaskNodeComponent.onAddChild()`: Opens `AddNodeModalComponent` (new Angular modal) configured to add a child to `nodeData.id`.
    *   `AddNodeModalComponent` collects text/properties. On save, calls `TaskTreeService.addChildNode(...)`.
*   **US11 (Add Sibling Node):**
    *   `TaskNodeComponent.onAddSiblingAbove()/onAddSiblingBelow()`: Opens `AddNodeModalComponent` configured for siblings.
    *   On save, calls `TaskTreeService.addSiblingNodeAbove/Below(...)`.
*   **US12 (Move Node):**
    *   `TaskNodeComponent.onMoveUp/Down/ToParentLevel()`: Call corresponding methods in `TaskTreeService` (e.g., `TaskTreeService.moveNodeUp(nodeId)`).
*   **US13 (Add Property):**
    *   `TaskNodeComponent.onAddProperty()`: Opens `AddPropertyModalComponent` (or reuses `EditNodeModalComponent` in a specific mode).
    *   On save, calls `TaskTreeService.addPropertyToNode(nodeId, key, value)`.
*   **US14 (Export Project):**
    *   Button in `TaskAnalyserComponent`.
    *   On click:
        *   Get current tree from `TaskTreeService.taskTree$.value`.
        *   Get LLM config (provider, model, endpoint) from `ConfigService.llmConfig$.value`.
        *   Construct the export object: `{ taskTree: ..., llmConfig: ... }`.
        *   Use browser APIs to trigger JSON file download (similar to original `exportJson` function).

**Services in More Detail (Phase 1 focus):**

*   **`TaskTreeService.ts`:**
    *   `taskTree$: BehaviorSubject<TaskNode | null> = new BehaviorSubject(null);`
    *   `initializeNewTree(...)`
    *   `loadTree(treeData: TaskNode)`
    *   `findNodeById(nodeId: string, searchNode: TaskNode = this.taskTree$.value): TaskNode | null` (recursive helper)
    *   `findParentNode(nodeId: string, searchNode: TaskNode = this.taskTree$.value, parent: TaskNode | null = null): TaskNode | null` (recursive helper)
    *   `updateNode(nodeId: string, newText?: string, newProperties?: any)`: Finds node, updates, `this.taskTree$.next({...this.taskTree$.value})` (immutable update to trigger change detection).
    *   `deleteNode(nodeId: string)`: Finds parent, filters children, immutable update.
    *   `addChildNode(parentId: string, text: string, properties?: any)`: Generates unique ID, creates new node, adds to parent's children, immutable update.
    *   `addChildrenToNode(parentId: string, childrenData: {text: string, description?: string, properties?: any}[])`: Batch adds children.
    *   ... (other manipulation methods from original `treeDataManipulation.js`, adapted for immutability and BehaviorSubjects).
    *   `generateUniqueId(): string`
    *   `exportTree(): { taskTree: TaskNode, llmConfig: LlmConfig }` (gets config from `ConfigService`).
*   **`LlmService.ts`:**
    *   `private apiKey: string | null = null;`
    *   `constructor(private http: HttpClient, private configService: ConfigService)`
    *   `setApiKey(key: string): void { this.apiKey = key; }`
    *   `createPrompt(node: TaskNode, isRoot: boolean, projectContext: string, techStack?: string[]): any[] /* LLM messages array */` (migrates logic from original `llmService.js` and uses `prompts.js` data, which can be a const object in this service).
    *   `subDivideTaskLLM(...): Observable<SubTask[]>`:
        *   Gets current provider, model, endpoint from `configService.llmConfig$.value`.
        *   Checks `this.apiKey`.
        *   Builds request headers and body based on provider.
        *   Uses `this.http.post(...)`.
        *   Handles response parsing (extracting content from OpenAI/Groq/Ollama structures).
*   **`NotificationService.ts`:**
    *   Simple service to show toast-like messages (could use a library or basic DOM manipulation for Phase 1).
    *   `showSuccess(message: string)`
    *   `showError(message: string)`

This detailed breakdown should provide a solid plan for implementing Phase 1. Each US builds upon the previous, creating the core Angular application. Remember to use Angular's change detection effectively, especially when updating the `taskTree` in `TaskTreeService` (by emitting new object references).











Okay, let's detail the User Stories US06 through US15 for Phase 1, focusing on the technical implementation for each. These stories primarily involve interactions with the `TaskNodeComponent` and modifications to the `TaskTreeService`.

**Assumptions:**

*   The `TaskNodeComponent` is already set up to display basic node text and recursively render children (from US05).
*   `TaskTreeService` has foundational methods for finding nodes and is set up with a `BehaviorSubject` for the `taskTree`.
*   Modal components (`EditNodeModalComponent`, `AddNodeModalComponent`, etc.) will be created as needed. We'll assume a simple modal service or a library like `ng-bootstrap` / Angular Material Dialogs is used to manage them.
*   `NotificationService` is available for user feedback.

---

**US06 (Node Details): As a user, I want to see the text and properties of each task node clearly displayed.**

*   **Technical Implementation (Already partially covered in US05, this refines it):**
    *   **Component:** `TaskNodeComponent`
        *   **Template (`task-node.component.html`):**
            *   `span.node-text`: Displays `{{ nodeData.text }}`.
            *   `div.node-properties [hidden]="!propertiesVisible">`:
                *   `*ngIf="nodeData.properties && objectKeys(nodeData.properties).length > 0"`
                *   Iterate: `*ngFor="let key of objectKeys(nodeData.properties)"`
                    *   Display: `<strong>{{ key }}:</strong> {{ nodeData.properties[key] }}` (Handle non-string values appropriately, e.g., `JSON.stringify` for objects/arrays if they appear).
            *   Add a small toggle icon (e.g., eye or chevron) next to the node text or in actions to control `propertiesVisible`.
        *   **Component Logic (`task-node.component.ts`):**
            *   `@Input() nodeData!: TaskNode;`
            *   `propertiesVisible: boolean = false;` (or load preference from a service)
            *   `toggleProperties(): void { this.propertiesVisible = !this.propertiesVisible; }`
            *   `objectKeys = Object.keys;`

---

**US07 (Edit Node): As a user, I want to edit the text and properties (JSON format) of any task node so I can correct or update information.**

*   **Technical Implementation:**
    *   **Component:** `TaskNodeComponent`
        *   **Template:** `<i class="fas fa-edit action-icon" (click)="onEdit()"></i>`
        *   **Component Logic:**
            *   `onEdit(): void`:
                *   Open `EditNodeModalComponent`, passing `this.nodeData`.
                *   Subscribe to the modal's close/save event. If saved, the modal should return the updated text and properties.
                *   Call `this.taskTreeService.updateNode(this.nodeData.id, updatedData.text, updatedData.properties)`.
    *   **Component:** `EditNodeModalComponent` (New Angular Modal Component)
        *   **Template:**
            *   Form with:
                *   Text input for `nodeText`, pre-filled with `nodeData.text`.
                *   Textarea for `nodePropertiesJson`, pre-filled with `JSON.stringify(nodeData.properties, null, 2)`.
            *   "Save" and "Cancel" buttons.
        *   **Component Logic:**
            *   Receives `nodeData` as input (e.g., via modal data).
            *   On "Save":
                *   Get `nodeText` from input.
                *   Try to parse `nodePropertiesJson` using `JSON.parse()`. Handle potential `SyntaxError` (show error to user).
                *   If valid, emit a save event with `{ text: nodeText, properties: parsedProperties }` and close the modal.
    *   **Service:** `TaskTreeService`
        *   `updateNode(nodeId: string, newText?: string, newProperties?: any): void`:
            *   Find the node in the tree.
            *   If `newText` is provided, update `node.text`.
            *   If `newProperties` is provided, update `node.properties`.
            *   Emit an updated copy of the entire `taskTree` via `this.taskTree$.next(...)` for immutability and change detection.
            *   Call `NotificationService.showSuccess("Node updated.")`.

---

**US08 (Delete Node): As a user, I want to delete any task node so I can remove irrelevant or incorrect tasks.**

*   **Technical Implementation:**
    *   **Component:** `TaskNodeComponent`
        *   **Template:** `<i class="fas fa-trash action-icon" (click)="onDelete()"></i>`
        *   **Component Logic:**
            *   `onDelete(): void`:
                *   Show a confirmation dialog (e.g., `window.confirm("Are you sure you want to delete this node and all its children?")`).
                *   If confirmed, call `this.taskTreeService.deleteNode(this.nodeData.id)`.
    *   **Service:** `TaskTreeService`
        *   `deleteNode(nodeId: string): void`:
            *   If `nodeId === 'root'`, potentially clear the whole tree or show an error (deleting root usually means starting over). For now, let's assume root cannot be deleted this way.
            *   Find the parent of the node with `nodeId`.
            *   If parent found, filter `parentNode.children` to remove the node.
            *   Emit an updated copy of the `taskTree` via `this.taskTree$.next(...)`.
            *   Call `NotificationService.showSuccess("Node deleted.")`.

---

**US09 (Subdivide Node - LLM): As a user, I want to further subdivide an existing task node using the configured LLM so I can get more granular sub-tasks.**
    *(This covers both "Subdivide with options" and "Subdivide with default options" icons for Phase 1, the "options" part might just be a flag or slightly different initial context for now, more advanced options in Phase 2).*

*   **Technical Implementation:**
    *   **Component:** `TaskNodeComponent`
        *   **Template:**
            *   `<i class="fas fa-code-branch action-icon" (click)="onSubdivide(true)" title="Subdivide with options"></i>`
            *   `<i class="fas fa-sitemap action-icon" (click)="onSubdivide(false)" title="Subdivide with default options"></i>`
        *   **Component Logic:**
            *   `isLoadingSubdivision: boolean = false;`
            *   `onSubdivide(useCustomOptions: boolean): void`:
                1.  `this.isLoadingSubdivision = true;` (for UI feedback, e.g., disable button, show spinner).
                2.  Get project context (e.g., from root node properties or a dedicated field in `TaskTreeService`).
                3.  Get parent task description (current `nodeData.text` or `nodeData.description`).
                4.  Get sibling task descriptions (optional, could be complex for Phase 1, might simplify to just parent context).
                5.  Call `this.llmService.subDivideTaskLLM(this.nodeData, false, projectContext, parentTaskDesc, siblingDesc, this.taskTreeService.currentTechStack$.value, useCustomOptions)` (pass necessary context).
                6.  Subscribe to the Observable:
                    *   On success (LLM returns subtasks as `SubTask[]`):
                        *   Call `this.taskTreeService.addChildrenToNode(this.nodeData.id, subtasks, { prompt: /* original prompt sent */, response: /* raw LLM response */ })`.
                        *   `this.notificationService.showSuccess("Node subdivided.")`
                    *   On error:
                        *   `this.notificationService.showError("Failed to subdivide: " + error.message)`
                    *   Finally: `this.isLoadingSubdivision = false;`
    *   **Service:** `LlmService`
        *   `subDivideTaskLLM(node: TaskNode, isRoot: boolean, projectContext: string, parentTaskDesc: string, siblingsDesc: string, techStack?: string[], useCustomOptions?: boolean): Observable<SubTask[]>`:
            *   Calls `createPrompt(...)` internally, potentially passing `useCustomOptions` to slightly vary the prompt if logic is added.
            *   Makes the HTTP call.
            *   Parses the response and returns an array of subtask objects (each should have at least `text`, `description`, and other properties LLM provides).
    *   **Service:** `TaskTreeService`
        *   `addChildrenToNode(parentId: string, childrenData: SubTask[], llmInteraction?: { prompt: any, response: string }): void`:
            *   Find the parent node.
            *   For each `childData` in `childrenData`:
                *   Generate a unique ID.
                *   Create a new `TaskNode` object from `childData` (mapping `text`, `description`, and other properties).
                *   Add to `parentNode.children`.
            *   If `llmInteraction` is provided, add it to `parentNode.prompts_and_responses`.
            *   Emit updated `taskTree`.

---

**US10 (Add Child Node): As a user, I want to manually add a new child task node to an existing node so I can expand the task breakdown.**

*   **Technical Implementation:**
    *   **Component:** `TaskNodeComponent`
        *   **Template:** `<i class="fas fa-plus action-icon" (click)="onAddChild()" title="Add Child"></i>`
        *   **Component Logic:**
            *   `onAddChild(): void`:
                *   Open `AddNodeModalComponent`, passing `{ parentId: this.nodeData.id, mode: 'child' }`.
                *   Subscribe to modal's save event. If saved, it returns `{ text: string, properties: any }`.
                *   Call `this.taskTreeService.addChildNode(this.nodeData.id, savedData.text, savedData.properties)`.
    *   **Component:** `AddNodeModalComponent` (New Angular Modal Component)
        *   **Template:** Form for "Node Text" and "Properties (JSON)".
        *   **Component Logic:**
            *   Receives `modalData` (containing `parentId` and `mode`).
            *   On save, validates inputs, parses properties JSON.
            *   Emits save event with `{ text, properties }` and closes.
    *   **Service:** `TaskTreeService`
        *   `addChildNode(parentId: string, text: string, properties?: any): string /* newNodeId */`:
            *   Find `parentNode`.
            *   Generate `newNodeId`.
            *   Create `newNode` object.
            *   Add to `parentNode.children`.
            *   Emit updated `taskTree`.
            *   `NotificationService.showSuccess("Child node added.")`.
            *   Return `newNodeId`.

---

**US11 (Add Sibling Node): As a user, I want to manually add a new sibling task node above or below an existing node.**

*   **Technical Implementation:**
    *   **Component:** `TaskNodeComponent`
        *   **Template:**
            *   `<i class="fas fa-arrow-circle-up action-icon" (click)="onAddSibling('above')" title="Add Task Above"></i>`
            *   `<i class="fas fa-arrow-circle-down action-icon" (click)="onAddSibling('below')" title="Add Task Below"></i>`
        *   **Component Logic:**
            *   `onAddSibling(position: 'above' | 'below'): void`:
                *   Open `AddNodeModalComponent`, passing `{ siblingId: this.nodeData.id, mode: 'sibling', position: position }`.
                *   Subscribe to modal save event.
                *   If `position === 'above'`, call `this.taskTreeService.addSiblingNodeAbove(this.nodeData.id, savedData.text, savedData.properties)`.
                *   Else, call `this.taskTreeService.addSiblingNodeBelow(this.nodeData.id, savedData.text, savedData.properties)`.
    *   **Component:** `AddNodeModalComponent` (as in US10, mode handling will be internal or via distinct modal types if simpler).
    *   **Service:** `TaskTreeService`
        *   `addSiblingNodeAbove(siblingId: string, text: string, properties?: any): string /* newNodeId */`:
            *   Find `parentNode` of `siblingId`.
            *   Find index of `siblingId` in `parentNode.children`.
            *   Create `newNode`, splice into `parentNode.children` at the correct index.
            *   Emit updated `taskTree`.
            *   `NotificationService.showSuccess("Sibling node added above.")`.
            *   Return `newNodeId`.
        *   `addSiblingNodeBelow(siblingId: string, text: string, properties?: any): string /* newNodeId */`: Similar logic, splicing at `index + 1`.

---

**US12 (Move Node): As a user, I want to move a task node up or down within its current parent, or move it to its parent's level (outdent), so I can re-organize the task structure.**

*   **Technical Implementation:**
    *   **Component:** `TaskNodeComponent`
        *   **Template:**
            *   `<i class="fas fa-arrow-up action-icon" (click)="onMove('up')" title="Move Up"></i>`
            *   `<i class="fas fa-arrow-down action-icon" (click)="onMove('down')" title="Move Down"></i>`
            *   `<i class="fas fa-level-up-alt action-icon" (click)="onMove('outdent')" title="Move to Parent Level"></i>` (Disable if node is a child of root).
        *   **Component Logic:**
            *   `onMove(direction: 'up' | 'down' | 'outdent'): void`:
                *   Call `this.taskTreeService.moveNode(this.nodeData.id, direction)`.
    *   **Service:** `TaskTreeService`
        *   `moveNode(nodeId: string, direction: 'up' | 'down' | 'outdent'): void`:
            *   Find `node` and its `parentNode`.
            *   **'up'/'down'**:
                *   Find `nodeIndex` in `parentNode.children`.
                *   If valid move, swap elements in the array.
                *   Emit updated `taskTree`.
                *   `NotificationService.showSuccess("Node moved.")`.
            *   **'outdent'**:
                *   Find `grandparentNode` (parent of `parentNode`).
                *   If `grandparentNode` exists:
                    *   Remove `node` from `parentNode.children`.
                    *   Find `parentIndex` in `grandparentNode.children`.
                    *   Splice `node` into `grandparentNode.children` after `parentNode`.
                    *   Emit updated `taskTree`.
                    *   `NotificationService.showSuccess("Node moved to parent level.")`.
                *   Else (node was child of root), do nothing or show error.

---

**US13 (Add Property): As a user, I want to add a custom key-value property to a task node so I can store additional metadata.**

*   **Technical Implementation:**
    *   **Component:** `TaskNodeComponent`
        *   **Template:** `<i class="fas fa-plus-circle action-icon" (click)="onAddProperty()" title="Add Property"></i>`
        *   **Component Logic:**
            *   `onAddProperty(): void`:
                *   Open `AddPropertyModalComponent` (New Angular Modal) passing `this.nodeData.id`.
                *   Subscribe to modal save, which returns `{ key: string, value: string }`. (Value initially string, parsing for JSON/numbers can be added).
                *   Call `this.taskTreeService.addPropertyToNode(this.nodeData.id, savedData.key, savedData.value)`.
    *   **Component:** `AddPropertyModalComponent`
        *   **Template:** Form for "Property Key" (text input) and "Property Value" (text input or textarea).
        *   **Component Logic:** Validates key is not empty. Emits `{ key, value }` on save.
    *   **Service:** `TaskTreeService`
        *   `addPropertyToNode(nodeId: string, key: string, value: any): void`:
            *   Find `node`.
            *   Ensure `node.properties` exists (initialize as `{}` if not).
            *   Set `node.properties[key] = value`.
            *   Emit updated `taskTree`.
            *   `NotificationService.showSuccess("Property added.")`.

---

**US14 (Export Project): As a user, I want to export the current task tree and LLM configuration (excluding API key) to a `task_tree.json` file so I can save my work or share it.**

*   **Technical Implementation:**
    *   **Component:** `TaskAnalyserComponent` (or a global header component)
        *   **Template:** `<button (click)="onExportJson()">Export JSON</button>`
        *   **Component Logic:**
            *   Inject `TaskTreeService`, `ConfigService`.
            *   `onExportJson(): void`:
                1.  Get current tree: `const tree = this.taskTreeService.taskTree$.value;`
                2.  Get LLM config: `const llmConfig = this.configService.llmConfig$.value;`
                3.  Construct export object:
                    ```typescript
                    const dataToExport = {
                        taskTree: tree,
                        llmConfig: {
                            provider: llmConfig?.provider,
                            modelName: llmConfig?.modelName,
                            apiEndpoint: llmConfig?.apiEndpoint,
                            // Optionally include taskType if it's part of ConfigService
                        }
                    };
                    ```
                4.  `const jsonString = JSON.stringify(dataToExport, null, 2);`
                5.  `const blob = new Blob([jsonString], { type: 'application/json' });`
                6.  `const url = URL.createObjectURL(blob);`
                7.  Create an `<a>` element, set `href` and `download="task_tree.json"`, click it, then revoke URL. (Standard file download JS snippet).
                8.  `NotificationService.showSuccess("Project exported.")`.
    *   **No specific service changes for this beyond exposing current state.**

---

**US15 (Visual Consistency): As a user, I want the task nodes (icons, actions, layout) to look and feel the same as in the original application for familiarity.**

*   **Technical Implementation (Ongoing effort throughout component development):**
    *   **Component:** `TaskNodeComponent`
        *   **Styling (`task-node.component.scss`):**
            *   Carefully migrate CSS rules from the original `task_analyser/css/styles.css` pertaining to:
                *   `.task-node` (background, border, padding, margin, position)
                *   `.node-content` (flex layout)
                *   `.node-text` (flex-grow, margins)
                *   `.node-actions` (flex layout, gap)
                *   `.node-children` (margin-left, position, `::before` for vertical connector line)
                *   `.node-children .task-node::before` (horizontal connector line)
                *   `.action-icon` (cursor, color)
            *   Ensure Font Awesome icons are used correctly for actions.
    *   **Global Styles (`styles.scss`):**
        *   Ensure the dark theme (`body` background, default text color) is replicated.
    *   **Testing:** Visually compare the Angular component output with screenshots or a running version of the original application.

This detailed breakdown for US06-US15 should guide their implementation within the Angular framework. Remember that creating reusable modal components and robust service methods will be key to a clean and maintainable Phase 1.