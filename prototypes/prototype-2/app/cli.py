import click
from flask import Blueprint
import requests
import json

BASE_URL = 'http://127.0.0.1:5000/api/v1'

bp = Blueprint('cli', __name__, cli_group='issue-tracker')

@bp.cli.command('list')
@click.option('--status', help='Filter by status.')
@click.option('--assignee', help='Filter by assignee.')
@click.option('--priority', help='Filter by priority.')
def list_issues(status, assignee, priority):
    """List all issues."""
    params = {}
    if status:
        params['status'] = status
    if assignee:
        params['assignee'] = assignee
    if priority:
        params['priority'] = priority
    
    response = requests.get(f"{BASE_URL}/issues", params=params)
    if response.status_code == 200:
        issues = response.json()
        for issue in issues:
            click.echo(f"ID: {issue['id']}, Title: {issue['title']}, Status: {issue['status']}")
    else:
        click.echo(f"Error: {response.status_code} - {response.text}")

@bp.cli.command('show')
@click.argument('issue_id')
def show_issue(issue_id):
    """Show details of a specific issue."""
    response = requests.get(f"{BASE_URL}/issues/{issue_id}")
    if response.status_code == 200:
        issue = response.json()
        click.echo(json.dumps(issue, indent=2))
    else:
        click.echo(f"Error: {response.status_code} - {response.text}")

@bp.cli.command('create')
@click.option('--title', prompt=True)
def create_issue(title):
    """Create a new issue."""
    editor_content = click.edit('Please enter the description for the issue.')
    if editor_content is None:
        click.echo('No description provided. Aborting.')
        return
    
    description = editor_content

    data = {
        'title': title,
        'description': description,
        'creator_id': 'user' # Assume user for now
    }
    response = requests.post(f"{BASE_URL}/issues", json=data)
    if response.status_code == 201:
        issue = response.json()
        click.echo(f"Successfully created issue {issue['id']}")
    else:
        click.echo(f"Error: {response.status_code} - {response.text}")

@bp.cli.command('comment')
@click.argument('issue_id')
@click.argument('comment_text')
def add_comment(issue_id, comment_text):
    """Add a comment to an issue."""
    data = {
        'comment': comment_text,
        'sender_id': 'user'
    }
    response = requests.post(f"{BASE_URL}/issues/{issue_id}/comments", json=data)
    if response.status_code == 201:
        click.echo("Comment added.")
    else:
        click.echo(f"Error: {response.status_code} - {response.text}")
