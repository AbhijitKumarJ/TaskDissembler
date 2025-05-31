import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private router: Router,
    private taskService: TaskService
  ) {}

  createNewTask() {
    // Navigate to the new task form instead of creating directly
    this.router.navigate(['/new-task']);
  }

  async loadTaskFromFile(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    this.isLoading = true;
    this.errorMessage = '';
    const file = input.files[0];

    try {
      await this.taskService.loadTaskFromFile(file);
      this.router.navigate(['/analyze']);
    } catch (error: unknown) {
      console.error('Error loading task file', error);
      this.errorMessage = 'Error loading task file. Please make sure it\'s a valid task file.';
      if (error instanceof Error) {
        this.errorMessage += ` ${error.message}`;
      }
    } finally {
      this.isLoading = false;
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.loadTaskFromFile(event);
    }
  }
}
