# Product specs (example for baton init)

Use this file with:

```bash
baton init --specs docs/specs/specs-file.example.md
```

Only rows with `| Must |` and an `FR-*` id in the first column become issues.

---

## Requirements

| ID     | Priority | Requirement |
|--------|----------|-------------|
| FR-1.1 | Must     | The system shall expose a CLI to initialize the issue tracker. |
| FR-1.2 | Must     | The system shall persist issues in a local SQLite database. |
| FR-1.3 | Must     | The system shall record an activity log entry when an issue is created. |
| FR-1.4 | Should   | The system should support exporting issues to JSON. (ignored by init) |
| FR-1.5 | Could    | The system could send email notifications. (ignored by init) |
