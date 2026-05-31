// update.js
// AI was consulted for some portions of this file.
// update command allows the user to update data fields for an issue
// Usage: baton update <id> [options]
//        baton update <id>              (launches interactive mode pre-filled with current values)
//
// Options:
//  --title <text>         New title
//  --description <text>   New description
//  --token-limit <n>      New token budget
//  --status <s>           open | in-progress | closed
//  --priority <p>         low | medium | high
//  -h, --help             Show this help
//
// Examples:
//  baton update 3                        # interactive mode
//  baton update 3 --title "Revised title"
//  baton update 7 --status closed --priority medium

import { updateIssue, getIssue } from "../services/issuesService.js";
import { parseArgs } from "../util.js";
import { issueSchema } from "../models/schema.js";
import { input, select, confirm, editor } from "@inquirer/prompts";
import { spawnSync } from "child_process";
import { writeFileSync, readFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

// Derived from issueSchema -- stays current if fields are added or renamed there.
const VALID_FLAGS  = new Set(Object.values(issueSchema).map((c) => c.flag));
const FLAGS_HINT   = [...VALID_FLAGS].join(", ");
const USAGE        = "Usage: baton update <id> [options]";

// Build select choices from issueSchema enums so they stay in sync automatically.
const PRIORITY_HINTS = {
    Low:         "routine work, no urgency",
    Medium:      "should be resolved this week",
    High:        "blocking or time-sensitive",
};
const PRIORITY_CHOICES = issueSchema.priority.values.map((v) => ({
    name:  `${v.padEnd(6)} -- ${PRIORITY_HINTS[v] ?? v}`,
    value: v,
}));

const STATUS_CHOICES = issueSchema.status.values.map((v) => ({
    name:  v,
    value: v,
}));


/**
 * Opens the user's $EDITOR pre-filled with existing content.
 * Falls back to the inquirer built-in editor widget if $EDITOR is not set.
 * Returns null if the user saves without making any changes.
 *
 * @param {string} existing  Current description to pre-fill.
 * @returns {Promise<string|null>}
 */
async function openEditorForDescription(existing = "") {
    const editorBin = process.env.EDITOR || process.env.VISUAL;

    if (!editorBin) {
        const result = await editor({
            message: "Description (opens in-terminal editor -- save & quit when done):",
            default: existing,
            waitForUseInput: false,
        });
        const cleaned = result.trim();
        return cleaned !== existing.trim() ? cleaned : null;
    }

    const tmpPath = join(tmpdir(), `baton-issue-${Date.now()}.md`);
    writeFileSync(tmpPath, existing, "utf8");

    const result = spawnSync(editorBin, [tmpPath], { stdio: "inherit" });
    if (result.error) {
        unlinkSync(tmpPath);
        throw new Error(`Could not open $EDITOR (${editorBin}): ${result.error.message}`);
    }

    const saved = readFileSync(tmpPath, "utf8");
    unlinkSync(tmpPath);

    const cleaned = saved.trim();
    return cleaned !== existing.trim() ? cleaned : null;
}

/**
 * Prompts the user to edit each field of an existing issue.
 * Every prompt is pre-filled with the issue's current value so the user
 * only needs to change what they care about.
 *
 * @param {object} issue  The current issue object from the database.
 * @returns {Promise<object>} Partial options object containing only changed fields.
 */
async function runInteractiveMode(issue) {
    console.log(`\n  Baton -- editing issue #${issue.id}: "${issue.title}"\n`);

    // Collect all prompt results into one object keyed by schema field name.
    // The diff at the end loops over this -- no field names hardcoded there.
    const results = {};

    // Title
    results.title = await input({
        message: "Title:",
        default:  issue.title,
        validate: (val) => val.trim().length > 0 || "Title cannot be empty.",
    });

    // Status
    results.status = await select({
        message: "Status:",
        choices: STATUS_CHOICES,
        default: issue.status,
    });

    // Priority
    results.priority = await select({
        message: "Priority:",
        choices: PRIORITY_CHOICES,
        default: issue.priority,
    });

    // Token limit -- confirm-gated since it is optional
    const currentLimit = issue.tokenLimit ?? null;
    const wantsTokenLimit = await confirm({
        message: `Set a token limit?${currentLimit ? ` (currently ${currentLimit})` : ""}`,
        default: currentLimit !== null,
    });
    if (wantsTokenLimit) {
        const raw = await input({
            message: "Token limit (positive integer):",
            default:  currentLimit ? String(currentLimit) : undefined,
            validate: (val) => {
                const n = Number(val);
                return (Number.isInteger(n) && n > 0) || "Must be a positive integer.";
            },
        });
        results.tokenLimit = Number(raw);
    } else {
        results.tokenLimit = null;
    }

    // Description -- $EDITOR flow, keep original if the user makes no changes
    const wantsDescription = await confirm({
        message: "Edit description?",
        default: true,
    });
    if (wantsDescription) {
        const editorBin = process.env.EDITOR || process.env.VISUAL;
        const hint = editorBin ? `opens ${editorBin}` : "in-terminal editor";
        console.log(`  ->  ${hint} -- edit the description, save and quit when done.\n`);
        const edited = await openEditorForDescription(issue.description ?? "");
        results.description = edited !== null ? edited : issue.description;
    } else {
        results.description = issue.description;
    }

    // Diff: loop over results and collect only what changed.
    // Adding a new prompt above is all that is needed -- nothing to update here.
    const pending = Object.fromEntries(
        Object.entries(results).filter(([key, val]) => val !== issue[key])
    );

    if (Object.keys(pending).length === 0) {
        console.log("\nNo changes made.");
        process.exit(0);
    }

    console.log("\n" + "-".repeat(48));
    for (const [key, val] of Object.entries(pending)) {
        const old = issue[key] ?? "(none)";
        const preview = String(val).split("\n").slice(0, 2).join(" ").slice(0, 60);
        console.log(`  ${key}: "${old}" -> "${preview}${String(val).length > 60 ? "..." : ""}"`);
    }
    console.log("-".repeat(48) + "\n");

    const confirmed = await confirm({ message: "Save changes?", default: true });
    if (!confirmed) {
        console.log("Aborted -- no changes saved.");
        process.exit(0);
    }

    return pending;
}


// --- Entry point ---

/**
 * Updates the specified fields for a given issue ID.
 * Drops into interactive mode when only an ID is provided and no field flags follow.
 *
 * @param {string[]} args - The command line arguments
 * @returns {Promise<number>} The exit code: 0 is success, 1 is error.
 */
export async function run(args) {
    if (args.length === 0 || args === "") {
        throw new Error(
            `Invalid input: No arguments entered.\n${USAGE}\nOptions: ${FLAGS_HINT}`
        );
    }

    const id = parseInt(args[0], 10);
    if (isNaN(id)) {
        throw new Error(
            `Invalid input: No ID entered.\n${USAGE}\nOptions: ${FLAGS_HINT}`
        );
    }

    // Check if user misspelled a flag
    for (const arg of args) {
        if (arg.startsWith("--") && !VALID_FLAGS.has(arg)) {
            throw new Error(`Unknown flag: ${arg}\nValid flags: ${FLAGS_HINT}`);
        }
    }

    try {
        const oldIssue = await getIssue(id);

        // Interactive mode: only the ID was passed, no field flags.
        // Flag mode:        at least one flag follows the ID.
        const providedFlags = args.slice(1).filter((a) => a.startsWith("--"));
        const isInteractive  = providedFlags.length === 0;

        const options = isInteractive
            ? await runInteractiveMode(oldIssue)
            : parseArgs(args.slice(1));

        const newIssue = await updateIssue(id, oldIssue, options);

        console.log(`\nSuccessfully updated issue #${id}:`);
        for (const key in options) {
            if (oldIssue[key] !== newIssue[key]) {
                console.log(`  ${key}: "${oldIssue[key]}" -> "${newIssue[key]}"`);
            } else {
                console.log(`  ${key}: No change (already set to "${newIssue[key]}")`);
            }
        }
        console.log("");
        return 0;
    } catch (error) {
        if (error.name === "ExitPromptError") {
            console.log("\nAborted.");
            return 0;
        }
        console.error(`Failed to update issue: ${error.message}`);
        return 1;
    }
}