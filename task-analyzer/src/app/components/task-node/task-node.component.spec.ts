import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TaskNodeComponent } from './task-node.component';
import { LlmService } from '../../services/llm.service';
import { NotificationService } from '../../services/notification.service';
import { PromptEditModalComponent } from '../prompt-edit-modal/prompt-edit-modal.component'; // It's imported by TaskNodeComponent
import { TaskNode } from '../../models/task-node.interface';
import { of } from 'rxjs';

// Mock services
class MockLlmService {
  analyzeTask(prompt: string, context: string = '') {
    // Return a simple response that can be processed by processLlmResponse
    return of('Mock LLM response: 1. Subtask 1\nDescription for Subtask 1\n2. Subtask 2\nDescription for Subtask 2');
  }
  getSettings() { return { provider: 'groq', model: 'llama3-8b-8192', apiKey: 'test-key' }; }
}

class MockNotificationService {
  notify(message: string, type: string) { /* console.log(`Notify: ${message}, ${type}`); */ }
}

describe('TaskNodeComponent', () => {
  let component: TaskNodeComponent;
  let fixture: ComponentFixture<TaskNodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        FormsModule,
        TaskNodeComponent, // TaskNodeComponent is standalone and imports PromptEditModalComponent
        // PromptEditModalComponent, // No need to import here if TaskNodeComponent imports it
      ],
      providers: [
        { provide: LlmService, useClass: MockLlmService },
        { provide: NotificationService, useClass: MockNotificationService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaskNodeComponent);
    component = fixture.componentInstance;
    // Provide a default node for basic component initialization
    component.node = { id: 'root', text: 'Root Node' };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Add other basic tests for TaskNodeComponent if necessary (e.g., toggleExpand, startEditing, etc.)
  // For this subtask, focusing on the new functionality.

  describe('subdivide functionality with prompt review', () => {
    beforeEach(() => {
      component.node = { id: 'test', text: 'Test Node for Subdivide' };
      fixture.detectChanges();
    });

    it('should set promptForReview and showPromptPreviewModal on subdivide()', () => {
      component.subdivide();
      expect(component.promptForReview).toBeDefined();
      expect(component.promptForReview).toContain('Please analyze the following task');
      expect(component.showPromptPreviewModal).toBeTrue();
    });

    it('handlePromptReview with "cancel" should hide modal and clear promptForReview', () => {
      component.promptForReview = 'Some prompt';
      component.showPromptPreviewModal = true;
      component.isSubdividing = true; // Assume it was set before modal

      component.handlePromptReview({ action: 'cancel' });

      expect(component.showPromptPreviewModal).toBeFalse();
      expect(component.promptForReview).toBeNull();
      expect(component.isSubdividing).toBeFalse(); // Ensure isSubdividing is reset
    });

    it('handlePromptReview with "confirm" and editedPrompt should call LlmService.analyzeTask with edited prompt', () => {
      const llmService = TestBed.inject(LlmService);
      spyOn(llmService, 'analyzeTask').and.callThrough();
      component.promptForReview = 'Original prompt';
      component.showPromptPreviewModal = true;

      component.handlePromptReview({ action: 'confirm', editedPrompt: 'Edited prompt text' });

      expect(component.showPromptPreviewModal).toBeFalse();
      expect(llmService.analyzeTask).toHaveBeenCalledWith('Edited prompt text', jasmine.any(String));
      // isSubdividing becomes true, then false in the 'complete' block of the mock.
      // If the mock is synchronous, it should be false.
      expect(component.isSubdividing).toBeFalse();
    });

    it('handlePromptReview with "confirm" (no editedPrompt) should call LlmService.analyzeTask with original promptForReview', () => {
      const llmService = TestBed.inject(LlmService);
      spyOn(llmService, 'analyzeTask').and.callThrough();
      component.promptForReview = 'Original prompt from subdivide';
      component.showPromptPreviewModal = true;

      component.handlePromptReview({ action: 'confirm' }); // No editedPrompt field in the event payload

      expect(llmService.analyzeTask).toHaveBeenCalledWith('Original prompt from subdivide', jasmine.any(String));
    });

    it('should store the correct prompt in prompts_and_responses after "confirm" with edited prompt', (done) => {
      const llmService = TestBed.inject(LlmService);
      const mockResponse = "1. Edited Subtask A\nDescription of A\n2. Edited Subtask B\nDescription of B";
      spyOn(llmService, 'analyzeTask').and.returnValue(of(mockResponse));

      component.node = { id: 'node1', text: 'Parent Task for Prompts' };
      fixture.detectChanges(); // Update component with new node

      component.promptForReview = 'Original prompt value';
      const editedPromptText = 'This is the final edited prompt';

      spyOn(component.nodeUpdated, 'emit');

      component.handlePromptReview({ action: 'confirm', editedPrompt: editedPromptText });

      // Since the LlmService mock returns an observable that completes synchronously (of(...)),
      // the .subscribe() block in handlePromptReview should also complete synchronously.
      // However, operations within .subscribe() like emitting events might still queue microtasks.
      // Using setTimeout with 0 delay or fixture.whenStable() can help ensure all async parts are done.

      fixture.whenStable().then(() => {
        const emittedNode = (component.nodeUpdated.emit as jasmine.Spy).calls.mostRecent().args[0] as TaskNode;
        expect(emittedNode.prompts_and_responses).toBeDefined("prompts_and_responses should be defined");
        expect(emittedNode.prompts_and_responses?.length).toBeGreaterThan(0, "prompts_and_responses should not be empty");

        const firstPromptResponse = emittedNode.prompts_and_responses![0];
        expect(firstPromptResponse.prompt).toEqual(editedPromptText);
        expect(firstPromptResponse.response).toEqual(mockResponse);
        done();
      });
    });

    it('handlePromptReview with "confirm" but empty final prompt should notify user and not call LLM', () => {
        const llmService = TestBed.inject(LlmService);
        const notificationService = TestBed.inject(NotificationService);
        spyOn(llmService, 'analyzeTask');
        spyOn(notificationService, 'notify');

        component.promptForReview = '   '; // Original prompt is whitespace
        component.showPromptPreviewModal = true;

        // User confirms without editing, or confirms with an empty edited prompt
        component.handlePromptReview({ action: 'confirm', editedPrompt: ' ' });

        expect(component.showPromptPreviewModal).toBeFalse();
        expect(notificationService.notify).toHaveBeenCalledWith('Prompt is empty. Subdivision cancelled.', 'warn');
        expect(llmService.analyzeTask).not.toHaveBeenCalled();
        expect(component.isSubdividing).toBeFalse();
    });
  });
});
