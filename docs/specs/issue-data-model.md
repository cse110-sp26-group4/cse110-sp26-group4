# Issue Data Model Definition

## Items to input per issue:
- User/Agent input required when creating issues
- Required fields must be filled in, else failure to create issue

| Field | Type | Required | Default | Description |
| -------- | -------- | ------- | ----- | ------ |
| ```title``` | string | Yes | "Issue #" | The name for the issue |
| ```status```| enum | Yes | ```Open``` | Options: (Open/In-Progress/Closed) |
| ```priority``` | enum | No | ```Low``` | Options: (Low/Medium/High) |
| ```tokenLimit``` | int | No | N/A | Integer values that range from [0, INT_MAX] |
| ```description``` | string | No | N/A | Text description of current issue + notes from attempts(if applicable) |

## Auto generated per issue:
- All items that are auto generated cannot be ```null```, and are automatically filled so will not be ```null```

| Item | Type | Description |
| ---- | ----- | --- |
| ```id``` | int | Auto-generated | The unique identifying number for the issue |
| ```created_at``` | TIMESTAMP | The time when the issue was created in the format of  (HH:MM:SS YYYY-MM-DD) |
| ```attempt_num``` | int | Running total for the number of attempts to resolve the current issue |

# Activity log items:

| Item | Type | Description |
| ---- | ---- | --- |
| ```log_id``` | int | id system to keep track of activity history |
| ```id``` | int | The issue that was addressed |
| ```created_at``` | TIMESTAMP | The time when the event occurred in the format of  (HH:MM:SS YYYY-MM-DD) |
| ```action``` | enum | The action performed on the issue: (state_change, priority_change, edit, read, creation, deletion) |
| ```details``` | string | Details of what occurred at each action |


## Implementation:
- All data is stored in SQL 
- The data per issue will be stored as a sqlite entry with the keys defined in the tables above in the ```issues``` table
- Activity log will store every instance of actions occurring in the ```activity``` table, including: creation: (creation of issues), state_change: (status change of issues such as from closed to open), deletion: (deletion of issues), read: (issue accessed), edit: (attempts made to address issue, comment addition, edits to any input field), priority_change: (change of priority such as from low to high). Events will automatically be appended to activity log to ensure integrity of ```activity``` table.

## SQL Schema:
### ```issues``` table
```
-- 1. Create the table 
CREATE TABLE IF NOT EXISTS issues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    attempt_num INTEGER DEFAULT 0 NOT NULL,
    title TEXT DEFAULT 'PENDING', -- Temporary placeholder
    status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In-Progress', 'Closed')),
    priority TEXT DEFAULT 'Low' CHECK (priority IN ('Low', 'Medium', 'High')),
    token_limit INTEGER CHECK (token_limit >= 0),
    description TEXT
);

-- 2. Create the Trigger to auto-format the title with incrementing vals
CREATE TRIGGER IF NOT EXISTS set_default_issue_title
AFTER INSERT ON issues
FOR EACH ROW
WHEN NEW.title = 'PENDING' OR NEW.title IS NULL
BEGIN
    UPDATE issues 
    SET title = 'Issue #' || NEW.id 
    WHERE id = NEW.id;
END;
```

### ```activity``` table
```
CREATE TABLE IF NOT EXISTS activity (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT, -- Unique ID for the log entry itself
    issue_id INTEGER,                          -- The ID of the issue (kept after deletion)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    action TEXT NOT NULL 
        CHECK (action IN (
            'state_change', 
            'priority_change', 
            'edit', 
            'read', 
            'creation',
            'deletion'
        )),
    details TEXT
    -- We keep the issue_id to ensure the audit trail remains intact.
);
```

### Logic for deletion of issues
1. Add the deletion to the ```activity``` table with ```action``` set to ```deletion```
   ```
    INSERT INTO activity (issue_id, action, details) 
    VALUES (/* insert issue id */, 'deletion', '/* insert issue title */ was deleted by supervisor.');
   ```
2. Remove the issue from ```issues``` table
   ```
   DELETE FROM issues WHERE id = /* insert issue id */;
   SELECT strftime('%H:%M:%S %Y-%m-%d', event_timestamp) as formatted_time, action 
    FROM activity 
    WHERE issue_id = ?;
   ```
