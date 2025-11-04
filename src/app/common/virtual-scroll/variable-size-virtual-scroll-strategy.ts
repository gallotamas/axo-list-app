import { Observable, Subject } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { VirtualScrollStrategy, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { binarySearchIndex } from '@/utils';

export interface ItemWithHeight {
  height: number;
  cumulativeHeight: number; // Sum of this item's height + all previous items' heights
}

/** Virtual scrolling strategy for lists with variable-sized items. */
export class VariableSizeVirtualScrollStrategy implements VirtualScrollStrategy {
  private readonly _scrolledIndexChange = new Subject<number>();

  /** @docs-private Implemented as part of VirtualScrollStrategy. */
  scrolledIndexChange: Observable<number> = this._scrolledIndexChange.pipe(distinctUntilChanged());

  /** The attached viewport. */
  private _viewport: CdkVirtualScrollViewport | null = null;

  /** Array of item heights and cumulative heights */
  private _itemHeights: ItemWithHeight[] = [];

  /** The minimum amount of buffer rendered beyond the viewport (in pixels). */
  private _minBufferPx: number;

  /** The number of buffer items to render beyond the edge of the viewport (in pixels). */
  private _maxBufferPx: number;

  /**
   * @param itemHeights Array of item heights with cumulative heights
   * @param minBufferPx The minimum amount of buffer (in pixels) before needing to render more
   * @param maxBufferPx The amount of buffer (in pixels) to render when rendering more.
   */
  constructor(itemHeights: ItemWithHeight[], minBufferPx: number, maxBufferPx: number) {
    this._itemHeights = itemHeights;
    this._minBufferPx = minBufferPx;
    this._maxBufferPx = maxBufferPx;
  }

  /**
   * Attaches this scroll strategy to a viewport.
   * @param viewport The viewport to attach this strategy to.
   */
  attach(viewport: CdkVirtualScrollViewport) {
    this._viewport = viewport;
    this._updateTotalContentSize();
    this._updateRenderedRange();
  }

  /** Detaches this scroll strategy from the currently attached viewport. */
  detach() {
    this._scrolledIndexChange.complete();
    this._viewport = null;
  }

  /**
   * Update the item heights and buffer size.
   * @param itemHeights Array of item heights with cumulative heights
   * @param minBufferPx The minimum amount of buffer (in pixels) before needing to render more
   * @param maxBufferPx The amount of buffer (in pixels) to render when rendering more.
   */
  updateItemHeightsAndBufferSize(
    itemHeights: ItemWithHeight[],
    minBufferPx: number,
    maxBufferPx: number,
  ) {
    if (maxBufferPx < minBufferPx && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throw Error('CDK virtual scroll: maxBufferPx must be greater than or equal to minBufferPx');
    }

    this._itemHeights = itemHeights;
    this._minBufferPx = minBufferPx;
    this._maxBufferPx = maxBufferPx;

    this._updateTotalContentSize();
    this._updateRenderedRange();
  }

  /** @docs-private Implemented as part of VirtualScrollStrategy. */
  onContentScrolled() {
    this._updateRenderedRange();
  }

  /** @docs-private Implemented as part of VirtualScrollStrategy. */
  onDataLengthChanged() {
    this._updateTotalContentSize();
    this._updateRenderedRange();
  }

  /** @docs-private Implemented as part of VirtualScrollStrategy. */
  onContentRendered() {
    /* no-op */
  }

  /** @docs-private Implemented as part of VirtualScrollStrategy. */
  onRenderedOffsetChanged() {
    /* no-op */
  }

  /**
   * Scroll to the offset for the given index.
   * @param index The index of the element to scroll to.
   * @param behavior The ScrollBehavior to use when scrolling.
   */
  scrollToIndex(index: number, behavior: ScrollBehavior): void {
    if (this._viewport && index >= 0 && index < this._itemHeights.length) {
      const offset = index > 0 ? this._itemHeights[index - 1].cumulativeHeight : 0;
      this._viewport.scrollToOffset(offset, behavior);
    }
  }

  /** Update the viewport's total content size. */
  private _updateTotalContentSize() {
    if (!this._viewport) {
      return;
    }

    const totalHeight = this._itemHeights[this._itemHeights.length - 1]?.cumulativeHeight ?? 0;
    this._viewport.setTotalContentSize(totalHeight);
  }

  /** Find the index of the item at a given scroll position. */
  private _findIndexAtScrollPosition(scrollOffset: number): number {
    if (this._itemHeights.length === 0 || scrollOffset <= 0) {
      return 0;
    }

    const index = binarySearchIndex(
      this._itemHeights,
      scrollOffset,
      (item) => item.cumulativeHeight,
    );

    return index < 0 ? 0 : index;
  }

  /** Update the viewport's rendered range. */
  private _updateRenderedRange() {
    if (!this._viewport || this._itemHeights.length === 0) {
      return;
    }

    const scrollOffset = this._viewport.measureScrollOffset();
    const viewportSize = this._viewport.getViewportSize();
    const dataLength = this._viewport.getDataLength();

    const firstVisibleIndex = this._findIndexAtScrollPosition(scrollOffset);

    const lastScrollPosition = scrollOffset + viewportSize;
    let lastVisibleIndex = this._findIndexAtScrollPosition(scrollOffset);

    // Make sure we include the item that's partially visible at the bottom
    if (
      lastVisibleIndex < dataLength - 1 &&
      this._itemHeights[lastVisibleIndex].cumulativeHeight < lastScrollPosition
    ) {
      lastVisibleIndex++;
    }

    let bufferStartOffset = scrollOffset;
    let bufferEndOffset = lastScrollPosition;

    let startIndex = firstVisibleIndex;
    if (firstVisibleIndex > 0) {
      const firstItemOffset =
        firstVisibleIndex > 0 ? this._itemHeights[firstVisibleIndex - 1].cumulativeHeight : 0;
      const startBuffer = scrollOffset - firstItemOffset;

      if (startBuffer < this._minBufferPx) {
        bufferStartOffset = Math.max(0, scrollOffset - this._maxBufferPx);
        startIndex = this._findIndexAtScrollPosition(bufferStartOffset);
      }
    }

    let endIndex = lastVisibleIndex;
    if (lastVisibleIndex < dataLength - 1) {
      const lastItemEndOffset = this._itemHeights[lastVisibleIndex].cumulativeHeight;
      const endBuffer = lastItemEndOffset - lastScrollPosition;

      if (endBuffer < this._minBufferPx) {
        bufferEndOffset = lastScrollPosition + this._maxBufferPx;
        endIndex = this._findIndexAtScrollPosition(bufferEndOffset);
        endIndex = Math.min(dataLength - 1, endIndex);
      }
    }

    const newRange = { start: startIndex, end: endIndex + 1 };
    this._viewport.setRenderedRange(newRange);

    const renderedContentOffset =
      startIndex > 0 ? this._itemHeights[startIndex - 1].cumulativeHeight : 0;
    this._viewport.setRenderedContentOffset(renderedContentOffset);

    this._scrolledIndexChange.next(firstVisibleIndex);
  }
}
