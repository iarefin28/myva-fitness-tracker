// TagPicker.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

export type TagPickerHandle = {
  focusSearch: () => void;
  blurSearch: () => void;
  isSearchFocused: () => boolean;
};

type ExclusiveGroup = "equipment" | "bench" | "grip style" | "grip width" | "side" | "unilateral pattern" | "posture";;
export type TagState = Partial<Record<ExclusiveGroup, string>>;
type Props = {
  value: TagState;
  onChange: (next: TagState) => void;
  groups?: ExclusiveGroup[];
  maxResults?: number;   // default: 4
  height?: number;       // default: 140
  containerStyle?: any;  // optional override/extra styles
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
};

const GROUP_OPTIONS: Record<ExclusiveGroup, string[]> = {
  equipment: ["barbell", "dumbbell", "kettlebell", "cable", "machine", "smith", "trap-bar", "bodyweight"],
  bench: ["flat", "incline", "decline"],
  "grip style": ["overhand", "underhand", "neutral", "mixed"],
  "grip width": ["close", "standard", "wide", "shoulder"],
  side: ["bilateral", "unilateral"],
  "unilateral pattern": ["single arm", "single leg", "alternating"],
  posture: ["standing", "seated", "half-kneeling", "tall-kneeling", "prone", "supine", "bent-over"],
};

const ALIASES: Record<string, string[]> = {
  barbell: ["bb"], dumbbell: ["db"], kettlebell: ["kb"],
  "trap-bar": ["trapbar", "hexbar", "hex-bar"],
  overhand: ["pronated"], underhand: ["supinated"],
  "single arm": ["single-arm", "one arm", "one-arm"],
  "single leg": ["single-leg", "one leg", "one-leg"],
  alternating: ["alternate", "alt"],
  "bent-over": ["bent over", "hinge", "hip hinge"],
  "tall-kneeling": ["tall kneeling"],
  "half-kneeling": ["half kneeling", "split kneeling"],
  prone: ["chest-supported"],
};

const LANE = 40;   // fixed lane height for chips
const INPUT_H = 40;
const V_SP = 6;

const TagSearchPicker = React.forwardRef<TagPickerHandle, Props>(({
  value,
  onChange,
  groups = ["equipment", "bench", "grip style", "grip width", "side", "unilateral pattern", "posture"],
  maxResults = 4,
  height = 140,
  containerStyle,
  collapsed = false,
  onToggleCollapsed
}, ref) => {

  const searchRef = React.useRef<TextInput>(null);
  const [searchFocused, setSearchFocused] = React.useState(false);

  React.useImperativeHandle(ref, () => ({
    focusSearch: () => searchRef.current?.focus(),
    blurSearch: () => searchRef.current?.blur(),
    // Use the native focus state first; fallback to React state
    isSearchFocused: () => !!searchRef.current?.isFocused?.() || searchFocused,
  }), [searchFocused]);

  const isDark = useColorScheme() === "dark";
  const C = {
    text: isDark ? "#fff" : "#000",
    sub: isDark ? "#aaa" : "#666",
    inputBg: isDark ? "#2a2a2a" : "#f4f4f4",
    cardBg: isDark ? "#1b1b1b" : "#fff",
    chipBg: isDark ? "#2f2f2f" : "#eee",
    chipBgActive: isDark ? "#1e90ff22" : "#007aff1a",
    border: isDark ? "#3c3c3c" : "#ddd",
  };


  const [q, setQ] = useState("");

  const activeGroups = useMemo(() => {
    if (value.side !== "unilateral") {
      return groups.filter(g => g !== "unilateral pattern") as ExclusiveGroup[];
    }
    return groups;
  }, [groups, value.side]);

  const index = useMemo(() => {
    const items: { group: ExclusiveGroup; value: string; label: string; tokens: string[] }[] = [];
    for (const g of activeGroups) {
      for (const opt of (GROUP_OPTIONS[g] || [])) {
        const tokens = [opt, g, ...(ALIASES[opt] || [])].map(s => s.toLowerCase());
        items.push({ group: g, value: opt, label: opt, tokens });
      }
    }
    return items;
  }, [activeGroups]);
  // Rank results
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [] as typeof index;
    return index
      .map(it => {
        const starts = it.tokens.some(t => t.startsWith(s)) ? 1 : 0;
        const includes = it.tokens.some(t => t.includes(s)) ? 1 : 0;
        return { it, score: starts * 2 + includes };
      })
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map(x => x.it);
  }, [q, index, maxResults]);

  // put near the top of the component
  function normalize(next: TagState): TagState {
    // if not explicitly unilateral, pattern must not exist
    if (next.side !== "unilateral") {
      delete next["unilateral pattern"];
    }
    return next;
  }
  const refocusSearch = () => {
    requestAnimationFrame(() => searchRef.current?.focus());
  };


  const select = (g: ExclusiveGroup, opt: string) => {
    const toggledOff = value[g] === opt;
    const next: TagState = { ...value, [g]: toggledOff ? undefined : opt };
    onChange(normalize(next));
    setQ("");
    refocusSearch();
  };

  const clearGroup = (g: ExclusiveGroup) => {
    if (!value[g]) return;
    const next: TagState = { ...value };
    delete next[g];
    onChange(normalize(next));
    refocusSearch();
  };

  const SelectedChip = ({ g, label }: { g: ExclusiveGroup; label: string }) => (
    <View style={{
      height: 30, paddingHorizontal: 10, borderRadius: 999,
      borderWidth: 1, borderColor: C.border, backgroundColor: C.chipBg,
      flexDirection: "row", alignItems: "center", marginRight: 8,
      overflow: "hidden", maxWidth: 220,
    }}>
      <Text style={{ color: C.text, fontWeight: "700", marginRight: 6 }}>{g.toUpperCase()}</Text>
      <Text style={{ color: C.text, marginRight: 6 }} numberOfLines={1}>
        {label}
      </Text>
      <TouchableOpacity onPress={() => clearGroup(g)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={{ color: C.sub, fontWeight: "900" }}>×</Text>
      </TouchableOpacity>
    </View>
  );

  const SuggestionChip = ({
    g, label, active, onPress,
  }: { g: ExclusiveGroup; label: string; active?: boolean; onPress: () => void }) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        height: 30, paddingHorizontal: 12, borderRadius: 999,
        borderWidth: 1, borderColor: C.border,
        backgroundColor: active ? C.chipBgActive : "transparent",
        alignItems: "center", justifyContent: "center", marginRight: 8,
        overflow: "hidden", maxWidth: 220,
      }}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Text style={{ color: C.text, fontWeight: "600" }} numberOfLines={1}>
        {label} <Text style={{ color: C.sub, fontWeight: "600" }}>· {g}</Text>
      </Text>
    </TouchableOpacity>
  );

  // compact height when collapsed: just the selected chips lane + small padding
  const compactHeight = LANE + 20;

  return (
    <View
      style={[
        {
          height: collapsed ? compactHeight : height,   // NEW
          backgroundColor: C.cardBg,
          borderColor: C.border,
          borderWidth: 1,
          borderRadius: 12,
          padding: 10,
          marginBottom: 10,
          overflow: "hidden",
          ...(Platform.OS === "ios"
            ? { shadowColor: "#000", shadowOpacity: 0.07, shadowOffset: { width: 0, height: 3 }, shadowRadius: 6 }
            : { elevation: 1 }),
        },
        containerStyle,
      ]}
    >
      {/* SELECTED lane (always visible) */}
      <View style={{ height: LANE, justifyContent: "center", flexDirection: "row", alignItems: "center" }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          style={{ width: "100%", flex: 1 }}
          contentContainerStyle={{ alignItems: "center", flexGrow: 1 }}
        >
          {(["equipment", "bench", "posture", "grip style", "grip width", "side", ...(value.side === "unilateral" ? ["unilateral pattern"] : [])] as ExclusiveGroup[])
            .filter(g => groups.includes(g))
            .map(g => (value[g] ? <SelectedChip key={`sel:${g}`} g={g} label={value[g]!} /> : null))}
        </ScrollView>
        {/* expand/collapse chevron */}
        <TouchableOpacity
          onPress={onToggleCollapsed}
          style={{
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 8,
            height: "100%",
          }}
        >
          <Ionicons
            name={collapsed ? "chevron-down" : "chevron-up"}
            size={24}
            color={C.sub}
          />
        </TouchableOpacity>
      </View>

      {/* Spacer */}
      {!collapsed && <View style={{ height: V_SP }} />}

      {/* SEARCH (hidden when collapsed) */}
      {!collapsed && (
        <View style={{ height: INPUT_H, justifyContent: "center" }}>
          <TextInput
            ref={searchRef}
            placeholder="Search tags (equipment, posture, grip...)"
            placeholderTextColor={C.sub}
            value={q}
            onChangeText={setQ}
            onFocus={(...args) => {
              setSearchFocused(true);
              // if you already had onFocus, call it:
              // props.onSearchFocus?.();
            }}
            onBlur={(...args) => {
              setSearchFocused(false);
              // props.onSearchBlur?.();
            }}
            blurOnSubmit={false}
            style={{
              height: INPUT_H,
              backgroundColor: C.inputBg,
              color: C.text,
              borderRadius: 10,
              paddingHorizontal: 12,
              borderWidth: 1,
              borderColor: C.border,
            }}
            returnKeyType="search"
          />
        </View>
      )}

      {/* SUGGESTIONS (hidden when collapsed) */}
      {!collapsed && (
        <View style={{ height: LANE, justifyContent: "center" }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="none"
            style={{ width: "100%" }}
            contentContainerStyle={{ alignItems: "center", paddingRight: 4 }}
          >
            {q && results.length > 0
              ? results.map(r => (
                <SuggestionChip
                  key={`${r.group}:${r.value}`}
                  g={r.group}
                  label={r.label}
                  active={value[r.group] === r.value}
                  onPress={() => select(r.group, r.value)}
                />
              ))
              : null}
          </ScrollView>

          {!q && (
            <View style={{ position: "absolute", alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={{ color: C.sub, fontWeight: "700", fontSize: 14, opacity: 0.5, letterSpacing: 0.3 }}>
                MYVA
              </Text>
              <Ionicons name="search" size={14} color={C.sub} />
            </View>
          )}

          {q && results.length === 0 && (
            <Text style={{ position: "absolute", alignSelf: "center", color: C.sub, fontWeight: "600", fontSize: 13, opacity: 0.7 }}>
              No results.
            </Text>
          )}
        </View>
      )}
    </View>
  );
});


export default TagSearchPicker;
