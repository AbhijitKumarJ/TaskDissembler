import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { RationaleDisplayModalComponent } from './rationale-display-modal.component';

describe('RationaleDisplayModalComponent', () => {
  let component: RationaleDisplayModalComponent;
  let fixture: ComponentFixture<RationaleDisplayModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ CommonModule, RationaleDisplayModalComponent ] // Import standalone component
    })
    .compileComponents();

    fixture = TestBed.createComponent(RationaleDisplayModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the rationaleText input', () => {
    const testRationale = 'This is the LLM rationale.';
    component.rationaleText = testRationale;
    fixture.detectChanges(); // Trigger change detection
    const preElement = fixture.nativeElement.querySelector('.rationale-content pre');
    expect(preElement).toBeTruthy();
    expect(preElement.textContent).toContain(testRationale);
  });

  it('should emit closeModal event when onClose is called', () => {
    spyOn(component.closeModal, 'emit');
    component.onClose();
    expect(component.closeModal.emit).toHaveBeenCalled();
  });

  it('should call onClose when the close button is clicked', () => {
    spyOn(component, 'onClose');
    fixture.detectChanges(); // Ensure button is in the DOM
    const closeButton = fixture.nativeElement.querySelector('.modal-actions button');
    expect(closeButton).toBeTruthy(); // Ensure the button is found
    closeButton.click();
    expect(component.onClose).toHaveBeenCalled();
  });

  it('should call onClose when the modal overlay is clicked', () => {
     spyOn(component, 'onClose');
     fixture.detectChanges(); // Ensure overlay is in the DOM
     const overlayElement = fixture.nativeElement.querySelector('.modal-overlay');
     expect(overlayElement).toBeTruthy(); // Ensure the overlay is found
     overlayElement.click();
     expect(component.onClose).toHaveBeenCalled();
  });
});
