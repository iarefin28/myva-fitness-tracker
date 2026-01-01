import React, { PropsWithChildren, memo } from "react";
import { StyleProp, View, ViewStyle, useColorScheme } from "react-native";

export type SectionCardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  colors?: {
    cardColor?: string;
    borderColor?: string;
    dividerColor?: string; // not used here but handy to pass through
  };
}>;

function SectionCard({ children, style, colors }: SectionCardProps) {
  const scheme = useColorScheme();
  const cardColor   = colors?.cardColor   ?? (scheme === "dark" ? "#0b0b0b" : "#f5f5f5");
  const borderColor = colors?.borderColor ?? (scheme === "dark" ? "#262626" : "#e5e7eb");

  return (
    <View
      style={[
        {
          backgroundColor: cardColor, // “black overlay” in dark mode
          borderRadius: 12,
          borderWidth: 1,
          borderColor,
          padding: 14,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export default memo(SectionCard);