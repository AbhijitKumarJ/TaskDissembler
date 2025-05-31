import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private listeners: ((msg: string, type: 'success' | 'error' | 'info') => void)[] = [];

  notify(message: string, type: 'success' | 'error' | 'info' = 'info') {
    this.listeners.forEach(listener => listener(message, type));
  }

  subscribe(listener: (msg: string, type: 'success' | 'error' | 'info') => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}
