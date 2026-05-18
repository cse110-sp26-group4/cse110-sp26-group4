# CRUD CLI Commands and Flags

# Commands
| Command | Description | Example Command| Example Output |
|---------|-------------|----------------|----------------|
|create --title <issue name> --priority <priority> --assignee <user> | creating an issue with an issue name, priority, and user assignee | create --title "Login bug" --priority high --assignee kalyssa | issue id #12 created |
|list|outputs a list of all issues|list --status open|ID   TITLE   STATUS <br> 12   Login bug  open <br> 18   OAuth failure   open |
|view <id>|view a specific issue's information by id|view 12||
|update <id>|update a specific issue based on id|update 12 --status in-progress||
|claim <id>|current user claims the issue with id <id>|claim 12||
|delete <id>|delete issue with id <id>|delete 12||
|close <id>|close the issue with id <id>|close 12||
|reopen <id>|reopen a closed issue with id <id>| reopen 12 ||
|comment <id> -m <message>|comment on an issue with id <id>|comment 12 -m "Waiting on frontend fix"||
|||||
