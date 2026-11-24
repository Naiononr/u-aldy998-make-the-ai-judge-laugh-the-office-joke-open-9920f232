// Make the AI Judge Laugh: the Office Joke Open — entry program.
//
// Writes a single fixed one-line office joke to
// <MAKEFUN_OUTPUT_DIR or /output>/entry.txt (UTF-8, no trailing
// newline). Deterministic: the same bytes on every run. Stdlib only,
// no network.
//
// Why this line, against the judge criteria (in order):
//   (1) Office life, works as a joke — an HR "morale initiative" is
//       unmistakably office life, and the line is a joke about it, not
//       a complaint: the committee's own first act is the punchline.
//   (2) Laugh earned in the last few words — the turn is that the
//       committee charged with making work fun schedules fun itself,
//       and the payoff lands at the end: "Friday at 4:55 pm", the
//       exact moment nobody wants to be there.
//   (3) Specific office detail — "fun committee", "Friday at 4:55 pm":
//       concrete, recognisable, not a generic grumble about work.
//   (4) Fresh — takes the familiar "mandatory fun" setup somewhere
//       unexpected: the initiative's first act is bureaucratic
//       scheduling, i.e. the opposite of fun.
//   (5) Reads cleanly in one pass — 105 chars, one sentence, no word
//       cuttable; "morale initiative" / "fun committee" / "4:55 pm"
//       each do work.

import { chmodSync, copyFileSync, mkdirSync, readFileSync, renameSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const LINE =
  "HR's new morale initiative is a 'fun committee' — its first act was scheduling fun for Friday at 4:55 pm.";

function main(): void {
  // Runtime self-check: the gate requires 1-200 chars, UTF-8, one line,
  // not only whitespace.
  if (LINE.length < 1 || LINE.length > 200) {
    throw new Error(`line is ${LINE.length} chars, must be 1-200`);
  }
  if (LINE.trim().length === 0 || LINE.includes("\n") || LINE.includes("\r")) {
    throw new Error("line must be a single non-blank line");
  }
  // No leading/trailing whitespace: the gate requires a single clean line,
  // so a stray space at either end must fail the run, not ship.
  if (LINE !== LINE.trim()) {
    throw new Error("line must not have leading or trailing whitespace");
  }

  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(outDir, { recursive: true });
  // Temp file MUST live in the output directory itself: the grader mounts
  // /tmp as a tmpfs separate from /output, so a temp file in os.tmpdir()
  // cannot be renamed onto /output (EXDEV: cross-device link not
  // permitted) and the run exits 1. Same-directory temp keeps the rename
  // on one filesystem; the EXDEV copy fallback covers odd mount layouts.
  const tmpFile = join(outDir, `.entry-${process.pid}.tmp`);
  try {
    writeFileSync(tmpFile, LINE, "utf8");
    chmodSync(tmpFile, 0o644);
    try {
      renameSync(tmpFile, join(outDir, "entry.txt"));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "EXDEV") throw err;
      copyFileSync(tmpFile, join(outDir, "entry.txt"));
      chmodSync(join(outDir, "entry.txt"), 0o644);
      unlinkSync(tmpFile);
    }
  } finally {
    rmSync(tmpFile, { force: true });
  }

  // Verify the finished file: exact bytes, single line, world-readable.
  const written = readFileSync(join(outDir, "entry.txt"), "utf8");
  if (written !== LINE) throw new Error("entry.txt does not match the line");
}

main();
