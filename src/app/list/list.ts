import { 
  ChangeDetectionStrategy, 
  Component, 
  ViewChild,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  inject,
  computed
} from '@angular/core';
import { ScrollingModule, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { OverlayScrollbarsDirective, OverlayscrollbarsModule } from 'overlayscrollbars-ngx';
import type { PartialOptions } from 'overlayscrollbars';
import { ItemWithHeight, TextMeasurementService, VariableSizeVirtualScroll } from '@/common';
import { TextStyle } from '@/types';

@Component({
  selector: 'axo-list',
  templateUrl: './list.html',
  styleUrl: './list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [VariableSizeVirtualScroll, ScrollingModule, OverlayscrollbarsModule],
})
export class List implements AfterViewInit, OnDestroy {
  @ViewChild('osTarget', { read: ElementRef })
  private osTargetRef!: ElementRef<HTMLElement>;
  
  @ViewChild('osTarget', { read: OverlayScrollbarsDirective })
  private osDirective!: OverlayScrollbarsDirective;
  
  @ViewChild(CdkVirtualScrollViewport)
  private viewport!: CdkVirtualScrollViewport;

  private textMeasurementService = inject(TextMeasurementService);

  overlayScrollbarsOptions: PartialOptions = {
    scrollbars: {
      autoHide: 'scroll',
      theme: 'os-theme-dark'
    }
  };

  items = Array.from({length: 1000000}).map((_, i) => {
    const lengthVariant = i % 5;
    let text;
    switch (lengthVariant) {
      case 0:
        text = `Item #${i} - Short`;
        break;
      case 1:
        text = `Item #${i} - This is a medium length item with some additional text to make it longer`;
        break;
      case 2:
        text = `Item #${i} - This is a very long item with lots of text. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`;
        break;
      case 3:
        text = `Item #${i} - Extra long content here! Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.`;
        break;
      default:
        text = `Item #${i}`;
    }
    return { id: i, text };
  });

  itemHeights = computed<ItemWithHeight[]>(() => {
    const startTime = performance.now()

    // Calculate heights for each item
    const heights: ItemWithHeight[] = [];
    const viewportWidth = 800; // From CSS: .list-viewport width
    const horizontalPadding = 16 * 2; // From CSS: padding: 8px 16px (left/right)
    const verticalPadding = 8 * 2; // From CSS: padding: 8px 16px (top/bottom)
    const border = 1; // From CSS: border-bottom: 1px
    const lineHeight = 18; // From CSS: line-height: 18px
    const textWidth = Math.floor(viewportWidth - horizontalPadding); // Available width for text
    
    // Text styles matching the list-item CSS
    const textStyle: TextStyle = {
      fontSize: '13px',
      fontFamily: 'Monaco, Consolas, "Courier New", monospace',
      fontWeight: '400'
    };

    let cumulativeHeight = 0;
    
    for (const item of this.items) {
      const numberOfLines = this.textMeasurementService.getNumberOfLines(
        item.text,
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
    console.log(`itemHeights calculation took ${endTime - startTime} milliseconds`)


    return heights;
  });


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

  trackById(_index: number, item: any): number {
    return item.id;
  }
}
