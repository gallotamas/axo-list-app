import { Directive, forwardRef, Input, OnChanges } from '@angular/core';
import { coerceNumberProperty, NumberInput } from '@angular/cdk/coercion';
import { VIRTUAL_SCROLL_STRATEGY } from '@angular/cdk/scrolling';
import {
  VariableSizeVirtualScrollStrategy,
  ItemWithHeight,
} from './variable-size-virtual-scroll-strategy';

/**
 * Provider factory for `VariableSizeVirtualScrollStrategy` that simply extracts the already created
 * `VariableSizeVirtualScrollStrategy` from the given directive.
 * @param variableSizeDir The instance of `VariableSizeVirtualScroll` to extract the
 *     `VariableSizeVirtualScrollStrategy` from.
 */
export function _variableSizeVirtualScrollStrategyFactory(
  variableSizeDir: VariableSizeVirtualScroll,
) {
  return variableSizeDir._scrollStrategy;
}

/** A virtual scroll strategy that supports variable-sized items. */
@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector -- This will be used over the cdk-virtual-scroll-viewport component
  selector: 'cdk-virtual-scroll-viewport[variableItemHeights]',
  providers: [
    {
      provide: VIRTUAL_SCROLL_STRATEGY,
      useFactory: _variableSizeVirtualScrollStrategyFactory,
      deps: [forwardRef(() => VariableSizeVirtualScroll)],
    },
  ],
})
export class VariableSizeVirtualScroll implements OnChanges {
  /** Array of item heights with cumulative heights */
  @Input()
  get variableItemHeights(): ItemWithHeight[] {
    return this._variableItemHeights;
  }
  set variableItemHeights(value: ItemWithHeight[]) {
    this._variableItemHeights = value || [];
  }
  private _variableItemHeights: ItemWithHeight[] = [];

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
  private _minBufferPx = 100;

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
  private _maxBufferPx = 200;

  /** The scroll strategy used by this directive. */
  _scrollStrategy = new VariableSizeVirtualScrollStrategy(
    this.variableItemHeights,
    this.minBufferPx,
    this.maxBufferPx,
  );

  ngOnChanges() {
    this._scrollStrategy.updateItemHeightsAndBufferSize(
      this.variableItemHeights,
      this.minBufferPx,
      this.maxBufferPx,
    );
  }
}
