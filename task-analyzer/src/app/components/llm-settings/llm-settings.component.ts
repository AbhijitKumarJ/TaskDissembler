import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LlmService, LlmSettings } from '../../services/llm.service';
import { NotificationService } from '../../services/notification.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-llm-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './llm-settings.component.html',
  styleUrls: ['./llm-settings.component.scss']
})
export class LlmSettingsComponent implements OnInit {
  showApiKey = false;
  config: LlmSettings = {
    provider: 'groq',
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    apiKey: '',
    baseUrl: '',
    temperature: 0.7,
    maxTokens: 2000
  };

  private llmService = inject(LlmService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  ngOnInit(): void {
    this.loadSettings();
  }

  toggleApiKeyVisibility(): void {
    this.showApiKey = !this.showApiKey;
  }

  loadSettings(): void {
    this.config = this.llmService.getSettings();
  }

  saveSettings(): void {
    // Save settings using the LlmService
    this.llmService.updateSettings(this.config);
    
    // Show success notification
    this.notificationService.notify('LLM settings saved successfully!', 'success');
    
    // Navigate back to the previous page
    this.router.navigate(['/']);
  }

  resetForm(): void {
    this.config = {
      provider: 'groq',
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      apiKey: '',
      baseUrl: '',
      temperature: 0.7,
      maxTokens: 2000
    };
  }
}
