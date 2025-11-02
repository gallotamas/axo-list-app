import { 
  ChangeDetectionStrategy, 
  Component, 
  ViewChild,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  inject,
  computed,
  DOCUMENT
} from '@angular/core';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { OverlayScrollbarsDirective, OverlayscrollbarsModule } from 'overlayscrollbars-ngx';
import type { PartialOptions } from 'overlayscrollbars';
import { ItemWithHeight, TextMeasurementService, VariableSizeVirtualScroll } from '@/common';
import { TextStyle } from '@/types';
import { ListItem } from './list-item/list-item';
import { LOG_DATA, type LogEntryWithId } from '@/data';

@Component({
  selector: 'axo-list',
  templateUrl: './list.html',
  styleUrl: './list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [VariableSizeVirtualScroll, ScrollingModule, OverlayscrollbarsModule, ListItem],
})
export class List implements AfterViewInit, OnDestroy {
  @ViewChild('osTarget', { read: ElementRef })
  private osTargetRef!: ElementRef<HTMLElement>;
  
  @ViewChild('osTarget', { read: OverlayScrollbarsDirective })
  private osDirective!: OverlayScrollbarsDirective;

  private textMeasurementService = inject(TextMeasurementService);

  private document = inject(DOCUMENT);

  items: LogEntryWithId[] = Array.from({length: 1000000}).map((_, i) => ({
    id: i,
    ...LOG_DATA[Math.floor(Math.random() * LOG_DATA.length)]
  }));

  itemHeights = computed<ItemWithHeight[]>(() => {
    const startTime = performance.now()

    const heights: ItemWithHeight[] = [];

    // Constants from CSS (they should match the appropriate CSS properties)
    const textStyle: TextStyle = {
      fontSize: '13px',
      fontFamily: 'Monaco, Consolas, "Courier New", monospace',
      fontWeight: '400'
    };
    const viewportWidth = 800;
    const horizontalPadding = 16 * 2;
    const verticalPadding = 8 * 2;
    const border = 1;
    const lineHeight = 18;
    const indexColumnWidth = 50;
    const timestampColumnWidth = 160;
    const gap = 12 * 2;
    
    const textWidth = Math.floor(viewportWidth - horizontalPadding - indexColumnWidth - timestampColumnWidth - gap);

    let cumulativeHeight = 0;
    for (const item of this.items) {
      const numberOfLines = this.textMeasurementService.getNumberOfLines(
        item.message,
        textWidth,
        textStyle
      );
      
      const itemHeight = (numberOfLines * lineHeight) + verticalPadding + border;
      cumulativeHeight += itemHeight;
      
      heights.push({
        height: itemHeight,
        cumulativeHeight: cumulativeHeight
      });
    }

    const endTime = performance.now()
    console.debug(`itemHeights calculation took ${endTime - startTime} milliseconds`)

    return heights;
  });


  overlayScrollbarsOptions: PartialOptions;

  constructor() {
    this.overlayScrollbarsOptions = {
      scrollbars: {
        autoHide: 'scroll',
        theme: this.isDarkMode() ? 'os-theme-light' : 'os-theme-dark'
      }
    }
  }

  ngAfterViewInit() {
    const targetElm = this.osTargetRef?.nativeElement;
    const osDirective = this.osDirective;

    if (targetElm && osDirective) {     
      osDirective.osInitialize({
        target: targetElm,
        elements: {
          viewport: targetElm,
          content: targetElm,
        }
      });
    }
  }

  ngOnDestroy() {
    this.osDirective?.osInstance()?.destroy();
  }

  trackById(_index: number, item: LogEntryWithId): number {
    return item.id;
  }

  private isDarkMode(): boolean {
    const window = this.document.defaultView;
    return window?.matchMedia('(prefers-color-scheme: dark)').matches ?? false;
  }
}
