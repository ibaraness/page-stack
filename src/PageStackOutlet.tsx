"use client";

/**
 * Visual outlet for the generic page stack: renders the current screen with slide transitions.
 *
 * Pair with `PageStackProvider` from `./PageStackContext`. This component does not know about
 * Get Out Of It flows; it only reads `currentPageId` from context and looks up a React component
 * in the `pages` map.
 *
 * @see ./slideTransition.ts — default motion variants (override via custom outlet if needed)
 */

import { AnimatePresence, motion } from "motion/react";
import { createElement, useEffect, useRef, type ComponentType } from "react";
import { usePageStackCore } from "./PageStackContext";
import { slideTransition, slideVariants } from "./slideTransition";
import type { Direction } from "./types";

export type PageStackOutletProps<TPageId extends string> = {
  /**
   * Map from page id to screen component. Must include an entry for every id that can appear
   * on the stack (at minimum `integration.initialPageId`).
   */
  pages: Record<TPageId, ComponentType<Record<string, never>>>;
  /**
   * Called when a stack change starts and finishes animating.
   * Use to gate UI that must not run during transitions (e.g. tutorial popovers).
   *
   * - `true` when `stackKey` changes (after the first mount).
   * - `false` when the enter animation reaches `"center"`.
   */
  onTransitionRunningChange?: (running: boolean) => void;
};

/**
 * Renders `pages[currentPageId]` inside a horizontal slide transition.
 *
 * `stackKey` from context drives `AnimatePresence` so forward/back get distinct enter/exit paths.
 * If `currentPageId` is missing from `pages`, renders nothing (usually a configuration bug).
 */
export function PageStackOutlet<TPageId extends string>({
  pages,
  onTransitionRunningChange,
}: PageStackOutletProps<TPageId>) {
  const { currentPageId, stackKey, navigationDirection } = usePageStackCore<TPageId>();
  const hasMountedRef = useRef(false);
  const PageComponent = pages[currentPageId];

  useEffect(() => {
    if (!onTransitionRunningChange) return;
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    onTransitionRunningChange(true);
  }, [onTransitionRunningChange, stackKey]);

  if (!PageComponent) {
    return null;
  }

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden">
      <AnimatePresence initial={false} custom={navigationDirection as Direction}>
        <motion.div
          key={stackKey}
          role="presentation"
          custom={navigationDirection}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          onAnimationComplete={(definition) => {
            if (definition === "center") {
              onTransitionRunningChange?.(false);
            }
          }}
          transition={slideTransition}
          className="absolute inset-0 flex min-h-0 flex-col bg-transparent"
        >
          <div className="min-h-0 flex-1 overflow-y-auto">
            {createElement(PageComponent)}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
