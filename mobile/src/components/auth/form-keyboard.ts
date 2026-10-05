// The arithmetic behind keeping a form field above the keyboard
// (AuthShell). Kept apart from the component so it can be tested directly.

// How much of a view the keyboard covers: the view's bottom edge and the
// keyboard's top edge, both in window coordinates. 0 when the system has
// already made room (Android resizing the window) or the keyboard is lower.
export function keyboardOverlap(viewBottom: number, keyboardTop: number): number {
  return Math.max(0, Math.round(viewBottom - keyboardTop));
}

// The scroll offset that brings the range [top, bottom] (in content
// coordinates) into the visible part of a scroll view, `margin` away from
// its edges, or null when it's already visible. When the range is taller
// than what's visible, its top wins.
export function scrollToReveal({
  top,
  bottom,
  offset,
  visibleHeight,
  margin,
}: {
  top: number;
  bottom: number;
  offset: number;
  visibleHeight: number;
  margin: number;
}): number | null {
  const visibleTop = offset + margin;
  const visibleBottom = offset + visibleHeight - margin;
  if (top < visibleTop) return Math.max(0, top - margin);
  if (bottom > visibleBottom) return Math.max(0, Math.min(top - margin, bottom - visibleHeight + margin));
  return null;
}
