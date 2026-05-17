# Prototype 2.0: AI-Powered Issue Tracker

This is a working prototype of the AI-powered issue tracking system.

## Setup

1.  Install the required dependencies:
    ```bash
    pip install -r requirements.txt
    ```
2.  Initialize the database:
    ```bash
    flask db init
    flask db migrate -m "Initial migration."
    flask db upgrade
    ```
3.  Run the application:
    ```bash
    flask run
    ```

## CLI

The CLI is available through the `issue-tracker` command.
```bash
issue-tracker --help
```
