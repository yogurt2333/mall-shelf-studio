import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const mojibakeSentinels = ["涓", "�", "�?", "鈫"];

function readUtf8(path: string) {
  return readFileSync(path, "utf8");
}

describe("project documentation", () => {
  test("keeps the MVP spec and domain context readable", () => {
    const mvpSpec = readUtf8("docs/MVP_SPEC.md");
    const context = readUtf8("docs/CONTEXT.md");

    expect(mvpSpec).toContain("A00 中岛横向货柜组");
    expect(mvpSpec).toContain("女款休闲包");
    expect(context).toContain("Cabinet Group");

    for (const sentinel of mojibakeSentinels) {
      expect(mvpSpec).not.toContain(sentinel);
      expect(context).not.toContain(sentinel);
    }
  });

  test("links README readers to the key project documents", () => {
    const readme = readUtf8("README.md");

    expect(readme).toContain("[MVP Spec](./docs/MVP_SPEC.md)");
    expect(readme).toContain("[Domain Context](./docs/CONTEXT.md)");
  });
});
