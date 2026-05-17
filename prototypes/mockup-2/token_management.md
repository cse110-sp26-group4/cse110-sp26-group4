# Token Management

To control costs and prevent runaway processes, a token tracking system is essential.

## How it Works

1.  **Budgeting:**
    *   Each AI agent has a global budget (e.g., max tokens per day).
    *   Each ticket can have a specific token budget assigned to it.
2.  **Tracking:**
    *   Every API call made by an AI agent, and the corresponding response, is measured in tokens.
    *   This token usage is recorded and associated with both the agent and the specific ticket it's working on.
3.  **Enforcement:**
    *   If an agent exceeds its ticket-specific budget, its work on that ticket is automatically paused, and a human is notified.
    *   If an agent exceeds its global budget, it is deactivated until the budget resets (e.g., the next day).

## Viewing Token Usage

Token usage can be viewed in the GUI on the agent's profile page and on the ticket details page.

**CLI:**

```bash
# View token usage for a specific agent
issue-tracker agent show <agent_id> --show-tokens

# View token usage for a specific ticket
issue-tracker show <issue_id> --show-tokens
```

## Configuration

Token budgets are set in the `.issue-tracker/config.yml` file.

```yaml
agent_config:
  default_ticket_budget: 50000 # Default max tokens per ticket
  agents:
    - id: "agent-gpt4"
      daily_token_budget: 1000000
```
