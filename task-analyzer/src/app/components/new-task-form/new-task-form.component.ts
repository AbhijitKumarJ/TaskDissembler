import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { LlmService } from '../../services/llm.service';
import { ConfigService } from '../../services/config.service';
import { TaskNode } from '../../models/task-node.interface'; // Ensure this path is correct

@Component({
  selector: 'app-new-task-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './new-task-form.component.html',
  styleUrls: ['./new-task-form.component.scss']
})
export class NewTaskFormComponent implements OnInit {
  newTaskForm: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private taskService: TaskService,
    private llmService: LlmService,
    private configService: ConfigService
  ) {
    this.newTaskForm = this.fb.group({
      projectName: ['', Validators.required],
      projectDescription: [''],
      overallTaskSummary: ['', Validators.required],
      targetTechnologyStack: ['']
    });
  }

  ngOnInit(): void {}

  async onSubmit(): Promise<void> {
    if (this.newTaskForm.invalid) {
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }
    this.isLoading = true;
    this.errorMessage = null;

    const formData = this.newTaskForm.value;

    try {
      // Process technology stack input - split by commas and trim
      const techStack = formData.targetTechnologyStack ? 
        formData.targetTechnologyStack.split(',').map((s: string) => s.trim()).filter((s: string) => s) : 
        [];
      
      // Create the root node with proper data
      const rootNode = this.taskService.createNewRootTask(formData.overallTaskSummary, {
        projectName: formData.projectName,
        projectDescription: formData.projectDescription,
        targetTechnologyStack: techStack
      });

      // Save the task and navigate to the analyzer
      this.isLoading = false;
      this.router.navigate(['/analyze']);

    } catch (error) {
      console.error('Error creating new task:', error);
      this.errorMessage = 'An unexpected error occurred while creating the task. Please try again.';
      this.isLoading = false;
    }
  }

  cancelForm(): void {
    this.router.navigate(['']);
  }
}
