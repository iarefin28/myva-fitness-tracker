import { useExerciseLibrary } from "@/store/exerciseLibrary";
import { useMobilityMovementLibrary } from "@/store/mobilityMovementLibrary";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { typography } from "@/theme/typography";



// === Types ===
export type Exercise = {
  id: string;
  name: string;
  subtitle?: string;
  usageCount?: number;
  lastUsedAt?: number | null;
  createdAt?: number;
};

export type AddExerciseModalProps = {
  open: boolean;
  onClose: () => void;
  initialQuery?: string;
  onQueryChange?: (q: string) => void;
  exercises?: Exercise[];
  onSelectExercise?: (ex: Exercise) => void;
  onAddNew?: (name: string) => void;
};

export default function AddExerciseModal({
  open,
  onClose,
  initialQuery = "",
  onQueryChange,
  exercises = [],
  onSelectExercise,
  onAddNew,
}: AddExerciseModalProps) {
  const [searchActive, setSearchActive] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  const inputRef = useRef<TextInput>(null);
  const [quickTab, setQuickTab] = useState<"recent" | "all" | "most">("recent");
  const [mode, setMode] = useState<"exercises" | "mobility">("exercises");
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const C = useMemo(
    () => ({
      bg: isDark ? "#0b0b0b" : "#F8FAFC",
      surface: isDark ? "#141414" : "#FFFFFF",
      surfaceAlt: isDark ? "#0f0f10" : "#FFFFFF",
      border: isDark ? "#2a2a2a" : "#E2E8F0",
      borderStrong: isDark ? "#222" : "#CBD5E1",
      text: isDark ? "#E5E7EB" : "#0F172A",
      subText: isDark ? "#9ca3af" : "#64748B",
      muted: isDark ? "#6b7280" : "#94A3B8",
      tabBg: isDark ? "#111" : "#F1F5F9",
      accent: isDark ? "#0A84FF" : "#2563EB",
      noteBg: isDark ? "#0f1428" : "#EFF6FF",
      noteBorder: isDark ? "#1a2038" : "#BFDBFE",
      emptyBg: isDark ? "#0f1428" : "#EFF6FF",
      emptyBorder: isDark ? "#1a2038" : "#BFDBFE",
      grabber: isDark ? "#333" : "#CBD5E1",
    }),
    [isDark]
  );

  // ---- Library wiring ----
  const libReady = useExerciseLibrary((s) => s.ready);
  const exercisesById = useExerciseLibrary((s) => s.exercises);
  const searchLocal = useExerciseLibrary((s) => s.searchLocal);
  const ensureDefaults = useExerciseLibrary((s) => s.ensureDefaults);
  const mobilityReady = useMobilityMovementLibrary((s) => s.ready);
  const mobilityById = useMobilityMovementLibrary((s) => s.movements);
  const ensureMobilityReady = useMobilityMovementLibrary((s) => s.ensureReady);

  // Convert store map -> array
  const allFromLib: Exercise[] = useMemo(() => {
    if (!exercisesById) return [];
    const arr = Object.values(exercisesById).map((e: any) => ({
      id: e.id,
      name: e.name,
      subtitle: e.type,
      usageCount: e.usageCount ?? 0,
      lastUsedAt: e.lastUsedAt ?? null,
      createdAt: e.createdAt ?? 0,
    }));
    return arr.sort((a, b) => a.name.localeCompare(b.name));
  }, [exercisesById]);

  const allMobilityFromLib: Exercise[] = useMemo(() => {
    if (!mobilityById) return [];
    const arr = Object.values(mobilityById).map((m: any) => ({
      id: m.id,
      name: m.name,
      subtitle: m.type || "Mobility",
      usageCount: 0,
      lastUsedAt: null,
      createdAt: m.createdAt ?? 0,
    }));
    return arr.sort((a, b) => a.name.localeCompare(b.name));
  }, [mobilityById]);

  // Which list to show when fake search is visible
  const masterList: Exercise[] = useMemo(() => {
    if (mode === "mobility") {
      if (mobilityReady && allMobilityFromLib.length) return allMobilityFromLib;
      return [];
    }
    if (libReady && allFromLib.length) return allFromLib;
    return exercises;
  }, [mode, mobilityReady, allMobilityFromLib, libReady, allFromLib, exercises]);

  const quickSelectBase: Exercise[] = useMemo(() => {
    if (mode === "mobility") {
      if (mobilityReady && allMobilityFromLib.length) return allMobilityFromLib;
      return [];
    }
    if (libReady && allFromLib.length) return allFromLib;
    return exercises.map((ex) => ({
      ...ex,
      usageCount: ex.usageCount ?? 0,
      lastUsedAt: ex.lastUsedAt ?? null,
      createdAt: ex.createdAt ?? 0,
    }));
  }, [mode, mobilityReady, allMobilityFromLib, libReady, allFromLib, exercises]);

  const quickSelectList: Exercise[] = useMemo(() => {
    const base = [...quickSelectBase];
    if (quickTab === "recent") {
      const hasUsed = base.some((ex) => (ex.lastUsedAt ?? 0) > 0);
      if (!hasUsed) {
        return base.sort((a, b) => a.name.localeCompare(b.name)).slice(0, 15);
      }
      return base
        .filter((ex) => (ex.lastUsedAt ?? 0) > 0)
        .sort((a, b) => (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0))
        .slice(0, 15);
    }
    if (quickTab === "most") {
      return base.sort((a, b) => {
        const diff = (b.usageCount ?? 0) - (a.usageCount ?? 0);
        if (diff !== 0) return diff;
        return a.name.localeCompare(b.name);
      }).slice(0, 10);
    }
    return base.sort((a, b) => a.name.localeCompare(b.name));
  }, [quickSelectBase, quickTab]);

  // Filtered results when real search is active
  const filteredList: Exercise[] = useMemo(() => {
    const q = query.trim();
    if (!searchActive) return [];
    if (!q) return [];
    if (mode === "exercises" && searchLocal) {
      return searchLocal(q, 200).map((e: any) => ({
        id: e.id,
        name: e.name,
        subtitle: e.type,
      }));
    }
    return masterList.filter((e) => e.name.toLowerCase().includes(q.toLowerCase()));
  }, [searchActive, query, searchLocal, masterList, mode]);

  const hasResults = filteredList.length > 0;
  const canSuggestAdd = searchActive && !!query.trim();
  const isMobility = mode === "mobility";
  const allLabel = isMobility ? "All Mobility" : "All Exercises";
  const searchLabel = isMobility ? "Search mobility library" : "Search exercises";
  const addRowTitle = isMobility
    ? `+ Add “${query.trim()}” to your mobility`
    : `+ Add “${query.trim()}” to your exercises`;
  const addRowSub = isMobility
    ? "Create a new mobility movement in your library"
    : "Create a new exercise in your library";

  // Reset state each time the modal opens
  useEffect(() => {
    if (!open) return;
    ensureDefaults();
    ensureMobilityReady();
    setSearchActive(false);
    setQuery(initialQuery);
  }, [open, initialQuery, ensureDefaults, ensureMobilityReady]);

  // --- Handlers ---
  const focusRealSearch = useCallback(() => {
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const handleFakePress = () => {
    setSearchActive(true);
    focusRealSearch();
  };

  // X button behavior
  const handleClose = () => {
    if (searchActive) {
      setSearchActive(false);
      Keyboard.dismiss();
      return;
    }
    if (Platform.OS === "ios") Keyboard.dismiss();
    onClose();
  };

  const updateQuery = (t: string) => {
    setQuery(t);
    onQueryChange?.(t);
  };

  const keyExtractor = useCallback((item: Exercise) => String(item.id ?? item.name), []);

  const handlePick = (ex: Exercise) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onSelectExercise?.(ex);
    onClose();
  };

  const handleAddNew = () => {
    const name = query.trim();
    if (!name) return;
    onAddNew?.(name); // You'll navigate in parent
  };

  // Row renderer for adding a new exercise
  const renderAddRow = useCallback(() => {
    if (!canSuggestAdd) return null;
    return (
      <Pressable
        onPress={handleAddNew}
        style={({ pressed }) => [styles.row, { paddingHorizontal: 16 }, pressed && styles.rowPressed]}
        android_ripple={{ color: isDark ? "#1f2937" : "#E2E8F0" }}
      >
        <View style={styles.rowTextWrap}>
          <Text style={[styles.rowTitle, { color: C.text }]}>{addRowTitle}</Text>
          <Text style={[styles.rowSub, { color: C.subText }]}>{addRowSub}</Text>
        </View>
        <Ionicons name="add-circle" size={20} color={C.accent} />
      </Pressable>
    );
  }, [canSuggestAdd, addRowTitle, addRowSub, C.text, C.subText, C.accent]);

  // --- Separated sections ---
  const renderSearchSection = () => (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={styles.filterWrap}>
        <Pressable
          style={({ pressed }) => [
            styles.filterBtn,
            { backgroundColor: C.accent, borderColor: C.accent },
            pressed && styles.filterBtnPressed,
          ]}
        >
          <Ionicons name="search" size={16} color="#fff" />
          <Text style={[styles.filterBtnText, { color: "#fff" }]}>{allLabel}</Text>
        </Pressable>
      </View>
      {query.trim().length > 0 ? (
        <FlatList
          data={filteredList}
          keyExtractor={keyExtractor}
          ItemSeparatorComponent={() => <View style={[styles.sep, { backgroundColor: C.border }]} />}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handlePick(item)}
              style={({ pressed }) => [
                styles.row,
                { paddingHorizontal: 16 },
                pressed && styles.rowPressed,
              ]}
            >
              <View style={styles.rowTextWrap}>
                <Text style={[styles.rowTitle, { color: C.text }]}>{item.name}</Text>
                {item.subtitle ? <Text style={[styles.rowSub, { color: C.subText }]}>{item.subtitle}</Text> : null}
              </View>
              <Ionicons name="add-circle" size={20} color={C.accent} />
            </Pressable>
          )}
          ListFooterComponent={hasResults ? renderAddRow : null}
          ListEmptyComponent={!hasResults ? renderAddRow : null}
        />
      ) : null}
    </KeyboardAvoidingView>
  );

  const renderQuickSelectSection = () => (
    <>
      <View style={styles.tabRow}>
        <Pressable
          onPress={() => setQuickTab("recent")}
          style={[
            styles.tabBtn,
            { backgroundColor: C.tabBg, borderColor: C.border },
            quickTab === "recent" && [styles.tabBtnActive, { backgroundColor: C.accent, borderColor: C.accent }],
          ]}
        >
          <Text
            style={[
              styles.tabText,
              { color: C.subText },
              quickTab === "recent" && [styles.tabTextActive, { color: "#fff" }],
            ]}
          >
            Recent
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setQuickTab("all")}
          style={[
            styles.tabBtn,
            { backgroundColor: C.tabBg, borderColor: C.border },
            quickTab === "all" && [styles.tabBtnActive, { backgroundColor: C.accent, borderColor: C.accent }],
          ]}
        >
          <Text
            style={[
              styles.tabText,
              { color: C.subText },
              quickTab === "all" && [styles.tabTextActive, { color: "#fff" }],
            ]}
          >
            {allLabel}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setQuickTab("most")}
          style={[
            styles.tabBtn,
            { backgroundColor: C.tabBg, borderColor: C.border },
            quickTab === "most" && [styles.tabBtnActive, { backgroundColor: C.accent, borderColor: C.accent }],
          ]}
        >
          <Text
            style={[
              styles.tabText,
              { color: C.subText },
              quickTab === "most" && [styles.tabTextActive, { color: "#fff" }],
            ]}
          >
            Most Used
          </Text>
        </Pressable>
      </View>

      <View style={[styles.panel, { backgroundColor: C.surfaceAlt, borderColor: C.borderStrong }]}>
        <View style={[styles.panelHeader, { borderBottomColor: C.border }]}>
          <Text style={[styles.panelTitle, { color: C.text }]}>
            {quickTab === "recent"
              ? `Recent ${isMobility ? "Mobility" : "Exercises"}`
              : quickTab === "most"
              ? `Most Used ${isMobility ? "Mobility" : "Exercises"}`
              : allLabel}
          </Text>
        </View>

        <FlatList
          data={quickSelectList}
          keyExtractor={keyExtractor}
          ItemSeparatorComponent={() => <View style={[styles.sep, { backgroundColor: C.border }]} />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handlePick(item)}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              android_ripple={{ color: isDark ? "#1f2937" : "#E2E8F0" }}
            >
              <View style={styles.rowTextWrap}>
                <Text style={[styles.rowTitle, { color: C.text }]}>{item.name}</Text>
                {quickTab === "recent" ? (
                  <Text style={[styles.rowSub, { color: C.subText }]}>
                    {item.subtitle ? `${item.subtitle} | ` : ""}
                    Last Used:{" "}
                    {item.lastUsedAt
                      ? new Date(item.lastUsedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Never"}
                  </Text>
                ) : quickTab === "most" ? (
                  <Text style={[styles.rowSub, { color: C.subText }]}>
                    {item.subtitle ? `${item.subtitle} | ` : ""}
                    Used {item.usageCount ?? 0} times
                  </Text>
                ) : item.subtitle ? (
                  <Text style={[styles.rowSub, { color: C.subText }]}>{item.subtitle}</Text>
                ) : null}
              </View>

              <Ionicons name="add-circle" size={20} color={C.accent} />
            </Pressable>
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyBox}>
              <Text style={[styles.emptyTitle, { color: C.text }]}>
                {isMobility ? "No mobility moves yet" : "No exercises yet"}
              </Text>
              <Text style={[styles.emptySub, { color: C.subText }]}>
                Tap Search above to add your first one.
              </Text>
            </View>
          )}
          contentContainerStyle={
            quickSelectList.length === 0 ? { flex: 1, justifyContent: "center" } : {}
          }
          style={{ flex: 1 }}
          bounces={false}
          nestedScrollEnabled
        />
      </View>
    </>
  );

  return (
    <Modal
      visible={open}
      onRequestClose={handleClose}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]}>
        {/* Grabber */}
        <View style={[styles.grabber, { backgroundColor: C.grabber }]} />

        {/* Top Bar */}
        <View style={[styles.topbar, { backgroundColor: C.bg }]}>
          {/* Left: X */}
          <View style={styles.sideLeft}>
            <Pressable
              onPress={handleClose}
              style={styles.iconBtn}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={searchActive ? "Back to list" : "Close"}
            >
              <Ionicons name="close" size={22} color={C.subText} />
            </Pressable>
          </View>

          {/* Center: Title or Real Search */}
          <View style={styles.center}>
            {!searchActive ? (
              <View style={styles.centerRow} pointerEvents="none">
                <Ionicons name="search" size={16} color={C.subText} />
                <Text style={[styles.title, { color: C.text }]}>Search</Text>
              </View>
            ) : (
              <View style={[styles.realSearchRow, { backgroundColor: C.surface, borderColor: C.border }]}>
                <Ionicons name="search" size={18} color={C.subText} style={styles.realIcon} />
                <TextInput
                  ref={inputRef}
                  value={query}
                  onChangeText={updateQuery}
                  placeholder={searchLabel}
                  placeholderTextColor={C.muted}
                  style={[styles.input, { color: C.text }]}
                  returnKeyType="search"
                  blurOnSubmit={false}
                  accessibilityLabel={searchLabel}
                />
              </View>
            )}

            {/* Invisible input kept mounted per spec */}
            <TextInput
              value={query}
              onChangeText={updateQuery}
              style={styles.invisibleInput}
              editable={false}
              pointerEvents="none"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            />
          </View>

          {/* Right spacer to keep center perfectly centered vs left X */}
          <View style={styles.sideRight} />
        </View>

        {/* Fake search below top bar */}
        {!searchActive && (
          <>
            <Pressable
              style={[styles.fakeSearch, { backgroundColor: C.surface, borderColor: C.border }]}
              onPress={handleFakePress}
              accessibilityRole="button"
              accessibilityLabel="Open search"
            >
              <Ionicons name="search" size={18} color={C.subText} style={styles.fakeIcon} />
              <Text style={[styles.fakeText, { color: C.subText }]}>
                {searchLabel}
              </Text>
            </Pressable>
            <View style={styles.modeRow}>
              <Pressable
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setMode("exercises");
                }}
                style={({ pressed }) => [
                  styles.modeBtn,
                  styles.modeBtnExercises,
                  mode === "exercises" && [styles.modeBtnSelected, { borderColor: C.text }],
                  pressed && styles.modeBtnPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Exercises"
              >
                <Ionicons name="search" size={16} color="#fff" />
                <Text style={styles.modeBtnText}>Exercises</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setMode("mobility");
                }}
                style={({ pressed }) => [
                  styles.modeBtn,
                  styles.modeBtnMobility,
                  mode === "mobility" && [styles.modeBtnSelected, { borderColor: C.text }],
                  pressed && styles.modeBtnPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Mobility Movement"
              >
                <Ionicons name="search" size={16} color="#fff" />
                <Text style={styles.modeBtnText}>Mobility Movement</Text>
              </Pressable>
            </View>
          </>
        )}

        {/* CONTENT AREA */}
        {!searchActive ? renderQuickSelectSection() : renderSearchSection()}
      </SafeAreaView>
    </Modal>
  );
}

// === Styles ===
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0b0b0b" },
  grabber: {
    alignSelf: "center",
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#333",
    marginTop: 8,
    marginBottom: 4,
  },

  // Top bar
  topbar: { flexDirection: "row", alignItems: "center", height: 64 },
  sideLeft: { width: 56, alignItems: "flex-start", justifyContent: "center" },
  sideRight: { width: 56 },
  iconBtn: { padding: 10, borderRadius: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  centerRow: { flexDirection: "row", alignItems: "center" },
  title: { color: "#e5e7eb", fontSize: 16, marginLeft: 6, ...typography.body },

  modeRow: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  modeBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  modeBtnExercises: { backgroundColor: "#0A84FF" },
  modeBtnMobility: { backgroundColor: "#16A34A" },
  modeBtnSelected: { borderWidth: 2 },
  modeBtnPressed: { opacity: 0.85 },
  modeBtnText: { color: "#fff", fontSize: 13, ...typography.body },

  realSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0ea5e9",
    borderColor: "#2a2a2a",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 36,
    width: "100%",
  },
  realIcon: { marginRight: 8 },
  input: { flex: 1, color: "#fff" },
  invisibleInput: { position: "absolute", width: 1, height: 1, opacity: 0 },

  // Fake search
  fakeSearch: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0ea5e9",
    borderColor: "#2a2a2a",
    borderWidth: 1,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  fakeIcon: { marginRight: 8 },
  fakeText: { color: "#9ca3af" },

  tabRow: {
    flexDirection: "row",
    gap: 8,
    marginHorizontal: 12,
    marginBottom: 8,
  },
  tabBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    backgroundColor: "#111",
    paddingVertical: 10,
    alignItems: "center",
  },
  tabBtnActive: { backgroundColor: "#0A84FF", borderColor: "#0A84FF" },
  tabText: { color: "#9ca3af", ...typography.body },
  tabTextActive: { color: "#fff" },

  // When real search is active
  body: { flex: 1 },

  // Panel used when fake search is visible
  panel: {
    flex: 1,
    marginTop: 8,
    marginHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#222",
    backgroundColor: "#0f0f10",
    overflow: "hidden",
  },
  panelHeader: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  panelTitle: { color: "#e5e7eb", fontSize: 15, ...typography.body },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowPressed: { opacity: 0.7 },
  rowTextWrap: { flex: 1, paddingRight: 10 },
  rowTitle: { color: "#e5e7eb", fontSize: 15, ...typography.body },
  rowSub: { color: "#9ca3af", fontSize: 12, marginTop: 2, ...typography.body },
  sep: { height: 1, width: "90%", alignSelf: "center" },

  emptyBox: { alignItems: "center" },
  emptyTitle: { color: "#d1d5db", marginBottom: 4, ...typography.body },
  emptySub: { color: "#9ca3af", ...typography.body },

  searchNote: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#0f1428",
    borderWidth: 1,
    borderColor: "#1a2038",
  },
  searchNoteTitle: { color: "#e5e7eb", marginBottom: 4, ...typography.body },
  searchNoteText: { color: "#9ca3af", fontSize: 12, lineHeight: 16, ...typography.body },
  filterWrap: {
    marginHorizontal: 0,
    marginBottom: 12,
  },
  filterBtn: {
    width: "100%",
    borderRadius: 0,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  filterBtnPressed: { opacity: 0.85 },
  filterBtnText: { fontSize: 14, ...typography.body },
});
