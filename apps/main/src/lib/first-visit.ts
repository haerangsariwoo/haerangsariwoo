export const SETUP_KEY = "haerang-first-visit-v1";
export const SETUP_RESTART = "haerang-first-visit-restart";
export type SetupPhase = "welcome" | "tour" | "install" | "notifications" | "done";

export function initialSetupPhase(stored: string | null, tourSeen: boolean): SetupPhase {
  if (["welcome", "tour", "install", "notifications", "done"].includes(stored ?? "")) {
    return stored as SetupPhase;
  }
  // Existing users keep their dismissal; they can replay the setup from MY.
  return tourSeen ? "done" : "welcome";
}

export function nextSetupPhase(phase: SetupPhase, tourActive: boolean, installed: boolean): SetupPhase {
  if (phase === "tour" && !tourActive) return installed ? "notifications" : "install";
  if (phase === "install" && installed) return "notifications";
  return phase;
}
