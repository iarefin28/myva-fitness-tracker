export type UnitWeight = "lb" | "kg";
export type UnitTime = "sec" | "min";
export type ExerciseType = "weighted" | "bodyweight";

export interface SetAction {
    type: "set";
    setNumber: number;
    reps: string;
    weight?: string;
    unit?: "lb" | "kg";
}

export interface RestAction {
  type: "rest";
  restNumber: number;
  value: string; // rest duration
  unit: UnitTime;
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
