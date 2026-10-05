import { AccessibilityInfo } from "react-native";

// Reads a message out to screen readers. VoiceOver doesn't read new text on
// its own, so forms announce what went wrong (or that it worked).
export function announce(message: string | null | undefined): void {
  if (message) AccessibilityInfo.announceForAccessibility(message);
}
