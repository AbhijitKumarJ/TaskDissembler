import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rationale-display-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rationale-display-modal.component.html',
  styleUrls: ['./rationale-display-modal.component.scss']
})
export class RationaleDisplayModalComponent {
  @Input() rationaleText: string | null = '';
  @Output() closeModal = new EventEmitter<void>();

  onClose(): void {
    this.closeModal.emit();
  }
}
