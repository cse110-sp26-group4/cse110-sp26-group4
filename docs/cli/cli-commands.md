# CRUD CLI Commands and Flags

## Commands
| Command | Description | Example Command| Example Output |
|---------|-------------|----------------|----------------|
|create --title \<issue name\> --priority \<priority\> --assignee \<user\> | creating an issue with an issue name, priority, and user assignee | create --title "Login bug" --priority high --assignee kalyssa | issue id #12 created |
|list|outputs a list of all issues|list --status open|12   Login bug  open <br> 18   OAuth failure   open |
|view \<id\>|view a specific issue's information by id|view 12||
|update \<id\>|update a specific issue based on id|update 12 --status in-progress||
|claim \<id\>|current user claims the issue with id <id>|claim 12||
|delete \<id\>|delete issue with id \<id\>|delete 12||
|close \<id\>|close the issue with id \<id\>|close 12||
|reopen \<id\>|reopen a closed issue with id \<id\>| reopen 12 ||
|comment \<id> -m \<message\>|comment on an issue with id <id>|comment 12 -m "Waiting on frontend fix"||
|history \<id\>|history of changes of an issue \(similar to github\)|history 12||
|status \<id\>|get status of an issue with id \<id\>|status 12||
|find \<flag\>|find an issue with a particular flag|find --assignee kalyssa <br> find --keyword "login"||
|assign --id \<id\> --assignee \<user\>|assign an issue with id \<id\> to a particular user|assign --id 12 --assignee kalyssa||
|login \<username\>|log in to claim issues for yourself|login kalyssa||

## Flags
- --title
- --description
- --status          \(open | in-progress | closed\)
- --priority        \(low | medium | high\)
- --assignee
- --label 
- --due-date
- --keyword
- --id 
