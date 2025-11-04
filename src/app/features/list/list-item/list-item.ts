import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { LogEntryWithId } from '@/data';
import { GAP, INDEX_COLUMN_WIDTH, TIMESTAMP_COLUMN_WIDTH } from '../common/constants';

@Component({
  selector: 'axo-list-item',
  templateUrl: './list-item.html',
  styles: `
    .list-item-container {
      gap: ${GAP}px;
    }
    .index-column {
      width: ${INDEX_COLUMN_WIDTH}px;
    }
    .timestamp-column {
      width: ${TIMESTAMP_COLUMN_WIDTH}px;
    }
  `,
  styleUrl: './list-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
})
export class ListItem {
  log = input.required<LogEntryWithId>();
}
