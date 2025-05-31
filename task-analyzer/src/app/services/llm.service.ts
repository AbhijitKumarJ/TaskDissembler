import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

export interface LlmSettings {
  apiKey?: any;
  provider: 'openai' | 'groq' | 'ollama' | 'custom';
  model: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}


@Injectable({
  providedIn: 'root'
})
export class LlmService {
  private settingsKey = 'llmSettings';
  private defaultSettings: LlmSettings = {
    provider: 'groq',
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    temperature: 0.7,
    maxTokens: 2000
  };

  private settingsSubject = new BehaviorSubject<LlmSettings>(this.loadSettings());
  settings$ = this.settingsSubject.asObservable();

  constructor(private http: HttpClient) {}

  getSettings(): LlmSettings {
    return this.settingsSubject.value;
  }

  updateSettings(settings: Partial<LlmSettings>): void {
    const currentSettings = this.getSettings();
    const newSettings = { ...currentSettings, ...settings };
    
    // Store API key in memory only, not in localStorage
    const apiKey = newSettings.apiKey;
    delete newSettings.apiKey;
    
    // Save settings without API key to localStorage
    localStorage.setItem(this.settingsKey, JSON.stringify(newSettings));
    
    // Add API key back for the current session
    newSettings.apiKey = apiKey;
    
    this.settingsSubject.next(newSettings);
  }

  private loadSettings(): LlmSettings {
    try {
      const savedSettings = localStorage.getItem(this.settingsKey);
      return savedSettings 
        ? { ...this.defaultSettings, ...JSON.parse(savedSettings) }
        : this.defaultSettings;
    } catch (e) {
      console.error('Error loading LLM settings', e);
      return this.defaultSettings;
    }
  }

  analyzeTask(prompt: string, context: string = ''): Observable<string> {
    const settings = this.getSettings();
    
    if (!settings.apiKey && settings.provider !== 'ollama') {
      return throwError(() => new Error('API key is required. Please go to LLM Settings to configure your API key.'));
    }

    const payload = this.createPayload(settings, prompt, context);
    const headers = this.getHeaders(settings);
    
    // Determine the API endpoint based on the provider
    let apiUrl = '';
    
    switch (settings.provider) {
      case 'openai':
        apiUrl = settings.baseUrl || 'https://api.openai.com/v1/chat/completions';
        break;
      case 'groq':
        apiUrl = settings.baseUrl || 'https://api.groq.com/openai/v1/chat/completions';
        break;
      case 'ollama':
        apiUrl = settings.baseUrl || 'http://localhost:11434/api/chat';
        break;
      case 'custom':
        if (!settings.baseUrl) {
          return throwError(() => new Error('Base URL is required for custom provider'));
        }
        apiUrl = settings.baseUrl;
        break;
      default:
        return throwError(() => new Error('Unsupported LLM provider'));
    }
    
    // Make the actual API call
    return this.http.post<any>(apiUrl, payload, { headers }).pipe(
      map(response => {
        // Handle different response formats
        if (response.choices && response.choices.length > 0) {
          // OpenAI/Groq format
          if (response.choices[0].message && response.choices[0].message.content) {
            return response.choices[0].message.content;
          }
          // Older format
          if (response.choices[0].text) {
            return response.choices[0].text;
          }
        }
        
        // Ollama format
        if (response.message && response.message.content) {
          return response.message.content;
        }
        
        // Fallback
        return JSON.stringify(response);
      }),
      catchError(error => {
        console.error('LLM API call error:', error);
        
        // For development/testing purposes, return a mock response if the API call fails
        if (error.status === 0) {
          console.warn('Network error. Using mock response for development purposes.');
          return of(`Here's a breakdown of the task into logical subtasks:\n\n1. Research and Planning\n   Gather requirements and create a detailed plan for implementation.\n\n2. Design Phase\n   Create wireframes, mockups, and architecture diagrams.\n\n3. Implementation\n   Write code according to the design specifications.\n\n4. Testing\n   Perform unit tests, integration tests, and user acceptance testing.\n\n5. Deployment\n   Release the solution to production environment.`);
        }
        
        return throwError(() => new Error(`LLM API call failed: ${error.message || 'Unknown error'}`));
      })
    );
  }

  private createPayload(settings: LlmSettings, prompt: string, context: string): any {
    const basePayload: any = {
      model: settings.model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that helps break down complex tasks into smaller, more manageable sub-tasks.'
        },
        {
          role: 'user',
          content: context ? `${context}\n\n${prompt}` : prompt
        }
      ],
      temperature: settings.temperature || 0.7,
      max_tokens: settings.maxTokens || 2000
    };

    // Add provider-specific settings
    if (settings.provider === 'openai' || settings.provider === 'groq') {
      // OpenAI and Groq use the same API format
      return basePayload;
    } else if (settings.provider === 'ollama') {
      // Ollama might have different parameters
      return {
        ...basePayload,
        stream: false
      };
    } else if (settings.provider === 'custom' && settings.baseUrl) {
      // Custom provider with custom base URL
      return basePayload;
    }

    return basePayload;
  }

  // Helper method to get headers for the API request
  private getHeaders(settings: LlmSettings): { [key: string]: string } {
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json'
    };

    // Only add Authorization header if using a provider that requires it
    if (settings.apiKey && settings.provider !== 'ollama') {
      const prefix = 'Bearer ' ; //settings.provider === 'openai' ? 'Bearer ' : '';
      headers['Authorization'] = `${prefix}${settings.apiKey}`;
    }

    return headers;
  }
}
