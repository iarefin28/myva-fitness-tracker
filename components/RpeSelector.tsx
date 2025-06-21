import React, { useState } from "react";
import { LayoutChangeEvent, Text, TouchableOpacity, useColorScheme, View } from "react-native";


// const rpeDescriptions = {
//   1: "Very Light – Barely any effort",
//   2: "Light – Easy pace",
//   3: "Moderate – Comfortable",
//   4: "Somewhat Hard – Slight push",
//   5: "Hard – Steady effort",
//   6: "Challenging – Starting to grind",
//   7: "Very Hard – Struggling a bit",
//   8: "Extremely Hard – Near max",
//   9: "Brutal – One rep left",
//   10: "Max Effort – All out",
// };
const rpeDescriptions = {
  1: "Nothing",
  2: "Very Easy",
  3: "Easy",
  4: "Comfortable",
  5: "Somewhat Difficult",
  6: "Difficult",
  7: "Hard",
  8: "Very Hard",
  9: "Extremely Hard",
  10: "Max Effort - All out"
}

const getRpeColor = (num) => {
  if (num <= 2) return "#4da6ff";
  if (num <= 4) return "#70e000";
  if (num <= 6) return "#ffd700";
  if (num <= 8) return "#ff8800";
  return "#ff4d4d";
};

const RpeSelector = ({ selected, onSelect }) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const numColumns = 5;
  const gap = 8;

  const isDark = useColorScheme() === "dark";

  const containerBg = isDark ? "#1a1a1a" : "#f4f4f4";
  const unselectedButtonBg = isDark ? "#333" : "#ddd";
  const textColor = isDark ? "#fff" : "#000";
  const secondaryTextColor = isDark ? "#bbb" : "#444";
  const defaultInfoBg = isDark ? "#2a2a2a" : "#e6e6e6";

  const onContainerLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  const totalGap = gap * (numColumns - 1);
  const buttonWidth = (containerWidth - totalGap) / numColumns;

  const renderRow = (numbers) => (
    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
      {numbers.map((num) => {
        const isSelected = selected === num;
        return (
          <TouchableOpacity
            key={num}
            onPress={() => onSelect(num)}
            style={{
              width: buttonWidth,
              backgroundColor: isSelected ? getRpeColor(num) : unselectedButtonBg,
              borderRadius: 6,
              paddingVertical: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: isSelected ? "#000" : textColor, fontWeight: "600" }}>{num}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View
      onLayout={onContainerLayout}
      style={{
        padding: 16,
        backgroundColor: containerBg,
        borderRadius: 10,
        width: "100%",
      }}
    >
      {containerWidth > 0 && (
        <>
          {renderRow([1, 2, 3, 4, 5])}
          {renderRow([6, 7, 8, 9, 10])}
        </>
      )}

      {/* RPE Info */}
      <View
        style={{
          backgroundColor: selected ? getRpeColor(selected) : defaultInfoBg,
          padding: 12,
          borderRadius: 8,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: selected ? "#000" : textColor,
            fontWeight: "bold",
            fontSize: 16,
          }}
        >
          RPE: {selected ?? "-"}
        </Text>
        <Text
          style={{
            color: selected ? "#222" : secondaryTextColor,
            marginTop: 4,
            fontSize: 14,
            textAlign: "center",
          }}
        >
          {selected ? rpeDescriptions[selected] : "Select a number to see RPE meaning"}
        </Text>
      </View>
    </View>
  );
};

export default RpeSelector;
