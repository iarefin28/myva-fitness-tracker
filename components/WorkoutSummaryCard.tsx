import { useTheme } from "@react-navigation/native";
import React from "react";
import { Text, TouchableOpacity, View, ViewStyle, useColorScheme } from "react-native";

export type MetricItem = {
  label: string;
  value: string | number | React.ReactNode;
  flex?: number;          // default 1
};

type Props = {
  title: string;
  rightText?: string;     // e.g., "Used 3×", "Sep 6", "Today 5:30p"
  items: MetricItem[];    // 3–4 small metrics (Exercises, Sets, Duration, etc.)
  onPress?: () => void;
  onLongPress?: () => void;
  style?: ViewStyle;
  testID?: string;
};

export const formatHM = (sec?: number | string) => {
  const total = Number(sec || 0);
  const minutes = Math.floor(total / 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
};

export const WorkoutSummaryCard: React.FC<Props> = ({
  title,
  rightText,
  items,
  onPress,
  onLongPress,
  style,
  testID,
}) => {
  const scheme = useColorScheme();
  const { colors } = useTheme();

  const backgroundColor = scheme === "dark" ? "#000" : "#fff";
  const textColor = colors.text;
  const cardColor = scheme === "dark" ? "#1e1e1e" : "#f2f2f2";
  const dividerColor = scheme === "dark" ? "#222" : "#eee";
  const labelColor = scheme === "dark" ? "#9ca3af" : "#6b7280";

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      testID={testID}
      style={[
        {
          backgroundColor: cardColor,
          padding: 16,
          borderRadius: 12,
          marginBottom: 15,
          elevation: 3,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
        },
        style,
      ]}
    >
      {/* Header: title (left) + right text (right) */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 20, fontWeight: "bold", color: textColor, flexShrink: 1 }}>
          {title}
        </Text>
        {!!rightText && (
          <Text style={{ fontSize: 20, fontWeight: "bold", color: textColor, marginLeft: 8 }}>
            {rightText}
          </Text>
        )}
      </View>

      {/* Divider */}
      <View
        style={{
          height: 1,
          backgroundColor: dividerColor,
          marginTop: 8,
          marginBottom: 8,
          opacity: scheme === "dark" ? 0.7 : 1,
        }}
      />

      {/* Stat row */}
      <View style={{ marginTop: 10, flexDirection: "row" }}>
        {items.map((it, i) => (
          <View key={i} style={{ flex: it.flex ?? 1, paddingHorizontal: 3 }}>
            <Text style={{ color: labelColor, fontSize: 12 }}>{it.label}</Text>
            <Text style={{ color: textColor, fontSize: 16, fontWeight: "700" }}>
              {it.value}
            </Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
};