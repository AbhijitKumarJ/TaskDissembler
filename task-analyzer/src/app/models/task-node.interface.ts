export interface TaskNode {
  id: string;
  text: string;
  description?: string;
  children?: TaskNode[];
  properties?: { [key: string]: any };
  prompts_and_responses?: Array<{prompt: string, response: string}>;
  parentId?: string; // Reference to parent node ID
  order?: number; // For maintaining order among siblings
}
