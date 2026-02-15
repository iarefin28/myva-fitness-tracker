// app/addNewMobility.tsx
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio, Video } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";

import { useMobilityMovementLibrary } from "@/store/mobilityMovementLibrary";
import { typography } from "@/theme/typography";

type RouteParams = { name?: string };

const MAX_MEDIA_SECONDS = 30;
const MAX_MEDIA_MS = MAX_MEDIA_SECONDS * 1000;
const AUDIO_URI_KEY = "mobility_new_audio_uri";
const AUDIO_DURATION_KEY = "mobility_new_audio_duration";
const VIDEO_URI_KEY = "mobility_new_video_uri";
const VIDEO_DURATION_KEY = "mobility_new_video_duration";

export default function AddNewMobility() {
  const route = useRoute();
  const navigation = useNavigation();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const { name: initialName = "" } = (route.params ?? {}) as RouteParams;

  const [name, setName] = useState(initialName.trim());
  const [type, setType] = useState<
    "Static" | "Dynamic" | "Branded" | "Corrective" | "PNF" | "Active"
  >();
  const [defaultMetrics, setDefaultMetrics] = useState<("Breathes" | "Reps" | "Time")[]>([]);
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);
  const [showMediaControls] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recordingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [viewMode, setViewMode] = useState<"pretty" | "data">("pretty");
  const [howTo, setHowTo] = useState("");

  const ensureLocalMovement = useMobilityMovementLibrary((s) => s.ensureLocalMovement);
  const ensureReady = useMobilityMovementLibrary((s) => s.ensureReady);

  const canSave = !!name.trim();

  const C = useMemo(
    () => ({
      bg: isDark ? "#0b0b0b" : "#F8FAFC",
      surface: isDark ? "#141414" : "#FFFFFF",
      border: isDark ? "#333" : "#E2E8F0",
      text: isDark ? "#FFFFFF" : "#0F172A",
      subText: isDark ? "#9ca3af" : "#64748B",
      placeholder: isDark ? "#777" : "#94A3B8",
      info: isDark ? "#93c5fd" : "#2563EB",
      tipBg: isDark ? "#0f1428" : "#EFF6FF",
      tipBorder: isDark ? "#1a2038" : "#BFDBFE",
      primary: isDark ? "#0A84FF" : "#2563EB",
      jsonBorder: isDark ? "#262626" : "#e2e8f0",
      jsonBg: isDark ? "#0f0f0f" : "#ffffff",
      jsonText: isDark ? "#cbd5e1" : "#0f172a",
    }),
    [isDark]
  );

  const jsonPreview = useMemo(
    () =>
      JSON.stringify(
        {
          name,
          type,
          howTo,
          defaultMetrics,
          showAdvancedMetrics,
          audio: audioUri ? { uri: audioUri, durationMs: audioDuration } : null,
          video: videoUri ? { uri: videoUri, durationMs: videoDuration } : null,
        },
        null,
        2
      ),
    [audioDuration, audioUri, defaultMetrics, howTo, name, showAdvancedMetrics, type, videoDuration, videoUri]
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          disabled={!canSave}
          onPress={() => {
            const trimmed = name.trim();
            if (!trimmed) return;
            ensureLocalMovement({
              name: trimmed,
              type,
              howTo,
              defaultMetrics,
            });
            navigation.goBack();
          }}
          style={[styles.headerAction, !canSave && { opacity: 0.5 }]}
        >
          <Text style={[styles.headerActionText, { color: C.primary }]}>Save</Text>
        </Pressable>
      ),
      headerRightContainerStyle: { paddingRight: 8 },
    });
  }, [C.primary, canSave, defaultMetrics, howTo, name, navigation, type, ensureLocalMovement]);

  useEffect(() => {
    ensureReady();
  }, [ensureReady]);

  const formatDuration = (ms?: number | null) => {
    if (!ms) return "";
    const total = Math.round(ms / 1000);
    const m = Math.floor(total / 60);
    const s = String(total % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const ensureDir = async (dir: string) => {
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
  };

  const persistAudio = async (sourceUri: string, durationMs: number | null) => {
    const dir = `${FileSystem.documentDirectory}mobility-audio`;
    await ensureDir(dir);
    const dest = `${dir}/audio-${Date.now()}.m4a`;
    await FileSystem.copyAsync({ from: sourceUri, to: dest });
    setAudioUri(dest);
    setAudioDuration(durationMs);
    await AsyncStorage.setItem(AUDIO_URI_KEY, dest);
    if (durationMs !== null) {
      await AsyncStorage.setItem(AUDIO_DURATION_KEY, String(durationMs));
    }
  };

  const persistVideo = async (sourceUri: string, durationMs: number | null) => {
    const dir = `${FileSystem.documentDirectory}mobility-video`;
    await ensureDir(dir);
    const dest = `${dir}/video-${Date.now()}.mp4`;
    await FileSystem.copyAsync({ from: sourceUri, to: dest });
    setVideoUri(dest);
    setVideoDuration(durationMs);
    await AsyncStorage.setItem(VIDEO_URI_KEY, dest);
    if (durationMs !== null) {
      await AsyncStorage.setItem(VIDEO_DURATION_KEY, String(durationMs));
    }
  };

  const pickAudioFromLibrary = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "audio/*",
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets?.length) return;
    const { uri } = result.assets[0];
    const { sound, status } = await Audio.Sound.createAsync({ uri }, { shouldPlay: false });
    const durationMs = status.isLoaded ? status.durationMillis ?? null : null;
    await sound.unloadAsync();
    if (durationMs && durationMs > MAX_MEDIA_MS) {
      Alert.alert("Audio too long", `Please choose audio that is ${MAX_MEDIA_SECONDS}s or less.`);
      return;
    }
    await persistAudio(uri, durationMs);
  };

  const startAudioRecording = async () => {
    const perm = await Audio.requestPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Microphone permission", "Please enable microphone access to record audio.");
      return;
    }
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const rec = new Audio.Recording();
    await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await rec.startAsync();
    setRecording(rec);
    setIsRecording(true);
    recordingTimeoutRef.current = setTimeout(() => {
      void stopAudioRecording();
    }, MAX_MEDIA_MS);
  };

  const stopAudioRecording = async () => {
    if (!recording) return;
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const status = await recording.getStatusAsync();
      const durationMs = status.isLoaded ? status.durationMillis ?? null : null;
      if (uri) {
        if (durationMs && durationMs > MAX_MEDIA_MS) {
          Alert.alert("Audio too long", `Please record ${MAX_MEDIA_SECONDS}s or less.`);
        } else {
          await persistAudio(uri, durationMs);
        }
      }
    } finally {
      setRecording(null);
      setIsRecording(false);
    }
  };

  const showAudioOptions = () => {
    Alert.alert("Audio Description", "Choose an option", [
      { text: "Record Audio", onPress: () => void startAudioRecording() },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const pickVideoFromLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Media library permission", "Please enable media library access to pick a video.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsMultipleSelection: false,
      quality: 1,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    const durationMs = asset.duration ?? null;
    if (durationMs && durationMs > MAX_MEDIA_MS) {
      Alert.alert("Video too long", `Please choose a video that is ${MAX_MEDIA_SECONDS}s or less.`);
      return;
    }
    await persistVideo(asset.uri, durationMs);
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]}>
      <View style={[styles.toggleRow, { borderColor: C.border }]}>
        <Pressable
          onPress={() => setViewMode("pretty")}
          style={[
            styles.toggleBtn,
            viewMode === "pretty" && styles.toggleBtnActive,
            { borderColor: C.border, backgroundColor: C.surface },
          ]}
        >
          <Text style={[styles.toggleText, { color: viewMode === "pretty" ? C.text : C.subText }]}>
            Pretty
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setViewMode("data")}
          style={[
            styles.toggleBtn,
            viewMode === "data" && styles.toggleBtnActive,
            { borderColor: C.border, backgroundColor: C.surface },
          ]}
        >
          <Text style={[styles.toggleText, { color: viewMode === "data" ? C.text : C.subText }]}>
            Data
          </Text>
        </Pressable>
      </View>
      {viewMode === "data" ? (
        <>
          <View style={[styles.jsonBox, { borderColor: C.jsonBorder, backgroundColor: C.jsonBg }]}>
            <ScrollView>
              <Text style={[styles.jsonText, { color: C.jsonText }]}>{jsonPreview}</Text>
            </ScrollView>
          </View>
          <View style={[styles.noteBox, { borderColor: C.border, backgroundColor: C.surface }]}>
            <Text style={[styles.noteText, { color: C.subText }]}>Audio for descriptions is in the works.</Text>
            <Text style={[styles.noteText, { color: C.subText }]}>Video upload for how to perform is in the works.</Text>
            <Text style={[styles.noteText, { color: C.subText }]}>Can scale those to everywhere else.</Text>
          </View>
        </>
      ) : null}

      {viewMode === "pretty" ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView contentContainerStyle={styles.body}>
          {/* Name */}
          <View style={styles.block}>
            <Text style={[styles.label, { color: C.text }]}>Name of Mobility Movement</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g., Hip Flexor Opener"
              placeholderTextColor={C.placeholder}
              style={[styles.input, { backgroundColor: C.surface, borderColor: C.border, color: C.text }]}
              autoCapitalize="words"
              returnKeyType="done"
            />
          </View>

          {/* How-To */}
          <View style={styles.block}>
            <Text style={[styles.label, { color: C.text }]}>
              General Notes on How To Perform (optional)
            </Text>
            <TextInput
              value={howTo}
              onChangeText={setHowTo}
              placeholder="Cues, timing, hold duration, etc."
              placeholderTextColor={C.placeholder}
              style={[
                styles.input,
                { minHeight: 110, textAlignVertical: "top", backgroundColor: C.surface, borderColor: C.border, color: C.text },
              ]}
              multiline
            />
          </View>

          {showMediaControls ? (
            <View style={styles.block}>
              <View style={styles.mediaRow}>
                <View style={styles.mediaItem}>
                  <Pressable
                    onPress={isRecording ? stopAudioRecording : showAudioOptions}
                    style={[styles.mediaButton, { backgroundColor: C.primary }]}
                  >
                    <View style={styles.mediaButtonContent}>
                      <Ionicons name="add-circle-outline" size={16} color="#fff" />
                      <Text style={styles.mediaButtonText}>
                        {isRecording ? "Recording Audio... Tap to Stop" : "Audio Description"}
                      </Text>
                    </View>
                    <Text style={styles.mediaButtonSubText}>max 30s</Text>
                  </Pressable>
                  {audioUri ? (
                    <Text style={[styles.metaText, { color: C.subText }]}>
                      Audio attached {audioDuration ? `(${formatDuration(audioDuration)})` : ""}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.mediaItem}>
                  <Pressable
                    onPress={pickVideoFromLibrary}
                    style={[styles.mediaButton, { backgroundColor: C.primary }]}
                  >
                    <View style={styles.mediaButtonContent}>
                      <Ionicons name="add-circle-outline" size={16} color="#fff" />
                      <Text style={styles.mediaButtonText}>Upload Video</Text>
                    </View>
                    <Text style={styles.mediaButtonSubText}>max 30s</Text>
                  </Pressable>
                  {videoUri ? (
                    <>
                      <Text style={[styles.metaText, { color: C.subText }]}>
                        Video attached {videoDuration ? `(${formatDuration(videoDuration)})` : ""}
                      </Text>
                      <Video
                        source={{ uri: videoUri }}
                        style={styles.videoPreview}
                        useNativeControls
                        resizeMode="contain"
                        isLooping
                      />
                    </>
                  ) : null}
                </View>
              </View>
            </View>
          ) : null}

          <Pressable
            onPress={() => setShowAdvancedMetrics((v) => !v)}
            style={[styles.advancedToggle, { backgroundColor: C.primary }]}
          >
            <Text style={styles.advancedToggleText}>
              {showAdvancedMetrics ? "Hide Advanced Metrics" : "Show Advanced Metrics"}
            </Text>
          </Pressable>

          {showAdvancedMetrics ? (
            <>
              {/* Type */}
              <View style={styles.block}>
                <Text style={[styles.label, { color: C.text }]}>Type (select one)</Text>
                <View style={[styles.segment, { backgroundColor: C.surface, borderColor: C.border }]}>
                  {(["Static", "Dynamic", "Branded", "Corrective", "PNF", "Active"] as const).map((t) => {
                    const active = type === t;
                    return (
                      <Pressable
                        key={t}
                        onPress={() => setType(t)}
                        style={[styles.segmentChip, active && [styles.segmentChipActive, { backgroundColor: C.primary }]]}
                      >
                        <Text
                          style={[
                            styles.segmentText,
                            { color: active ? "#fff" : C.subText },
                          ]}
                        >
                          {t}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Default Metrics Tracked */}
              <View style={styles.block}>
                <Text style={[styles.label, { color: C.text }]}>
                  Default Metrics Tracked (select all that apply)
                </Text>
                <View style={[styles.segment, { backgroundColor: C.surface, borderColor: C.border }]}>
                  {(["Reps", "Time", "Breathes"] as const).map((t) => {
                    const active = defaultMetrics.includes(t);
                    return (
                      <Pressable
                        key={t}
                        onPress={() =>
                          setDefaultMetrics((prev) =>
                            prev.includes(t) ? prev.filter((m) => m !== t) : [...prev, t]
                          )
                        }
                        style={[styles.segmentChip, active && [styles.segmentChipActive, { backgroundColor: C.primary }]]}
                      >
                        <Text
                          style={[
                            styles.segmentText,
                            { color: active ? "#fff" : C.subText },
                          ]}
                        >
                          {t}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </>
          ) : null}

          </ScrollView>
        </KeyboardAvoidingView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0b0b0b" },

  body: { padding: 16, gap: 14 },

  block: { gap: 8 },
  label: { color: "#e5e7eb", ...typography.body },
  input: {
    borderWidth: 1,
    borderColor: "#333",
    backgroundColor: "#141414",
    color: "white",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },

  segment: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#111",
    borderRadius: 10,
    padding: 4,
    gap: 6,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  segmentChip: {
    flexBasis: "32%",
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 8,
  },
  segmentChipActive: { backgroundColor: "#0A84FF" },
  segmentText: { color: "#9ca3af", ...typography.body },

  toggleRow: {
    flexDirection: "row",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 10,
  },
  toggleBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleBtnActive: {
    backgroundColor: "#0f0f0f",
  },
  toggleText: { ...typography.body, fontWeight: "600" },
  jsonBox: {
    marginHorizontal: 16,
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  jsonText: { fontSize: 12, ...typography.body },
  noteBox: {
    marginHorizontal: 16,
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  noteText: { fontSize: 12, ...typography.body },

  mediaButton: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 64,
  },
  mediaButtonText: { color: "#fff", fontSize: 14, ...typography.body, fontWeight: "600" },
  mediaButtonSubText: { marginTop: 4, color: "#e5e7eb", fontSize: 12, ...typography.body },
  mediaButtonContent: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  mediaRow: { flexDirection: "row", gap: 10, alignItems: "stretch" },
  mediaItem: { flex: 1 },
  videoPreview: {
    marginTop: 8,
    width: "100%",
    height: 160,
    borderRadius: 10,
    backgroundColor: "#0f0f0f",
  },
  metaText: { marginTop: 6, ...typography.body },

  advancedToggle: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  advancedToggleText: { color: "#fff", fontSize: 14, ...typography.body, fontWeight: "600" },

  primary: {
    backgroundColor: "#0A84FF",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 6,
  },
  primaryText: { color: "white", fontSize: 16, ...typography.button },
  headerAction: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  headerActionText: { fontSize: 14, ...typography.body, fontWeight: "600" },
});
