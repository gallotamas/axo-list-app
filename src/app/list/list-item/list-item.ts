import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { LogEntryWithId } from '@/data';

@Component({
  selector: 'axo-list-item',
  templateUrl: './list-item.html',
  styleUrl: './list-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [DatePipe],
})
export class ListItem {
  @Input() log!: LogEntryWithId;
}
