export interface TaskNode {
  id: string;
  text: string;
  description?: string;
  taskType?: string;
  children?: TaskNode[];
  properties?: { [key: string]: any };
  prompts_and_responses?: PromptResponsePair[];
  parentId?: string; // Reference to parent node ID
  order?: number; // For maintaining order among siblings
}

export interface PromptResponsePair {
  prompt: string;
  response: string;
  timestamp?: string; // Made optional as it might not exist on older data
  type?: 'subdivision' | 'alternative-applied' | 'rationale'; // Added type
  rationale?: {
    prompt: string;
    response: string;
    timestamp: string;
  };
}
