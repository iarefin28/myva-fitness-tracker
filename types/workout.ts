export type UnitWeight = "lb" | "kg";
export type UnitTime = "sec" | "min";

export interface SetAction {
  type: "set";
  setNumber: number;
  weight: string; // keep as string if directly used in input fields
  unit: UnitWeight;
  reps: string;
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
  actions: ExerciseAction[];
}

export interface Workout {
  workoutName: string;
  date: Date;
  notes?: string;
  exercises: Exercise[];
}
