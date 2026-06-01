# Team #4 Service Layer subteam meeting: 5/28/2026 
## Meeting Type  
Technical Development meeting 

## Attendance
| Member name | Present |
|---|---|
| Albert Bunyi | Y|
| Anish Kondamadugula | Y|
| Yifei Du | Y|

## Location and Time  
- Zoom
- Sunday, May 28, 2026 @ 10:30pm
- Meeting end time: 11:00 pm

## Agenda  
- Delegate tasks for the Service Layer

## Notes
- Wrap all multi-step DB writes in transactions for atomicity, although no functionality in created does multi-step writes to the DB


## Tasks
| Task | Person(s)
|------|----------|
Add ```In-Review``` to ```Status``` enum and DB schema CHECK constraint | Anish 
Add ```last_updated``` column to DB schema, auto-update via SQL trigger | Anish
Fix ```rejection``` in DB CHECK constraint | Albert
Implement ```issue.validate()``` — enforce required fields, valid enums, positive ```tokenLimit``` | Albert
Add ```assignee``` field to DB schema and ```Issue``` model | Yifei
Write unit tests for all service functions | All

