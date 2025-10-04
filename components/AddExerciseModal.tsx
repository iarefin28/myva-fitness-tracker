import { useExerciseLibrary } from "@/store/exerciseLibrary";
import { Ionicons } from "@expo/vector-icons";
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
    View,
} from "react-native";

// === Types ===
export type Exercise = { id: string; name: string; subtitle?: string };

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

  // ---- Library wiring ----
  const libReady = useExerciseLibrary((s) => s.ready);
  const exercisesById = useExerciseLibrary((s) => s.exercises);
  const searchLocal = useExerciseLibrary((s) => s.searchLocal);

  // Convert store map -> array
  const allFromLib: Exercise[] = useMemo(() => {
    if (!exercisesById) return [];
    const arr = Object.values(exercisesById).map((e: any) => ({
      id: e.id,
      name: e.name,
      subtitle: e.type,
    }));
    return arr.sort((a, b) => a.name.localeCompare(b.name));
  }, [exercisesById]);

  // Which list to show when fake search is visible
  const masterList: Exercise[] = useMemo(() => {
    if (libReady && allFromLib.length) return allFromLib;
    return exercises;
  }, [libReady, allFromLib, exercises]);

  // Filtered results when real search is active
  const filteredList: Exercise[] = useMemo(() => {
    const q = query.trim();
    if (!searchActive) return [];
    if (!q) return [];
    if (searchLocal) {
      return searchLocal(q, 200).map((e: any) => ({
        id: e.id,
        name: e.name,
        subtitle: e.type,
      }));
    }
    return masterList.filter((e) => e.name.toLowerCase().includes(q.toLowerCase()));
  }, [searchActive, query, searchLocal, masterList]);

  const hasResults = filteredList.length > 0;
  const canSuggestAdd = searchActive && !!query.trim();

  // Reset state each time the modal opens
  useEffect(() => {
    if (!open) return;
    setSearchActive(false);
    setQuery(initialQuery);
  }, [open, initialQuery]);

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
    onSelectExercise?.(ex);
    onClose();
  };

  const handleAddNew = () => {
    const name = query.trim();
    if (!name) return;
    onAddNew?.(name); // You'll navigate in parent
  };

  // Footer renderer for "Add '{query}'" at the END of search list
  const renderSearchFooter = useCallback(() => {
    if (!hasResults || !canSuggestAdd) return null;
    return (
      <Pressable
        onPress={handleAddNew}
        style={({ pressed }) => [styles.row, { paddingHorizontal: 16 }, pressed && styles.rowPressed]}
        android_ripple={{ color: "#1f2937" }}
      >
        <View style={styles.rowTextWrap}>
          <Text style={styles.rowTitle}>+ Add “{query.trim()}” to your exercises</Text>
          <Text style={styles.rowSub}>Create a new exercise in your library</Text>
        </View>
        <Ionicons name="add-circle" size={20} color="#0A84FF" />
      </Pressable>
    );
  }, [hasResults, canSuggestAdd, query]);

  return (
    <Modal
      visible={open}
      onRequestClose={handleClose}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.root}>
        {/* Grabber */}
        <View style={styles.grabber} />

        {/* Top Bar */}
        <View style={styles.topbar}>
          {/* Left: X */}
          <View style={styles.sideLeft}>
            <Pressable
              onPress={handleClose}
              style={styles.iconBtn}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={searchActive ? "Back to list" : "Close"}
            >
              <Ionicons name="close" size={22} color="#9ca3af" />
            </Pressable>
          </View>

          {/* Center: Title or Real Search */}
          <View style={styles.center}>
            {!searchActive ? (
              <View style={styles.centerRow} pointerEvents="none">
                <Ionicons name="search" size={16} color="#9ca3af" />
                <Text style={styles.title}>Search</Text>
              </View>
            ) : (
              <View style={styles.realSearchRow}>
                <Ionicons name="search" size={18} color="#9ca3af" style={styles.realIcon} />
                <TextInput
                  ref={inputRef}
                  value={query}
                  onChangeText={updateQuery}
                  placeholder="Search exercises"
                  placeholderTextColor="#6b7280"
                  style={styles.input}
                  returnKeyType="search"
                  blurOnSubmit={false}
                  accessibilityLabel="Search exercises"
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
          <Pressable
            style={styles.fakeSearch}
            onPress={handleFakePress}
            accessibilityRole="button"
            accessibilityLabel="Open search"
          >
            <Ionicons name="search" size={18} color="#9ca3af" style={styles.fakeIcon} />
            <Text style={styles.fakeText}>Search exercises</Text>
          </Pressable>
        )}

        {/* CONTENT AREA */}
        {!searchActive ? (
          // Panel fills the rest of the screen when fake search is visible
          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Your Exercises</Text>
            </View>

            {/* Only the list scrolls */}
            <FlatList
              data={masterList}
              keyExtractor={keyExtractor}
              ItemSeparatorComponent={() => <View style={styles.sep} />}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handlePick(item)}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                  android_ripple={{ color: "#1f2937" }}
                >
                  <View style={styles.rowTextWrap}>
                    <Text style={styles.rowTitle}>{item.name}</Text>
                    {item.subtitle ? <Text style={styles.rowSub}>{item.subtitle}</Text> : null}
                  </View>

                  {/* Right accessory: blue plus icon */}
                  <Ionicons name="add-circle" size={20} color="#0A84FF" />
                </Pressable>
              )}
              ListEmptyComponent={() => (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyTitle}>No exercises yet</Text>
                  <Text style={styles.emptySub}>Tap Search above to add your first one.</Text>
                </View>
              )}
              contentContainerStyle={
                masterList.length === 0 ? { flex: 1, justifyContent: "center" } : {}
              }
              style={{ flex: 1 }}
              bounces={false}
              nestedScrollEnabled
            />
          </View>
        ) : (
          // Real search active
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={0}
          >
            {hasResults ? (
              <FlatList
                data={filteredList}
                keyExtractor={keyExtractor}
                ItemSeparatorComponent={() => <View style={styles.sep} />}
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
                      <Text style={styles.rowTitle}>{item.name}</Text>
                      {item.subtitle ? <Text style={styles.rowSub}>{item.subtitle}</Text> : null}
                    </View>
                    {/* Right accessory: blue plus icon */}
                    <Ionicons name="add-circle" size={20} color="#0A84FF" />
                  </Pressable>
                )}
                ListFooterComponent={renderSearchFooter}
              />
            ) : query.trim().length > 0 ? (
              // Empty-state CTA when NO results and user typed something
              <View style={styles.emptyStateWrap}>
                <Pressable
                  onPress={handleAddNew}
                  style={({ pressed }) => [
                    styles.suggestionEmpty,
                    {
                      alignSelf: "stretch",
                      marginHorizontal: 16,
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}
                >
                  <Text style={styles.suggestionEmptyText}>
                    No matches found. Tap here to add a new exercise
                  </Text>
                  <Ionicons name="add-circle" size={20} color="#0A84FF" />
                </Pressable>
              </View>
            ) : null}
          </KeyboardAvoidingView>
        )}
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
  title: { color: "#e5e7eb", fontWeight: "800", fontSize: 16, marginLeft: 6 },

  realSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#141414",
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
    backgroundColor: "#141414",
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
  panelTitle: { color: "#e5e7eb", fontWeight: "700", fontSize: 15 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowPressed: { opacity: 0.7 },
  rowTextWrap: { flex: 1, paddingRight: 10 },
  rowTitle: { color: "#e5e7eb", fontSize: 15, fontWeight: "600" },
  rowSub: { color: "#9ca3af", fontSize: 12, marginTop: 2 },
  sep: { height: 1, backgroundColor: "#1a1a1a", marginLeft: 14 },

  emptyBox: { alignItems: "center" },
  emptyTitle: { color: "#d1d5db", fontWeight: "700", marginBottom: 4 },
  emptySub: { color: "#9ca3af" },

  // Centered empty state between top and keyboard
  emptyStateWrap: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },

  // CTA card reused for empty state
  suggestionEmpty: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#0f1428",
    borderWidth: 1,
    borderColor: "#1a2038",
  },
  suggestionEmptyText: {
    flex: 1,
    fontSize: 15,
    color: "#e5e7eb",
    marginRight: 12,
  },
});
