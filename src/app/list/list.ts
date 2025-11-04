import { 
  ChangeDetectionStrategy, 
  Component, 
  ViewChild,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  inject,
  computed,
  DOCUMENT,
  signal,
  effect
} from '@angular/core';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { OverlayScrollbarsDirective, OverlayscrollbarsModule } from 'overlayscrollbars-ngx';
import type { PartialOptions } from 'overlayscrollbars';
import { ItemWithHeight, TextMeasurementService, VariableSizeVirtualScroll } from '@/common';
import { TextStyle } from '@/types';
import { ListItem } from './list-item/list-item';
import { ScrollControls } from './scroll-controls/scroll-controls';
import { OverlayLoader } from './overlay-loader/overlay-loader';
import { LOG_DATA, type LogEntryWithId } from '@/data';
import { debounceTime, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'axo-list',
  templateUrl: './list.html',
  styleUrl: './list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    VariableSizeVirtualScroll, 
    ScrollingModule, 
    OverlayscrollbarsModule, 
    ListItem, 
    ScrollControls,
    OverlayLoader
  ],
})
export class List implements AfterViewInit, OnDestroy {
  @ViewChild(CdkVirtualScrollViewport)
  private viewport!: CdkVirtualScrollViewport;
  
  @ViewChild('osTarget', { read: OverlayScrollbarsDirective })
  private osDirective!: OverlayScrollbarsDirective;

  @ViewChild('osTarget', { read: ElementRef })
  protected osTargetRef!: ElementRef<HTMLElement>;

  private document = inject(DOCUMENT);
  private textMeasurementService = inject(TextMeasurementService);
  private resizeSubject$ = new Subject<ResizeObserverEntry>();
  private resizeObserver?: ResizeObserver;
  private viewportWidth = signal<number>(800);
  private destroy$ = new Subject<void>();
  
  protected isCalculatingHeights = signal<boolean>(false);

  overlayScrollbarsOptions: PartialOptions;

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
    const viewportWidth = this.viewportWidth(); // Use signal value
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

  constructor() {
    this.overlayScrollbarsOptions = {
      scrollbars: {
        autoHide: 'scroll',
        theme: this.isDarkMode() ? 'os-theme-light' : 'os-theme-dark'
      }
    }

    // Wait for the itemHeights to be calculated before hiding the loader
    effect(() => {
      // Access itemHeights to make this effect depend on it
      this.itemHeights();
    
      setTimeout(() => {
        this.isCalculatingHeights.set(false);
      }, 0);
    });

    this.resizeSubject$
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.updateViewportWidth();
      });
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

    this.isCalculatingHeights.set(true);
    requestAnimationFrame(() => {
      this.updateViewportWidth();
    });

    if (targetElm) {
      const resizeObserver = new ResizeObserver(
        entries => {
          this.resizeSubject$.next(entries[0]);
        }
      );
      resizeObserver.observe(targetElm);
      this.resizeObserver = resizeObserver;
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.resizeObserver?.disconnect();
    this.osDirective?.osInstance()?.destroy();
  }

  trackById(_index: number, item: LogEntryWithId): number {
    return item.id;
  }

  scrollToRow(rowId: number): void {
    this.viewport.scrollToIndex(rowId);
  }

  private isDarkMode(): boolean {
    const window = this.document.defaultView;
    return window?.matchMedia('(prefers-color-scheme: dark)').matches ?? false;
  }

  private updateViewportWidth(): void {
    const viewportElement = this.viewport.getElementRef().nativeElement;
    if (viewportElement) {
      const width = viewportElement.clientWidth;
      if (width > 0 && width !== this.viewportWidth()) {
        this.isCalculatingHeights.set(true);
        
        requestAnimationFrame(() => {
          this.viewportWidth.set(width);
        });
      }
    }
  }
}
