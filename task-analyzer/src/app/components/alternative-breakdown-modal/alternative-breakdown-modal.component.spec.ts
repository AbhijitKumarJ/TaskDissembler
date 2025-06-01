import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { AlternativeBreakdownModalComponent } from './alternative-breakdown-modal.component';
import { TaskNode } from '../../models/task-node.interface';

const mockTaskNodes: TaskNode[] = [
  { id: 'alt-1', text: 'Alt Task 1', description: 'Desc 1', properties: { source: 'llm-alternative'} },
  { id: 'alt-2', text: 'Alt Task 2', properties: { source: 'llm-alternative'} },
];

describe('AlternativeBreakdownModalComponent', () => {
  let component: AlternativeBreakdownModalComponent;
  let fixture: ComponentFixture<AlternativeBreakdownModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ CommonModule, AlternativeBreakdownModalComponent ]
    }).compileComponents();

    fixture = TestBed.createComponent(AlternativeBreakdownModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display originalTaskText and hintText if provided', () => {
    component.originalTaskText = 'Original Task';
    component.hintText = 'Test Hint';
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('For task: Original Task');
    expect(compiled.textContent).toContain('Generated with hint: "Test Hint"');
  });

  it('should display alternative subtasks', () => {
    component.alternativeSubtasks = [...mockTaskNodes];
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('.list-group-item');
    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain('Alt Task 1');
    expect(items[0].textContent).toContain('Desc 1');
    expect(items[1].textContent).toContain('Alt Task 2');
  });

  it('should show "No alternative subtasks" message if tasks are null or empty', () => {
    component.alternativeSubtasks = null;
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No alternative subtasks were generated');

    component.alternativeSubtasks = [];
    fixture.detectChanges();
    expect(compiled.textContent).toContain('No alternative subtasks were generated');
  });

  it('should not render "Apply this Breakdown" button if no tasks', () => {
    component.alternativeSubtasks = null;
    fixture.detectChanges();
    const applyButton = fixture.nativeElement.querySelector('.btn-primary') as HTMLButtonElement;
    expect(applyButton).toBeNull(); // Button is conditionally rendered with *ngIf
  });

  it('should render "Apply this Breakdown" button if tasks exist', () => {
     component.alternativeSubtasks = [...mockTaskNodes];
     fixture.detectChanges();
     const applyButton = fixture.nativeElement.querySelector('.btn-primary') as HTMLButtonElement;
     expect(applyButton).not.toBeNull();
     // Standalone buttons that are rendered are not disabled by default unless [disabled] is bound
     expect(applyButton.disabled).toBeFalse();
  });

  it('should emit applyBreakdown with tasks and closeModal on onApply if tasks exist', () => {
    spyOn(component.applyBreakdown, 'emit');
    spyOn(component.closeModal, 'emit');
    component.alternativeSubtasks = [...mockTaskNodes];
    component.onApply();
    expect(component.applyBreakdown.emit).toHaveBeenCalledWith(mockTaskNodes);
    expect(component.closeModal.emit).toHaveBeenCalled();
  });

  it('should only emit closeModal on onApply if tasks are empty', () => {
     spyOn(component.applyBreakdown, 'emit');
     spyOn(component.closeModal, 'emit');
     component.alternativeSubtasks = [];
     component.onApply();
     expect(component.applyBreakdown.emit).not.toHaveBeenCalled();
     expect(component.closeModal.emit).toHaveBeenCalled();
  });

  it('should emit closeModal on onClose', () => {
    spyOn(component.closeModal, 'emit');
    component.onClose();
    expect(component.closeModal.emit).toHaveBeenCalled();
  });
});
