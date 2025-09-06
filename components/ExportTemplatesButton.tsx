// ExportTemplatesButton.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from "react-native";

type Props = {
  storageKey?: string;     // defaults to "savedTemplates"
  pretty?: boolean;        // pretty-print JSON (2 spaces)
  label?: string;          // button text
};

export default function ExportTemplatesButton({
  storageKey = "savedTemplates",
  pretty = true,
  label = "Copy Templates JSON",
}: Props) {
  const [busy, setBusy] = useState(false);

  const onPress = async () => {
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

  return (
    <TouchableOpacity
      onPress={onPress}
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
        minWidth: 180,
      }}
    >
      {busy ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <ActivityIndicator />
          <Text style={{ color: "white", fontWeight: "700" }}>Preparing…</Text>
        </View>
      ) : (
        <Text style={{ color: "white", fontWeight: "700" }}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}
