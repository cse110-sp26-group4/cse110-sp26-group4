import sqlite3
import os
import sys
import datetime
import json
import argparse

DB_PATH = "issues.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Issues Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS issues (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        attempt_num INTEGER DEFAULT 0 NOT NULL,
        title TEXT DEFAULT 'PENDING',
        status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Closed', 'Awaiting Approval', 'Paused')),
        priority TEXT DEFAULT 'Low' CHECK (priority IN ('Low', 'Medium', 'High')),
        token_limit INTEGER CHECK (token_limit >= 0),
        tokens_used INTEGER DEFAULT 0,
        description TEXT,
        proposed_fix TEXT,
        reasoning TEXT
    )
    ''')
    
    # Activity Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS activity (
        log_id INTEGER PRIMARY KEY AUTOINCREMENT,
        issue_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        action TEXT NOT NULL CHECK (action IN (
            'state_change', 'priority_change', 'edit', 'read', 'creation', 'deletion', 'approval', 'pause'
        )),
        user_type TEXT CHECK (user_type IN ('human', 'ai')),
        user_id TEXT,
        details TEXT
    )
    ''')
    
    # Trigger for Title
    cursor.execute('''
    CREATE TRIGGER IF NOT EXISTS set_default_issue_title
    AFTER INSERT ON issues
    FOR EACH ROW
    WHEN NEW.title = 'PENDING' OR NEW.title IS NULL
    BEGIN
        UPDATE issues 
        SET title = 'Issue #' || NEW.id 
        WHERE id = NEW.id;
    END;
    ''')
    
    conn.commit()
    conn.close()

def log_activity(issue_id, action, user_type, user_id, details):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO activity (issue_id, action, user_type, user_id, details)
    VALUES (?, ?, ?, ?, ?)
    ''', (issue_id, action, user_type, user_id, details))
    conn.commit()
    conn.close()

def create_issue(args):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO issues (title, priority, description, token_limit)
    VALUES (?, ?, ?, ?)
    ''', (args.title or 'PENDING', args.priority, args.description, args.token_limit))
    issue_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    log_activity(issue_id, 'creation', 'human', 'user', f"Issue created: {args.title}")
    print(f"Created Issue #{issue_id}")

def list_issues(args):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    query = "SELECT * FROM issues WHERE 1=1"
    params = []
    if args.status:
        query += " AND status = ?"
        params.append(args.status)
        
    cursor.execute(query, params)
    rows = cursor.fetchall()
    
    if args.json:
        print(json.dumps([dict(r) for r in rows], indent=2))
    else:
        print(f"{'ID':<5} | {'Title':<20} | {'Status':<15} | {'Priority':<8}")
        print("-" * 55)
        for r in rows:
            print(f"{r['id']:<5} | {r['title'][:20]:<20} | {r['status']:<15} | {r['priority']:<8}")
    conn.close()

def view_issue(args):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM issues WHERE id = ?", (args.id,))
    issue = cursor.fetchone()
    
    if not issue:
        print("Issue not found.")
        return

    print(f"--- Issue #{issue['id']}: {issue['title']} ---")
    print(f"Status: {issue['status']}")
    print(f"Priority: {issue['priority']}")
    print(f"Tokens: {issue['tokens_used']} / {issue['token_limit']}")
    print(f"Description: {issue['description']}")
    if issue['reasoning']:
        print(f"Latest AI Reasoning: {issue['reasoning']}")
    if issue['proposed_fix']:
        print(f"Proposed Fix: {issue['proposed_fix']}")
    
    print("\n--- Activity History ---")
    cursor.execute("SELECT * FROM activity WHERE issue_id = ? ORDER BY created_at DESC", (args.id,))
    for log in cursor.fetchall():
        print(f"[{log['created_at']}] {log['user_type'].upper()} ({log['user_id']}): {log['action']} - {log['details']}")
    
    conn.close()

def agent_work(args):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if issue exists and is not closed/paused
    cursor.execute("SELECT status, tokens_used, token_limit FROM issues WHERE id = ?", (args.id,))
    row = cursor.fetchone()
    if not row:
        print("Issue not found.")
        return
    
    status, tokens_used, token_limit = row
    if status in ('Closed', 'Paused'):
        print(f"Cannot work on issue in status: {status}")
        return
        
    if token_limit and (tokens_used + args.tokens) > token_limit:
        print("Token limit exceeded. Auto-pausing ticket.")
        cursor.execute("UPDATE issues SET status = 'Paused' WHERE id = ?", (args.id,))
        conn.commit()
        log_activity(args.id, 'pause', 'ai', args.agent_id, "Token limit hit.")
        return

    # Simulate proposing a fix
    cursor.execute('''
    UPDATE issues 
    SET status = 'Awaiting Approval', 
        reasoning = ?, 
        proposed_fix = ?,
        tokens_used = tokens_used + ?,
        attempt_num = attempt_num + 1
    WHERE id = ?
    ''', (args.reasoning, args.fix, args.tokens, args.id))
    
    conn.commit()
    conn.close()
    
    log_activity(args.id, 'edit', 'ai', args.agent_id, f"Proposed fix. Tokens used: {args.tokens}")
    print(f"Agent {args.agent_id} submitted a proposal for Issue #{args.id}. Awaiting human approval.")

def approve_issue(args):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT status FROM issues WHERE id = ?", (args.id,))
    row = cursor.fetchone()
    if not row or row[0] != 'Awaiting Approval':
        print("No pending proposal found for this issue.")
        return

    cursor.execute("UPDATE issues SET status = 'Closed' WHERE id = ?", (args.id,))
    conn.commit()
    conn.close()
    
    log_activity(args.id, 'approval', 'human', 'supervisor', "Approved AI proposal.")
    print(f"Issue #{args.id} approved and closed.")

def main():
    parser = argparse.ArgumentParser(prog='issue', description='AI-Integrated Issue Tracker Prototype')
    subparsers = parser.add_subparsers(dest='command')

    # Create
    p_create = subparsers.add_parser('create')
    p_create.add_argument('--title')
    p_create.add_argument('--priority', default='Low', choices=['Low', 'Medium', 'High'])
    p_create.add_argument('--description')
    p_create.add_argument('--token-limit', type=int)

    # List
    p_list = subparsers.add_parser('list')
    p_list.add_argument('--status')
    p_list.add_argument('--json', action='store_true')

    # View
    p_view = subparsers.add_parser('view')
    p_view.add_argument('id', type=int)

    # Agent Work
    p_work = subparsers.add_parser('work')
    p_work.add_argument('id', type=int)
    p_work.add_argument('--agent-id', required=True)
    p_work.add_argument('--reasoning', required=True)
    p_work.add_argument('--fix', required=True)
    p_work.add_argument('--tokens', type=int, default=100)

    # Approve
    p_approve = subparsers.add_parser('approve')
    p_approve.add_argument('id', type=int)

    args = parser.parse_args()

    if not os.path.exists(DB_PATH):
        init_db()

    if args.command == 'create':
        create_issue(args)
    elif args.command == 'list':
        list_issues(args)
    elif args.command == 'view':
        view_issue(args)
    elif args.command == 'work':
        agent_work(args)
    elif args.command == 'approve':
        approve_issue(args)
    else:
        parser.print_help()

if __name__ == '__main__':
    main()
