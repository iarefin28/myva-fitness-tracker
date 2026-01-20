import { Platform } from "react-native";

export const fontFamilies = {
  base: Platform.select({
    ios: "AvenirNext-Regular",
    android: "sans-serif",
    default: "System",
  }),
  medium: Platform.select({
    ios: "AvenirNext-Medium",
    android: "sans-serif-medium",
    default: "System",
  }),
  semiBold: Platform.select({
    ios: "AvenirNext-DemiBold",
    android: "sans-serif-medium",
    default: "System",
  }),
  mono: Platform.select({
    ios: "Menlo",
    android: "monospace",
    default: "monospace",
  }),
};

export const typography = {
  body: { fontFamily: fontFamilies.base },
  label: { fontFamily: fontFamilies.medium },
  button: { fontFamily: fontFamilies.semiBold, letterSpacing: 0.3 },
  mono: { fontFamily: fontFamilies.mono },
};
