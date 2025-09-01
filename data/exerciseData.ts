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
  "Overhead Press",
  "Dumbbell Shoulder Press",
  "Arnold Press",
  "Lateral Raises",
  "Front Raises",
  "Cable Chest Fly",
  "Tricep Pushdown",
  "Tricep Extensions",
  "Skull Crushers",
  "Close Grip Bench Press",
  "Chest Press Machine",
  "Dumbbell Press",
  "Dips (Close Grip)",
  "Dips (Wide Grip)",
  "Dips (Neutral Grip)",

  //Pull Up Variations 
  "Pull Ups",
  "Pull Ups (Overhand Close Grip)",
  "Pull Ups (Overhand Shoulder Width Grip)",
  "Pull Ups (Overhand Wide Grip)",
  "Pull Ups (Neutral Close Grip)",
  "Pull Ups (Neutral Shoulder Width Grip)",
  "Pull Ups (Neutral Wide Grip)",
  "Weighted Pull Ups (Overhand Close Grip)",
  "Weighted Pull Ups (Overhand Shoulder Width Grip)",
  "Weighted Pull Ups (Overhand Wide Grip)",
  "Weighted Pull Ups (Neutral Close Grip)",
  "Weighted Pull Ups (Neutral Shoulder Width Grip)",
  "Weighted Pull Ups (Neutral Wide Grip)",
  "Chin Up (Close Grip)",
  "Chin Up (Shoulder Width Grip)",
  "Chin Up (Wide Grip)",
  "Weighted Chin Up (Close Grip)",
  "Weighted Chin Up (Shoulder Width Grip)",
  "Weighted Chin Up (Wide Grip)",

  "Lat Pulldown (Close Grip)",
  "Lat Pulldown (Shoulder Width Grip)",
  "Lat Pulldown (Wide Grip):",
  "Lat Pulldown Machine",


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
  "Single Arm Dumbbell Row",

  // Legs
  "Squat",
  "Front Squat",
  "Bulgarian Split Squats",
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
  "Kneeling Leg Curl Machine",

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
  "Cossack Squat",

  //Ishan's Workouts 
  "Hip Thrust Machine",
  "French Press (Seated) (Dumbbell)",
  "Alternating Bicep Curls",
  "Back Squat",
  "Standing Calf Raise (Bodyweight)",
  "Standing Calf Raise (Machine)",
  "Seated Calf Raise (Machine)",
  "Dumbbell Skull Crushers",
  "Romanian Deadlift (Single Leg) (Dumbbell)",

  //Okay I have to make a choice on how many workouts I will provide for the user and what they can add. 
  //But I should definitely give them the ability to add a workout themselves, if anything maybe I could have a bunch of tags like single arm, single leg, dumbbell, barbell 
  //and give them flexibility on what they want to add. 
  //Maybe allow them to pick what muscle group is gonna be hit to dynamically render "single arm" tag vs "single leg"

  "Prone Leg Curl (Machine)",
  "Arnold Press (Standing) (Single Arm)",
  "Seated Hamstring Curl Machine",
  "Push Ups (Close Grip)",
  "Push Ups (Shoulder Width Grip)",
  "Push Ups (Wide Grip)",
  "Weighted Push Ups (Close Grip)",
  "Weighted Push Ups (Shoulder Width Grip)",
  "Weighted Push Ups (Wide Grip)",
  "Face Pulls (Cable) (Rope)",
  "Dumbbell Row",
  "Incline Dumbbell Rows",
  "Incline Dumbbell Row (Single Arm)",
  "Glute Kick Back Machine",
  "Hip Adductor Machine",
  "Seated Hip Abductor Machine",
  "Push Ups (Bosu Ball)",
  "Seated Cable Row (Close Grip)",
  "Seated Cable Row (Wide Grip)",
  "Seated Row Machine",
  "Seated Cable Row (Single Arm)",
  "Roman Chair Back Extension (bodyweight)",
  "Roman Chair Back Extension (weighted) (plate)",
  "Roman Chair Back Extension (weighted) (dumbbell)",
  "Roman Chair Back Extension (weighted) (barbell)",
  "ATG Split Squats (bodyweight)",
  "ATG Split Squats (weighted)",
  "Seated Dip Machine",
  "Suitcase Carry (Time)",
  "Suitcase Carry (Distance)",
  "Farmer Carry (Time)",
  "Farmer Carry (Distance)",
  "Hip Flexor Raises (Monkey Feet)",
  "Lying Hip Flexor Raise (Orange Band)",
  "Reverse Squat (Orange Band)"
];
