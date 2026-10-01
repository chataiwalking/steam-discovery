import { describe, expect, it } from "vitest";
import {
  defaultEvidence,
  defaultWorld,
  gearVelocity,
  isDay,
  lightHex,
  taskComplete,
} from "../src/learning";
import type { AgeBand, LessonId, WorldState } from "../src/types";
import type { Evidence } from "../src/learning";

describe("the phenomena children observe", () => {
  it("alternates daylight after half a turn and repeats after one full turn", () => {
    for (const angle of [0, 0.3, 1.2, 2.2, 4]) {
      expect(isDay(angle + Math.PI)).toBe(!isDay(angle));
      expect(isDay(angle + Math.PI * 2)).toBe(isDay(angle));
    }
  });

  it("meshing external gears reverse direction and conserve passing teeth", () => {
    expect(gearVelocity(2, 12, 12)).toBe(-2);
    expect(gearVelocity(2, 12, 24)).toBe(-1);
    expect(gearVelocity(-2, 12, 24)).toBe(1);
    expect(gearVelocity(0, 12, 24)).toBeCloseTo(0);
    expect(Math.abs(gearVelocity(3, 12, 24)) * 24).toBe(3 * 12);
  });

  it("uses additive RGB light, including yellow and white rather than paint mixing", () => {
    expect(lightHex([0, 0, 0])).toBe("#000000");
    expect(lightHex([1, 0, 0])).toBe("#ff0000");
    expect(lightHex([1, 1, 0])).toBe("#ffff00");
    expect(lightHex([0, 1, 1])).toBe("#00ffff");
    expect(lightHex([1, 0, 1])).toBe("#ff00ff");
    expect(lightHex([1, 1, 1])).toBe("#ffffff");
    expect(lightHex([-0.2, 0.5, 1.8])).toBe("#0080ff");
  });

  it("creates isolated experiment state for a new step or lesson", () => {
    const first = defaultWorld();
    first.waterOrder.push(1);
    first.lights[0] = 1;
    first.shapes.push("sphere");
    const next = defaultWorld();
    expect(next.waterOrder).toEqual([]);
    expect(next.lights).toEqual([0, 0, 0]);
    expect(next.shapes).toEqual([]);
    const evidence = defaultEvidence();
    evidence.water.push(1);
    expect(defaultEvidence().water).toEqual([]);
  });
});

it("requires the twenty-four-tooth gear to still be selected when claiming the challenge", () => {
  const evidence = { ...defaultEvidence(), ratio: true };
  expect(taskComplete("gears", "6-8", 2, { ...defaultWorld(), gearRunning: true, gearTeeth: 12 }, evidence)).toBe(false);
  expect(taskComplete("gears", "6-8", 2, { ...defaultWorld(), gearRunning: true, gearTeeth: 24 }, evidence)).toBe(true);
});

type Example = {
  id: LessonId;
  age: AgeBand;
  completedWorld?: Partial<WorldState>;
  completedEvidence?: Partial<Evidence>;
  incompleteWorld?: Partial<WorldState>;
  incompleteEvidence?: Partial<Evidence>;
};

const examples: Example[] = [
  {
    id: "day-night",
    age: "2-3",
    completedEvidence: { day: true, night: true },
    incompleteEvidence: { day: true },
  },
  {
    id: "day-night",
    age: "4-5",
    completedEvidence: { day: true, night: true },
    incompleteEvidence: { night: true },
  },
  {
    id: "day-night",
    age: "6-8",
    completedEvidence: { prediction: true },
    incompleteEvidence: { day: true, night: true },
  },
  {
    id: "water-cycle",
    age: "2-3",
    completedEvidence: { water: [1, 2, 3] },
    incompleteEvidence: { water: [1, 3] },
  },
  {
    id: "water-cycle",
    age: "4-5",
    completedEvidence: { water: [1, 2, 3] },
    incompleteEvidence: { water: [1, 2] },
  },
  {
    id: "water-cycle",
    age: "6-8",
    completedWorld: { waterOrder: [1, 2, 3] },
    incompleteWorld: { waterOrder: [2, 1, 3] },
    incompleteEvidence: { water: [1, 2, 3] },
  },
  {
    id: "gears",
    age: "2-3",
    completedEvidence: { actions: 2 },
    incompleteEvidence: { actions: 1 },
  },
  {
    id: "gears",
    age: "4-5",
    completedWorld: { gearRunning: true },
    completedEvidence: { reversed: true },
    incompleteEvidence: { reversed: true },
  },
  {
    id: "gears",
    age: "6-8",
    completedWorld: { gearRunning: true, gearTeeth: 24 },
    completedEvidence: { ratio: true },
    incompleteWorld: { gearRunning: true },
  },
  {
    id: "bridge",
    age: "2-3",
    completedWorld: { deck: true },
    completedEvidence: { crossed: true },
    incompleteWorld: { deck: true },
  },
  {
    id: "bridge",
    age: "4-5",
    completedWorld: { deck: true, pier: true },
    completedEvidence: { crossed: true, pierCrossed: true },
    incompleteWorld: { deck: true, pier: true },
    incompleteEvidence: { crossed: true },
  },
  {
    id: "bridge",
    age: "6-8",
    completedEvidence: { bridgeBefore: true, bridgeAfter: true },
    incompleteEvidence: { bridgeBefore: true },
  },
  {
    id: "light",
    age: "2-3",
    completedEvidence: { colors: [0, 1, 2] },
    incompleteEvidence: { colors: [0, 1] },
  },
  {
    id: "light",
    age: "4-5",
    completedWorld: { lights: [1, 1, 0] },
    incompleteWorld: { lights: [1, 0, 0] },
  },
  {
    id: "light",
    age: "6-8",
    completedWorld: { lights: [1, 1, 1] },
    incompleteWorld: { lights: [1, 1, 0.9] },
  },
  {
    id: "shapes",
    age: "2-3",
    completedWorld: { shapes: ["sphere", "sphere", "sphere"] },
    incompleteWorld: { shapes: ["sphere", "sphere", "cube"] },
  },
  {
    id: "shapes",
    age: "4-5",
    completedWorld: {
      shapes: ["cube", "cube", "cube", "cube", "cube"],
      sorted: 5,
    },
    incompleteWorld: {
      shapes: ["cube", "cube", "cube", "cube", "cube"],
      sorted: 4,
    },
  },
  {
    id: "shapes",
    age: "6-8",
    completedWorld: {
      shapes: [
        "sphere",
        "sphere",
        "sphere",
        "cube",
        "cube",
        "cube",
        "cube",
        "cube",
      ],
    },
    incompleteWorld: { shapes: Array(8).fill("sphere") },
  },
];

describe.each(examples)("$id / $age learning evidence", (example) => {
  it("keeps the discovery star locked without enough evidence and accepts the complete task", () => {
    const check = (w: Partial<WorldState> = {}, e: Partial<Evidence> = {}) =>
      taskComplete(
        example.id,
        example.age,
        2,
        { ...defaultWorld(), ...w },
        { ...defaultEvidence(), ...e },
      );
    expect(check()).toBe(false);
    expect(check(example.incompleteWorld, example.incompleteEvidence)).toBe(
      false,
    );
    expect(check(example.completedWorld, example.completedEvidence)).toBe(true);
  });

  it("allows observation but requires a real interaction before leaving the trial step", () => {
    expect(
      taskComplete(
        example.id,
        example.age,
        0,
        defaultWorld(),
        defaultEvidence(),
      ),
    ).toBe(true);
    expect(
      taskComplete(
        example.id,
        example.age,
        1,
        defaultWorld(),
        defaultEvidence(),
      ),
    ).toBe(false);
    expect(
      taskComplete(example.id, example.age, 1, defaultWorld(), {
        ...defaultEvidence(),
        actions: 1,
      }),
    ).toBe(true);
  });
});

it("does not accept excess or invalid pieces for the eight-piece combination", () => {
  const check = (shapes: WorldState["shapes"]) =>
    taskComplete(
      "shapes",
      "6-8",
      2,
      { ...defaultWorld(), shapes },
      defaultEvidence(),
    );
  expect(check(["sphere", ...Array(8).fill("cube")])).toBe(false);
  expect(check(["sphere", "cylinder", ...Array(6).fill("cube")])).toBe(false);
});

it("requires five items of the same shape, not a mixed group with a matching sorted count", () => {
  const mixed: WorldState = {
    ...defaultWorld(),
    shapes: ["sphere", "cube", "cube", "cube", "cube"],
    sorted: 5,
  };
  expect(taskComplete("shapes", "4-5", 2, mixed, defaultEvidence())).toBe(
    false,
  );
});
