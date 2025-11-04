import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { kebabCase } from 'lodash-es';
import type { TextStyle } from '@/types';

const MEASUREMENT_BASE_STYLES: Partial<CSSStyleDeclaration> = {
  position: 'absolute',
  top: '-9999px',
  left: '-9999px',
  visibility: 'hidden',
  whiteSpace: 'pre', // Preserve spaces for monospace
  display: 'inline-block',
  padding: '0',
  margin: '0',
  border: '0',
};

/**
 * Service to measure the width and height of text with monospaced font
 */
@Injectable({
  providedIn: 'root',
})
export class TextMeasurementService {
  /**
   * The document object
   */
  private document = inject<Document>(DOCUMENT);

  /**
   * Cache of measured character widths by text style
   */
  private cache: Record<string, number> = {};

  /**
   * Hidden element for measuring text width and height
   */
  private measurementElement!: HTMLElement;

  /**
   * Flag to indicate whether the measurement element has been initialized
   */
  private initialized = false;

  private initialize(): void {
    if (this.initialized) return;

    // Create a hidden element for measurement
    this.measurementElement = this.document.createElement('div');
    Object.assign(this.measurementElement.style, MEASUREMENT_BASE_STYLES);
    this.document.body.appendChild(this.measurementElement);
    this.initialized = true;
  }

  private applyTextStyles(styles: TextStyle): void {
    Object.entries(styles).forEach(([key, value]) => {
      const kebabKey = kebabCase(key);
      this.measurementElement.style.setProperty(kebabKey, value);
    });
  }

  private getCharWidth(style: TextStyle): number {
    const cacheKey = JSON.stringify(style);
    if (this.cache[cacheKey]) {
      return this.cache[cacheKey];
    }

    this.initialize();
    Object.assign(this.measurementElement.style, MEASUREMENT_BASE_STYLES);
    this.applyTextStyles(style);

    this.measurementElement.textContent = 'A';
    const width = this.measurementElement.getBoundingClientRect().width;

    this.cache[cacheKey] = width;
    return width;
  }

  getNumberOfLines(text: string, containerWidth: number, style: TextStyle): number {
    const charWidth = this.getCharWidth(style);
    const maxCharsPerLine = Math.floor(containerWidth / charWidth);

    if (maxCharsPerLine <= 0) {
      return 1;
    }

    // Split by explicit line breaks
    const lines = text.split('\n');
    let totalLines = 0;

    for (const line of lines) {
      // Empty lines count as one line
      if (line.length === 0) {
        totalLines += 1;
        continue;
      }

      const words = line.split(' ');
      let currentLineLength = 0;
      let lineCount = 1;
      // Iterate through words and check if they fit on the current line
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const wordLength = word.length;
        // Add space back before word (except first word)
        const spaceLength = i === 0 ? 0 : 1;

        // Check if word itself exceeds line limit
        if (wordLength > maxCharsPerLine) {
          // If there's content on current line, start a new line
          if (currentLineLength > 0) {
            lineCount++;
            currentLineLength = 0;
          }

          // Split the long word across multiple lines
          const additionalLines = Math.ceil(wordLength / maxCharsPerLine);
          lineCount += additionalLines - 1;

          // Set current line length to the remainder of the split word
          currentLineLength = wordLength % maxCharsPerLine || maxCharsPerLine;
        } else if (currentLineLength + spaceLength + wordLength > maxCharsPerLine) {
          // Word doesn't fit on current line, start new line
          lineCount++;
          currentLineLength = wordLength;
        } else {
          // Word fits on current line
          currentLineLength += spaceLength + wordLength;
        }
      }

      totalLines += lineCount;
    }

    return totalLines;
  }

  calculateItemHeight(
    text: string,
    width: number,
    style: TextStyle,
    lineHeight: number,
    verticalPadding = 0,
    borderHeight = 0,
  ): number {
    const numberOfLines = this.getNumberOfLines(text, width, style);
    return numberOfLines * lineHeight + verticalPadding + borderHeight;
  }

  destroy(): void {
    if (this.initialized && this.measurementElement) {
      this.document.body.removeChild(this.measurementElement);
      this.initialized = false;
    }
  }
}
