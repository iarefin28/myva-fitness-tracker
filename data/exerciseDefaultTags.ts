// import type { ExerciseType, TagState } from "../types/workout";

// const NORMALIZE = (s: string) => s.toLowerCase().trim();

// // Explicit defaults for the exercises you listed
// const EXERCISE_DEFAULT_TAGS: Record<string, TagState> = {
//   // Bulgarian Split Squat variants
//   [NORMALIZE("Bulgarian Split Squat")]: {
//     equip: "dumbbell",
//     posture: "standing",
//     bench: "flat",   // you said you’re on a flat bench now
//     stance: "narrow"
//   },

//   // Calf raises + leg curl
//   [NORMALIZE("Prone Leg Curl (Machine)")]: {
//     equip: "machine",
//     posture: "prone",
//   },
//   [NORMALIZE("Seated Calf Raise (Machine)")]: {
//     equip: "machine",
//     posture: "seated",
//   },
//   [NORMALIZE("Standing Calf Raise (Machine)")]: {
//     equip: "machine",
//     posture: "standing",
//   },
//   [NORMALIZE("Standing Calf Raise (Bodyweight)")]: {
//     equip: "bodyweight",
//     posture: "standing",
//   },
// };

// // Heuristics if not in explicit table
// export function inferDefaultTags(name: string, type: ExerciseType): TagState {
//   const key = NORMALIZE(name);
//   if (EXERCISE_DEFAULT_TAGS[key]) return { ...EXERCISE_DEFAULT_TAGS[key] };

//   const n = key;
//   const tags: TagState = {};

//   // equip
//   if (type === "bodyweight" || n.includes("bodyweight")) tags.equip = "bodyweight";
//   else if (n.includes("barbell")) tags.equip = "barbell";
//   else if (n.includes("dumbbell") || n.includes("db")) tags.equip = "dumbbell";
//   else if (n.includes("machine")) tags.equip = "machine";
//   else if (n.includes("cable")) tags.equip = "cable";

//   // posture
//   if (n.includes("seated")) tags.posture = "seated";
//   else if (n.includes("standing")) tags.posture = "standing";
//   else if (n.includes("prone")) tags.posture = "prone";
//   else if (n.includes("supine")) tags.posture = "supine";

//   // bench (only set when clearly stated)
//   if (n.includes("flat")) tags.bench = "flat";
//   if (n.includes("incline")) tags.bench = "incline";
//   if (n.includes("decline")) tags.bench = "decline";

//   return tags;
// }


// inferDefaultTags.ts (or wherever your current infer lives)
// Assumes your TagPicker groups are exactly these keys with spaces:
type ExclusiveGroup =
  | "equipment"
  | "bench"
  | "grip style"
  | "grip width"
  | "side"
  | "unilateral pattern"
  | "posture";

export type TagState = Partial<Record<ExclusiveGroup, string>>;

// Import your curated defaults
export const exerciseDefaultTags: Record<string, TagState> = {
  // --- Legs 09/02/2025 ---
  "Bulgarian Split Squats": {
    equipment: "dumbbell",
    side: "unilateral",
    "unilateral pattern": "single leg",
    posture: "standing",
    bench: "flat", // rear-foot elevated on flat bench
  },
  "Kneeling Leg Curl Machine": {
    equipment: "machine",
    side: "unilateral",
    "unilateral pattern": "single leg",
    posture: "tall-kneeling", // closest match to “kneeling” in your options
  },
  "Hip Adductor Machine": {
    equipment: "machine",
    posture: "seated",
    side: "bilateral",
  },
  "Standing Calf Raise (Machine)": {
    equipment: "machine",
    posture: "standing",
    side: "bilateral",
  },

  // --- Back Day 09/03/2025 ---
  "Dumbbell Row": {
    equipment: "dumbbell",
    side: "unilateral",
    "unilateral pattern": "single arm",
    posture: "bent-over",
    "grip style": "neutral",
  },
  "Incline Dumbbell Rows": {
    equipment: "dumbbell",
    side: "bilateral",
    posture: "prone",
    bench: "incline",
    "grip style": "neutral",
  },
  "Pull Ups": {
    equipment: "bodyweight",
    side: "bilateral",
  },
  "Lat Pulldown Machine": {
    equipment: "cable",
    posture: "seated",
    side: "bilateral",
    // add grip tags per your preference (e.g., overhand/wide)
  },
  "Alternating Bicep Curls": {
    equipment: "dumbbell",
    posture: "standing",
    side: "unilateral",
    "unilateral pattern": "alternating",
  },

  // --- Chest Day (TBD) ---
  "Dumbbell Press": {
    equipment: "dumbbell",
    side: "bilateral",
    posture: "supine",
    bench: "flat",
    "grip style": "overhand",
    "grip width": "standard",
  },
  "Chest Press Machine": {
    equipment: "machine",
    posture: "seated",
    "unilateral pattern": "single arm",
    "grip style": "neutral",
  },
  "Dumbbell Skull Crushers": {
    equipment: "dumbbell",
    posture: "supine",
  },
  "Tricep Extensions": {
    equipment: "cable",
    posture: "standing",
  },
};

// -- Helpers ----------------------------------------------------

const benchPostures = new Set(["prone", "supine"]);

function normalize(next: TagState): TagState {
  const out = { ...next };

  // keep unilateral pattern only if side is unilateral
  if (out.side !== "unilateral") {
    delete out["unilateral pattern"];
  }

  // bench only valid for posture prone/supine
  if (!benchPostures.has(out.posture as string)) {
    delete out.bench;
  }

  return out;
}

function fillIfEmpty<T extends ExclusiveGroup>(
  target: TagState,
  key: T,
  val?: string
) {
  if (val && target[key] == null) target[key] = val;
}

// -- Heuristic parser ------------------------------------------

function heuristicsFromName(name: string): TagState {
  const s = name.toLowerCase().replace(/\s+/g, " ");

  const tags: TagState = {};

  // Equipment
  if (/\b(machine)\b/.test(s)) fillIfEmpty(tags, "equipment", "machine");
  else if (/\bcable(s)?\b/.test(s)) fillIfEmpty(tags, "equipment", "cable");
  else if (/\bsmith\b/.test(s)) fillIfEmpty(tags, "equipment", "smith");
  else if (/\b(trap[- ]?bar|hex[- ]?bar)\b/.test(s)) fillIfEmpty(tags, "equipment", "trap-bar");
  else if (/\b(dumbbell|db)\b/.test(s)) fillIfEmpty(tags, "equipment", "dumbbell");
  else if (/\b(barbell|bb)\b/.test(s)) fillIfEmpty(tags, "equipment", "barbell");
  else if (/\b(pull ?ups?|chin ?ups?)\b/.test(s)) fillIfEmpty(tags, "equipment", "bodyweight");

  // Posture
  if (/\b(prone|chest[- ]supported)\b/.test(s)) fillIfEmpty(tags, "posture", "prone");
  else if (/\bsupine\b/.test(s)) fillIfEmpty(tags, "posture", "supine");
  else if (/\bseated?\b/.test(s)) fillIfEmpty(tags, "posture", "seated");
  else if (/\bstanding\b/.test(s)) fillIfEmpty(tags, "posture", "standing");
  else if (/\bbent[- ]?over\b/.test(s)) fillIfEmpty(tags, "posture", "bent-over");
  else if (/\bhalf[- ]?kneeling\b/.test(s)) fillIfEmpty(tags, "posture", "half-kneeling");
  else if (/\b(tall[- ]?kneeling|kneeling leg curl)\b/.test(s)) fillIfEmpty(tags, "posture", "tall-kneeling");

  // Bench (only makes sense with prone/supine; normalize() will police it)
  if (/\bincline\b/.test(s)) fillIfEmpty(tags, "bench", "incline");
  else if (/\bdecline\b/.test(s)) fillIfEmpty(tags, "bench", "decline");
  else if (/\bflat\b/.test(s)) fillIfEmpty(tags, "bench", "flat");

  // Sidedness & unilateral pattern
  if (/\balternating\b/.test(s)) {
    fillIfEmpty(tags, "side", "unilateral");
    fillIfEmpty(tags, "unilateral pattern", "alternating");
  } else if (/\b(single|one|1)[- ]?arm\b/.test(s)) {
    fillIfEmpty(tags, "side", "unilateral");
    fillIfEmpty(tags, "unilateral pattern", "single arm");
  } else if (/\b(single|one|1)[- ]?leg\b/.test(s)) {
    fillIfEmpty(tags, "side", "unilateral");
    fillIfEmpty(tags, "unilateral pattern", "single leg");
  } else if (/\b(bulgarian split|split[- ]squat)\b/.test(s)) {
    fillIfEmpty(tags, "side", "unilateral");
    fillIfEmpty(tags, "unilateral pattern", "single leg");
  }

  // Grip style
  if (/\bneutral\b/.test(s)) fillIfEmpty(tags, "grip style", "neutral");
  else if (/\boverhand|pronated\b/.test(s)) fillIfEmpty(tags, "grip style", "overhand");
  else if (/\bunderhand|supinated\b/.test(s)) fillIfEmpty(tags, "grip style", "underhand");
  else if (/\bmixed\b/.test(s)) fillIfEmpty(tags, "grip style", "mixed");

  // Grip width
  if (/\bclose\b/.test(s)) fillIfEmpty(tags, "grip width", "close");
  else if (/\bwide\b/.test(s)) fillIfEmpty(tags, "grip width", "wide");
  else if (/\bshoulder|standard\b/.test(s)) fillIfEmpty(tags, "grip width", "shoulder");

  return tags;
}

// -- Public API -------------------------------------------------

export function inferDefaultTags(
  exerciseName: string,
  seedOrType?: string | TagState
): TagState {
  // resolve the seed
  const seed: TagState =
    seedOrType && typeof seedOrType === "object" ? seedOrType : {};

  // 1) curated defaults
  const base = exerciseDefaultTags[exerciseName] ?? {};

  // 2) seed wins over curated
  const start: TagState = { ...base, ...seed };

  // 3) heuristics from name
  const inferred = heuristicsFromName(exerciseName);
  const merged: TagState = { ...inferred, ...start };

  // 4) normalize
  return normalize(merged);
}