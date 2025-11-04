import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListItem } from './list-item';
import { LogEntryWithId, LOG_DATA } from '@/data';

describe('ListItem', () => {
  let component: ListItem;
  let fixture: ComponentFixture<ListItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListItem],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(ListItem);
    component = fixture.componentInstance;

    // Set required input
    const mockLog: LogEntryWithId = {
      id: 1,
      ...LOG_DATA[0],
    };
    component.log = mockLog;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
