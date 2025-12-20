// ------------------------------
// TODO: Support Custom Exercises
// ------------------------------
// Context:
// - Currently, exercises are hardcoded in EXERCISES_DB
// - Users cannot add their own workouts dynamically
//
//  Goal:
// - Allow users to add a new exercise name + type
// - Store this data locally (AsyncStorage or SQLite)
// - Merge with default exercises on app load
//
// Notes:
// - Watch for duplicate exercise names
// - Consider tagging custom exercises with isCustom = true
// ------------------------------

export const EXERCISES_DB = [
  "Barbell Bench Press",
  "Dumbbell Bench Press",
  "Incline Dumbbell Press",
  "Chest Fly",
  "Push-Ups",

  "Pull-Ups",
  "Lat Pulldown",
  "Barbell Row",
  "Seated Cable Row",
  "Dumbbell Row",

  "Overhead Barbell Press",
  "Dumbbell Shoulder Press",
  "Lateral Raises",
  "Front Raises",
  "Rear Delt Fly",

  "Barbell Curl",
  "Dumbbell Curl",
  "Hammer Curl",
  "Preacher Curl",
  "Cable Curl",

  "Triceps Pushdown",
  "Skull Crushers",
  "Overhead Triceps Extension",
  "Dips",
  "Close-Grip Bench Press",

  "Barbell Squat",
  "Leg Press",
  "Lunges",
  "Bulgarian Split Squat",
  "Step-Ups",

  "Deadlift",
  "Lying Leg Curl",
  "Seated Leg Curl",

  "Standing Calf Raises",
  "Seated Calf Raises",

  "Plank",
  "Hanging Leg Raises",
  "Cable Crunch",
  "Russian Twists",
];
