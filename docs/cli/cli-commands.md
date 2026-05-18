# CRUD CLI Commands and Flags

# Commands
| Command | Description | Example Command| Example Output |
|---------|-------------|----------------|----------------|
|create --title <issue name> --priority <priority> --assignee <user> | creating an issue with an issue name, priority, and user assignee | create --title "Login bug" --priority high --assignee kalyssa | issue id #12 created |
|list|outputs a list of all issues|issue list --status open|ID   TITLE            STATUS
12   Login bug        open
18   OAuth failure    open
|