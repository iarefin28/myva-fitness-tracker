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

  // Importing missing exercises from Adrian's list import on 09/14/2025
  "Smith Machine Bench Press (Incline)": {
    equipment: "smith",
    bench: "incline",
    posture: "supine",
    side: "bilateral"
  },
  "Dumbbell Flys": {
    equipment: "dumbbell",
    bench: "flat",
    posture: "supine",
  },
  "Pec Deck Chest Fly Machine": {
    equipment: "machine",
    posture: "seated",
  },
  "Machine Row (Hammer Strength)": {
    equipment: "machine",
    posture: "seated",
  },
  "Cable Lateral Raise": {
    equipment: "cable",
    posture: "standing",
    side: "unilateral",
    "unilateral pattern": "single arm",
  },
  "Machine Lateral Raise": {
    equipment: "machine",
    posture: "seated",
  },
  "Cable Rear Delt Fly (Reverse Cable Cross)": {
    equipment: "cable",
    posture: "standing",
  },
  "Reverse Pec Deck Machine": {
    equipment: "machine",
    posture: "seated",
  },
  "Incline Reverse Fly (Chest on Incline Bench)": {
    equipment: "dumbbell",
    bench: "incline",
    posture: "prone",
  },
  "Barbell Shrugs": {
    equipment: "barbell",
    posture: "standing",
  },
  "EZ Bar Curl": {
    equipment: "barbell",
    "grip style": "underhand",
    posture: "standing",
  },
  "Hammer Curl (Neutral Grip)": {
    equipment: "dumbbell",
    "grip style": "neutral",
    side: "unilateral",
    "unilateral pattern": "single arm",
    posture: "standing",
  },
  "Preacher Curl (Barbell)": {
    equipment: "barbell",
    posture: "seated",
  },
  "Preacher Curl (Dumbbell)": {
    equipment: "dumbbell",
    posture: "seated",
    side: "unilateral",
    "unilateral pattern": "single arm",
  },
  "Incline Dumbbell Curl": {
    equipment: "dumbbell",
    bench: "incline",
    posture: "seated",
  },
  "Rope Cable Hammer Curl": {
    equipment: "cable",
    "grip style": "neutral",
    posture: "standing",
  },
  "Reverse Curl (Overhand Grip)": {
    equipment: "barbell",
    "grip style": "overhand",
    posture: "standing",
  },
  "Machine Bicep Curl": {
    equipment: "machine",
    posture: "seated",
  },
  "Overhead Triceps Extension (Dumbbell)": {
    equipment: "dumbbell",
    posture: "standing",
  },
  "Overhead Cable Triceps Extension": {
    equipment: "cable",
    posture: "standing",
  },
  "Dumbbell Kickbacks": {
    equipment: "dumbbell",
    side: "unilateral",
    "unilateral pattern": "single arm",
    posture: "bent-over",
  },
  "One-Arm Cable Pushdowns": {
    equipment: "cable",
    side: "unilateral",
    "unilateral pattern": "single arm",
    posture: "standing",
  },
  "Machine Triceps Dip Press": {
    equipment: "machine",
    posture: "seated",
  },
  "Hack Squat": {
    equipment: "machine",
    posture: "standing",
  },
  "Smith Machine Squat": {
    equipment: "smith",
    posture: "standing",
  },

    "Bench Press": { "equipment": "barbell", "bench": "flat", "grip style": "overhand", "side": "bilateral", "posture": "supine" },
  "Dumbbell Bench Press": { "equipment": "dumbbell", "bench": "flat", "grip style": "neutral", "side": "bilateral", "posture": "supine" },
  "Incline Bench Press": { "equipment": "barbell", "bench": "incline", "grip style": "overhand", "side": "bilateral", "posture": "supine" },
  "Decline Bench Press": { "equipment": "barbell", "bench": "decline", "grip style": "overhand", "side": "bilateral", "posture": "supine" },
  "Overhead Press": { "equipment": "barbell", "grip style": "overhand", "side": "bilateral", "posture": "standing" },
  "Dumbbell Shoulder Press": { "equipment": "dumbbell", "grip style": "neutral", "side": "bilateral", "posture": "seated" },
  "Arnold Press": { "equipment": "dumbbell", "grip style": "mixed", "side": "bilateral", "posture": "seated" },
  "Lateral Raises": { "equipment": "dumbbell", "grip style": "neutral", "side": "bilateral", "posture": "standing" },
  "Front Raises": { "equipment": "dumbbell", "grip style": "overhand", "side": "bilateral", "posture": "standing" },
  "Cable Chest Fly": { "equipment": "cable", "grip style": "neutral", "side": "bilateral", "posture": "standing" },
  "Tricep Pushdown": { "equipment": "cable", "grip style": "overhand", "side": "bilateral", "posture": "standing" },
  //"Tricep Extensions": { "equipment": "cable", "grip style": "neutral", "side": "bilateral", "posture": "standing" },
  "Skull Crushers": { "equipment": "barbell", "grip style": "neutral", "side": "bilateral", "posture": "supine" },
  "Close Grip Bench Press": { "equipment": "barbell", "bench": "flat", "grip style": "overhand", "grip width": "close", "side": "bilateral", "posture": "supine" },
  //"Chest Press Machine": { "equipment": "machine", "grip style": "overhand", "side": "bilateral", "posture": "seated" },
  //"Dumbbell Press": { "equipment": "dumbbell", "bench": "flat", "grip style": "neutral", "side": "bilateral", "posture": "supine" },
  "Dips (Close Grip)": { "equipment": "bodyweight", "grip style": "neutral", "grip width": "close", "side": "bilateral", "posture": "standing" },
  "Dips (Wide Grip)": { "equipment": "bodyweight", "grip style": "neutral", "grip width": "wide", "side": "bilateral", "posture": "standing" },
  "Dips (Neutral Grip)": { "equipment": "bodyweight", "grip style": "neutral", "grip width": "shoulder", "side": "bilateral", "posture": "standing" },
  //"Pull Ups": { "equipment": "bodyweight", "grip style": "overhand", "grip width": "shoulder", "side": "bilateral" },
  "Pull Ups (Overhand Close Grip)": { "equipment": "bodyweight", "grip style": "overhand", "grip width": "close", "side": "bilateral" },
  "Pull Ups (Overhand Shoulder Width Grip)": { "equipment": "bodyweight", "grip style": "overhand", "grip width": "shoulder", "side": "bilateral" },
  "Pull Ups (Overhand Wide Grip)": { "equipment": "bodyweight", "grip style": "overhand", "grip width": "wide", "side": "bilateral" },
  "Pull Ups (Neutral Close Grip)": { "equipment": "bodyweight", "grip style": "neutral", "grip width": "close", "side": "bilateral" },
  "Pull Ups (Neutral Shoulder Width Grip)": { "equipment": "bodyweight", "grip style": "neutral", "grip width": "shoulder", "side": "bilateral" },
  "Pull Ups (Neutral Wide Grip)": { "equipment": "bodyweight", "grip style": "neutral", "grip width": "wide", "side": "bilateral" },
  "Weighted Pull Ups (Overhand Close Grip)": { "equipment": "bodyweight", "grip style": "overhand", "grip width": "close", "side": "bilateral" },
  "Weighted Pull Ups (Overhand Shoulder Width Grip)": { "equipment": "bodyweight", "grip style": "overhand", "grip width": "shoulder", "side": "bilateral" },
  "Weighted Pull Ups (Overhand Wide Grip)": { "equipment": "bodyweight", "grip style": "overhand", "grip width": "wide", "side": "bilateral" },
  "Weighted Pull Ups (Neutral Close Grip)": { "equipment": "bodyweight", "grip style": "neutral", "grip width": "close", "side": "bilateral" },
  "Weighted Pull Ups (Neutral Shoulder Width Grip)": { "equipment": "bodyweight", "grip style": "neutral", "grip width": "shoulder", "side": "bilateral" },
  "Weighted Pull Ups (Neutral Wide Grip)": { "equipment": "bodyweight", "grip style": "neutral", "grip width": "wide", "side": "bilateral" },
  "Chin Up (Close Grip)": { "equipment": "bodyweight", "grip style": "underhand", "grip width": "close", "side": "bilateral" },
  "Chin Up (Shoulder Width Grip)": { "equipment": "bodyweight", "grip style": "underhand", "grip width": "shoulder", "side": "bilateral" },
  "Chin Up (Wide Grip)": { "equipment": "bodyweight", "grip style": "underhand", "grip width": "wide", "side": "bilateral" },
  "Weighted Chin Up (Close Grip)": { "equipment": "bodyweight", "grip style": "underhand", "grip width": "close", "side": "bilateral" },
  "Weighted Chin Up (Shoulder Width Grip)": { "equipment": "bodyweight", "grip style": "underhand", "grip width": "shoulder", "side": "bilateral" },
  "Weighted Chin Up (Wide Grip)": { "equipment": "bodyweight", "grip style": "underhand", "grip width": "wide", "side": "bilateral" },
  "Lat Pulldown (Close Grip)": { "equipment": "cable", "grip style": "overhand", "grip width": "close", "side": "bilateral", "posture": "seated" },
  "Lat Pulldown (Shoulder Width Grip)": { "equipment": "cable", "grip style": "overhand", "grip width": "shoulder", "side": "bilateral", "posture": "seated" },
  "Lat Pulldown (Wide Grip):": { "equipment": "cable", "grip style": "overhand", "grip width": "wide", "side": "bilateral", "posture": "seated" },
  //"Lat Pulldown Machine": { "equipment": "machine", "grip style": "overhand", "side": "bilateral", "posture": "seated" },
  "Lat Pulldown": { "equipment": "cable", "grip style": "overhand", "side": "bilateral", "posture": "seated" },
  "Seated Row": { "equipment": "cable", "side": "bilateral", "posture": "seated" },
  "Barbell Row": { "equipment": "barbell", "grip style": "overhand", "grip width": "shoulder", "side": "bilateral", "posture": "bent-over" },
  "T-Bar Row": { "equipment": "barbell", "grip style": "neutral", "grip width": "close", "side": "bilateral", "posture": "bent-over" },
  "Face Pulls": { "equipment": "cable", "grip style": "neutral", "side": "bilateral", "posture": "standing" },
  "Rear Delt Fly": { "equipment": "dumbbell", "grip style": "neutral", "side": "bilateral", "posture": "bent-over" },
  "Shrugs": { "equipment": "bodyweight" },
  "Deadlift": { "equipment": "barbell", "grip style": "mixed", "grip width": "shoulder", "side": "bilateral", "posture": "standing" },
  "Trap Bar Deadlift": { "equipment": "trap-bar", "grip style": "neutral", "grip width": "shoulder", "side": "bilateral", "posture": "standing" },
  "Rack Pull": { "equipment": "barbell", "grip style": "mixed", "grip width": "shoulder", "side": "bilateral", "posture": "standing" },
  "Cable Row": { "equipment": "cable", "side": "bilateral", "posture": "seated" },
  "Reverse Fly": { "equipment": "dumbbell", "grip style": "neutral", "side": "bilateral", "posture": "bent-over" },
  "Single Arm Dumbbell Row": { "equipment": "dumbbell", "grip style": "neutral", "side": "unilateral", "unilateral pattern": "single arm", "posture": "bent-over" },
  "Squat": { "equipment": "barbell", "grip style": "overhand", "grip width": "shoulder", "side": "bilateral", "posture": "standing" },
  "Front Squat": { "equipment": "barbell", "grip style": "overhand", "grip width": "shoulder", "side": "bilateral", "posture": "standing" },
  //"Bulgarian Split Squats": { "equipment": "bodyweight", "side": "unilateral", "unilateral pattern": "single leg", "posture": "standing" },
  "Walking Lunges": { "equipment": "dumbbell", "side": "unilateral", "unilateral pattern": "alternating", "posture": "standing" },
  "Reverse Lunges": { "equipment": "dumbbell", "side": "unilateral", "unilateral pattern": "alternating", "posture": "standing" },
  "Leg Press": { "equipment": "machine", "side": "bilateral", "posture": "seated" },
  "Romanian Deadlift": { "equipment": "barbell", "grip style": "overhand", "grip width": "shoulder", "side": "bilateral", "posture": "standing" },
  "Hamstring Curl": { "equipment": "machine", "side": "bilateral", "posture": "seated" },
  "Leg Extension": { "equipment": "machine", "side": "bilateral", "posture": "seated" },
  "Step Ups": { "equipment": "dumbbell", "side": "unilateral", "unilateral pattern": "alternating", "posture": "standing" },
  "Hip Thrust": { "equipment": "barbell", "side": "bilateral", "posture": "supine" },
  "Glute Bridge": { "equipment": "bodyweight", "side": "bilateral", "posture": "supine" },
  "Calf Raises": { "equipment": "dumbbell", "side": "bilateral", "posture": "seated" },
  "Box Jumps": { "equipment": "bodyweight", "side": "bilateral", "posture": "standing" },
  "Goblet Squat": { "equipment": "dumbbell", "side": "bilateral", "posture": "standing" },
  //"Kneeling Leg Curl Machine": { "equipment": "machine", "side": "bilateral", "posture": "prone" },
  "Plank": { "equipment": "bodyweight", "side": "bilateral", "posture": "prone" },
  "Side Plank": { "equipment": "bodyweight", "side": "unilateral", "unilateral pattern": "single arm" },
  "Sit Ups": { "equipment": "bodyweight", "side": "bilateral", "posture": "supine" },
  "Crunches": { "equipment": "bodyweight", "side": "bilateral", "posture": "supine" },
  "Russian Twists": { "equipment": "bodyweight" },
  "Hanging Leg Raise": { "equipment": "bodyweight", "side": "bilateral" },
  "Cable Woodchopper": { "equipment": "cable", "grip style": "neutral", "side": "unilateral", "unilateral pattern": "single arm", "posture": "standing" },
  "V-Ups": { "equipment": "bodyweight", "side": "bilateral", "posture": "supine" },
  "Mountain Climbers": { "equipment": "bodyweight", "side": "bilateral", "posture": "prone" },
  "Toe Touches": { "equipment": "bodyweight", "side": "bilateral", "posture": "supine" },
  "Ab Rollout": { "equipment": "bodyweight", "side": "bilateral" },
  "Flutter Kicks": { "equipment": "bodyweight", "side": "bilateral", "posture": "supine" },
  "Bicycle Crunches": { "equipment": "bodyweight", "side": "bilateral", "posture": "supine" },
  "Farmer's Carry (Time)": { "equipment": "dumbbell", "side": "bilateral", "posture": "standing" },
  "Farmer's Carry (Distance)": { "equipment": "dumbbell", "side": "bilateral", "posture": "standing" },
  "Kettlebell Swing": { "equipment": "kettlebell", "grip style": "overhand", "side": "bilateral", "posture": "standing" },
  "Battle Ropes": { "equipment": "bodyweight", "side": "bilateral", "posture": "standing" },
  "Sled Push": { "equipment": "machine", "side": "bilateral", "posture": "standing" },
  "Sled Pull": { "equipment": "machine", "side": "bilateral", "posture": "standing" },
  "Jump Rope": { "equipment": "bodyweight", "side": "bilateral", "posture": "standing" },
  "Burpees": { "equipment": "bodyweight", "side": "bilateral", "posture": "standing" },
  "Bear Crawl": { "equipment": "bodyweight", "side": "bilateral", "posture": "standing" },
  "Medicine Ball Slam": { "equipment": "bodyweight", "side": "bilateral", "posture": "standing" },
  "Boxing Shadow Drill": { "equipment": "bodyweight", "side": "bilateral", "posture": "standing" },
  "Bodyweight Squat": { "equipment": "bodyweight" },
  "Wall Sit": { "equipment": "bodyweight", "side": "bilateral", "posture": "seated" },
  "Superman Hold": { "equipment": "bodyweight", "side": "bilateral", "posture": "prone" },
  "Hollow Body Hold": { "equipment": "bodyweight", "side": "bilateral", "posture": "supine" },
  "Handstand Hold": { "equipment": "bodyweight", "side": "bilateral", "posture": "standing" },
  "Pistol Squat": { "equipment": "bodyweight" },
  "Inchworm Stretch": { "equipment": "bodyweight", "side": "bilateral", "posture": "standing" },
  "World’s Greatest Stretch": { "equipment": "bodyweight", "side": "bilateral", "posture": "half-kneeling" },
  "Cossack Squat": { "equipment": "bodyweight", "side": "unilateral", "unilateral pattern": "alternating", "posture": "standing" },
  "Hip Thrust Machine": { "equipment": "machine", "side": "bilateral", "posture": "supine" },
  "French Press (Seated) (Dumbbell)": { "equipment": "dumbbell", "grip style": "neutral", "side": "bilateral", "posture": "seated" },
  //"Alternating Bicep Curls": { "equipment": "bodyweight" },
  "Back Squat": { "equipment": "barbell", "grip style": "overhand", "grip width": "shoulder", "side": "bilateral", "posture": "standing" },
  //"Dumbbell Skull Crushers": { "equipment": "dumbbell", "grip style": "neutral", "side": "bilateral", "posture": "supine" },
  "Romanian Deadlift (Single Leg) (Dumbbell)": { "equipment": "dumbbell", "grip style": "neutral", "grip width": "shoulder", "side": "unilateral", "unilateral pattern": "single leg", "posture": "standing" },
  "Arnold Press (Standing) (Single Arm)": { "equipment": "dumbbell", "grip style": "mixed", "side": "unilateral", "unilateral pattern": "single arm", "posture": "standing" },
  "Seated Hamstring Curl Machine": { "equipment": "machine", "side": "bilateral", "posture": "seated" },
  "Push Ups (Close Grip)": { "equipment": "bodyweight", "grip style": "overhand", "grip width": "close", "side": "bilateral" },
  "Push Ups (Shoulder Width Grip)": { "equipment": "bodyweight", "grip style": "overhand", "grip width": "shoulder", "side": "bilateral" },
  "Push Ups (Wide Grip)": { "equipment": "bodyweight", "grip style": "overhand", "grip width": "wide", "side": "bilateral" },
  "Weighted Push Ups (Close Grip)": { "equipment": "bodyweight", "grip style": "overhand", "grip width": "close", "side": "bilateral" },
  "Weighted Push Ups (Shoulder Width Grip)": { "equipment": "bodyweight", "grip style": "overhand", "grip width": "shoulder", "side": "bilateral" },
  "Weighted Push Ups (Wide Grip)": { "equipment": "bodyweight", "grip style": "overhand", "grip width": "wide", "side": "bilateral" },
  "Face Pulls (Cable) (Rope)": { "equipment": "cable", "grip style": "neutral", "side": "bilateral", "posture": "standing" },
  //"Dumbbell Row": { "equipment": "dumbbell", "grip style": "neutral", "side": "bilateral", "posture": "bent-over" },
  //"Incline Dumbbell Rows": { "equipment": "dumbbell", "grip style": "neutral", "side": "bilateral", "posture": "bent-over" },
  "Incline Dumbbell Row (Single Arm)": { "equipment": "dumbbell", "grip style": "neutral", "side": "unilateral", "unilateral pattern": "single arm", "posture": "bent-over" },
  "Glute Kick Back Machine": { "equipment": "machine", "side": "unilateral", "unilateral pattern": "single leg", "posture": "standing" },
  //"Hip Adductor Machine": { "equipment": "machine", "side": "bilateral", "posture": "seated" },
  "Seated Hip Abductor Machine": { "equipment": "machine", "side": "bilateral", "posture": "seated" },
  "Push Ups (Bosu Ball)": { "equipment": "bodyweight", "grip style": "overhand", "grip width": "shoulder", "side": "bilateral" },
  "Seated Cable Row (Close Grip)": { "equipment": "cable", "grip style": "neutral", "grip width": "close", "side": "bilateral", "posture": "seated" },
  "Seated Cable Row (Wide Grip)": { "equipment": "cable", "grip style": "overhand", "grip width": "wide", "side": "bilateral", "posture": "seated" },
  "Seated Row Machine": { "equipment": "machine", "side": "bilateral", "posture": "seated" },
  "Seated Cable Row (Single Arm)": { "equipment": "cable", "side": "unilateral", "unilateral pattern": "single arm", "posture": "seated" },
  "Roman Chair Back Extension (bodyweight)": { "equipment": "bodyweight", "side": "bilateral", "posture": "prone" },
  "Roman Chair Back Extension (weighted) (plate)": { "equipment": "bodyweight", "side": "bilateral", "posture": "prone" },
  "Roman Chair Back Extension (weighted) (dumbbell)": { "equipment": "dumbbell", "side": "bilateral", "posture": "prone" },
  "Roman Chair Back Extension (weighted) (barbell)": { "equipment": "barbell", "side": "bilateral", "posture": "prone" },
  "ATG Split Squats (bodyweight)": { "equipment": "bodyweight", "side": "unilateral", "unilateral pattern": "single leg", "posture": "standing" },
  "ATG Split Squats (weighted)": { "equipment": "dumbbell", "side": "unilateral", "unilateral pattern": "single leg", "posture": "standing" },
  "Seated Dip Machine": { "equipment": "machine", "grip style": "neutral", "side": "bilateral", "posture": "seated" },
  "Suitcase Carry (Time)": { "equipment": "dumbbell", "side": "unilateral", "unilateral pattern": "single arm", "posture": "standing" },
  "Suitcase Carry (Distance)": { "equipment": "dumbbell", "side": "unilateral", "unilateral pattern": "single arm", "posture": "standing" },
  "Farmer Carry (Time)": { "equipment": "dumbbell", "side": "bilateral", "posture": "standing" },
  "Farmer Carry (Distance)": { "equipment": "dumbbell", "side": "bilateral", "posture": "standing" },
  "Hip Flexor Raises (Monkey Feet)": { "equipment": "dumbbell", "side": "unilateral", "unilateral pattern": "single leg", "posture": "standing" },
  "Lying Hip Flexor Raise (Orange Band)": { "equipment": "bodyweight", "side": "unilateral", "unilateral pattern": "single leg", "posture": "supine" },
  "Reverse Squat (Orange Band)": { "equipment": "bodyweight", "side": "bilateral", "posture": "standing" },
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