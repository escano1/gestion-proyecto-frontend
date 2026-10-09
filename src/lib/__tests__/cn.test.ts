import { describe, expect, it } from "vitest";
import { cn } from "../cn";

describe("cn", () => {
  it("resuelve conflictos de Tailwind a favor de la última clase", () => {
    expect(cn("block w-full", "w-40")).toBe("block w-40");
    expect(cn("bg-marca-700 text-white", "bg-red-600")).toBe("text-white bg-red-600");
  });

  it("ignora valores falsos", () => {
    expect(cn("px-2", false, undefined, "py-1")).toBe("px-2 py-1");
  });
});
