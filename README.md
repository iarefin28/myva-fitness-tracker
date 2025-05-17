# MYVA Fitness 📱💪

## 🚀 Overview
MYVA Fitness is a minimalist yet powerful workout tracking app built for focus-driven individuals. Its core philosophy is frictionless design—making it incredibly easy to log workouts without interrupting your flow. Whether you're doing bodyweight circuits, weighted lifts, or timed carries, MYVA adapts effortlessly to your routine.

With clean visualizations, you'll clearly see your progress over time, your workout frequency, and soon, AI-powered insights to optimize performance. Future updates will allow sharing your journey with friends, keeping the grind personal—but never lonely.
---
MYVA is a workout-tracking mobile app focused on:
- Minimal input friction
- Clean visuals
- Customizability
- Future AI-driven insights
- Social interaction with trusted friends

Currently in active development – MVP features being finalized.
---

## ⚙️ Features (MVP)
- [x] Add workouts manually
- [x] Track sets, rest, weights, and distance, notes
- [x] Dynamic exercise type support (e.g., bodyweight, weighted, duration)
- [x] Autocomplete for selecting exercises
- [x] Modular UI components

### 🔜 Coming Soon
- Charts and progress analytics
- Workout calendar + muscle heatmaps
- MYVA Insights (AI suggestions)
- Social feature to share workouts
---

## 🗂 Current Folder Structure

myva-fitness/
├── .expo/                    # Expo-generated files (auto-managed)
├── .vscode/                 # VSCode workspace settings
├── app/                     # App router and screen components
│   ├── _layout.tsx          # Layout wrapper (like a root stack/tab navigator)
│   ├── add-workout.tsx      # Add Workout screen
│   ├── add-workout.tsx.swp  # Swap file (temp – safe to delete if not editing)
│   └── index.tsx            # Home screen or landing page
├── assets/                  # Fonts, images, icons, etc.
├── components/              # Reusable UI components
│   ├── ActionInput.tsx
│   ├── ExerciseAutocomplete.tsx
│   ├── ExerciseCard.tsx
│   └── ExerciseInteractiveModal.tsx
├── data/                    # Static or structured data files
│   ├── exerciseData.ts
│   └── exerciseTypeMap.ts
├── types/                   # Shared TypeScript types
│   └── workout.ts
├── .gitignore               # Files to ignore in Git versioning
├── app.json                 # Expo config (includes entry point)
├── eslint.config.js         # Linting rules
├── expo-env.d.ts            # Type declarations for Expo
├── package-lock.json        # Dependency lock file
├── package.json             # Project metadata and scripts
├── README.md                # Project overview and instructions
└── tsconfig.json            # TypeScript configuration

## 🛠️ Tech Stack
- **React Native** with **Expo**
- **Expo Router** for navigation
- **TypeScript**
- **Custom Components** (no UI libraries for maximum control – yet)
- Minimal external dependencies (for speed and stability)

---
## 📝 Developer Notes

- Build logic is centralized around the `add-workout.tsx` screen.
- Types are defined in `types/workout.ts` to ensure strict data validation.
- Design philosophy: **"Less is more"**. Clean UX > feature overload.

---

*Move with purpose. Train with focus. MYVA Fitness.* ⚔️