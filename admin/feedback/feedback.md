# Review of Team 5

## Strengths

- The status video is very informative and professionally made, and all existing research and documentation is clearly available on the GitHub project page. The slides effectively communicate what the team has accomplished, what it is currently working on, and what issues the team has encountered.

- The README is informative and well-structured, clearly outlining the software being developed, the scope of the project, the technologies used, and directions for testing it yourself. This makes it easy for anyone to get a sense of the project, even without much technical background.

- The CI pipeline is very advanced, featuring several checks beyond just standard unit tests and code linting. There is linting for commit messages, which helps standardize and clarify commit histories. There is also automated version control with Release Please, which is another nice addition to ensure consistency.

- All progress and decisions recorded regarding the project are clearly organized, labeled, and have a well-illustrated thought process. The workflow diagrams and architecture documentation in the `/docs` folder are especially strong. They clearly explain how issues move through the system, how agents interact with the API, and how the backend and data model are structured. The diagrams make the project much easier to understand quickly and demonstrate a lot of planning and design beyond just implementation.

- The team makes effective use of GitHub Issues to track tasks, with custom tags dividing work into frontend and backend categories, as well as a clear use of Pull Requests to manage contributions.

---

## Improvements

- The tracker currently has no plans to track tokens or cost. Some form of token tracking should be added, as it could be useful for managers or stakeholders who view token usage as a measure of agent productivity or work done. Relatedly, including a way to track agent token usage and the time it takes for an agent to generate outputs would provide visibility into agent cost and output efficiency.

- Comment formatting is inconsistent between files. While each file is internally consistent, there is no standardized format across all scripts. The team should consider establishing and enforcing a unified comment style to improve overall readability.

- Of the ten JavaScript files, only one (`worker.js`) currently has any tests. More unit tests are needed for the remaining files. Some functionality may be too interdependent to test individually, but those cases can be addressed later with end-to-end testing.

- The README explains how to run the UI and API, but adding a short end-to-end walkthrough would be helpful. For example, a simple example flow covering how to create an issue, claim it as an agent, post a result, and close it. This would make onboarding and testing the core workflow much easier.

- The code repository could use more organization. There are `.js` and `.json` files sitting outside of any folders, which may make navigation and development more difficult as the project grows.

- A more refined definition of what constitutes a failure for an AI agent's attempt would help address concerns about the frequency of blocked issues and the need for regular human monitoring, such as checks for any ignored constraints or failures in the CI/CD pipeline.

- Meeting notes are currently split across two separate locations in the two repositories. Consolidating them into a single unified space would improve clarity and make it easier to track team decisions over time.

- Defining what "done" looks like for an issue before an agent picks it up, such as acceptance criteria or expected outcomes in the issue description, would give agents clearer guidance and make human review easier, since reviewers would know what to check against rather than judging an open-ended result.

---

## Questions

- The video mentions that claim locking is done atomically to prevent multiple AI agents from taking the same ticket. How does the design specifically ensure this? What would happen if two agents somehow did claim the same ticket, and how does the code prevent race conditions?

- How does the software plan to handle collaboration when multiple people are using the issue tracker simultaneously on the same project?

- The "blocked" status is used when something goes wrong with an agent. Is it possible to automatically detect when an AI agent has gone wrong, and if so, how would that work?

- How does the team plan to handle prioritization when both humans and AI agents are actively using the tracker? For example, if an AI agent has claimed an issue but a higher-priority issue is created afterward, should the agent finish its current task or switch to the new one?

- What options is the team currently considering for how tasks are assigned or distributed to agents?

- In `backlog.md`, a claim expires after 30 minutes, meaning one agent could potentially spend up to 1.5 hours on a single ticket in the worst case. Could this create situations where an agent spends an unnecessarily large number of tokens on one ticket before alerting the user? When an issue is returned to "open" after a failed claim, can another agent pick it up, and is there a limit to how many times an agent can attempt to resolve the same issue?

---

## Suggestions

- There are plans mentioned for an audit log, but it does not appear in the sprint plans. Implementing an audit log would be a logical next step to help human users track what each AI agent did and maintain a clear history of agent activity.

- Create unit test files for the remaining JavaScript files that can be tested individually, deferring end-to-end testing for functionality that is too interdependent. Additionally, consider tracking how many times an issue has transitioned to a "blocked" state — a high count could be a useful signal that a particular issue is especially difficult to resolve.

- Since the project already separates human users and AI agents in the architecture, implementing role-based dashboards or filtered views could be a valuable next step. For example, agents could see only claimable issues, while human reviewers could focus on items in "review" or "blocked" states.

- Consider logging any attempt that fails the automated test suite as a failure and/or "blocked" state. This would reduce the user's workload when reviewing escalated claims by surfacing failures earlier and more automatically.

- Adding more test data that covers edge cases, such as token usage reaching or surpassing its limit, would strengthen the test suite. Currently, there are only eight test cases, which likely leaves significant behavior untested.

- As agents start completing real work, consider linking issue results to actual code changes (e.g., a branch or pull request) rather than just a text summary in the tracker. This would make human review feel more natural and help AIT sit better alongside GitHub as the place where code is written and merged.

---

# Review of Team 2 (Extra Credit)

## Strengths

- The README makes it easy for users to understand how to use the product while also serving as a helpful reference for developers working on the project. The setup and installation instructions are thorough and clear, making it easy to get the program running locally. This likely makes it easier for contributors to stay on the same page and keep up with updates.

- The project is already installable, which is an impressive milestone at this stage of development.

- Unit tests specific to VS Code extensions (`.vscode-test.mjs`) are used, which demonstrates solid domain knowledge and a thoughtful approach to testing within this environment.

- Building the agent tracker as a VS Code extension is a smart design choice for accessibility. Since VS Code is used by a large portion of developers, this makes the tool easy to install and integrate into existing workflows.

- The GitHub Issues are detailed and well-structured, making it easy to understand the work being tracked.

- Templates are set up for things that need to be completed, which helps ensure consistency and reduces friction for contributors.

- The AIT feels centered around teamwork. The project aims to support how people actually plan and follow up on work together, rather than being disconnected from day-to-day collaboration.

---

## Improvements

- The GitHub tags are very overwhelming at first glance, and some appear redundant or unnecessary (for example, "can-break-down" and "multi-step"). Pruning or consolidating the tag system would make it easier to navigate.

- The repository structure is confusing for first-time viewers. There are many directories, several of which are currently empty, and some folders share the same names across different parts of the repo. Many directory names are also very short and cryptic (for example, `gh`, `gg`, `fc`, and `tc`), making it difficult to discern their purpose. Renaming directories to be more descriptive and removing or consolidating unused ones would significantly improve navigability. Additionally, loose `.js` and `.json` files outside of any folder should be moved into appropriately named directories to keep the repo organized as the project grows.

- Commits should not be pushed directly to the main branch. The team should utilize branches for individual issues and require Pull Requests to manage changes to main, both for safety and organizational purposes.

---

## Questions

- Since the extension is built on the VS Code API, have you considered failsafes in case the API encounters issues or its support is discontinued? Relatedly, have you run into any storage or scalability limitations using the VS Code API as the backing store for issues?

- In `gg_api_help_session_management.js`, parallel agent sessions appear to be supported. Have you considered the risks this introduces, such as race conditions where multiple agents work on the same issue without knowledge of each other?

- Since the extension is tightly integrated into VS Code, how does the team plan to handle portability in the future? If users wanted to use the tracker outside of VS Code or in a different editor, would the current architecture support that, or is the design intentionally VS Code-specific?

- How does the team plan to test how optimal the code is, given that it is so tightly coupled to VS Code?

- The project includes cost tracking — how would that differ for subscription-based AI services versus token top-up services?

- Has the team considered how they're integrating tracking features? Through a strict one-to-one sync with GitHub, or through added local tracking features that offer more flexibility but may sync less immediately?

---

## Suggestions

- Several files imported by `gg_api_help_session_management.js` do not yet exist. Even if no code has been written for them yet, adding placeholder or stub files would prevent confusion and make the intended structure clearer to contributors. Along the same lines, the team should consider simplifying the backend structure further using the VS Code API, or alternatively, evaluating whether a lightweight database for issue storage would make scaling easier as the number of issues grows.

- Consider implementing configurable session limits, such as a maximum number of parallel agents or a maximum function-call depth. This would help prevent runaway agent loops and make resource usage easier to control during testing.

- The current documentation, particularly the meeting minutes, is functional but could be clearer about what the team is currently working on and what blockers exist. Improving this would make it easier for others to understand the project's current state at a glance.

- Protect the main branch and require Pull Requests with at least one reviewer before merging. This was noted as an improvement as well, but making it a concrete enforced policy in the repository settings would ensure it is followed consistently going forward.

- Focus on getting one small feature fully working end to end. This would demonstrate that the project is a functioning application and not just a framework, which is valuable both for testing and for building confidence in the design.