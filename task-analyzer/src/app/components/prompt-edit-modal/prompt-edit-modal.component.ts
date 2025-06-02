import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Import FormsModule

@Component({
  selector: 'app-prompt-edit-modal',
  standalone: true,
  imports: [CommonModule, FormsModule], // Add FormsModule here
  templateUrl: './prompt-edit-modal.component.html',
  styleUrls: ['./prompt-edit-modal.component.scss']
})
export class PromptEditModalComponent implements OnInit {
  @Input() prompt: string = '';
  @Output() reviewOutcome = new EventEmitter<{ action: 'confirm' | 'cancel', editedPrompt?: string }>();

  editablePrompt: string = '';

  ngOnInit(): void {
    this.editablePrompt = this.prompt;
  }

  onConfirm(): void {
    if (this.editablePrompt.trim()) {
      this.reviewOutcome.emit({ action: 'confirm', editedPrompt: this.editablePrompt });
    } else {
      // Optionally, handle empty prompt case, e.g., show a message or prevent confirmation
      console.warn('Edited prompt is empty. Confirmation prevented.');
      // Or emit confirm with the original prompt if that's desired behavior
      // this.reviewOutcome.emit({ action: 'confirm', editedPrompt: this.prompt });
    }
  }

  onCancel(): void {
    this.reviewOutcome.emit({ action: 'cancel' });
  }
}
