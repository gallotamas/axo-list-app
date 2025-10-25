import { ChangeDetectionStrategy, Component } from '@angular/core';
import {ScrollingModule} from '@angular/cdk/scrolling';

@Component({
  selector: 'axo-list',
  templateUrl: './list.html',
  styleUrl: './list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ScrollingModule],
})
export class List {
  items = Array.from({length: 100000}).map((_, i) => `Item #${i}`);
}
