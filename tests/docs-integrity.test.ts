import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const mojibakeSentinels = ["涓", "�", "�?", "鈫"];

function readUtf8(path: string) {
  return readFileSync(path, "utf8");
}

describe("project documentation and UI copy", () => {
  test("keeps the MVP spec, domain context, and visible UI copy readable", () => {
    const files = [
      readUtf8("docs/MVP_SPEC.md"),
      readUtf8("docs/CONTEXT.md"),
      readUtf8("src/App.tsx"),
      readUtf8("src/floorPlanConfig.ts"),
      readUtf8("tests/e2e/app-shell.spec.ts"),
    ];

    expect(files.join("\n")).toContain("A00 中岛横向货柜组");
    expect(files.join("\n")).toContain("女款休闲包");
    expect(files.join("\n")).toContain("Cabinet Group");
    expect(files.join("\n")).toContain("固定商场平面图");
    expect(files.join("\n")).toContain("选择一个货柜组开始编辑陈列");

    for (const sentinel of mojibakeSentinels) {
      for (const content of files) {
        expect(content).not.toContain(sentinel);
      }
    }
  });

  test("links README readers to the key project documents", () => {
    const readme = readUtf8("README.md");

    expect(readme).toContain("[MVP Spec](./docs/MVP_SPEC.md)");
    expect(readme).toContain("[Domain Context](./docs/CONTEXT.md)");
  });
});
