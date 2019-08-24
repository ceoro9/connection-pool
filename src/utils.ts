export function spliceElement<T>(arr: Array<T>, element: T) {
  let index: number;
  if ((index = arr.indexOf(element)) !== -1) {
    arr.splice(index, 1);
  }
}
