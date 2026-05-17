You are a senior engineer. Your goal is to create an issue tracker / ticketing system where AI agents can get involved.

The tool should be a command line tool.

Please look through the workflows in this folder for an idea of what to do. Do not edit any existing files.

In the current directory, please create a mockup in a new directory called mockup-2. 

Here are a set of additional requirements: 

Must Have (non-negotiable):
AI needs a set of API CRUD (Create, Read, Update, Delete) endpoints
Humans need a graphical interface to also CRUD tickets
Humans should be able to pause/cancel AI created tickets
Humans must approve all changes being made
Full activity history so users can see every ticket change made by humans or AI

Should Have (wants):
A general chat system where humans can type general to AI, and the AI can decompose that idea into specific issues
For each CRUD action, the AI should log its thinking/reasoning for deciding to make that action. 
Token tracking system for AI processes 
Dashboard which displays sprint progress, finished work, and overdue issues
Way to hold a certain AI accountable for unoptimized code, bad ideas, inefficient work (possibly retiring it or replacing it)
Some sort of CRUD attempt / resolution time limit per ticket, to prevent AI from spending too many tokens on attempting to solve a ticket without user supervision 
Guidelines in terms of actions that must require user approval before proceeding (as part of a solution) to reduce user’s responsibility of reviewing these changes at the end 
Instructions for an agent to wait to resolve its ticket (or other handling methods)  if it’s dependent on the resolution of another ticket, so that it doesn’t try to solve multiple tickets in an attempt to solve its original problem. 

Could Have (wants - lower tier):
Let AI agents assign other AI agents specific tasks
Assign tasks to team members
Assign tasks points based on issue difficulty (using a points system)
Assign tasks tailored to a team members specific skills
Each individual ticket has a chat system between humans and the AI agent(s) handling the ticket
Email notifications after each action by the AI
AI-generated summaries for large tickets
A way to assign different levels of priority to each issue so that the AI addresses those first
A way to categorize tickets to restrict an agent’s repo-access to a specific area / logic branch to reduce each agent’s memory requirements
Efficient ticket design such that AI agents minimize the number of tokens used to acquire context

Won’t Have (dreams):
Give AI agents full control of the ticketing system
Let the AI resolve tickets without a person giving final say
