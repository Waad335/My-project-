import { Platform, type TextStyle } from "react-native";

// Content that always reads left to right, even in Arabic: email addresses,
// phone numbers and sizes such as "20ml" (the website marks them dir="ltr").
// iOS and Android mirror "left" and "right" in a right-to-left layout unless
// the element itself is laid out left to right (`direction`); the web
// preview uses `writingDirection` (CSS direction) instead.
export const leftToRight: TextStyle =
  Platform.OS === "web"
    ? { writingDirection: "ltr", textAlign: "left" }
    : { direction: "ltr", writingDirection: "ltr", textAlign: "left" };
