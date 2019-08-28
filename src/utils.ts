export function spliceElement<T>(arr: Array<T>, element: T): void {
  let index: number;
  if ((index = arr.indexOf(element)) !== -1) {
    arr.splice(index, 1);
  }
}

export function isShiftable<T>(arr: Array<T>): arr is ({ shift(): T; } & Array<T>) {
  return !!arr[0];
}
