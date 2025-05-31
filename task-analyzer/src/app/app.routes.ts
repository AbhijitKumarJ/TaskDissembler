import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LlmSettingsComponent } from './components/llm-settings/llm-settings.component';
import { TaskAnalyzerComponent } from './components/task-analyzer/task-analyzer.component';
import { NewTaskFormComponent } from './components/new-task-form/new-task-form.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'settings', component: LlmSettingsComponent },
  { path: 'new-task', component: NewTaskFormComponent }, // Added route for NewTaskFormComponent
  { path: 'analyze', component: TaskAnalyzerComponent },
  { path: '**', redirectTo: '' }
];
