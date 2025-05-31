export interface LlmConfig {
  provider: string;
  modelName: string;
  apiEndpoint?: string; // For 'Other (Manual Endpoint)' or Ollama custom address
  // API Key is NOT stored here for persistence
}

export interface UserData extends LlmConfig {
  projectName?: string;
  projectDescription?: string;
  overallTaskSummary?: string;
  targetTechnology?: string[];
  llmApiKey?: string; // For in-session use by LlmService
}
