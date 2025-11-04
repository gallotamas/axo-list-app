import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { TextMeasurementService } from './text-measurement-service';
import type { TextStyle } from '@/types';

describe('TextMeasurementService', () => {
  let service: TextMeasurementService;
  const defaultStyle: TextStyle = {
    fontFamily: 'monospace',
    fontSize: '14px',
    fontWeight: 'normal',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    service = TestBed.inject(TextMeasurementService);
  });

  afterEach(() => {
    service.destroy();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getNumberOfLines', () => {
    it('should return 1 for single line text that fits', () => {
      const text = 'Hello';
      const containerWidth = 1000;
      const lines = service.getNumberOfLines(text, containerWidth, defaultStyle);
      expect(lines).toBe(1);
    });

    it('should return 1 for empty text', () => {
      const text = '';
      const containerWidth = 1000;
      const lines = service.getNumberOfLines(text, containerWidth, defaultStyle);
      expect(lines).toBe(1);
    });

    it('should count explicit line breaks', () => {
      const text = 'Line 1\nLine 2\nLine 3';
      const containerWidth = 1000;
      const lines = service.getNumberOfLines(text, containerWidth, defaultStyle);
      expect(lines).toBe(3);
    });

    it('should count empty lines from line breaks', () => {
      const text = 'Line 1\n\nLine 3';
      const containerWidth = 1000;
      const lines = service.getNumberOfLines(text, containerWidth, defaultStyle);
      expect(lines).toBe(3);
    });

    it('should wrap text when it exceeds container width', () => {
      const text = 'This is a very long text that should wrap to multiple lines';
      const containerWidth = 100;
      const lines = service.getNumberOfLines(text, containerWidth, defaultStyle);
      expect(lines).toBeGreaterThan(1);
    });

    it('should handle long words that exceed line width', () => {
      const text = 'verylongwordthatexceedsthecontainerwidthandneedstobesplitnormally';
      const containerWidth = 100;
      const lines = service.getNumberOfLines(text, containerWidth, defaultStyle);
      expect(lines).toBeGreaterThan(1);
    });

    it('should handle long word with text on current line', () => {
      const text = 'Short verylongwordthatexceedsthecontainerwidthandneedstobesplitnormally';
      const containerWidth = 100;
      const lines = service.getNumberOfLines(text, containerWidth, defaultStyle);
      expect(lines).toBeGreaterThan(2);
    });

    it('should return 1 when containerWidth is 0 or negative', () => {
      const text = 'Hello';
      const lines = service.getNumberOfLines(text, 0, defaultStyle);
      expect(lines).toBe(1);

      const linesNegative = service.getNumberOfLines(text, -10, defaultStyle);
      expect(linesNegative).toBe(1);
    });

    it('should handle text with multiple spaces', () => {
      const text = 'Hello     World';
      const containerWidth = 1000;
      const lines = service.getNumberOfLines(text, containerWidth, defaultStyle);
      expect(lines).toBe(1);
    });

    it('should handle mixed line breaks and wrapping', () => {
      const text =
        'Short line\nThis is a very long text that should wrap to multiple lines when it exceeds the container width';
      const containerWidth = 150;
      const lines = service.getNumberOfLines(text, containerWidth, defaultStyle);
      expect(lines).toBeGreaterThan(2);
    });
  });

  describe('calculateItemHeight', () => {
    it('should calculate height for single line text', () => {
      const text = 'Hello';
      const width = 1000;
      const lineHeight = 20;
      const height = service.calculateItemHeight(text, width, defaultStyle, lineHeight);
      expect(height).toBe(20); // 1 line * 20px
    });

    it('should include vertical padding in height calculation', () => {
      const text = 'Hello';
      const width = 1000;
      const lineHeight = 20;
      const verticalPadding = 10;
      const height = service.calculateItemHeight(
        text,
        width,
        defaultStyle,
        lineHeight,
        verticalPadding,
      );
      expect(height).toBe(30); // 1 line * 20px + 10px padding
    });

    it('should include border height in calculation', () => {
      const text = 'Hello';
      const width = 1000;
      const lineHeight = 20;
      const verticalPadding = 10;
      const borderHeight = 2;
      const height = service.calculateItemHeight(
        text,
        width,
        defaultStyle,
        lineHeight,
        verticalPadding,
        borderHeight,
      );
      expect(height).toBe(32); // 1 line * 20px + 10px padding + 2px border
    });

    it('should calculate height for multi-line text', () => {
      const text = 'Line 1\nLine 2\nLine 3';
      const width = 1000;
      const lineHeight = 20;
      const height = service.calculateItemHeight(text, width, defaultStyle, lineHeight);
      expect(height).toBe(60); // 3 lines * 20px
    });

    it('should calculate height with all parameters', () => {
      const text = 'Line 1\nLine 2';
      const width = 1000;
      const lineHeight = 18;
      const verticalPadding = 16;
      const borderHeight = 4;
      const height = service.calculateItemHeight(
        text,
        width,
        defaultStyle,
        lineHeight,
        verticalPadding,
        borderHeight,
      );
      expect(height).toBe(56); // 2 lines * 18px + 16px padding + 4px border
    });
  });
});
