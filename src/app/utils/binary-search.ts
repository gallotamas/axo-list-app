/**
 * Generic binary search that returns the index of the first element whose numeric value
 * is strictly greater than the provided targetValue.
 *
 * If no such element exists, it returns the last valid index.
 * If the array is empty, it returns -1.
 *
 * @param array - The array to search in.
 * @param targetValue - The value to search for.
 * @param selector - A function that returns the numeric value of the item.
 * @returns The index of the first element whose numeric value is strictly greater than the provided targetValue.
 */
export function binarySearchIndex<T>(
  array: readonly T[],
  targetValue: number,
  selector: (item: T) => number,
): number {
  const length = array.length;
  if (length === 0) {
    return -1;
  }

  // Find the first index where selector(value) > targetValue
  let left = 0;
  let right = length;

  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    const midValue = selector(array[mid]);

    if (midValue <= targetValue) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }

  // If left === length, there is no value greater than target so return the last index
  return left < length ? left : length - 1;
}
