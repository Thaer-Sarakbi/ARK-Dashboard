"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useUserStore } from "@/store/useUserStore";

/**
 * Mount once at the app root (inside layout.tsx).
 * Starts the Firebase Auth listener and, when a user is authenticated,
 * also subscribes to their Firestore profile document in real-time.
 * Both subscriptions are cleaned up automatically on unmount.
 */
export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const subscribeAuth = useAuthStore((s) => s.subscribe);
  const user = useAuthStore((s) => s.user);
  const subscribeProfile = useUserStore((s) => s.subscribe);
  const clearProfile = useUserStore((s) => s.clear);

  // Auth listener — runs once on mount
  useEffect(() => {
    return subscribeAuth();
  }, [subscribeAuth]);

  // Profile listener — re-runs whenever the signed-in user changes
  useEffect(() => {
    if (!user) {
      clearProfile();
      return;
    }
    return subscribeProfile(user.uid);
  }, [user, subscribeProfile, clearProfile]);

  return <>{children}</>;
}
