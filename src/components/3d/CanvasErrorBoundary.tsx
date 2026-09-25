"use client";

import { Component, type ReactNode } from "react";

// If the WebGL context can't be created (blocked GPU, driver crash, context
// loss during init), render the static fallback instead of breaking the page.
export class CanvasErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("[3d] scene failed, showing static fallback:", error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
