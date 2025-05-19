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
    type: "set";
    setNumber: number;
    reps: string;
    weight?: string;
    weightUnit?: string;  // e.g., lb/kg
    value?: string;       // for duration or distance
    valueUnit?: string;   // e.g., sec/min or m/ft
    note?: string;
}

export interface RestAction {
  type: "rest";
  restNumber: number;
  value: string, 
}

export type ExerciseAction = SetAction | RestAction;

export interface Exercise {
    name: string;
    type: ExerciseType;
    actions: ExerciseAction[];
}

export interface Workout {
  workoutName: string;
  date: Date;
  notes?: string;
  exercises: Exercise[];
}
