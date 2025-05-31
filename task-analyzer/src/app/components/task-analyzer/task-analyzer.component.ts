import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TaskNode } from '../../models/task-node.interface';
import { TaskNodeComponent } from '../task-node/task-node.component';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-task-analyzer',
  standalone: true,
  imports: [CommonModule, TaskNodeComponent],
  templateUrl: './task-analyzer.component.html',
  styleUrls: ['./task-analyzer.component.scss']
})
export class TaskAnalyzerComponent implements OnInit {
  rootNode: TaskNode | null = null;
  isLoading: boolean = false;
  error: string | null = null;

  constructor(
    private router: Router,
    private taskService: TaskService
  ) {
    this.loadTask();
  }

  private loadTask(): void {
    this.isLoading = true;
    this.error = null;
    
    // First check if we have task data in the navigation state (e.g., from the home page)
    const navigation = this.router.getCurrentNavigation();
    const taskFromNavigation = navigation?.extras.state?.['taskData'];
    
    if (taskFromNavigation) {
      this.rootNode = this.processTaskFromNavigation(taskFromNavigation);
      this.isLoading = false;
    } else {
      // If no task in navigation, check the task service
      const subscription = this.taskService.currentTask$.subscribe({
        next: (task) => {
          if (task) {
            this.rootNode = task;
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading task:', err);
          this.error = 'Failed to load task. Please try again.';
          this.isLoading = false;
        }
      });
      
      // Clean up the subscription to prevent memory leaks
      // In a real app, you might want to use the async pipe instead
      // or manage subscriptions with a takeUntil pattern
      setTimeout(() => subscription.unsubscribe(), 0);
    }
  }
  
  private processTaskFromNavigation(taskData: any): TaskNode {
    try {
      // Ensure the task has all required properties
      return {
        id: taskData.id || 'root',
        text: taskData.text || 'New Task',
        description: taskData.description || '',
        children: taskData.children || [],
        properties: {
          created: taskData.properties?.created || new Date().toISOString(),
          lastUpdated: taskData.properties?.lastUpdated || new Date().toISOString(),
          ...taskData.properties
        }
      };
    } catch (error) {
      console.error('Error processing task from navigation:', error);
      return this.createNewTask('New Task');
    }
  }

  ngOnInit(): void {
    if (!this.rootNode) {
      // Check if there's a saved task in localStorage
      const savedTask = localStorage.getItem('currentTask');
      if (savedTask) {
        try {
          this.rootNode = JSON.parse(savedTask);
        } catch (e) {
          console.error('Error parsing saved task', e);
        }
      }
    }
  }

  addRootNode(): void {
    const newTask = this.createNewTask('New Task');
    this.rootNode = newTask;
    this.saveCurrentTask();
  }
  
  private createNewTask(title: string): TaskNode {
    return {
      id: `task-${Date.now()}`,
      text: title,
      description: 'Describe your main task here...',
      children: [],
      properties: {
        created: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      }
    };
  }

  onNodeUpdated(updatedNode: TaskNode): void {
    if (this.rootNode && this.rootNode.id === updatedNode.id) {
      // Update the root node with the new data
      this.rootNode = { 
        ...updatedNode,
        properties: {
          ...updatedNode.properties,
          lastUpdated: new Date().toISOString()
        }
      };
      this.saveCurrentTask();
    }
  }

  onNodeDeleted(nodeId: string): void {
    if (nodeId === 'root') {
      if (confirm('Are you sure you want to delete the root task? This will clear all data.')) {
        this.rootNode = null;
        localStorage.removeItem('currentTask');
      }
    }
  }

  onNodeSubdivided(node: TaskNode): void {
    // In a real implementation, this would call the LLM service to generate subtasks
    // For now, we'll just add some placeholder subtasks
    if (!node.children) {
      node.children = [];
    }
    
    const subtasks = [
      { id: `${node.id}-1`, text: 'First Subtask', description: 'Describe this subtask...' },
      { id: `${node.id}-2`, text: 'Second Subtask', description: 'Describe this subtask...' },
      { id: `${node.id}-3`, text: 'Third Subtask', description: 'Describe this subtask...' }
    ];
    
    node.children = [...(node.children || []), ...subtasks];
    this.saveCurrentTask();
  }
  
  onNodeMoved(event: {
    node: TaskNode;
    direction: 'up' | 'down' | 'outdent';
    currentIndex: number;
    parentNode?: TaskNode;
  }): void {
    if (!event.parentNode || !event.parentNode.children) return;

    const { node, direction, currentIndex, parentNode } = event;
    const siblings = parentNode.children || [];

    switch (direction) {
      case 'up':
        if (currentIndex > 0) {
          // Swap with previous sibling
          [siblings[currentIndex], siblings[currentIndex - 1]] = 
            [siblings[currentIndex - 1], siblings[currentIndex]];
        }
        break;

      case 'down':
        if (currentIndex < siblings.length - 1) {
          // Swap with next sibling
          [siblings[currentIndex], siblings[currentIndex + 1]] = 
            [siblings[currentIndex + 1], siblings[currentIndex]];
        }
        break;

      case 'outdent':
        if (parentNode && parentNode.id) {
          // Find the parent node in the tree to get its parent (grandparent)
          const parentInTree = this.findNodeById(this.rootNode!, parentNode.id);
          if (parentInTree && parentInTree.parentId) {
            const grandparent = this.findNodeById(this.rootNode!, parentInTree.parentId);
            
            if (grandparent && grandparent.children) {
              // Create a deep copy of the node to move
              const nodeToMove = JSON.parse(JSON.stringify(node));
              
              // Remove from current parent
              siblings.splice(currentIndex, 1);
              
              // Find the index of the parent in the grandparent's children
              const parentIndex = grandparent.children.findIndex(n => n.id === parentInTree.id);
              if (parentIndex !== -1) {
                // Add to grandparent's children after the parent
                grandparent.children.splice(parentIndex + 1, 0, nodeToMove);
                
                // Update parent reference
                nodeToMove.parentId = grandparent.id;
                
                // Ensure the node has a children array if it had children
                if (!nodeToMove.children) {
                  nodeToMove.children = [];
                }
                
                // Update the tree
                this.rootNode = { ...this.rootNode! };
                this.saveCurrentTask();
                return;
              }
            }
          }
        }
        break;
    }

    // Update the tree
    this.rootNode = { ...this.rootNode! };
    this.saveCurrentTask();
  }

  private findNodeById(node: TaskNode, id: string): TaskNode | null {
    if (node.id === id) return node;
    
    if (node.children) {
      for (const child of node.children) {
        const found = this.findNodeById(child, id);
        if (found) return found;
      }
    }
    
    return null;
  }

  onAddSiblingRequested(newSibling: any): void {
    if (!this.rootNode) return;
    
    // For the root node, we don't add siblings
    if (newSibling.id.startsWith('root')) {
      console.warn('Cannot add sibling to root node');
      return;
    }
    
    // Extract position preference and clean up the newSibling object
    const position = newSibling._position || 'below';
    const targetId = newSibling.id;
    delete newSibling._position;
    
    // Find the parent of the node that requested a sibling
    const findParentAndAddSibling = (node: TaskNode, targetId: string): boolean => {
      if (!node.children) return false;
      
      // Check if any of this node's children is the target
      const childIndex = node.children.findIndex(child => 
        child.id === targetId || targetId.startsWith(child.id + '-')
      );
      
      if (childIndex !== -1) {
        // We found the parent, add the sibling
        const updatedNode = { ...node };
        
        // Generate a proper ID for the sibling based on the parent
        newSibling.id = `${node.id}-${Date.now()}`;
        
        // Add the sibling to the children array at the correct position
        const newChildren = [...node.children];
        const insertIndex = position === 'below' ? childIndex + 1 : childIndex;
        newChildren.splice(insertIndex, 0, newSibling);
        
        updatedNode.children = newChildren;
        
        // Update the lastUpdated timestamp
        updatedNode.properties = {
          ...updatedNode.properties,
          lastUpdated: new Date().toISOString()
        };
        
        // Update the node
        if (node.id === this.rootNode?.id) {
          this.rootNode = updatedNode;
        } else {
          // Find and update this node in the tree
          this.updateNodeInTree(this.rootNode, node.id, updatedNode);
        }
        
        this.saveCurrentTask();
        
        // Highlight the new node
        setTimeout(() => {
          const element = document.getElementById(`node-${newSibling.id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('highlight');
            setTimeout(() => element.classList.remove('highlight'), 1500);
          }
        }, 100);
        
        return true;
      }
      
      // Recursively check children
      for (const child of node.children) {
        if (findParentAndAddSibling(child, targetId)) {
          return true;
        }
      }
      
      return false;
    };
    
    // Start the recursive search from the root
    findParentAndAddSibling(this.rootNode, newSibling.id);
  }
  
  private updateNodeInTree(node: TaskNode | null, nodeId: string, updatedNode: TaskNode): boolean {
    if (!node) return false;
    
    if (node.id === nodeId) {
      // This is the node to update
      Object.assign(node, updatedNode);
      return true;
    }
    
    if (node.children) {
      for (let i = 0; i < node.children.length; i++) {
        if (this.updateNodeInTree(node.children[i], nodeId, updatedNode)) {
          return true;
        }
      }
    }
    
    return false;
  }

  exportTask(): void {
    if (!this.rootNode) return;
    
    try {
      // Create a clean export object with only the necessary fields
      const exportData = {
        ...this.rootNode,
        properties: {
          ...this.rootNode.properties,
          exportedAt: new Date().toISOString()
        }
      };
      
      const dataStr = 'data:text/json;charset=utf-8,' + 
                    encodeURIComponent(JSON.stringify(exportData, null, 2));
      
      // Create a temporary link and trigger download
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute('href', dataStr);
      downloadAnchorNode.setAttribute('download', `task-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      
      // Optional: Show a success message
      // In a real app, you might want to use a toast notification service
      console.log('Task exported successfully');
    } catch (error) {
      console.error('Error exporting task:', error);
      this.error = 'Failed to export task. Please try again.';
    }
  }

  private saveCurrentTask(): void {
    if (this.rootNode) {
      // Update the last updated timestamp
      const taskToSave = {
        ...this.rootNode,
        properties: {
          ...this.rootNode.properties,
          lastUpdated: new Date().toISOString()
        }
      };
      
      this.taskService.updateTask(taskToSave);
    }
  }
}
