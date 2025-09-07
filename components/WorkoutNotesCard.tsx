import { Ionicons } from "@expo/vector-icons";
import React, { memo, useState } from "react";
import { StyleProp, Text, TouchableOpacity, useColorScheme, View, ViewStyle } from "react-native";

export type WorkoutNotesCardProps = {
  pre?: string | null;           // preWorkoutNote
  post?: string | null;          // postWorkoutNote
  legacy?: string | null;        // optional (fallback when pre/post aren't present)

  // Dates: pass either per-note dates, or a single workout date for both
  workoutDateISO?: string | null;
  preDateISO?: string | null;
  postDateISO?: string | null;

  // Signature
  authorName?: string;           // defaults to "Ishan Arefin"

  // Optional theme overrides from parent screen
  colors?: {
    textColor?: string;
    subTextColor?: string;
    cardColor?: string;
    dividerColor?: string;
    borderColor?: string;
  };

  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const hasText = (s?: string | null) => !!s && typeof s === "string" && s.trim().length > 0;

const formatDate = (iso?: string | null) => {
  try {
    const d = iso ? new Date(iso) : new Date();
    // Example: Sep 7, 2025
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
};

const NoteRow = memo(function NoteRow({
  label,
  text,
  dateISO,
  author,
  textColor,
  subTextColor,
  dividerColor,
}: {
  label: string;
  text: string;
  dateISO?: string | null;
  author: string;
  textColor: string;
  subTextColor: string;
  dividerColor: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const trimmed = text.trim();
  const collapsedLines = 3;
  const isLong = trimmed.length > 160;

  return (
    <TouchableOpacity
      onPress={() => setExpanded((v) => !v)}
      activeOpacity={0.85}
      style={{ paddingVertical: 10 }}
      accessibilityRole="button"
      accessibilityLabel={`${label} note, ${expanded ? "collapse" : "expand"}`}
    >
      <Text style={{ color: subTextColor, fontSize: 12, marginBottom: 6 }}>{label}</Text>

      <Text
        style={{ color: textColor, fontSize: 15, lineHeight: 22, fontStyle: "italic" }}
        numberOfLines={expanded ? undefined : collapsedLines}
        selectable
      >
        {`“${trimmed}”`}
      </Text>

      <View style={{ marginTop: 8, flexDirection: "row", justifyContent: "flex-end" }}>
        <Text style={{ color: subTextColor, fontSize: 12 }}>
          {`— ${author} · ${formatDate(dateISO)}`}
        </Text>
      </View>

      {isLong && !expanded ? (
        <Text
          style={{
            marginTop: 6,
            color: subTextColor,
            fontSize: 12,
            textDecorationLine: "underline",
          }}
        >
          Tap to expand
        </Text>
      ) : null}
    </TouchableOpacity>
  );
});

function WorkoutNotesCard({
  pre,
  post,
  legacy,
  workoutDateISO,
  preDateISO,
  postDateISO,
  authorName = "Ishan Arefin",
  colors,
  style,
  testID = "WorkoutNotesCard",
}: WorkoutNotesCardProps) {
  const scheme = useColorScheme();

  // Defaults with optional overrides from parent
  const textColor     = colors?.textColor     ?? (scheme === "dark" ? "#ffffff" : "#111111");
  const subTextColor  = colors?.subTextColor  ?? (scheme === "dark" ? "#a1a1aa" : "#4b5563");
  const cardColor     = colors?.cardColor     ?? (scheme === "dark" ? "#1e1e1e" : "#f5f5f5");
  const dividerColor  = colors?.dividerColor  ?? (scheme === "dark" ? "#2f2f2f" : "#e5e7eb");
  const borderColor   = colors?.borderColor   ?? dividerColor;

  const showPre = hasText(pre);
  const showPost = hasText(post);
  const showLegacy = !showPre && !showPost && hasText(legacy);

  if (!showPre && !showPost && !showLegacy) return null;

  return (
    <View
      testID={testID}
      style={[
        {
          backgroundColor: cardColor,
          borderRadius: 12,
          padding: 14,
          borderWidth: 1,
          borderColor,
        },
        style,
      ]}
    >
      {/* Header with larger notes icon */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
        <Ionicons
          name="document-text-outline"
          size={22}               // larger icon for a clean, prominent look
          color={subTextColor}
          style={{ marginRight: 8 }}
        />
        <Text style={{ color: textColor, fontWeight: "700", fontSize: 16 }}>
          Workout Notes
        </Text>
      </View>

      {/* Body */}
      {showPre ? (
        <>
          <NoteRow
            label="Pre-workout notes"
            text={pre!}
            dateISO={preDateISO ?? workoutDateISO}
            author={authorName}
            textColor={textColor}
            subTextColor={subTextColor}
            dividerColor={dividerColor}
          />
          {(showPost || showLegacy) && (
            <View style={{ height: 1, backgroundColor: dividerColor, marginVertical: 6 }} />
          )}
        </>
      ) : null}

      {showPost ? (
        <>
          <NoteRow
            label="Post-workout notes"
            text={post!}
            dateISO={postDateISO ?? workoutDateISO}
            author={authorName}
            textColor={textColor}
            subTextColor={subTextColor}
            dividerColor={dividerColor}
          />
          {showLegacy && <View style={{ height: 1, backgroundColor: dividerColor, marginVertical: 6 }} />}
        </>
      ) : null}

      {showLegacy ? (
        <NoteRow
          label="Notes"
          text={legacy!}
          dateISO={workoutDateISO}
          author={authorName}
          textColor={textColor}
          subTextColor={subTextColor}
          dividerColor={dividerColor}
        />
      ) : null}
    </View>
  );
}

export default memo(WorkoutNotesCard);
