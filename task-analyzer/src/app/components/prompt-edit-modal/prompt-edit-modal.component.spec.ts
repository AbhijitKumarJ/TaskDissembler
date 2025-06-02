import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { PromptEditModalComponent } from './prompt-edit-modal.component';
import { CommonModule } from '@angular/common';

describe('PromptEditModalComponent', () => {
  let component: PromptEditModalComponent;
  let fixture: ComponentFixture<PromptEditModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ FormsModule, CommonModule, PromptEditModalComponent ] // Import standalone component directly
    })
    .compileComponents();

    fixture = TestBed.createComponent(PromptEditModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize editablePrompt with the input prompt', () => {
    component.prompt = 'Initial prompt';
    component.ngOnInit();
    expect(component.editablePrompt).toBe('Initial prompt');
  });

  it('should emit reviewOutcome with "confirm" and editedPrompt on onConfirm when editablePrompt is not empty', () => {
    spyOn(component.reviewOutcome, 'emit');
    component.editablePrompt = 'Edited prompt';
    component.onConfirm();
    expect(component.reviewOutcome.emit).toHaveBeenCalledWith({ action: 'confirm', editedPrompt: 'Edited prompt' });
  });

  it('should not emit reviewOutcome on onConfirm if editablePrompt is empty or whitespace', () => {
    spyOn(component.reviewOutcome, 'emit');
    component.editablePrompt = '   '; // Whitespace
    component.onConfirm();
    // Depending on implementation: either not called or called with original
    // Based on current implementation, it console.warns and does not emit
    expect(component.reviewOutcome.emit).not.toHaveBeenCalled();
  });

  it('should emit reviewOutcome with "cancel" on onCancel', () => {
    spyOn(component.reviewOutcome, 'emit');
    component.onCancel();
    expect(component.reviewOutcome.emit).toHaveBeenCalledWith({ action: 'cancel' });
  });
});
