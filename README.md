# AxoListApp

A high-performance Angular application demonstrating how to efficiently render and interact with a list containing **1 million items** with variable content sizes while maintaining optimal performance.

## Overview

This project showcases a virtual scrolling technique using Angular CDK to handle extremely large datasets. The implementation focuses on:

- **Variable content sizing**: List items can have different heights
- **Optimal performance**: Smooth scrolling and rendering even with 1M+ items
- **Memory efficiency**: Only visible items are rendered in the DOM
- **Custom virtual scroll strategy**: Implements a custom scrolling strategy to handle variable-sized content

## How It Works

The implementation uses virtual scrolling that only renders the currently visible rows, plus a buffer of rows before and after the visible area. The viewport height is set to the total height of all rows as if they were fully rendered, which automatically adjusts the scrollbar to the appropriate size and ensures the scrollbar position accurately represents the actual position within the list.

This application can handle list items with variable sizes, which is not very common — most virtual scrolling implementations only support fixed-size items (e.g. the angular cdk has an experimental auto size virtual scrolling strategy but that's not ready for production use). To achieve this, the implementation uses a specific constraint on content styling: any text that can wrap into multiple lines must use a monospaced font (the specific font doesn't matter, as long as it's monospaced).

With monospaced fonts, we can calculate the required space for text content without actually rendering it. We only need to measure a single character once to determine its dimensions. Once we have the item heights calculated for all rows, the custom virtual scroll strategy can quickly calculate the precise location of each row, enabling smooth and efficient scrolling through the entire dataset.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start a local development server:
```bash
npm start
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`.

## Testing
Run unit tests with Karma test runner
```bash
npm test
```

## Known Issues

### Firefox Compatibility

Virtual scrolling currently does not work properly in Firefox. The browser displays the scrollbar as if only the already-loaded items are available, making it impossible to scroll through the entire list.

**Workaround**: Please use Chrome or Safari, both of which have been tested and work correctly.

### Browser Maximum Element Height Limitation

There is a fundamental browser limitation on the maximum height of DOM elements, which varies by browser but is typically around **16 million pixels** at the lowest. This constraint affects how many items can be displayed in a virtually scrolled list.

The number of list elements that can be successfully displayed depends on:
- The browser being used
- The viewport size
- The average height of list items

To work around this limitation, a complex modification to the virtual scroll strategy would be required. While there are implementations that attempt to solve this (such as [this approach](https://medium.com/@manju_reddys/rendering-array-of-billion-of-records-at-60-f-s-in-angular-or-vanilla-js-2613e5983a10)), they are not perfect and they might be even more complex for variable row sizes. For example in the referenced implementation the list is sometimes jumpinging thousands of lines during rapid scrolling.
