import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification.service';

interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  timeout: any;
}

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-container">
      <div *ngFor="let notification of notifications"
           class="notification"
           [ngClass]="{
             'notification-success': notification.type === 'success',
             'notification-error': notification.type === 'error',
             'notification-info': notification.type === 'info'
           }">
        <div class="notification-content">
          <i class="fas"
             [ngClass]="{
               'fa-check-circle': notification.type === 'success',
               'fa-exclamation-circle': notification.type === 'error',
               'fa-info-circle': notification.type === 'info'
             }"></i>
          <span>{{ notification.message }}</span>
        </div>
        <button class="notification-close" (click)="removeNotification(notification.id)">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .notification-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1050;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 350px;
    }
    
    .notification {
      padding: 12px 16px;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      justify-content: space-between;
      animation: slide-in 0.3s ease-out;
      color: white;
    }
    
    .notification-content {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .notification-success {
      background-color: #28a745;
    }
    
    .notification-error {
      background-color: #dc3545;
    }
    
    .notification-info {
      background-color: #17a2b8;
    }
    
    .notification-close {
      background: transparent;
      border: none;
      color: white;
      opacity: 0.7;
      cursor: pointer;
      padding: 0;
      margin-left: 10px;
    }
    
    .notification-close:hover {
      opacity: 1;
    }
    
    @keyframes slide-in {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class NotificationComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  private nextId = 1;
  private unsubscribe: (() => void) | null = null;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.unsubscribe = this.notificationService.subscribe((message, type) => {
      this.addNotification(message, type);
    });
  }

  ngOnDestroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    
    // Clear any remaining timeouts
    this.notifications.forEach(n => {
      if (n.timeout) {
        clearTimeout(n.timeout);
      }
    });
  }

  addNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const id = this.nextId++;
    
    // Create the timeout for auto-removal
    const timeout = setTimeout(() => {
      this.removeNotification(id);
    }, 5000); // Auto-remove after 5 seconds
    
    this.notifications.push({ id, message, type, timeout });
    
    // Limit the number of notifications
    if (this.notifications.length > 5) {
      const oldest = this.notifications.shift();
      if (oldest?.timeout) {
        clearTimeout(oldest.timeout);
      }
    }
  }

  removeNotification(id: number): void {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      const notification = this.notifications[index];
      if (notification.timeout) {
        clearTimeout(notification.timeout);
      }
      this.notifications.splice(index, 1);
    }
  }
}