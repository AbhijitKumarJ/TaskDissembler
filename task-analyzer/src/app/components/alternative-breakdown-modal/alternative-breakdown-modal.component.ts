import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskNode } from '../../models/task-node.interface'; // Adjusted path

@Component({
  selector: 'app-alternative-breakdown-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alternative-breakdown-modal.component.html',
  styleUrls: ['./alternative-breakdown-modal.component.scss']
})
export class AlternativeBreakdownModalComponent {
  @Input() alternativeSubtasks: TaskNode[] | null = [];
  @Input() hintText?: string;
  @Input() originalTaskText?: string;

  @Output() applyBreakdown = new EventEmitter<TaskNode[]>();
  @Output() closeModal = new EventEmitter<void>();

  onApply(): void {
    if (this.alternativeSubtasks && this.alternativeSubtasks.length > 0) {
      this.applyBreakdown.emit(this.alternativeSubtasks);
    }
    this.closeModal.emit(); // Close modal after applying or if empty
  }

  onClose(): void {
    this.closeModal.emit();
  }
}
