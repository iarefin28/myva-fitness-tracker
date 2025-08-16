export type UnitWeight = "lb" | "kg";
export type UnitTime = "sec" | "min";

export type ExerciseType =
  | "weighted"
  | "bodyweight"
  | "duration"
  | "unknown"
  | "weighted distance"
  | "weighted duration";

export interface SetAction {
  id: string;
  type: "set";
  setNumber: number;
  reps: string;
  weight?: string;
  weightUnit?: string;  // e.g., lb/kg
  value?: string;       // for duration or distance
  valueUnit?: string;   // e.g., sec/min or m/ft
  note?: string;
  isWarmup?: false;
  RPE?: -1;
}

export interface RestAction {
  id: string;
  type: "rest";
  restNumber: number;
  value: string,
  restInSeconds: number
}

export type ExerciseAction = SetAction | RestAction;

export interface Exercise {
  name: string;
  type: ExerciseType;
  actions: ExerciseAction[];
  editDurationInSeconds?: number;
  computedDurationInSeconds: number;
}

export interface Workout {
  workoutName: string;
  date: Date;
  notes?: string;
  exercises: Exercise[];
  approxDurationInSeconds: number; // ← estimated (saved on live too)

  //TO-DO: add actual duration in seconds to live workouts so we can do comparisons for templates and stuff
  //actualDurationInSeconds?: number;   // ← only meaningful for live
}
