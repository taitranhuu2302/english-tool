/** macOS `activate` can fire when a window hides; skip `showMain()` briefly after quick dismiss. */
let suppressUntil = 0;

export function suppressMainOnActivateFor(ms: number): void {
  suppressUntil = Date.now() + ms;
}

export function shouldSuppressMainOnActivate(): boolean {
  return Date.now() < suppressUntil;
}
