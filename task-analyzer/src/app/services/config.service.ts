import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LlmConfig } from '../models/llm-config.interface';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private readonly LLM_CONFIG_KEY = 'taskAnalyserLlmConfig';
  private llmConfigSubject = new BehaviorSubject<LlmConfig | null>(this.loadLlmConfig());
  llmConfig$ = this.llmConfigSubject.asObservable();

  constructor() { }

  loadLlmConfig(): LlmConfig | null {
    if (typeof localStorage !== 'undefined') {
      const storedConfig = localStorage.getItem(this.LLM_CONFIG_KEY);
      if (storedConfig) {
        try {
          return JSON.parse(storedConfig) as LlmConfig;
        } catch (e) {
          console.error('Error parsing LLM config from local storage', e);
          localStorage.removeItem(this.LLM_CONFIG_KEY);
          return null;
        }
      }
    }
    return null;
  }

  saveLlmConfig(config: Omit<LlmConfig, 'apiKey'>): void {
    if (typeof localStorage !== 'undefined') {
      // Ensure only provider, modelName, and apiEndpoint are saved
      const configToSave: LlmConfig = {
        provider: config.provider,
        modelName: config.modelName,
      };
      if (config.apiEndpoint) {
        configToSave.apiEndpoint = config.apiEndpoint;
      }
      localStorage.setItem(this.LLM_CONFIG_KEY, JSON.stringify(configToSave));
      this.llmConfigSubject.next(configToSave);
    }
  }

  getLlmConfig(): LlmConfig | null {
    return this.llmConfigSubject.value;
  }

  clearConfig(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.LLM_CONFIG_KEY);
    }
    this.llmConfigSubject.next(null);
  }
}
