import { createContext, useContext } from "react";
import type { View } from "react-native";

// Anything on screen that can be measured: a field, a button's wrapper.
export type Measurable = Pick<View, "measureLayout">;

// Lets text fields ask the form around them (AuthShell) to keep them, and
// optionally everything down to `until` (the submit button), above the
// keyboard. Outside such a form it's null and fields do nothing extra.
export type FormScroll = { onFieldFocus: (field: Measurable | null, until?: Measurable | null) => void };
export const FormScrollContext = createContext<FormScroll | null>(null);
export const useFormScroll = () => useContext(FormScrollContext);
