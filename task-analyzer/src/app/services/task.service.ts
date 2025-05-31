import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { TaskNode } from '../models/task-node.interface';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private currentTaskKey = 'currentTask';
  private taskSubject = new BehaviorSubject<TaskNode | null>(this.loadCurrentTask());
  
  currentTask$ = this.taskSubject.asObservable();

  constructor() {}

  setCurrentTask(task: TaskNode): void {
    this.saveTask(task);
  }

  // createNewRootTask(taskSummary: string, projectContext: {
  //   projectName?: string;
  //   projectDescription?: string;
  //   targetTechnologyStack?: string[];
  // }): TaskNode {
  //   const newTask: TaskNode = {
  //     id: `task-${Date.now()}`,
  //     text: taskSummary,
  //     description: projectContext.projectDescription || '',
  //     children: [],
  //     properties: {
  //       created: new Date().toISOString(),
  //       lastUpdated: new Date().toISOString(),
  //       projectName: projectContext.projectName,
  //       targetTechnologyStack: projectContext.targetTechnologyStack,
  //       // You can add other initial properties here if needed
  //     },
  //     prompts_and_responses: []
  //   };
  //   // Don't save to local storage immediately, let the NewTaskFormComponent decide after LLM call
  //   this.taskSubject.next({ ...newTask }); 
  //   return { ...newTask };
  // }

  // Existing createNewTask can be kept for simpler scenarios or internal use if needed
  // or be removed if createNewRootTask is the primary way to start.
  // For now, let's assume it might be used by other parts or tests, or can be removed later.
  createNewRootTask(overallTaskSummary: string, projectContext: any): TaskNode {
    const newTask: TaskNode = {
      id: `task-${Date.now()}`,
      text: overallTaskSummary,
      description: projectContext.projectDescription || '',
      children: [],
      properties: {
        created: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        projectName: projectContext.projectName,
        targetTechnologyStack: projectContext.targetTechnologyStack
      },
      prompts_and_responses: []
    };
    
    this.saveTask(newTask);
    return { ...newTask }; // Return a new object to prevent reference issues
  }

  loadTaskFromFile(file: File): Promise<TaskNode> {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('No file provided'));
        return;
      }
      
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          if (!event.target?.result) {
            throw new Error('Failed to read file');
          }
          
          const taskData = JSON.parse(event.target.result as string);
          
          // Validate the task data
          if (!this.isValidTask(taskData)) {
            throw new Error('Invalid task format');
          }
          
          // Process the task data to ensure it has all required fields
          const processedTask = this.processTaskData(taskData);
          
          // Save the task
          this.saveTask(processedTask);
          
          resolve(processedTask);
          
        } catch (error) {
          console.error('Error loading task from file:', error);
          reject(error instanceof Error ? error : new Error('Failed to load task'));
        }
      };
      
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        reject(new Error(`Failed to read file: ${error}`));
      };
      
      // Start reading the file
      reader.readAsText(file);
    });
  }
  
  /**
   * Process task data to ensure it has all required fields with proper defaults
   */
  private processTaskData(taskData: any): TaskNode {
    return {
      id: taskData.id || `task-${Date.now()}`,
      text: taskData.text || 'Untitled Task',
      description: taskData.description || '',
      children: Array.isArray(taskData.children) 
        ? taskData.children.map((child: any) => this.processTaskData(child)) 
        : [],
      properties: {
        created: taskData.properties?.created || new Date().toISOString(),
        lastUpdated: taskData.properties?.lastUpdated || new Date().toISOString(),
        ...taskData.properties
      },
      prompts_and_responses: Array.isArray(taskData.prompts_and_responses)
        ? taskData.prompts_and_responses
        : []
    };
  }

  updateTask(updatedTask: TaskNode): void {
    if (!updatedTask) return;
    
    try {
      // Ensure the task has the required properties
      const taskToSave: TaskNode = {
        id: updatedTask.id || `task-${Date.now()}`,
        text: updatedTask.text || 'Untitled Task',
        description: updatedTask.description,
        children: Array.isArray(updatedTask.children) ? updatedTask.children : [],
        properties: {
          ...updatedTask.properties,
          created: updatedTask.properties?.['created'] || new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        },
        prompts_and_responses: Array.isArray(updatedTask.prompts_and_responses) 
          ? updatedTask.prompts_and_responses 
          : []
      };
      
      // Save to local storage
      localStorage.setItem(this.currentTaskKey, JSON.stringify(taskToSave));
      
      // Notify subscribers
      this.taskSubject.next({ ...taskToSave });
      
    } catch (error) {
      console.error('Error updating task:', error);
      // In a real app, you might want to show an error to the user
    }
  }

  exportTask(task: TaskNode): void {
    if (!task) return;
    
    const dataStr = JSON.stringify(task, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `task-analysis-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  private saveTask(task: TaskNode): void {
    this.taskSubject.next(task);
    localStorage.setItem(this.currentTaskKey, JSON.stringify(task));
  }

  private loadCurrentTask(): TaskNode | null {
    const taskJson = localStorage.getItem(this.currentTaskKey);
    if (taskJson) {
      try {
        const parsedTask = JSON.parse(taskJson);
        if (this.isValidTask(parsedTask)) {
          return this.processTaskData(parsedTask);
        }
        return null;
      } catch (e) {
        console.error('Error parsing saved task:', e);
        return null;
      }
    }
    return null;
  }
  
  /**
   * Validates that the task data has the required structure
   */
  private isValidTask(data: any): data is TaskNode {
    if (!data) return false;
    if (typeof data !== 'object') return false;
    
    // Check for required fields
    if (typeof data.id !== 'string') return false;
    if (typeof data.text !== 'string') return false;
    
    // Check properties object
    if (data.properties && typeof data.properties !== 'object') return false;
    
    // Check children if they exist
    if (data.children) {
      if (!Array.isArray(data.children)) return false;
      // Recursively validate all children
      if (!data.children.every((child: any) => this.isValidTask(child))) {
        return false;
      }
    }
    
    return true;
  }

  // Helper method to find a node by ID in the task tree
  findNodeById(task: TaskNode, id: string): TaskNode | null {
    if (task.id === id) return task;
    
    if (task.children) {
      for (const child of task.children) {
        const found = this.findNodeById(child, id);
        if (found) return found;
      }
    }
    
    return null;
  }

  // Helper method to update a node in the task tree
  updateNode(task: TaskNode, nodeId: string, updates: Partial<TaskNode>): TaskNode | null {
    if (task.id === nodeId) {
      return { ...task, ...updates };
    }
    
    if (task.children) {
      const updatedChildren = task.children.map(child => {
        const updatedChild = this.updateNode(child, nodeId, updates);
        return updatedChild || child;
      });
      
      return { ...task, children: updatedChildren };
    }
    
    return null;
  }

  // Helper method to delete a node from the task tree
  deleteNode(task: TaskNode, nodeId: string): TaskNode | null {
    if (task.id === nodeId) {
      return null; // This would delete the root, which we handle separately
    }
    
    if (task.children) {
      const updatedChildren = task.children
        .filter(child => child.id !== nodeId)
        .map(child => this.deleteNode(child, nodeId))
        .filter(Boolean) as TaskNode[];
      
      return { ...task, children: updatedChildren };
    }
    
    return task;
  }
}
