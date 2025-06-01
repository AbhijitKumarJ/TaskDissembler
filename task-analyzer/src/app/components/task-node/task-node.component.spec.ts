import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TaskNodeComponent } from './task-node.component';
import { LlmService } from '../../services/llm.service';
import { NotificationService } from '../../services/notification.service';
import { PromptEditModalComponent } from '../prompt-edit-modal/prompt-edit-modal.component'; // It's imported by TaskNodeComponent
import { TaskNode } from '../../models/task-node.interface';
import { of, throwError } from 'rxjs';

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

  describe('LLM Rationale Functionality', () => {
    let mockLlmService: MockLlmService;
    let mockNotificationService: MockNotificationService;

    beforeEach(() => {
      // Component instance is `component`
      // Fixture instance is `fixture`
      mockLlmService = TestBed.inject(LlmService) as unknown as MockLlmService;
      mockNotificationService = TestBed.inject(NotificationService) as unknown as MockNotificationService;

      // Reset node for each test
      component.node = {
        id: 'node1',
        text: 'Parent Task for Rationale',
        children: [
          { id: 'child1', text: 'LLM Child 1', properties: { source: 'llm' } }
        ],
        prompts_and_responses: [
          { prompt: 'Initial subdivide prompt', response: '1. LLM Child 1' }
        ]
      };
      fixture.detectChanges();
    });

    describe('canGetRationale()', () => {
      it('should return true if conditions are met', () => {
        expect(component.canGetRationale()).toBeTrue();
      });

      it('should return false if prompts_and_responses is empty', () => {
        component.node.prompts_and_responses = [];
        expect(component.canGetRationale()).toBeFalse();
      });

      it('should return false if no LLM-generated children', () => {
        component.node.children = [{ id: 'child2', text: 'Manual Child', properties: { source: 'manual' } }];
        expect(component.canGetRationale()).toBeFalse();
      });

      it('should return false if children array is undefined or empty', () => {
        component.node.children = undefined;
        expect(component.canGetRationale()).toBeFalse();
        component.node.children = [];
        expect(component.canGetRationale()).toBeFalse();
      });

      it('should return false if last prompt_and_response already has rationale', () => {
        component.node.prompts_and_responses![0].rationale = { prompt: 'p', response: 'r', timestamp: '' };
        expect(component.canGetRationale()).toBeFalse();
      });
    });

    describe('getLlmRationale()', () => {
      it('should not proceed if canGetRationale() is false', () => {
        spyOn(mockLlmService, 'analyzeTask');
        spyOn(mockNotificationService, 'notify'); // Also spy on notify to check it's called with a warning
        component.node.prompts_and_responses = []; // Make canGetRationale false
        fixture.detectChanges();

        component.getLlmRationale();

        expect(mockLlmService.analyzeTask).not.toHaveBeenCalled();
        expect(mockNotificationService.notify).toHaveBeenCalledWith('Rationale cannot be fetched for this task at this moment.', 'warn');
      });

      it('should call LlmService.analyzeTask with a constructed rationale prompt', () => {
        spyOn(mockLlmService, 'analyzeTask').and.returnValue(of('Mocked rationale response'));
        component.getLlmRationale();
        expect(mockLlmService.analyzeTask).toHaveBeenCalled();
        const calledArgs = (mockLlmService.analyzeTask as jasmine.Spy).calls.mostRecent().args;
        expect(calledArgs[0]).toContain('Please explain your reasoning');
        expect(calledArgs[0]).toContain('Parent Task for Rationale'); // From node.text
        expect(calledArgs[0]).toContain('LLM Child 1'); // From child.text
        expect(calledArgs[0]).toContain('Initial subdivide prompt'); // From lastPnr.prompt
      });

      it('should set loading states and notify user during fetching', () => {
        spyOn(mockNotificationService, 'notify');
        spyOn(mockLlmService, 'analyzeTask').and.returnValue(of('response').pipe()); // Keep it pending by not completing
        component.getLlmRationale();
        expect(component.isFetchingRationale).toBeTrue();
        expect(mockNotificationService.notify).toHaveBeenCalledWith(
          `Fetching rationale for "${component.node.text}"...`, 'info'
        );
      });

      it('on successful response, should set rationale text, show modal, store rationale, and notify', (done) => {
        const mockRationale = 'This is the detailed rationale.';
        spyOn(mockLlmService, 'analyzeTask').and.returnValue(of(mockRationale));
        spyOn(mockNotificationService, 'notify');
        spyOn(component.nodeUpdated, 'emit');

        component.getLlmRationale();

        fixture.whenStable().then(() => {
          expect(component.currentRationaleText).toBe(mockRationale);
          expect(component.showRationaleModal).toBeTrue();
          expect(mockNotificationService.notify).toHaveBeenCalledWith('Rationale received.', 'success');

          const emittedNode = (component.nodeUpdated.emit as jasmine.Spy).calls.mostRecent().args[0];
          const lastPnr = emittedNode.prompts_and_responses[emittedNode.prompts_and_responses.length - 1];
          expect(lastPnr.rationale).toBeDefined();
          expect(lastPnr.rationale.response).toBe(mockRationale);
          expect(lastPnr.rationale.prompt).toContain('Please explain your reasoning');

          expect(component.isFetchingRationale).toBeFalse(); // Should be reset in complete()
          done();
        });
      });

      it('on error, should notify user and reset loading state', (done) => {
        spyOn(mockLlmService, 'analyzeTask').and.returnValue(throwError(() => new Error('LLM Error')));
        spyOn(mockNotificationService, 'notify');
        component.getLlmRationale();

        fixture.whenStable().then(() => {
          expect(mockNotificationService.notify).toHaveBeenCalledWith('Error fetching rationale: LLM Error', 'error');
          expect(component.isFetchingRationale).toBeFalse();
          expect(component.showRationaleModal).toBeFalse(); // Ensure modal isn't shown on error
          done();
        });
      });
    });

    describe('handleRationaleModalClose()', () => {
      it('should hide modal and clear currentRationaleText', () => {
        component.showRationaleModal = true;
        component.currentRationaleText = 'Some rationale';
        fixture.detectChanges();

        component.handleRationaleModalClose();
        expect(component.showRationaleModal).toBeFalse();
        expect(component.currentRationaleText).toBeNull();
      });
    });
  });

  describe('Alternative Breakdown Functionality', () => {
    let mockLlmService: MockLlmService; // Assuming MockLlmService is defined as in prior tests
    let mockNotificationService: MockNotificationService;

    beforeEach(() => {
      // component and fixture are already available from parent describe
      mockLlmService = TestBed.inject(LlmService) as unknown as MockLlmService;
      mockNotificationService = TestBed.inject(NotificationService) as unknown as MockNotificationService;
      component.node = { id: 'node-alt-test', text: 'Main Task for Alt', children: [] };
      component.alternativeHint = '';
      component.showAlternativeHintInput = false;
      component.currentAlternativeBreakdown = null;
      component.lastAlternativePromptAndResponse = null;
      component.isFetchingAlternative = false;
      component.showAlternativeModal = false;
      fixture.detectChanges();
    });

    describe('requestAlternativeBreakdown()', () => {
      it('should toggle showAlternativeHintInput', () => {
        component.requestAlternativeBreakdown();
        expect(component.showAlternativeHintInput).toBeTrue();
        component.requestAlternativeBreakdown();
        expect(component.showAlternativeHintInput).toBeFalse();
      });

      it('should clear alternativeHint if showAlternativeHintInput becomes false', () => {
        component.showAlternativeHintInput = true;
        component.alternativeHint = 'Test Hint';
        fixture.detectChanges(); // Ensure initial state is set before action
        component.requestAlternativeBreakdown(); // This will set showAlternativeHintInput to false
        expect(component.alternativeHint).toBe('');
      });
    });

    describe('getAlternativeBreakdown()', () => {
      it('should not proceed if node text is empty', () => {
        spyOn(mockLlmService, 'analyzeTask');
        spyOn(mockNotificationService, 'notify');
        component.node.text = '';
        fixture.detectChanges();
        component.getAlternativeBreakdown();
        expect(mockLlmService.analyzeTask).not.toHaveBeenCalled();
        expect(mockNotificationService.notify).toHaveBeenCalledWith('Cannot generate alternatives for an empty node.', 'warn');
      });

      it('should call LlmService.analyzeTask with hint if provided', () => {
        spyOn(mockLlmService, 'analyzeTask').and.returnValue(of('1. Alt Task'));
        component.alternativeHint = 'Focus on technical';
        component.getAlternativeBreakdown();
        expect(mockLlmService.analyzeTask).toHaveBeenCalled();
        const promptArg = (mockLlmService.analyzeTask as jasmine.Spy).calls.mostRecent().args[0];
        expect(promptArg).toContain('Focus on technical');
      });

      it('should call LlmService.analyzeTask with generic phrase if no hint', () => {
        spyOn(mockLlmService, 'analyzeTask').and.returnValue(of('1. Alt Task'));
        component.alternativeHint = '';
        component.getAlternativeBreakdown();
        expect(mockLlmService.analyzeTask).toHaveBeenCalled();
        const promptArg = (mockLlmService.analyzeTask as jasmine.Spy).calls.mostRecent().args[0];
        expect(promptArg).toContain('Explore a different perspective');
      });

      it('should process response, store alternative, and show modal on success', (done) => {
        const mockLLMResponse = '1. Parsed Alt Task 1\nDescription for task 1';
        spyOn(mockLlmService, 'analyzeTask').and.returnValue(of(mockLLMResponse));
        // Spy on the actual processLlmResponse to ensure it's called correctly
        spyOn(component, 'processLlmResponse').and.callThrough();

        component.getAlternativeBreakdown();

        fixture.whenStable().then(() => {
          expect(component.processLlmResponse).toHaveBeenCalledWith(mockLLMResponse, 'alt');
          expect(component.currentAlternativeBreakdown).toBeTruthy();
          expect(component.currentAlternativeBreakdown?.length).toBeGreaterThan(0);
          if(component.currentAlternativeBreakdown) { // type guard
            expect(component.currentAlternativeBreakdown[0].text).toBe('Parsed Alt Task 1');
            expect(component.currentAlternativeBreakdown[0].properties?.source).toBe('llm-alternative');
          }
          expect(component.lastAlternativePromptAndResponse).toBeTruthy();
          expect(component.lastAlternativePromptAndResponse?.prompt).toContain('Main Task for Alt');
          expect(component.lastAlternativePromptAndResponse?.response).toBe(mockLLMResponse);
          expect(component.showAlternativeModal).toBeTrue();
          expect(component.isFetchingAlternative).toBeFalse();
          done();
        });
      });

      it('should handle empty LLM response for alternatives gracefully', (done) => {
         spyOn(mockLlmService, 'analyzeTask').and.returnValue(of('')); // Empty response
         spyOn(mockNotificationService, 'notify');
         component.getAlternativeBreakdown();
         fixture.whenStable().then(() => {
           expect(component.currentAlternativeBreakdown).toEqual([]);
           expect(component.showAlternativeModal).toBeTrue(); // Still show modal to indicate attempt
           expect(mockNotificationService.notify).toHaveBeenCalledWith('LLM did not return any subtasks for the alternative breakdown.', 'warn');
           done();
         });
      });

      it('should handle LLM error during fetching', (done) => {
        spyOn(mockLlmService, 'analyzeTask').and.returnValue(throwError(() => new Error('LLM Fetch Error')));
        spyOn(mockNotificationService, 'notify');
        component.getAlternativeBreakdown();
        fixture.whenStable().then(() => {
          expect(mockNotificationService.notify).toHaveBeenCalledWith('Error fetching alternatives: LLM Fetch Error', 'error');
          expect(component.isFetchingAlternative).toBeFalse();
          expect(component.currentAlternativeBreakdown).toBeNull();
          done();
        });
      });
    });

    describe('applyAlternativeBreakdown()', () => {
      const altTasks: TaskNode[] = [{ id: 'alt-node-1', text: 'Applied Alt Task', properties: { source: 'llm-alternative' } }];

      beforeEach(() => {
        // Setup specific to applyAlternativeBreakdown tests
        component.lastAlternativePromptAndResponse = { prompt: 'alt prompt', response: 'alt response' };
        component.node.prompts_and_responses = []; // Clear for fresh test
        fixture.detectChanges();
      });

      it('should not proceed if tasksToApply is null or empty, and notify', () => {
        spyOn(component.nodeUpdated, 'emit');
        spyOn(mockNotificationService, 'notify');

        component.applyAlternativeBreakdown(null as any);
        expect(component.nodeUpdated.emit).not.toHaveBeenCalled();
        expect(mockNotificationService.notify).toHaveBeenCalledWith('No alternative tasks to apply.', 'warn');

        component.applyAlternativeBreakdown([]);
        expect(component.nodeUpdated.emit).not.toHaveBeenCalled();
        expect(mockNotificationService.notify).toHaveBeenCalledWith('No alternative tasks to apply.', 'warn');
      });

      it('should replace node children with applied tasks', () => {
        component.applyAlternativeBreakdown([...altTasks]);
        expect(component.node.children).toEqual(altTasks);
      });

      it('should add to prompts_and_responses with type "alternative-applied"', () => {
        component.applyAlternativeBreakdown([...altTasks]);
        expect(component.node.prompts_and_responses?.length).toBe(1);
        const pnrEntry = component.node.prompts_and_responses![0];
        expect(pnrEntry.type).toBe('alternative-applied');
        expect(pnrEntry.prompt).toBe('alt prompt');
        expect(pnrEntry.timestamp).toBeDefined();
      });

      it('should update node lastUpdated property and emit nodeUpdated', () => {
        spyOn(component.nodeUpdated, 'emit');
        const originalLastUpdated = component.node.properties?.lastUpdated;

        component.applyAlternativeBreakdown([...altTasks]);

        expect(component.node.properties?.lastUpdated).toBeDefined();
        if (originalLastUpdated) { // Only check if not equal if it was defined
            expect(component.node.properties?.lastUpdated).not.toBe(originalLastUpdated);
        }
        expect(component.nodeUpdated.emit).toHaveBeenCalledWith(component.node);
      });

      it('should reset alternative-related state variables and expand node', () => {
        component.currentAlternativeBreakdown = [...altTasks];
        component.showAlternativeModal = true;
        component.showAlternativeHintInput = true;
        component.alternativeHint = 'some hint';
        component.isExpanded = false;
        fixture.detectChanges();

        component.applyAlternativeBreakdown([...altTasks]);

        expect(component.currentAlternativeBreakdown).toBeNull();
        expect(component.lastAlternativePromptAndResponse).toBeNull();
        expect(component.showAlternativeModal).toBeFalse();
        expect(component.showAlternativeHintInput).toBeFalse();
        expect(component.alternativeHint).toBe('');
        expect(component.isExpanded).toBeTrue();
      });
    });

    describe('handleAlternativeModalClose()', () => {
      it('should set showAlternativeModal to false', () => {
        component.showAlternativeModal = true;
        fixture.detectChanges();
        component.handleAlternativeModalClose();
        expect(component.showAlternativeModal).toBeFalse();
      });
    });
  });
});
