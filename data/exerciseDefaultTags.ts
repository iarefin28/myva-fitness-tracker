import type { ExerciseType, TagState } from "../types/workout";

const NORMALIZE = (s: string) => s.toLowerCase().trim();

// Explicit defaults for the exercises you listed
const EXERCISE_DEFAULT_TAGS: Record<string, TagState> = {
  // Bulgarian Split Squat variants
  [NORMALIZE("Bulgarian Split Squat")]: {
    equip: "dumbbell",
    posture: "standing",
    bench: "flat",   // you said you’re on a flat bench now
    stance: "narrow"
  },

  // Calf raises + leg curl
  [NORMALIZE("Prone Leg Curl (Machine)")]: {
    equip: "machine",
    posture: "prone",
  },
  [NORMALIZE("Seated Calf Raise (Machine)")]: {
    equip: "machine",
    posture: "seated",
  },
  [NORMALIZE("Standing Calf Raise (Machine)")]: {
    equip: "machine",
    posture: "standing",
  },
  [NORMALIZE("Standing Calf Raise (Bodyweight)")]: {
    equip: "bodyweight",
    posture: "standing",
  },
};

// Heuristics if not in explicit table
export function inferDefaultTags(name: string, type: ExerciseType): TagState {
  const key = NORMALIZE(name);
  if (EXERCISE_DEFAULT_TAGS[key]) return { ...EXERCISE_DEFAULT_TAGS[key] };

  const n = key;
  const tags: TagState = {};

  // equip
  if (type === "bodyweight" || n.includes("bodyweight")) tags.equip = "bodyweight";
  else if (n.includes("barbell")) tags.equip = "barbell";
  else if (n.includes("dumbbell") || n.includes("db")) tags.equip = "dumbbell";
  else if (n.includes("machine")) tags.equip = "machine";
  else if (n.includes("cable")) tags.equip = "cable";

  // posture
  if (n.includes("seated")) tags.posture = "seated";
  else if (n.includes("standing")) tags.posture = "standing";
  else if (n.includes("prone")) tags.posture = "prone";
  else if (n.includes("supine")) tags.posture = "supine";

  // bench (only set when clearly stated)
  if (n.includes("flat")) tags.bench = "flat";
  if (n.includes("incline")) tags.bench = "incline";
  if (n.includes("decline")) tags.bench = "decline";

  return tags;
}