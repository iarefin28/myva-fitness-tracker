// ExportTemplatesButton.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from "react-native";

// @ts-ignore - adjust the path to your fixed JSON
import fixedTemplates from "./fixedTemplates.json";

type Props = {
  storageKey?: string;     // defaults to "savedTemplates"
  pretty?: boolean;        // pretty-print JSON (2 spaces)
  label?: string;          // export button text
};

export default function ExportTemplatesButton({
  storageKey = "savedTemplates",
  pretty = true,
  label = "Copy Templates JSON",
}: Props) {
  const [busy, setBusy] = useState(false);

  // --- Existing Export ---
  const onExport = async () => {
    try {
      setBusy(true);
      const raw = await AsyncStorage.getItem(storageKey);
      const list = raw ? JSON.parse(raw) : [];

      const json = pretty ? JSON.stringify(list, null, 2) : JSON.stringify(list);
      await Clipboard.setStringAsync(json);

      Alert.alert("Copied ✅", `${list.length} template${list.length === 1 ? "" : "s"} copied to clipboard`);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to copy templates");
    } finally {
      setBusy(false);
    }
  };

  // --- New Reset ---
  const onReset = async () => {
    try {
      setBusy(true);

      // backup existing
      const current = await AsyncStorage.getItem(storageKey);
      if (current) {
        await AsyncStorage.setItem(`${storageKey}_backup_${Date.now()}`, current);
      }

      // insert fixed templates
      await AsyncStorage.setItem(storageKey, JSON.stringify(fixedTemplates));

      Alert.alert("Reset ✅", `${fixedTemplates.length} template${fixedTemplates.length === 1 ? "" : "s"} reloaded`);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to reset templates");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flexDirection: "row", gap: 12 }}>
      {/* Export Button */}
      <TouchableOpacity
        onPress={onExport}
        disabled={busy}
        style={{
          backgroundColor: "#2a2a2a",
          borderRadius: 12,
          paddingVertical: 12,
          paddingHorizontal: 16,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: "#3a3a3a",
          minWidth: 160,
        }}
      >
        {busy ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <ActivityIndicator />
            <Text style={{ color: "white", fontWeight: "700" }}>Working…</Text>
          </View>
        ) : (
          <Text style={{ color: "white", fontWeight: "700" }}>{label}</Text>
        )}
      </TouchableOpacity>

      {/* Reset Button */}
      <TouchableOpacity
        onPress={onReset}
        disabled={busy}
        style={{
          backgroundColor: "#8b0000",
          borderRadius: 12,
          paddingVertical: 12,
          paddingHorizontal: 16,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: "#a52a2a",
          minWidth: 160,
        }}
      >
        <Text style={{ color: "white", fontWeight: "700" }}>Reset Templates</Text>
      </TouchableOpacity>
    </View>
  );
}
