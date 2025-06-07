// ------------------------------
// TODO: Expand EXERCISES_DB List
// ------------------------------
// Context:
// - Current exercise list is a sample subset for MVP testing
// - Does not include all variations or uncommon movements
//
// Goal:
// - Add more exercises for a full user experience
// - Include mobility, warm-ups, unilateral, and barbell/dumbbell alternatives
//
// Notes:
// - Consider alphabetizing or categorizing them for easier access
// - Sync with EXERCISE_TYPE_MAP as new entries are added
// ------------------------------

export const EXERCISE_TYPE_MAP: Record<string, "bodyweight" | "weighted" | "duration" | "weighted duration" | "weighted distance"> = {
    "Bench Press": "weighted",
    "Dumbbell Bench Press": "weighted",
    "Incline Bench Press": "weighted",
    "Decline Bench Press": "weighted",
    "Push Ups": "bodyweight",
    "Overhead Press": "weighted",
    "Dumbbell Shoulder Press": "weighted",
    "Arnold Press": "weighted",
    "Lateral Raises": "weighted",
    "Front Raises": "weighted",
    "Cable Chest Fly": "weighted",
    "Chest Dips": "bodyweight",
    "Tricep Pushdown": "weighted",
    "Skull Crushers": "weighted",
    "Close Grip Bench Press": "weighted",
    "Machine Chest Press": "weighted",
    "Flat Dumbbell Press": "weighted",
  
    "Pull Ups": "bodyweight",
    "Pull Ups (Weighted)": "weighted",
    "Chin Ups": "bodyweight",
    "Lat Pulldown": "weighted",
    "Seated Row": "weighted",
    "Dumbbell Row": "weighted",
    "Barbell Row": "weighted",
    "T-Bar Row": "weighted",
    "Face Pulls": "weighted",
    "Rear Delt Fly": "weighted",
    "Shrugs": "weighted",
    "Deadlift": "weighted",
    "Trap Bar Deadlift": "weighted",
    "Rack Pull": "weighted",
    "Cable Row": "weighted",
    "Reverse Fly": "weighted",
    "Single Arm Dumbbell Row": "weighted",
    
  
    "Squat": "weighted",
    "Front Squat": "weighted",
    "Bulgarian Split Squat": "weighted",
    "Walking Lunges": "weighted",
    "Reverse Lunges": "weighted",
    "Leg Press": "weighted",
    "Romanian Deadlift": "weighted",
    "Hamstring Curl": "weighted",
    "Leg Extension": "weighted",
    "Step Ups": "weighted",
    "Hip Thrust": "weighted",
    "Glute Bridge": "bodyweight",
    "Calf Raises": "weighted",
    "Box Jumps": "bodyweight",
    "Goblet Squat": "weighted",
  
    "Plank": "duration",
    "Side Plank": "duration",
    "Sit Ups": "bodyweight",
    "Crunches": "bodyweight",
    "Russian Twists": "bodyweight",
    "Hanging Leg Raise": "bodyweight",
    "Cable Woodchopper": "weighted",
    "V-Ups": "bodyweight",
    "Mountain Climbers": "duration",
    "Toe Touches": "bodyweight",
    "Ab Rollout": "weighted",
    "Flutter Kicks": "duration",
    "Bicycle Crunches": "bodyweight",
  
    "Farmer's Carry (Time)": "weighted duration",
    "Farmer's Carry (Distance)": "weighted distance",
    "Kettlebell Swing": "weighted",
    "Battle Ropes": "duration",
    "Sled Push": "duration",
    "Sled Pull": "duration",
    "Jump Rope": "duration",
    "Burpees": "bodyweight",
    "Bear Crawl": "duration",
    "Medicine Ball Slam": "weighted",
    "Boxing Shadow Drill": "duration",
  
    "Bodyweight Squat": "bodyweight",
    "Wall Sit": "duration",
    "Superman Hold": "duration",
    "Hollow Body Hold": "duration",
    "Handstand Hold": "duration",
    "Pistol Squat": "bodyweight",
    "Inchworm Stretch": "duration",
    "World’s Greatest Stretch": "duration",
    "Cossack Squat": "bodyweight"
  };
  