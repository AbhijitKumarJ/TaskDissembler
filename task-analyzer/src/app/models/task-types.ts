export interface TaskType {
  value: string; // The value to be stored (e.g., 'development')
  label: string; // The human-readable label (e.g., 'Development')
}

export const TASK_TYPES: TaskType[] = [
  { value: 'general', label: 'General Task' },
  { value: 'research', label: 'Research' },
  { value: 'design', label: 'Design' },
  { value: 'development', label: 'Development' },
  { value: 'testing', label: 'Testing' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'bug_fixing', label: 'Bug Fixing' },
  { value: 'code_review', label: 'Code Review' },
  { value: 'deployment', label: 'Deployment' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'project_management', label: 'Project Management' },
  // Add more types as needed
];

// Optionally, a default task type can be exported
export const DEFAULT_TASK_TYPE_VALUE = 'general';

// Function to get a label by value (might be useful)
export function getTaskTypeLabel(value: string): string | undefined {
  const taskType = TASK_TYPES.find(tt => tt.value === value);
  return taskType?.label;
}
