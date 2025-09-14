// hooks/useAccurateTimer.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

type Options = {
    initialAccumulatedMs?: number; // optional seed on open/edit
};

export default function useAccurateTimer(
    storageKey: string,
    running: boolean,
    options: Options = {}
) {
    const [displaySeconds, setDisplaySeconds] = useState(0);

    const accumulatedRef = useRef<number>(options.initialAccumulatedMs ?? 0);
    const startRef = useRef<number | null>(null);
    const appStateRef = useRef<string>(AppState.currentState);
    const tickRef = useRef<NodeJS.Timer | null>(null);
    const hydratedRef = useRef(false);
    const [ready, setReady] = useState(false);

    // Hydrate from disk (once)
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const saved = await AsyncStorage.getItem(storageKey);
                if (cancelled) return;
                if (saved) {
                    const { accumulated = 0, startEpoch = null, running: wasRunning } = JSON.parse(saved);
                    accumulatedRef.current = accumulated;
                    startRef.current = wasRunning && startEpoch ? startEpoch : null;
                    const live = startRef.current ? Date.now() - startRef.current : 0;
                    setDisplaySeconds(Math.floor((accumulatedRef.current + live) / 1000));
                } else if (options.initialAccumulatedMs && options.initialAccumulatedMs > 0) {
                    accumulatedRef.current = options.initialAccumulatedMs;
                    setDisplaySeconds(Math.floor(options.initialAccumulatedMs / 1000));
                }
            } finally {
                if (!cancelled) setReady(true);
            }
        })();
        return () => { cancelled = true; };
    }, [storageKey]);

    useEffect(() => {
        if (!ready) return;

        if (running && startRef.current == null) {
            startRef.current = Date.now();
        }
        if (!running && startRef.current != null) {
            accumulatedRef.current += Date.now() - startRef.current;
            startRef.current = null;
        }

        if (running) {
            tickRef.current = setInterval(() => {
                const live = startRef.current ? Date.now() - startRef.current : 0;
                setDisplaySeconds(Math.floor((accumulatedRef.current + live) / 1000));
            }, 1000);
        }
        return () => { if (tickRef.current) clearInterval(tickRef.current); };
    }, [running, ready]);

    // AppState sync + persist
    useEffect(() => {
        const sub = AppState.addEventListener("change", (next) => {
            appStateRef.current = next;

            // Refresh UI immediately on resume
            if (next === "active") {
                const live = startRef.current ? Date.now() - startRef.current : 0;
                setDisplaySeconds(Math.floor((accumulatedRef.current + live) / 1000));
            }

            // Persist state on any transition
            AsyncStorage.setItem(storageKey, JSON.stringify({
                accumulated: accumulatedRef.current,
                startEpoch: startRef.current,
                running,
            })).catch(() => { });
        });
        return () => sub.remove();
    }, [storageKey, running]);

    // External controls
    const finalize = () => {
        const live = startRef.current ? Date.now() - startRef.current : 0;
        return Math.floor((accumulatedRef.current + live) / 1000);
    };

    const reset = (initialMs = 0) => {
        accumulatedRef.current = initialMs;
        startRef.current = running ? Date.now() : null;
        const live = startRef.current ? Date.now() - startRef.current : 0;
        setDisplaySeconds(Math.floor((accumulatedRef.current + live) / 1000));
    };

    const persistNow = () =>
        AsyncStorage.setItem(storageKey, JSON.stringify({
            accumulated: accumulatedRef.current,
            startEpoch: startRef.current,
            running,
        })).catch(() => { });

    const stop = () => {
        if (startRef.current != null) {
            accumulatedRef.current += Date.now() - startRef.current;
            startRef.current = null;
        }
        setDisplaySeconds(Math.floor(accumulatedRef.current / 1000));
        AsyncStorage.setItem(storageKey, JSON.stringify({
            accumulated: accumulatedRef.current,
            startEpoch: null,
            running: false,
        })).catch(() => { });
    };

    return { displaySeconds, finalize, reset, persistNow, stop };
}
