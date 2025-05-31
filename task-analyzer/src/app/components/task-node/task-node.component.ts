import { Component, Input, Output, EventEmitter, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskNode } from '../../models/task-node.interface';
import { LlmService } from '../../services/llm.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-task-node',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
    
    this.isSubdividing = true;
    this.notificationService.notify(`Subdividing task "${this.node.text}"...`, 'info');
    
    // Get the project context from the root node
    const projectContext = this.getProjectContext();
    
    // Create a prompt for the LLM
    const prompt = this.createSubdividePrompt(projectContext);
    
    // Call the LLM service
    this.llmService.analyzeTask(prompt, projectContext).subscribe({
      next: (response) => {
        try {
          // Process the LLM response to extract subtasks
          const subtasks = this.processLlmResponse(response);
          
          // Create a copy of the node with the new subtasks
          const updatedNode = { ...this.node };
          
          // Initialize children array if it doesn't exist
          if (!updatedNode.children) {
            updatedNode.children = [];
          }
          
          // Add the new subtasks to the children array
          updatedNode.children = [...updatedNode.children, ...subtasks];
          
          // Store the prompt and response in the node's prompts_and_responses array
          if (!updatedNode.prompts_and_responses) {
            updatedNode.prompts_and_responses = [];
          }
          
          updatedNode.prompts_and_responses.push({
            prompt,
            response
          });
          
          // Update the lastUpdated timestamp
          if (!updatedNode.properties) {
            updatedNode.properties = {};
          }
          updatedNode.properties['lastUpdated'] = new Date().toISOString();
          
          // Update the node
          this.nodeUpdated.emit(updatedNode);
          
          // Expand the node to show the new subtasks
          this.isExpanded = true;
          
          // Show a success notification
          this.notificationService.notify(`Successfully subdivided "${this.node.text}" into ${subtasks.length} subtasks.`, 'success');
        } catch (error) {
          console.error('Error processing LLM response:', error);
          this.notificationService.notify('Error processing LLM response. Please try again.', 'error');
        }
      },
      error: (error) => {
        console.error('Error calling LLM service:', error);
        
        // Check if the error is related to missing API key
        if (error.message && error.message.includes('API key is required')) {
          this.notificationService.notify('API key is required. Please go to LLM Settings to configure your API key.', 'error');
        } else {
          this.notificationService.notify(`Error calling LLM service: ${error.message || 'Unknown error'}. Please check your settings and try again.`, 'error');
        }
        
        // For demo purposes, we'll still add some default subtasks if the user confirms
        if (confirm('Would you like to add default subtasks instead?')) {
          this.addDefaultSubtasks();
        }
      },
      complete: () => {
        this.isSubdividing = false;
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
  
  private createSubdividePrompt(context: string): string {
    return `Please analyze the following task and break it down into 3-5 logical subtasks. For each subtask, provide a clear title and a brief description.

${context}

Please format your response as a list with numbered items (1., 2., etc.) where each item has a title followed by a description on the next lines. Alternatively, you can provide the response in JSON format with an array of objects, each with 'title' and 'description' fields.`;
  }
  
  private processLlmResponse(response: string): TaskNode[] {
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
              item.description || item.desc || ''
            ));
          }
          
          // Check if it has a subtasks/tasks property
          if (parsedJson.subtasks || parsedJson.tasks) {
            const tasks = parsedJson.subtasks || parsedJson.tasks;
            if (Array.isArray(tasks)) {
              return tasks.map(item => this.createSubtask(
                item.title || item.name || item.text || 'Untitled Subtask',
                item.description || item.desc || ''
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
          subtasks.push(this.createSubtask(currentTitle, currentDescription));
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
      subtasks.push(this.createSubtask(currentTitle, currentDescription));
    }
    
    // If we couldn't parse any subtasks, create some default ones
    if (subtasks.length === 0) {
      // Create 3 default subtasks
      subtasks.push(
        this.createSubtask('Research', 'Gather information and resources needed for this task.'),
        this.createSubtask('Implementation', 'Execute the core work required for this task.'),
        this.createSubtask('Testing', 'Verify that the implementation meets the requirements.')
      );
    }
    
    return subtasks;
  }
  
  private createSubtask(title: string, description: string): TaskNode {
    return {
      id: `${this.node.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      text: title,
      description: description,
      properties: {
        created: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        source: 'llm'
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
}
