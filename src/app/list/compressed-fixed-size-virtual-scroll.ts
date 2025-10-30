import { coerceNumberProperty, NumberInput } from '@angular/cdk/coercion';
import { Directive, forwardRef, Input, OnChanges } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import {
  VIRTUAL_SCROLL_STRATEGY,
  VirtualScrollStrategy,
  CdkVirtualScrollViewport,
} from '@angular/cdk/scrolling';

/** Virtual scrolling strategy for lists with items of known fixed size. */
export class CompressedFixedSizeVirtualScrollStrategy implements VirtualScrollStrategy {
  private readonly _scrolledIndexChange = new Subject<number>();

  /** @docs-private Implemented as part of VirtualScrollStrategy. */
  scrolledIndexChange: Observable<number> = this._scrolledIndexChange.pipe(distinctUntilChanged());

  /** The attached viewport. */
  private _viewport: CdkVirtualScrollViewport | null = null;

  /** The size of the items in the virtually scrolling list. */
  private _itemSize: number;

  /** The minimum amount of buffer rendered beyond the viewport (in pixels). */
  private _minBufferPx: number;

  /** The number of buffer items to render beyond the edge of the viewport (in pixels). */
  private _maxBufferPx: number;

  /** The maximum browser element height in pixels. */
  private _maxBrowserElementHeight = 10_000_000; // safe browser element height limit, should be less than 16,777,216px

  /** The total size of the virtual list in pixels. */
  private _virtualTotalSize: number;

  /** The total size of the compressed list in pixels. */
  private _compressedTotalSize: number;

  /** The compression ratio of the virtual list to the compressed list. */
  private _compressionRatio: number;

  /**
   * @param itemSize The size of the items in the virtually scrolling list.
   * @param minBufferPx The minimum amount of buffer (in pixels) before needing to render more
   * @param maxBufferPx The amount of buffer (in pixels) to render when rendering more.
   */
  constructor(itemSize: number, minBufferPx: number, maxBufferPx: number) {
    this._itemSize = itemSize;
    this._minBufferPx = minBufferPx;
    this._maxBufferPx = maxBufferPx;

    this._virtualTotalSize = 0; // will be updated when the viewport is attached
    this._compressionRatio = 1; // will be updated when the viewport is attached
    this._compressedTotalSize = this._maxBrowserElementHeight;
  }

  /**
   * Attaches this scroll strategy to a viewport.
   * @param viewport The viewport to attach this strategy to.
   */
  attach(viewport: CdkVirtualScrollViewport) {
    this._viewport = viewport;
    this._updateVirtualMetrics();
    this._updateTotalContentSize();
    this._updateRenderedRange();
  }

  /** Detaches this scroll strategy from the currently attached viewport. */
  detach() {
    this._scrolledIndexChange.complete();
    this._viewport = null;
  }

  /**
   * Update the item size and buffer size.
   * @param itemSize The size of the items in the virtually scrolling list.
   * @param minBufferPx The minimum amount of buffer (in pixels) before needing to render more
   * @param maxBufferPx The amount of buffer (in pixels) to render when rendering more.
   */
  updateItemAndBufferSize(itemSize: number, minBufferPx: number, maxBufferPx: number) {
    if (maxBufferPx < minBufferPx && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throw Error('CDK virtual scroll: maxBufferPx must be greater than or equal to minBufferPx');
    }
    this._itemSize = itemSize;
    this._minBufferPx = minBufferPx;
    this._maxBufferPx = maxBufferPx;
    this._updateVirtualMetrics();
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
    if (this._viewport) {
      const virtualOffset = index * this._itemSize;
      const compressedOffset = this._virtualToCompressedPosition(virtualOffset);
      this._viewport.scrollToOffset(compressedOffset, behavior);
    }
  }

  /** Update the viewport's total content size. */
  private _updateTotalContentSize() {
    if (!this._viewport) {
      return;
    }

    this._viewport.setTotalContentSize(this._compressedTotalSize);
  }

  /** Update the viewport's rendered range. */
  private _updateRenderedRange() {
    if (!this._viewport) {
      return;
    }

    const renderedRange = this._viewport.getRenderedRange();
    const newRange = { start: renderedRange.start, end: renderedRange.end };
    const viewportSize = this._viewport.getViewportSize();
    const dataLength = this._viewport.getDataLength();
    let scrollOffset = this._viewport.measureScrollOffset();
    let virtualScrollOffset = this._compressedToVirtualPosition(scrollOffset);
    // Prevent NaN as result when dividing by zero.
    let firstVisibleIndex = this._itemSize > 0 ? virtualScrollOffset / this._itemSize : 0;

    // If user scrolls to the bottom of the list and data changes to a smaller list
    if (newRange.end > dataLength) {
      // We have to recalculate the first visible index based on new data length and viewport size.
      const maxVisibleItems = Math.ceil(viewportSize / this._itemSize);
      const newVisibleIndex = Math.max(
        0,
        Math.min(firstVisibleIndex, dataLength - maxVisibleItems)
      );

      // If first visible index changed we must update scroll offset to handle start/end buffers
      // Current range must also be adjusted to cover the new position (bottom of new list).
      if (firstVisibleIndex != newVisibleIndex) {
        firstVisibleIndex = newVisibleIndex;
        scrollOffset = newVisibleIndex * this._itemSize;
        virtualScrollOffset = this._compressedToVirtualPosition(scrollOffset);
        newRange.start = Math.floor(firstVisibleIndex);
      }

      newRange.end = Math.max(0, Math.min(dataLength, newRange.start + maxVisibleItems));
    }

    const startBuffer = virtualScrollOffset - newRange.start * this._itemSize;
    if (startBuffer < this._minBufferPx && newRange.start != 0) {
      const expandStart = Math.ceil((this._maxBufferPx - startBuffer) / this._itemSize);
      newRange.start = Math.max(0, newRange.start - expandStart);
      newRange.end = Math.min(
        dataLength,
        Math.ceil(firstVisibleIndex + this._compressedToVirtualPosition((viewportSize + this._minBufferPx) / this._itemSize))
      );
    } else {
      const endBuffer = newRange.end * this._itemSize - (virtualScrollOffset + viewportSize);
      if (endBuffer < this._minBufferPx && newRange.end != dataLength) {
        const expandEnd = Math.ceil((this._maxBufferPx - endBuffer) / this._itemSize);
        if (expandEnd > 0) {
          newRange.end = Math.min(dataLength, newRange.end + expandEnd);
          newRange.start = Math.max(
            0,
            Math.floor(firstVisibleIndex - this._compressedToVirtualPosition((this._minBufferPx / this._itemSize)))
          );
        }
      }
    }

    this._viewport.setRenderedRange(newRange);
    const renderedContentOffset = this._virtualToCompressedPosition(newRange.start * this._itemSize);
    this._viewport.setRenderedContentOffset(Math.round(renderedContentOffset));
    this._scrolledIndexChange.next(Math.floor(this._virtualToCompressedPosition(firstVisibleIndex)));
  }

  /** Update the total size of the virtual list. */
  private _updateVirtualMetrics() {
    if (!this._viewport) {
      return;
    }
    this._virtualTotalSize = this._viewport.getDataLength() * this._itemSize;
    this._compressionRatio = this._virtualTotalSize / this._compressedTotalSize;
  }

  /** Convert compressed position to virtual position */
  private _compressedToVirtualPosition(compressedPos: number): number {
    return compressedPos * this._compressionRatio;
  }

  /** Convert virtual position to compressed position */
  private _virtualToCompressedPosition(virtualPos: number): number {
    return virtualPos / this._compressionRatio;
  }
}

/**
 * Provider factory for `CompressedFixedSizeVirtualScrollStrategy` that simply extracts the already created
 * `CompressedFixedSizeVirtualScrollStrategy` from the given directive.
 * @param compressedFixedSizeDir The instance of `CdkCompressedFixedSizeVirtualScroll` to extract the
 *     `CompressedFixedSizeVirtualScrollStrategy` from.
 */
export function _compressedFixedSizeVirtualScrollStrategyFactory(
  compressedFixedSizeDir: CdkCompressedFixedSizeVirtualScroll
) {
  return compressedFixedSizeDir._scrollStrategy;
}

/** A virtual scroll strategy that supports fixed-size items without browser height limits. */
@Directive({
  selector: 'cdk-virtual-scroll-viewport[newItemSize]',
  providers: [
    {
      provide: VIRTUAL_SCROLL_STRATEGY,
      useFactory: _compressedFixedSizeVirtualScrollStrategyFactory,
      deps: [forwardRef(() => CdkCompressedFixedSizeVirtualScroll)],
    },
  ],
})
export class CdkCompressedFixedSizeVirtualScroll implements OnChanges {
  /** The size of the items in the list (in pixels). */
  @Input()
  get newItemSize(): number {
    return this._newItemSize;
  }
  set newItemSize(value: NumberInput) {
    this._newItemSize = coerceNumberProperty(value);
  }
  _newItemSize = 20;

  /**
   * The minimum amount of buffer rendered beyond the viewport (in pixels).
   * If the amount of buffer dips below this number, more items will be rendered. Defaults to 100px.
   */
  @Input()
  get minBufferPx(): number {
    return this._minBufferPx;
  }
  set minBufferPx(value: NumberInput) {
    this._minBufferPx = coerceNumberProperty(value);
  }
  _minBufferPx = 100;

  /**
   * The number of pixels worth of buffer to render for when rendering new items. Defaults to 200px.
   */
  @Input()
  get maxBufferPx(): number {
    return this._maxBufferPx;
  }
  set maxBufferPx(value: NumberInput) {
    this._maxBufferPx = coerceNumberProperty(value);
  }
  _maxBufferPx = 200;

  /** The scroll strategy used by this directive. */
  _scrollStrategy = new CompressedFixedSizeVirtualScrollStrategy(
    this.newItemSize,
    this.minBufferPx,
    this.maxBufferPx
  );

  ngOnChanges() {
    this._scrollStrategy.updateItemAndBufferSize(this.newItemSize, this.minBufferPx, this.maxBufferPx);
  }
}
