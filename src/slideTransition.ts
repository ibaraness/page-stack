import type { Direction } from "./types";

/** Motion config for `PageStackOutlet` slide transitions. */
export const slideTransition = {
  type: "tween" as const,
  duration: 0.35,
  ease: "easeInOut" as const,
};

/** Enter/exit offsets depend on navigation direction (forward vs back). */
export const slideVariants = {
  enter: (direction: Direction) => ({
    x: direction >= 0 ? "100%" : "-100%",
  }),
  center: { x: 0 },
  exit: (direction: Direction) => ({
    x: direction >= 0 ? "-100%" : "100%",
  }),
};
