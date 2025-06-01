import { Component, Input, Output, EventEmitter, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskNode } from '../../models/task-node.interface';
import { TASK_TYPES, TaskType, DEFAULT_TASK_TYPE_VALUE, getTaskTypeLabel } from '../../models/task-types';
import { LlmService } from '../../services/llm.service';
import { NotificationService } from '../../services/notification.service';
import { PromptEditModalComponent } from '../prompt-edit-modal/prompt-edit-modal.component';
import { RationaleDisplayModalComponent } from '../rationale-display-modal/rationale-display-modal.component';
import { AlternativeBreakdownModalComponent } from '../alternative-breakdown-modal/alternative-breakdown-modal.component';

@Component({
  selector: 'app-task-node',
  standalone: true,
  imports: [CommonModule, FormsModule, PromptEditModalComponent, RationaleDisplayModalComponent, AlternativeBreakdownModalComponent],
  templateUrl: './task-node.component.html',
  styleUrls: ['./task-node.component.scss']
})
export class TaskNodeComponent {
  @Input() node: TaskNode = { id: '', text: '' };
  @Input() isRoot: boolean = false;
  @Input() depth: number = 0; // Track the depth in the hierarchy
  @Input() parentNode?: TaskNode; // Reference to parent node
  @Input() indexInParent: number = 0; // Index in parent's children array
  @Input() isFirstSibling: boolean = false;
  @Input() isLastSibling: boolean = false;
  
  // Initialize with default values to prevent undefined errors
  constructor() {
    this.depth = this.depth || 0;
  }
  
  @Output() nodeUpdated = new EventEmitter<TaskNode>();
  @Output() nodeDeleted = new EventEmitter<string>();
  @Output() nodeSubdivided = new EventEmitter<TaskNode>();
  @Output() addSiblingRequested = new EventEmitter<any>();
  @Output() nodeMoved = new EventEmitter<{
    node: TaskNode;
    direction: 'up' | 'down' | 'outdent';
    currentIndex: number;
    parentNode?: TaskNode;
  }>();
  
  isExpanded: boolean = true;
  isEditing: boolean = false;
  isSaving: boolean = false;
  isSubdividing: boolean = false;
  editingText: string = '';
  editingDescription: string = '';
  editingPropertiesJson: string = '';
  propertiesError: string | null = null;
  showProperties: boolean = false;
  promptForReview: string | null = null;
  showPromptPreviewModal: boolean = false;
  isFetchingRationale: boolean = false;
  showRationaleModal: boolean = false;
  currentRationaleText: string | null = null;
  // For Alternative Breakdowns
  showAlternativeHintInput: boolean = false;
  alternativeHint: string = '';
  isFetchingAlternative: boolean = false;
  currentAlternativeBreakdown: TaskNode[] | null = null;
  showAlternativeModal: boolean = false; // To trigger modal in a later step
  lastAlternativePromptAndResponse: { prompt: string, response: string } | null = null; // To store the P&R for the latest alternative
  
  public readonly availableTaskTypes: TaskType[] = TASK_TYPES;
  editingTaskType: string = '';

  private llmService = inject(LlmService);
  private notificationService = inject(NotificationService);
  
  objectKeys = Object.keys



  toggleExpand(): void {
    this.isExpanded = !this.isExpanded;
  }
  
  toggleProperties(): void {
    this.showProperties = !this.showProperties;
  }
  
  isSimpleValue(value: any): boolean {
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
  }
  
  formatComplexValue(value: any): string {
    try {
      return JSON.stringify(value, null, 2);
    } catch (e) {
      return String(value);
    }
  }
  
  trackByNodeId(index: number, node: TaskNode): string {
    return node.id;
  }
  
  formatDate(dateString: string): string {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  }

  startEditing(): void {
    this.editingText = this.node.text;
    this.editingDescription = this.node.description || '';
    this.editingTaskType = this.node.taskType || ''; // Initialize with node's taskType or empty string
    
    // Filter out system properties that shouldn't be edited directly
    const editableProperties = { ...this.node.properties };
    if (editableProperties) {
      // Keep these properties in the node but don't show them for editing
      delete editableProperties['created'];
      delete editableProperties['lastUpdated'];
    }
    
    this.editingPropertiesJson = JSON.stringify(editableProperties || {}, null, 2);
    this.propertiesError = null;
    this.isEditing = true;
  }

  async saveEdit(): Promise<void> {
    if (!this.editingText.trim()) return;
    
    // Validate properties JSON
    let parsedProperties: any = {};
    try {
      if (this.editingPropertiesJson.trim()) {
        parsedProperties = JSON.parse(this.editingPropertiesJson);
        if (typeof parsedProperties !== 'object' || parsedProperties === null) {
          throw new Error('Properties must be a valid JSON object');
        }
      }
      this.propertiesError = null;
    } catch (error) {
      this.propertiesError = `Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`;
      return;
    }
    
    this.isSaving = true;
    
    try {
      // Preserve system properties
      const systemProperties = {
        created: this.node.properties?.['created'] || new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
      
      const updatedNode: TaskNode = {
        ...this.node,
        text: this.editingText.trim(),
        description: this.editingDescription?.trim() || undefined,
        taskType: this.editingTaskType === '' ? undefined : this.editingTaskType,
        properties: {
          ...parsedProperties,
          ...systemProperties
        }
      };
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      this.nodeUpdated.emit(updatedNode);
      this.isEditing = false;
    } catch (error) {
      console.error('Error saving task:', error);
      // In a real app, show an error message to the user
    } finally {
      this.isSaving = false;
    }
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.propertiesError = null;
  }

  async addChild(): Promise<void> {
    // Create a modal-like form for adding a child node
    const childText = prompt('Enter task name:', 'New Subtask');
    if (!childText || !childText.trim()) return;
    
    const childDescription = prompt('Enter task description (optional):', '');
    
    if (!this.node.children) {
      this.node.children = [];
    }
    
    const newId = `${this.node.id}-${Date.now()}`; // Use timestamp for unique ID
    const newChild: TaskNode = {
      id: newId,
      text: childText.trim(),
      description: childDescription?.trim() || undefined,
      properties: {
        created: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        source: 'manual'
      }
    };
    
    // Add the new child
    const updatedNode = {
      ...this.node,
      children: [...this.node.children, newChild],
      properties: {
        ...this.node.properties,
        lastUpdated: new Date().toISOString()
      }
    };
    
    this.nodeUpdated.emit(updatedNode);
    this.isExpanded = true; // Ensure the parent is expanded to show the new child
    
    // Show a success notification
    this.notificationService.notify(`Added new subtask "${childText.trim()}".`, 'success');
    
    // Highlight the new node
    setTimeout(() => {
      const element = document.getElementById(`node-${newId}`);
      if (element) {
        element.classList.add('highlight');
        setTimeout(() => element.classList.remove('highlight'), 1500);
      }
    }, 100);
  }

  subdivide(): void {
    if (this.isSubdividing) return;
    
    // Get the project context from the root node
    const projectContext = this.getProjectContext();
    
    // Create a prompt for the LLM
    this.promptForReview = this.createSubdividePrompt(projectContext);
    this.showPromptPreviewModal = true;
    // The rest of the logic (setting isSubdividing, calling LLM, etc.)
    // will be handled in handlePromptReview after user confirmation.
  }

  handlePromptReview(action: 'confirm' | 'cancel', editedPrompt?: string): void {
    if (action === 'cancel') {
      this.showPromptPreviewModal = false;
      this.promptForReview = null;
      this.isSubdividing = false; // Reset subdividing state
      return;
    }

    // action === 'confirm'
    this.showPromptPreviewModal = false;
    const finalPrompt = (editedPrompt && editedPrompt.trim().length > 0) ? editedPrompt : this.promptForReview;

    if (!finalPrompt) {
      this.notificationService.notify('Prompt is empty. Subdivision cancelled.', 'warn');
      this.isSubdividing = false;
      return;
    }

    this.isSubdividing = true;
    this.notificationService.notify(`Subdividing task "${this.node.text}"...`, 'info');
    const projectContext = this.getProjectContext(); // Recapture context just in case

    this.llmService.analyzeTask(finalPrompt, projectContext).subscribe({
      next: (response) => {
        try {
          const subtasks = this.processLlmResponse(response);
          const updatedNode = { ...this.node };

          if (!updatedNode.children) {
            updatedNode.children = [];
          }
          updatedNode.children = [...updatedNode.children, ...subtasks];

          if (!updatedNode.prompts_and_responses) {
            updatedNode.prompts_and_responses = [];
          }
          // Ensure the finalPrompt (potentially edited) is stored
          updatedNode.prompts_and_responses.push({
            prompt: finalPrompt,
            response,
            timestamp: new Date().toISOString(),
            type: 'subdivision'
          });

          if (!updatedNode.properties) {
            updatedNode.properties = {};
          }
          updatedNode.properties['lastUpdated'] = new Date().toISOString();
          
          this.nodeUpdated.emit(updatedNode);
          this.isExpanded = true;
          this.notificationService.notify(`Successfully subdivided "${this.node.text}" into ${subtasks.length} subtasks.`, 'success');
        } catch (error) {
          console.error('Error processing LLM response:', error);
          this.notificationService.notify('Error processing LLM response. Please try again.', 'error');
        }
      },
      error: (error) => {
        console.error('Error calling LLM service:', error);
        if (error.message && error.message.includes('API key is required')) {
          this.notificationService.notify('API key is required. Please go to LLM Settings to configure your API key.', 'error');
        } else {
          this.notificationService.notify(`Error calling LLM service: ${error.message || 'Unknown error'}. Please check your settings and try again.`, 'error');
        }
        // Optionally, offer default subtasks on error
        // if (confirm('Would you like to add default subtasks instead?')) {
        //   this.addDefaultSubtasks();
        // }
      },
      complete: () => {
        this.isSubdividing = false;
      }
    });
    this.promptForReview = null; // Clear the reviewed prompt
  }

  getLlmRationale(): void {
    if (!this.canGetRationale()) {
      this.notificationService.notify('Rationale cannot be fetched for this task at this moment.', 'warn');
      return;
    }

    // Double check, though canGetRationale should cover this.
    if (!this.node.prompts_and_responses || this.node.prompts_and_responses.length === 0) {
      console.error('No prompts and responses found, cannot fetch rationale.');
      return;
    }

    this.isFetchingRationale = true;
    this.notificationService.notify(`Fetching rationale for "${this.node.text}"...`, 'info');

    const lastPromptResponse = this.node.prompts_and_responses[this.node.prompts_and_responses.length - 1];
    const parentTaskText = this.node.text;
    const parentTaskDescription = this.node.description || '';

    const llmGeneratedSubtasks = (this.node.children || [])
      .filter(child => child.properties?.source === 'llm')
      // Optional: filter further to only include children that seem to be from *this* specific subdivision.
      // This is harder if children can be added/removed manually after LLM subdivision.
      // For now, assume all 'llm' children are relevant to the last subdivision.
      .map(child => `- ${child.text}${child.description ? ': ' + child.description : ''}`)
      .join('\n');

    if (!llmGeneratedSubtasks) {
        this.notificationService.notify('No LLM-generated subtasks found for the last subdivision.', 'warn');
        this.isFetchingRationale = false;
        return;
    }

    const rationalePrompt = `The following parent task was given:
Task: ${parentTaskText}
${parentTaskDescription ? 'Description: ' + parentTaskDescription + '\n' : ''}
You (the LLM) previously analyzed this parent task using the following prompt:
--- PROMPT START ---
${lastPromptResponse.prompt}
--- PROMPT END ---

And you generated the following subtasks as a result of that prompt:
--- SUBTASKS START ---
${llmGeneratedSubtasks}
--- SUBTASKS END ---

Please explain your reasoning and any assumptions you made when breaking down the parent task into these specific subtasks based on the original prompt. Provide a concise explanation.`;

    // The context for rationale generation can be minimal or specific if needed.
    // For now, using a generic context or an empty string.
    const rationaleContext = `Rationale generation for task: "${parentTaskText}"`;

    this.llmService.analyzeTask(rationalePrompt, rationaleContext).subscribe({
      next: (rationaleResponse: string) => {
        this.currentRationaleText = rationaleResponse;
        this.showRationaleModal = true; // This will trigger a modal (to be implemented)

        // Store the rationale in the last prompt_and_response entry
        if (this.node.prompts_and_responses && this.node.prompts_and_responses.length > 0) {
          const lastEntry = this.node.prompts_and_responses[this.node.prompts_and_responses.length - 1];
          lastEntry.rationale = {
            prompt: rationalePrompt,
            response: rationaleResponse,
            timestamp: new Date().toISOString()
          };
          this.nodeUpdated.emit({ ...this.node }); // Emit to save the updated node
        }

        this.notificationService.notify('Rationale received.', 'success');
      },
      error: (error: any) => {
        console.error('Error fetching rationale:', error);
        this.notificationService.notify(`Error fetching rationale: ${error.message || 'Unknown error'}`, 'error');
        this.isFetchingRationale = false;
      },
      complete: () => {
        this.isFetchingRationale = false;
      }
    });
  }

  requestAlternativeBreakdown(): void {
    this.showAlternativeHintInput = !this.showAlternativeHintInput; // Toggle display
    if (!this.showAlternativeHintInput) {
      this.alternativeHint = ''; // Clear hint if hiding input
    }
  }

  getAlternativeBreakdown(event?: Event): void {
    if (event) {
      event.preventDefault(); // Prevent form submission if triggered by enter key
    }

    if (!this.node || !this.node.text) {
      this.notificationService.notify('Cannot generate alternatives for an empty node.', 'warn');
      return;
    }

    this.isFetchingAlternative = true;
    this.currentAlternativeBreakdown = null;
    this.lastAlternativePromptAndResponse = null; // Clear previous alternative P&R
    this.notificationService.notify(`Fetching alternative breakdown for "${this.node.text}"...`, 'info');

    let prompt = `Please provide an *alternative* set of 3-5 subtasks for the following main task.
Original Task: "${this.node.text}"`;
    if (this.node.description) {
      prompt += `
Original Task Description: "${this.node.description}"`;
    }

    // Incorporate the hint, if provided
    if (this.alternativeHint && this.alternativeHint.trim().length > 0) {
      prompt += `

Please consider the following hint or focus: "${this.alternativeHint.trim()}" when generating the alternative subtasks.`;
    } else {
      prompt += `

Explore a different perspective or structure than a typical breakdown.`;
    }

    prompt += `

Format your response as a list with numbered items (1., 2., etc.) where each item has a title followed by a description on the next lines. Alternatively, you can provide the response in JSON format with an array of objects, each with 'title' and 'description' fields.`;

    const currentPrompt = prompt; // Capture for storing later

    this.llmService.analyzeTask(currentPrompt, `Context: Requesting alternative breakdown for task ID ${this.node.id}`).subscribe({
      next: (response) => {
        try {
          const alternativeSubtasks = this.processLlmResponse(response, 'alt');

          if (!alternativeSubtasks || alternativeSubtasks.length === 0) {
            this.notificationService.notify('LLM did not return any subtasks for the alternative breakdown.', 'warn');
            this.currentAlternativeBreakdown = []; // Empty array instead of null
          } else {
            this.currentAlternativeBreakdown = alternativeSubtasks;
            this.notificationService.notify(`Received alternative breakdown for "${this.node.text}".`, 'success');
          }
          this.lastAlternativePromptAndResponse = { prompt: currentPrompt, response };
          this.showAlternativeModal = true;

        } catch (error) {
          console.error('Error processing alternative LLM response:', error);
          this.notificationService.notify('Error processing alternative LLM response.', 'error');
          this.currentAlternativeBreakdown = null;
        }
      },
      error: (error) => {
        console.error('Error calling LLM service for alternatives:', error);
        this.notificationService.notify(`Error fetching alternatives: ${error.message || 'Unknown error'}`, 'error');
        this.isFetchingAlternative = false;
        this.currentAlternativeBreakdown = null;
      },
      complete: () => {
        this.isFetchingAlternative = false;
        // Optional: Clear hint or hide input after successful fetch
        // this.alternativeHint = '';
        // this.showAlternativeHintInput = false;
      }
    });
  }
  
  private addDefaultSubtasks(): void {
    // Create default subtasks for demonstration purposes
    const subtasks = [
      this.createSubtask('Research', 'Gather information and resources needed for this task.'),
      this.createSubtask('Implementation', 'Execute the core work required for this task.'),
      this.createSubtask('Testing', 'Verify that the implementation meets the requirements.'),
      this.createSubtask('Documentation', 'Document the process and results of this task.')
    ];
    
    // Create a copy of the node with the new subtasks
    const updatedNode = { ...this.node };
    
    // Initialize children array if it doesn't exist
    if (!updatedNode.children) {
      updatedNode.children = [];
    }
    
    // Add the new subtasks to the children array
    updatedNode.children = [...updatedNode.children, ...subtasks];
    
    // Update the node
    this.nodeUpdated.emit(updatedNode);
    
    // Expand the node to show the new subtasks
    this.isExpanded = true;
    
    // Show a notification
    this.notificationService.notify(`Added default subtasks to "${this.node.text}". Configure LLM settings for AI-powered subdivision.`, 'info');
    
    // Set isSubdividing to false
    this.isSubdividing = false;
  }
  
  private getProjectContext(): string {
    // Start with the current node's text and description
    let context = `Task: ${this.node.text}\n`;
    if (this.node.description) {
      context += `Description: ${this.node.description}\n`;
    }
    
    // Add any relevant properties
    if (this.node.properties) {
      if (this.node.properties['projectName']) {
        context += `Project: ${this.node.properties['projectName']}\n`;
      }
      
      if (this.node.properties['targetTechnologyStack']) {
        const techStack = Array.isArray(this.node.properties['targetTechnologyStack']) 
          ? this.node.properties['targetTechnologyStack'].join(', ')
          : this.node.properties['targetTechnologyStack'];
        context += `Technology Stack: ${techStack}\n`;
      }
    }
    
    return context;
  }

  canGetRationale(): boolean {
    if (!this.node.prompts_and_responses || this.node.prompts_and_responses.length === 0) {
      return false;
    }
    if (!this.node.children || !this.node.children.some(child => child.properties?.source === 'llm')) {
      return false;
    }
    // Check if the *last* subdivision already has a rationale
    const lastPromptResponse = this.node.prompts_and_responses[this.node.prompts_and_responses.length - 1];
    return !lastPromptResponse.rationale;
  }
  
  private createSubdividePrompt(context: string): string {
    let taskTypeSpecificPreamble = '';
    if (this.node.taskType && this.node.taskType !== DEFAULT_TASK_TYPE_VALUE) {
        const taskTypeLabel = getTaskTypeLabel(this.node.taskType) || this.node.taskType;
        taskTypeSpecificPreamble = `This task is specifically designated as a "${taskTypeLabel}" type. `;
    }

    return `${taskTypeSpecificPreamble}Please analyze the following task (details included in the context below) and break it down into 3-5 logical subtasks. For each subtask, provide a clear title and a brief description.

${context}

Please format your response as a list with numbered items (1., 2., etc.) where each item has a title followed by a description on the next lines. Alternatively, you can provide the response in JSON format with an array of objects, each with 'title' and 'description' fields.`;
  }
  
  private processLlmResponse(response: string, idPrefix: string = ''): TaskNode[] {
    // First, try to see if the response is in JSON format
    try {
      if (response.includes('{') && response.includes('}')) {
        // Extract JSON from the response if it's embedded in text
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonStr = jsonMatch[0];
          const parsedJson = JSON.parse(jsonStr);
          
          // Check if it's an array of subtasks
          if (Array.isArray(parsedJson)) {
            return parsedJson.map(item => this.createSubtask(
              item.title || item.name || item.text || 'Untitled Subtask',
              item.description || item.desc || '',
              idPrefix
            ));
          }
          
          // Check if it has a subtasks/tasks property
          if (parsedJson.subtasks || parsedJson.tasks) {
            const tasks = parsedJson.subtasks || parsedJson.tasks;
            if (Array.isArray(tasks)) {
              return tasks.map(item => this.createSubtask(
                item.title || item.name || item.text || 'Untitled Subtask',
                item.description || item.desc || '',
                idPrefix
              ));
            }
          }
        }
      }
    } catch (e) {
      console.log('Not valid JSON, continuing with text parsing');
    }
    
    // If JSON parsing failed, fall back to text parsing
    const lines = response.split('\n').filter(line => line.trim().length > 0);
    const subtasks: TaskNode[] = [];
    
    let currentTitle = '';
    let currentDescription = '';
    
    for (const line of lines) {
      // Check if this line looks like a subtask title (e.g., "1. Title" or "- Title" or "Title:")
      if (line.match(/^\d+\.\s+|^-\s+|^\*\s+|^[A-Za-z0-9\s]+:/) && !line.match(/^Description:/i)) {
        // If we already have a title, save the previous subtask
        if (currentTitle) {
          subtasks.push(this.createSubtask(currentTitle, currentDescription, idPrefix));
          currentDescription = '';
        }
        
        // Extract the new title
        currentTitle = line.replace(/^\d+\.\s+|^-\s+|^\*\s+|^([A-Za-z0-9\s]+):\s*/, '$1').trim();
      } else if (currentTitle) {
        // If we have a title and this line is not a new title, it's part of the description
        currentDescription += (currentDescription ? '\n' : '') + line.trim();
      }
    }
    
    // Add the last subtask if there is one
    if (currentTitle) {
      subtasks.push(this.createSubtask(currentTitle, currentDescription, idPrefix));
    }
    
    // If we couldn't parse any subtasks, create some default ones
    if (subtasks.length === 0 && idPrefix !== 'alt') { // Only add default for non-alternatives
      // Create 3 default subtasks
      subtasks.push(
        this.createSubtask('Research', 'Gather information and resources needed for this task.', idPrefix),
        this.createSubtask('Implementation', 'Execute the core work required for this task.', idPrefix),
        this.createSubtask('Testing', 'Verify that the implementation meets the requirements.', idPrefix)
      );
    } else if (subtasks.length === 0 && idPrefix === 'alt') {
      // If it's for alternatives and LLM returns nothing, return empty array, don't make defaults.
      // The getAlternativeBreakdown method will handle notification for this.
      return [];
    }
    
    return subtasks;
  }
  
  private createSubtask(title: string, description: string, idPrefix: string = ''): TaskNode {
    const baseId = idPrefix ? `${idPrefix}-${this.node.id}` : this.node.id;
    return {
      id: `${baseId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      text: title,
      description: description,
      properties: {
        created: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        source: idPrefix === 'alt' ? 'llm-alternative' : 'llm' // Mark source
      }
    };
  }

  deleteNode(): void {
    const childCount = this.node.children?.length || 0;
    let confirmMessage = 'Are you sure you want to delete this task';
    
    if (childCount > 0) {
      confirmMessage += ` and its ${childCount} subtask${childCount === 1 ? '' : 's'}`;
    }
    
    confirmMessage += '?';
    
    if (confirm(confirmMessage)) {
      this.nodeDeleted.emit(this.node.id);
    }
  }

  onChildUpdated(updatedChildNode: TaskNode): void {
    if (!this.node.children) return;
    
    const index = this.node.children.findIndex(child => child.id === updatedChildNode.id);
    if (index !== -1) {
      const updatedChildren = [...this.node.children];
      updatedChildren[index] = updatedChildNode;
      
      // Update the parent node with the new children and update the lastUpdated timestamp
      const updatedParentNode = { 
        ...this.node, 
        children: updatedChildren,
        properties: {
          ...this.node.properties,
          lastUpdated: new Date().toISOString()
        }
      };
      
      this.node = updatedParentNode;
      this.nodeUpdated.emit(updatedParentNode);
    }
  }

  onChildDeleted(nodeId: string): void {
    if (!this.node.children) return;
    
    const updatedChildren = this.node.children.filter(child => child.id !== nodeId);
    this.node = { ...this.node, children: updatedChildren };
    this.nodeUpdated.emit(this.node);
  }

  onChildSubdivided(node: TaskNode): void {
    this.nodeSubdivided.emit(node);
  }

  onNodeMoved(event: any): void {
    // Propagate the event up to the parent
    this.nodeMoved.emit(event);
  }

  // Move node within its parent or change its level
  moveNode(direction: 'up' | 'down' | 'outdent'): void {
    if (this.isRoot) return;
    
    // Ensure parent node has an ID
    if (!this.parentNode || !this.parentNode.id) {
      console.warn('Cannot move node: Parent node is missing or has no ID');
      return;
    }

    // Create a clean move event
    const moveEvent = {
      node: { ...this.node },
      direction: direction,
      currentIndex: this.indexInParent,
      parentNode: { ...this.parentNode }
    };
    
    // Emit the move event
    this.nodeMoved.emit(moveEvent);
  }
  
  // Add a sibling node (at the same level as the current node)
  addSibling(position: 'above' | 'below' = 'below', event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // We need to emit an event to the parent component to add a sibling
    // since siblings are managed by the parent node
    const siblingText = prompt('Enter task name:', 'New Task');
    if (!siblingText || !siblingText.trim()) return;
    
    const siblingDescription = prompt('Enter task description (optional):', '');
    
    const newSibling: TaskNode & { _position?: 'above' | 'below' } = {
      id: this.node.id, // Pass the current node's ID to find where to insert the sibling
      text: siblingText.trim(),
      description: siblingDescription?.trim() || undefined,
      _position: position, // Store position preference
      properties: {
        created: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        source: 'manual'
      }
    };
    
    // Emit an event to add a sibling
    this.addSiblingRequested.emit(newSibling);
    
    // Show a success notification
    this.notificationService.notify(`Added new task "${siblingText.trim()}".`, 'success');
  }

  handleRationaleModalClose(): void {
    this.showRationaleModal = false;
    this.currentRationaleText = null;
  }

  handleAlternativeModalClose(): void {
    this.showAlternativeModal = false;
    // Optional: Decide if currentAlternativeBreakdown and lastAlternativePromptAndResponse should be cleared here
    // For now, keeping them allows the modal to re-show the last fetched alternative if simply closed.
  }

  applyAlternativeBreakdown(tasksToApply: TaskNode[]): void {
    if (!tasksToApply || tasksToApply.length === 0) {
      this.notificationService.notify('No alternative tasks to apply.', 'warn');
      this.showAlternativeModal = false; // Ensure modal closes
      return;
    }

    // 1. Replace children
    this.node.children = [...tasksToApply]; // Create new array reference

    // 2. Update prompts_and_responses
    if (this.lastAlternativePromptAndResponse) {
      if (!this.node.prompts_and_responses) {
        this.node.prompts_and_responses = [];
      }
      this.node.prompts_and_responses.push({
        prompt: this.lastAlternativePromptAndResponse.prompt,
        response: this.lastAlternativePromptAndResponse.response,
        timestamp: new Date().toISOString(),
        type: 'alternative-applied' // Custom type to denote this entry
      });
    } else {
      this.notificationService.notify('Could not find the prompt/response for the applied alternative. History may be incomplete.', 'warn');
    }

    // 3. Update node properties
    if (!this.node.properties) {
      this.node.properties = {};
    }
    this.node.properties['lastUpdated'] = new Date().toISOString();
    // Optional: could store the hint that led to this breakdown
    // if (this.alternativeHint && this.alternativeHint.trim().length > 0) {
    //   this.node.properties['lastAppliedAlternativeHint'] = this.alternativeHint.trim();
    // }

    // 4. Emit nodeUpdated
    const updatedNode = { ...this.node };
    this.node = updatedNode; // Update component's instance of the node
    this.nodeUpdated.emit(updatedNode);

    this.notificationService.notify(`Alternative breakdown applied to "${this.node.text}".`, 'success');

    // 5. Clean up state
    this.currentAlternativeBreakdown = null;
    this.lastAlternativePromptAndResponse = null;
    this.showAlternativeModal = false; // Ensure modal is closed
    this.showAlternativeHintInput = false; // Hide hint input
    this.alternativeHint = ''; // Clear hint
    this.isExpanded = true; // Expand to show new children
  }
}
