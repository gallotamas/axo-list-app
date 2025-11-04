import { ElementRef } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OverlayLoader } from './overlay-loader';

describe('OverlayLoader', () => {
  let component: OverlayLoader;
  let fixture: ComponentFixture<OverlayLoader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OverlayLoader],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(OverlayLoader);
    component = fixture.componentInstance;
    
    // Set required inputs
    const mockElementRef = new ElementRef(document.createElement('div'));
    fixture.componentRef.setInput('target', mockElementRef);
    fixture.componentRef.setInput('isVisible', false);
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
