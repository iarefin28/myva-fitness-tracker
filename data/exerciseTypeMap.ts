// ------------------------------
// Default exercise type map
// ------------------------------

export const EXERCISE_TYPE_MAP: Record<
  string,
  "bodyweight" | "free weight" | "machine"
> = {
  "Barbell Bench Press": "free weight",
  "Dumbbell Bench Press": "free weight",
  "Incline Dumbbell Press": "free weight",
  "Chest Fly": "free weight",
  "Push-Ups": "bodyweight",

  "Pull-Ups": "bodyweight",
  "Lat Pulldown": "machine",
  "Barbell Row": "free weight",
  "Seated Cable Row": "machine",
  "Dumbbell Row": "free weight",

  "Overhead Barbell Press": "free weight",
  "Dumbbell Shoulder Press": "free weight",
  "Lateral Raises": "free weight",
  "Front Raises": "free weight",
  "Rear Delt Fly": "free weight",

  "Barbell Curl": "free weight",
  "Dumbbell Curl": "free weight",
  "Hammer Curl": "free weight",
  "Preacher Curl": "free weight",
  "Cable Curl": "machine",

  "Triceps Pushdown": "machine",
  "Skull Crushers": "free weight",
  "Overhead Triceps Extension": "free weight",
  "Dips": "bodyweight",
  "Close-Grip Bench Press": "free weight",

  "Barbell Squat": "free weight",
  "Leg Press": "machine",
  "Lunges": "free weight",
  "Bulgarian Split Squat": "free weight",
  "Step-Ups": "free weight",

  "Romanian Deadlift": "free weight",
  "Lying Leg Curl": "machine",
  "Seated Leg Curl": "machine",

  "Standing Calf Raises": "machine",
  "Seated Calf Raises": "machine",

  "Plank": "bodyweight",
  "Hanging Leg Raises": "bodyweight",
  "Cable Crunch": "machine",
  "Russian Twists": "bodyweight",
  "Ab Wheel Rollouts": "bodyweight"
};
