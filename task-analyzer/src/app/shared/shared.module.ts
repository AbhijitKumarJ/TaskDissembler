import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Services
import { LlmService } from '../services/llm.service';
import { TaskService } from '../services/task.service';

@NgModule({
  declarations: [
    //TaskNodeComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  exports: [
    CommonModule,
    FormsModule,
    RouterModule,
    //TaskNodeComponent
  ],
  providers: [
    LlmService,
    TaskService
  ]
})
export class SharedModule { }
