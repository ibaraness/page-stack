import { describe, expect, it } from "vitest";
import { slideTransition, slideVariants } from "./slideTransition";

describe("slideTransition", () => {
  it("exports tween config for PageStackOutlet", () => {
    expect(slideTransition).toEqual({
      type: "tween",
      duration: 0.35,
      ease: "easeInOut",
    });
  });

  it("slideVariants offset enter/exit by direction", () => {
    expect(slideVariants.enter(1)).toEqual({ x: "100%" });
    expect(slideVariants.enter(-1)).toEqual({ x: "-100%" });
    expect(slideVariants.exit(1)).toEqual({ x: "-100%" });
    expect(slideVariants.exit(-1)).toEqual({ x: "100%" });
    expect(slideVariants.center).toEqual({ x: 0 });
  });
});
