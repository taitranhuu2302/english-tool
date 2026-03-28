/** Set from `before-quit` so main `close` can allow real shutdown instead of only hiding. */
let appQuitting = false;

export function setAppQuitting(value: boolean): void {
  appQuitting = value;
}

export function isAppQuitting(): boolean {
  return appQuitting;
}
