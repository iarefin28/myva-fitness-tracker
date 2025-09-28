import { app } from '@/FirebaseConfig';
import type { Workout } from '@/types/workout-old';
import {
  addDoc,
  collection,
  getFirestore,
  serverTimestamp
} from 'firebase/firestore';

const db = getFirestore(app);

const USERS = 'users';
const WORKOUTS = 'workouts';

async function saveWorkout(userId: string, workout: Workout): Promise<{
  remoteId: string;
  serverTimestamps: { createdAt?: string; updatedAt?: string };
}> {
  // Write into subcollection: users/{uid}/workouts
  const colRef = collection(db, USERS, userId, WORKOUTS);

  // Add document with server timestamps
  // We mirror the local data, *excluding* id collisions and letting Firestore assign its own id.
  const payload = {
    ...workout,
    userId,
    source: 'synced',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(colRef, payload);

  // Optional: also upsert a doc at users/{uid}/workouts_by_localId/{localId} if you want mapping
  // const mapRef = doc(db, USERS, userId, 'workouts_by_localId', workout.id);
  // await setDoc(mapRef, { remoteId: docRef.id, updatedAt: serverTimestamp() }, { merge: true });

  return {
    remoteId: docRef.id,
    serverTimestamps: {}, // Firestore serverTimestamp resolves on read; keep ISO fallback in store
  };
}

export const workoutService = { saveWorkout };