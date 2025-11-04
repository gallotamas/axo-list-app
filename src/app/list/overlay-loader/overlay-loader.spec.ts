import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OverlayLoader } from './overlay-loader';

describe('OverlayLoader', () => {
  let component: OverlayLoader;
  let fixture: ComponentFixture<OverlayLoader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OverlayLoader],
    }).compileComponents();

    fixture = TestBed.createComponent(OverlayLoader);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
