// create.js
// AI was consulted for some portions of this file.
// create command allows the user to create an issue
// Usage: baton create --title <text> --description <text> --priority <level> --token-limit <n>
//        baton create                  (launches interactive prompt mode)
//
// Examples:
//   baton create --title "Fix login bug" --priority high
//   baton create --title "Refactor auth" --description "Clean up JWT logic" --token-limit 4000
//   baton create                         # interactive mode
//
// Options:
//   --title <text>         Issue title (defaults to "Issue #<id>" if omitted)
//   --description <text>   Issue description
//   --priority <level>     low | medium | high  (default: low)
//   --token-limit <n>      Optional token budget for this issue
//   -h, --help             Show this help

import { createIssue } from "../services/issuesService.js";
import { parseArgs } from "../util.js";
import { issueSchema } from "../models/schema.js";
import { input, select, confirm, editor } from "@inquirer/prompts";
import { spawnSync } from "child_process";
import { writeFileSync, readFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

// Derived from issueSchema
const VALID_FLAGS = new Set(Object.values(issueSchema).map((c) => c.flag));

// Build select choices from issueSchema.priority.values so the list stays in
// sync with the Priority enum without any duplication.
const PRIORITY_HINTS = {
  Low: "routine work, no urgency",
  Medium: "should be resolved this week",
  High: "blocking or time-sensitive",
};
const PRIORITY_CHOICES = issueSchema.priority.values.map((v) => ({
  name: `${v.padEnd(6)} -- ${PRIORITY_HINTS[v] ?? v}`,
  value: v,
}));
const DEFAULT_PRIORITY = issueSchema.priority.values[0];

const DESCRIPTION_PLACEHOLDER = [
  "## What is the issue?",
  "",
  "## Steps to reproduce (if applicable)",
  "",
  "## Expected vs actual behaviour",
  "",
  "## Additional context",
  "",
].join("\n");

/**
 * Opens the user's $EDITOR with an optional seed template and returns the
 * saved contents, or null if the user left it unchanged / empty.
 *
 * Falls back gracefully: if no $EDITOR is set the inquirer `editor` prompt is
 * used instead (which has its own built-in text area).
 *
 * @param {string} template   Initial file content shown to the user.
 * @returns {Promise<string|null>}
 */
async function openEditorForDescription(template = DESCRIPTION_PLACEHOLDER) {
  const editorBin = process.env.EDITOR || process.env.VISUAL;

  if (!editorBin) {
    // If no $EDITOR set, then fall back to @inquirer/prompts built-in editor widget
    const result = await editor({
      message:
        "Description (opens in-terminal editor -- save & quit when done):",
      default: template,
      waitForUseInput: false,
    });
    const cleaned = result.trim();
    return cleaned && cleaned !== template.trim() ? cleaned : null;
  }

  // Write template to a temp file, open $EDITOR, read back the result
  const tmpPath = join(tmpdir(), `baton-issue-${Date.now()}.md`);
  writeFileSync(tmpPath, template, "utf8");

  const result = spawnSync(editorBin, [tmpPath], { stdio: "inherit" });

  if (result.error) {
    unlinkSync(tmpPath);
    throw new Error(
      `Could not open $EDITOR (${editorBin}): ${result.error.message}`,
    );
  }

  const saved = readFileSync(tmpPath, "utf8");
  unlinkSync(tmpPath);

  const cleaned = saved.trim();
  // Return null if the user saved without changing anything
  return cleaned && cleaned !== template.trim() ? cleaned : null;
}

/**
 * Guides the user through issue creation with interactive prompts.
 * @returns {Promise<object>} Options object ready to pass to createIssue()
 */
async function runInteractiveMode() {
  console.log("\n  Baton -- interactive issue creation\n");

  // Title
  const title = await input({
    message: "Title:",
    required: true,
    validate: (val) => val.trim().length > 0 || "Title cannot be empty.",
  });

  // Priority
  const priority = await select({
    message: "Priority:",
    choices: PRIORITY_CHOICES,
    default: DEFAULT_PRIORITY,
  });

  // Token limit
  const wantsTokenLimit = await confirm({
    message: "Set a token limit for this issue?",
    default: false,
  });

  let tokenLimit = null;
  if (wantsTokenLimit) {
    const raw = await input({
      message: "Token limit (positive integer):",
      validate: (val) => {
        const n = Number(val);
        return (Number.isInteger(n) && n > 0) || "Must be a positive integer.";
      },
    });
    tokenLimit = Number(raw);
  }

  // Description
  const wantsDescription = await confirm({
    message: "Add a description?",
    default: true,
  });

  let description = null;
  if (wantsDescription) {
    const editorBin = process.env.EDITOR || process.env.VISUAL;
    const hint = editorBin ? `opens ${editorBin}` : "in-terminal editor";
    console.log(
      `  ->  ${hint} -- fill in what's relevant, save and quit when done.\n`,
    );
    description = await openEditorForDescription();
  }

  // Preview & confirm
  console.log("\n" + "-".repeat(48));
  console.log(`  Title      : ${title}`);
  console.log(`  Priority   : ${priority}`);
  console.log(`  Token limit: ${tokenLimit ?? "(none)"}`);
  if (description) {
    const preview = description.split("\n").slice(0, 3).join(" ").slice(0, 72);
    console.log(
      `  Description: ${preview}${description.length > 72 ? "..." : ""}`,
    );
  } else {
    console.log(`  Description: (none)`);
  }
  console.log("-".repeat(48) + "\n");

  const confirmed = await confirm({
    message: "Create this issue?",
    default: true,
  });
  if (!confirmed) {
    console.log("Aborted -- no issue created.");
    process.exit(0);
  }

  return { title, priority, tokenLimit, description };
}


/**
 * Initializes a new issue in the database with the specified fields
 * Drops into interactive mode when no flags are provided
 *
 * @param {string[]} args - The command line arguments
 * @returns {Promise<number>} The exit code: 0 is success, 1 is error
 */
export async function run(args) {
  // Flag validation -- VALID_FLAGS is derived from issueSchema, so this stays
  // current automatically when fields are added or renamed there
  const providedFlags = args.filter((a) => a.startsWith("--"));
  for (const flag of providedFlags) {
    if (!VALID_FLAGS.has(flag)) {
      const knownFlags = [...VALID_FLAGS].join(", ");
      throw new Error(
        `Unknown flag: ${flag}\nValid flags: ${knownFlags}\n` +
          `Tip: run \`baton create\` with no flags to use interactive mode.`,
      );
    }
  }

  try {
    // Interactive mode: no flags provided (human at a keyboard)
    // Flag mode:        at least one flag present (scripts, CI, power users)
    const isInteractive = providedFlags.length === 0;

    const options = isInteractive
      ? await runInteractiveMode()
      : parseArgs(args);

    const issue = await createIssue(options);

    console.log(`\nCreated issue #${issue.id}: "${issue.title}"`);
    return 0;
  } catch (error) {
    // when user hitsCtrl+C
    if (error.name === "ExitPromptError") {
      console.log("\nAborted.");
      return 0;
    }
    console.error(`Failed to create issue: ${error.message}`);
    return 1;
  }
}
