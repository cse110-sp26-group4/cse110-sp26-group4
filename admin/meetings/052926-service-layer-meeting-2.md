# Team #4 Service Layer subteam meeting: 5/29/2026 
## Meeting Type  
Technical Development meeting 

## Attendance
| Member name | Present |
|---|---|
| Albert Bunyi | Y|
| Anish Kondamadugula | Y|
| Yifei Du | Y|

## Location and Time  
- Pepper Canyon West, Vela
- Sunday, May 28, 2026 @ 2:15pm
- Meeting end time: 5:00 pm

## Agenda  
- Complete the tasks asssigned on 05/28/26

## Notes
- As a subteam, we worked on our individual tasks and then reviewed them 
- Wrap all multi-step DB writes in transactions for atomicity, although no functionality in created does multi-step writes to the DB


## Tasks
| Task | Person(s)
|------|----------|
(Complete) Add ```In-Review``` to ```Status``` enum and DB schema CHECK constraint | Anish 
(Complete) Add ```last_updated``` column to DB schema, auto-update via SQL trigger | Anish
(Complete) Fix ```rejection``` in DB CHECK constraint | Albert
(Complete) Implement ```issue.validate()``` — enforce required fields, valid enums, positive ```tokenLimit``` | Yifei
(Complete) Add ```assignee``` field to DB schema and ```Issue``` model | Yifei
(Complete) Review PRs for code | All
Write unit tests for all service functions | All
