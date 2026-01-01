// services/exerciseService.ts
import { app, /* or db */ } from '@/FirebaseConfig'; // adjust to your export
import {
  addDoc, collection, doc,
  endAt,
  getDocs, getFirestore,
  orderBy,
  limit as qlimit,
  query, serverTimestamp,
  startAt,
  updateDoc
} from 'firebase/firestore';

const db = /* if you export db from FirebaseConfig use it, else: */ getFirestore(app);

export type ExerciseType = 'free weight' | 'machine' | 'bodyweight';

export interface CreateExercisePayload {
  name: string;
  type: ExerciseType;
  howTo?: string;
}

const colRef = (uid: string) => collection(db, 'users', uid, 'exercises');

export async function listUserExercises(uid: string, take = 200) {
  const q = query(colRef(uid), orderBy('nameLower'), qlimit(take));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
}

export async function searchUserExercises(uid: string, prefix: string, take = 10) {
  const key = prefix.trim().toLowerCase();
  if (!key) return [];
  const q = query(
    colRef(uid),
    orderBy('nameLower'),
    startAt(key),
    endAt(key + '\uf8ff'),
    qlimit(take)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
}

export async function createUserExercise(uid: string, payload: CreateExercisePayload) {
  const now = Date.now();
  const data = {
    uid,
    name: payload.name.trim(),
    nameLower: payload.name.trim().toLowerCase(),
    type: payload.type,
    howTo: payload.howTo?.trim() || '',
    tags: [],
    createdAt: now,
    updatedAt: now,
    usageCount: 0,
    lastUsedAt: null as number | null,
    _sv: serverTimestamp(), // server clock marker (optional)
  };
  const ref = await addDoc(colRef(uid), data);
  return { id: ref.id, ...data };
}

export async function incrementExerciseUsage(uid: string, exerciseId: string) {
  const ref = doc(db, 'users', uid, 'exercises', exerciseId);
  await updateDoc(ref, {
    usageCount: (window as any).firebaseIncrement ?? 1, // fallback no-op RN; optional
    lastUsedAt: Date.now(),
    updatedAt: Date.now(),
  }).catch(() => {});
}
