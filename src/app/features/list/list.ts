import {
  ChangeDetectionStrategy,
  Component,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  inject,
  computed,
  signal,
  effect,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { BreakpointObserver } from '@angular/cdk/layout';
import { OverlayScrollbarsDirective, OverlayscrollbarsModule } from 'overlayscrollbars-ngx';
import type { PartialOptions } from 'overlayscrollbars';
import { ItemWithHeight, TextMeasurementService, VariableSizeVirtualScroll } from '@/common';
import { ListItem } from './list-item/list-item';
import { ScrollControls } from './scroll-controls/scroll-controls';
import { OverlayLoader } from './overlay-loader/overlay-loader';
import { LOG_DATA, type LogEntryWithId } from '@/data';
import { debounceTime, Subject, takeUntil, map } from 'rxjs';
import {
  TEXT_STYLE,
  HORIZONTAL_PADDING,
  VERTICAL_PADDING,
  BORDER,
  LINE_HEIGHT,
  INDEX_COLUMN_WIDTH,
  TIMESTAMP_COLUMN_WIDTH,
  GAP,
} from './common/constants';

@Component({
  selector: 'axo-list',
  templateUrl: './list.html',
  styles: `
    .list-item {
      padding: ${VERTICAL_PADDING}px ${HORIZONTAL_PADDING}px;
      border-bottom: ${BORDER}px dotted var(--mat-sys-outline);
      line-height: ${LINE_HEIGHT}px;
    }
  `,
  styleUrl: './list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    VariableSizeVirtualScroll,
    ScrollingModule,
    OverlayscrollbarsModule,
    ListItem,
    ScrollControls,
    OverlayLoader,
  ],
})
export class List implements AfterViewInit, OnDestroy {
  @ViewChild(CdkVirtualScrollViewport)
  private viewport!: CdkVirtualScrollViewport;

  @ViewChild('osTarget', { read: OverlayScrollbarsDirective })
  private osDirective!: OverlayScrollbarsDirective;

  @ViewChild('osTarget', { read: ElementRef })
  protected osTargetRef!: ElementRef<HTMLElement>;

  private textMeasurementService = inject(TextMeasurementService);
  private resizeSubject$ = new Subject<ResizeObserverEntry>();
  private resizeObserver?: ResizeObserver;
  private viewportWidth = signal<number>(800);
  private breakpointObserver = inject(BreakpointObserver);
  private destroy$ = new Subject<void>();

  private isDarkMode = toSignal(
    this.breakpointObserver
      .observe('(prefers-color-scheme: dark)')
      .pipe(map((result) => result.matches)),
    { requireSync: true },
  );

  protected isCalculatingHeights = signal<boolean>(false);

  overlayScrollbarsOptions: PartialOptions;

  items: LogEntryWithId[] = Array.from({ length: 1000000 }).map((_, i) => ({
    id: i,
    ...LOG_DATA[Math.floor(Math.random() * LOG_DATA.length)],
  }));

  itemHeights = computed<ItemWithHeight[]>(() => {
    const startTime = performance.now();

    const heights: ItemWithHeight[] = [];

    const viewportWidth = this.viewportWidth();
    const textWidth = Math.floor(
      viewportWidth -
        HORIZONTAL_PADDING * 2 -
        INDEX_COLUMN_WIDTH -
        TIMESTAMP_COLUMN_WIDTH -
        GAP * 2,
    );

    let cumulativeHeight = 0;
    for (const item of this.items) {
      const numberOfLines = this.textMeasurementService.getNumberOfLines(
        item.message,
        textWidth,
        TEXT_STYLE,
      );

      const itemHeight = numberOfLines * LINE_HEIGHT + VERTICAL_PADDING * 2 + BORDER;
      cumulativeHeight += itemHeight;

      heights.push({
        height: itemHeight,
        cumulativeHeight: cumulativeHeight,
      });
    }

    const endTime = performance.now();
    console.debug(`itemHeights calculation took ${endTime - startTime} milliseconds`);

    return heights;
  });

  constructor() {
    const createOverlayScrollbarsOptions: (isDarkMode: boolean) => PartialOptions = (
      isDarkMode,
    ) => {
      return {
        scrollbars: {
          autoHide: 'scroll',
          theme: isDarkMode ? 'os-theme-light' : 'os-theme-dark',
        },
      };
    };

    this.overlayScrollbarsOptions = createOverlayScrollbarsOptions(this.isDarkMode());

    // Update scrollbar theme when system theme changes
    effect(() => {
      const isDarkMode = this.isDarkMode();
      this.osDirective?.osInstance()?.options(createOverlayScrollbarsOptions(isDarkMode));
    });

    // Wait for the itemHeights to be calculated before hiding the loader
    effect(() => {
      // Access itemHeights to make this effect depend on it
      this.itemHeights();

      setTimeout(() => {
        this.isCalculatingHeights.set(false);
      }, 0);
    });

    this.resizeSubject$.pipe(debounceTime(300), takeUntil(this.destroy$)).subscribe(() => {
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
        },
      });
    }

    this.isCalculatingHeights.set(true);
    requestAnimationFrame(() => {
      this.updateViewportWidth();
    });

    if (targetElm) {
      const resizeObserver = new ResizeObserver((entries) => {
        this.resizeSubject$.next(entries[0]);
      });
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
