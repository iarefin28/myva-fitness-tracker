// ------------------------------
// Default exercise type map
// ------------------------------

export const EXERCISE_TYPE_MAP: Record<
  string,
  "bodyweight" | "weighted" | "duration" | "weighted duration" | "weighted distance"
> = {
  "Barbell Bench Press": "weighted",
  "Dumbbell Bench Press": "weighted",
  "Incline Dumbbell Press": "weighted",
  "Chest Fly": "weighted",
  "Push-Ups": "bodyweight",

  "Pull-Ups": "bodyweight",
  "Lat Pulldown": "weighted",
  "Barbell Row": "weighted",
  "Seated Cable Row": "weighted",
  "Dumbbell Row": "weighted",

  "Overhead Barbell Press": "weighted",
  "Dumbbell Shoulder Press": "weighted",
  "Lateral Raises": "weighted",
  "Front Raises": "weighted",
  "Rear Delt Fly": "weighted",

  "Barbell Curl": "weighted",
  "Dumbbell Curl": "weighted",
  "Hammer Curl": "weighted",
  "Preacher Curl": "weighted",
  "Cable Curl": "weighted",

  "Triceps Pushdown": "weighted",
  "Skull Crushers": "weighted",
  "Overhead Triceps Extension": "weighted",
  "Dips": "bodyweight",
  "Close-Grip Bench Press": "weighted",

  "Barbell Squat": "weighted",
  "Leg Press": "weighted",
  "Lunges": "weighted",
  "Bulgarian Split Squat": "weighted",
  "Step-Ups": "weighted",

  "Deadlift": "weighted",
  "Lying Leg Curl": "weighted",
  "Seated Leg Curl": "weighted",

  "Standing Calf Raises": "weighted",
  "Seated Calf Raises": "weighted",

  "Plank": "bodyweight",
  "Hanging Leg Raises": "bodyweight",
  "Cable Crunch": "weighted",
  "Russian Twists": "bodyweight",
};
