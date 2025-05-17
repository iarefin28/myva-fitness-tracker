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
    // Upper Body - Push
    "Bench Press",
    "Dumbbell Bench Press",
    "Incline Bench Press",
    "Decline Bench Press",
    "Push Ups",
    "Overhead Press",
    "Dumbbell Shoulder Press",
    "Arnold Press",
    "Lateral Raises",
    "Front Raises",
    "Cable Chest Fly",
    "Chest Dips",
    "Tricep Pushdown",
    "Skull Crushers",
    "Close Grip Bench Press",
    "Machine Chest Press",
  
    // Upper Body - Pull
    "Pull Ups (Weighted)",
    "Chin Ups",
    "Lat Pulldown",
    "Seated Row",
    "Dumbbell Row",
    "Barbell Row",
    "T-Bar Row",
    "Face Pulls",
    "Rear Delt Fly",
    "Shrugs",
    "Deadlift",
    "Trap Bar Deadlift",
    "Rack Pull",
    "Cable Row",
    "Reverse Fly",
  
    // Legs
    "Squat",
    "Front Squat",
    "Bulgarian Split Squat",
    "Walking Lunges",
    "Reverse Lunges",
    "Leg Press",
    "Romanian Deadlift",
    "Hamstring Curl",
    "Leg Extension",
    "Step Ups",
    "Hip Thrust",
    "Glute Bridge",
    "Calf Raises",
    "Box Jumps",
    "Goblet Squat",
  
    // Core
    "Plank",
    "Side Plank",
    "Sit Ups",
    "Crunches",
    "Russian Twists",
    "Hanging Leg Raise",
    "Cable Woodchopper",
    "V-Ups",
    "Mountain Climbers",
    "Toe Touches",
    "Ab Rollout",
    "Flutter Kicks",
    "Bicycle Crunches",
  
    // Functional / Carries / Cardio
    "Farmer's Carry (Time)",
    "Farmer's Carry (Distance)",
    "Kettlebell Swing",
    "Battle Ropes",
    "Sled Push",
    "Sled Pull",
    "Jump Rope",
    "Burpees",
    "Bear Crawl",
    "Medicine Ball Slam",
    "Boxing Shadow Drill",
  
    // Bodyweight / Mobility
    "Bodyweight Squat",
    "Wall Sit",
    "Superman Hold",
    "Hollow Body Hold",
    "Handstand Hold",
    "Pistol Squat",
    "Inchworm Stretch",
    "World’s Greatest Stretch",
    "Cossack Squat"
  ];
  