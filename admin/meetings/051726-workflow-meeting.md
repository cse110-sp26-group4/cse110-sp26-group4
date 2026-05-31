# Team #4 Workflow Subteam Meeting 1 Notes: 5/17/2026 
## Meeting Type  
Workflow Subteam Meeting - Finalize Workflow

## Attendance
| Member name | Present |
|---|---|
| Phuong Dinh | Y|
| Albert Bunyi | Y|
| Anish Kondamadugula | Y|
| Jack Xiang | Y|
| Shermyn Cheah | Y|
| Yifei Du | Y|

## Location and Time  
- In person, Geisel 2nd Floor East
- Sunday, May 17, 2026 @ 8:05pm
- Meeting end time: 10:00 pm

## Agenda  
- Review all individual workflows
- Merge all workflows into one big workflow
  - Resolve any duplicate actions / conflicts in existing workflows

## Miro Board for Workflows
- https://miro.com/app/board/uXjVHSZ9d7w=/?share_link_id=955887020651

## Current Issues
- Need to make some decisions regarding how AI is used within application
- Does our CLI only work on issues meant for AI to work on, or do we also include issues that would be resolved by humans
  - Zach: I think this should be a feature we include, where you are able to turn off (override) AI usage for an issue.
- AI CREATES TICKET: Human, CLI Tool, AI Agent. Is it:
  - Human prompts AI Agent, AI agent uses our CLI tool. CLI tool gives a copy of databse to Agent. Agent creates ticket description, and calls CLI tool to create the ticket.
  - Human uses CLI tool, CLI tool has in-built AI Agent that reviews database and identifies issue. CLI tool then creates the ticket
- Are we integrating with Github? If so, how
  - Zach: This is something we COULD have, but I think for now we focus on creating the user flow without GitHub integration in mind.

## Decisions
- Tag entire team on Slack to make decisions regarding workflow
- Schedule emergency meeting with TA to clarify the questions on workflow and get feedback 
