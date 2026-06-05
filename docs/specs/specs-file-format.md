# Specs file format for `baton init`

`baton init` reads a Markdown specs file and creates one issue per matching table row. The parser lives in `source/commands/init.js` (`parseMustRequirements`).

## Quick rules

1. File must be **plain Markdown** (`.md` recommended).
2. Each issue comes from a **single table row** that contains the exact text `| Must |` (spaces matter).
3. The row must be a **pipe table** with at least **3 columns** after splitting on `|`.
4. **Column 1** (issue title in DB): requirement ID starting with `FR-` (e.g. `FR-1.1`).
5. **Column 2**: must be the priority label `Must` (only these rows are imported).
6. **Column 3** (issue description in DB): full requirement text.
7. Rows with `Should`, `Could`, or `Won't` are **skipped** for now in the MVP. Subject to change in future iterations.
8. Header/separator rows (no `FR-` id) are **skipped**.

## Table layout

```markdown
| ID     | Priority | Requirement                                      |
|--------|----------|--------------------------------------------------|
| FR-1.1 | Must     | The system shall do something important.         |
| FR-1.2 | Must     | The system shall do something else.              |
| FR-1.3 | Should   | Optional requirement — not turned into an issue.   |
```

### How columns map to issues

| Table column | Example        | Stored as issue field |
|--------------|----------------|------------------------|
| 1 — ID       | `FR-1.1`       | `title`                |
| 2 — Priority | `Must`         | (filter only; not stored) |
| 3 — Requirement | `The system shall…` | `description`     |

All seeded issues get `priority: Medium` and `status: Open` in code today (not read from the table).

## Minimal valid file

Save as e.g. `my-specs.md`:

```markdown
# My product specs

| ID     | Priority | Requirement |
|--------|----------|-------------|
| FR-1.1 | Must     | Users can sign in with email and password. |
| FR-1.2 | Must     | Users can reset a forgotten password. |
```

Run:

```bash
baton init --specs ./my-specs.md
# or
baton init ./my-specs.md
```

Expected issues:

| Title   | Description                              |
|---------|------------------------------------------|
| FR-1.1  | Users can sign in with email and password. |
| FR-1.2  | Users can reset a forgotten password.    |

## Full example (matches default project specs style)

See `docs/specs/project-requirements.md` for a working file. A typical **Must** row looks like:

```markdown
| FR-1.1 | Must | The system shall allow a human supervisor to **create** a new issue via the CLI, providing at minimum a title, description, and priority level. |
```

- Markdown bold (`**create**`) in the requirement text is fine.
- Extra prose, headings, and legends above/below the table are fine; only matching rows are parsed.

## Rows that are ignored

| Line | Why ignored |
|------|-------------|
| `\| ID \| Priority \| Requirement \|` | No `\| Must \|`; ID is not `FR-…` |
| `\|----\|----------\|-------------…` | Separator row |
| `\| FR-1.5 \| Should \| …` | Priority is not `Must` |
| `\| BUG-1 \| Must \| …` | ID does not start with `FR-` |
| Empty lines, `# headings`, bullet lists | Not table rows |

## Invalid examples

**Wrong priority column (typo or extra spaces)**

```markdown
| FR-1.1 | must | The system shall… |
```

Not matched — parser looks for `| Must |` with that exact casing and spacing.

**Too few columns**

```markdown
| FR-1.1 | Must |
```

Skipped — need at least three cells after splitting on `|`.

**ID in wrong column**

```markdown
| Must | FR-1.1 | The system shall… |
```

Skipped — first cell must match `/^FR-/`.

## Default path

If you omit `--specs` and a positional path:

```text
docs/specs/project-requirements.md
```

(relative to the directory where you run `baton init`).

## Parser reference

Equivalent logic:

```js
for (const line of markdown.split('\n')) {
  if (!line.includes('| Must |')) continue;

  const cells = line.split('|').map((c) => c.trim()).filter(Boolean);
  if (cells.length < 3) continue;

  const id = cells[0];           // → issue title
  const requirement = cells[2];  // → issue description

  if (!/^FR-/.test(id) || !requirement) continue;
  // create issue { title: id, description: requirement, priority: 'Medium' }
}
```

## Copy-paste template

A minimal template file is at `docs/specs/specs-file.example.md`.
