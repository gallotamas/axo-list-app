import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScrollControls } from './scroll-controls';

describe('ScrollControls', () => {
  let component: ScrollControls;
  let fixture: ComponentFixture<ScrollControls>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScrollControls],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(ScrollControls);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should be invalid when value is less than 0', () => {
    fixture.componentRef.setInput('maxRowId', 100);
    fixture.detectChanges();

    component.scrollToRowControl.setValue(-1);

    expect(component.scrollToRowControl.valid).toBe(false);
    expect(component.scrollToRowControl.hasError('min')).toBe(true);
  });

  it('should be invalid when value exceeds maxRowId', () => {
    fixture.componentRef.setInput('maxRowId', 100);
    fixture.detectChanges();

    component.scrollToRowControl.setValue(101);

    expect(component.scrollToRowControl.valid).toBe(false);
    expect(component.scrollToRowControl.hasError('max')).toBe(true);
  });

  it('should be valid when value is within range', () => {
    fixture.componentRef.setInput('maxRowId', 100);
    fixture.detectChanges();

    component.scrollToRowControl.setValue(50);

    expect(component.scrollToRowControl.valid).toBe(true);
    expect(component.scrollToRowControl.hasError('min')).toBe(false);
    expect(component.scrollToRowControl.hasError('max')).toBe(false);
  });

  it('should be valid when value equals maxRowId', () => {
    fixture.componentRef.setInput('maxRowId', 100);
    fixture.detectChanges();

    component.scrollToRowControl.setValue(100);

    expect(component.scrollToRowControl.valid).toBe(true);
    expect(component.scrollToRowControl.hasError('max')).toBe(false);
  });
});
