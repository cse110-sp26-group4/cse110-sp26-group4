from flask import Blueprint, request, jsonify
from app import db
from app.models import Ticket, Activity
from app.schemas import TicketSchema
import json

bp = Blueprint('api', __name__)

@bp.route('/issues', methods=['POST'])
def create_issue():
    data = request.get_json() or {}
    # Basic validation
    if 'title' not in data or 'description' not in data:
        return jsonify({'error': 'must include title and description'}), 400

    ticket = Ticket(
        title=data['title'],
        description=data['description'],
        creator_id=data.get('creator_id', 'agent'), # Assume agent for now
        reasoning=data.get('reasoning')
    )
    db.session.add(ticket)
    db.session.commit()

    # Log activity
    activity = Activity(
        ticket_id=ticket.id,
        actor_id=ticket.creator_id,
        action='ticket.created',
        details=json.dumps({'title': ticket.title})
    )
    db.session.add(activity)
    db.session.commit()

    ticket_schema = TicketSchema()
    return jsonify(ticket_schema.dump(ticket)), 201

@bp.route('/issues', methods=['GET'])
def get_issues():
    status = request.args.get('status')
    assignee = request.args.get('assignee')
    priority = request.args.get('priority')

    query = Ticket.query
    if status:
        query = query.filter_by(status=status)
    if assignee:
        query = query.filter_by(assignee_id=assignee)
    if priority:
        query = query.filter_by(priority=priority)
    
    tickets = query.all()
    ticket_schema = TicketSchema(many=True)
    return jsonify(ticket_schema.dump(tickets))

@bp.route('/issues/<int:issue_id>', methods=['GET'])
def get_issue(issue_id):
    ticket = Ticket.query.get_or_404(issue_id)
    ticket_schema = TicketSchema()
    return jsonify(ticket_schema.dump(ticket))

@bp.route('/issues/<int:issue_id>', methods=['PUT'])
def update_issue(issue_id):
    ticket = Ticket.query.get_or_404(issue_id)
    data = request.get_json() or {}
    
    # For now, only allow updating title and description
    if 'title' in data:
        ticket.title = data['title']
    if 'description' in data:
        ticket.description = data['description']

    db.session.commit()

    # Log activity
    # ... (activity logging to be added)

    ticket_schema = TicketSchema()
    return jsonify(ticket_schema.dump(ticket))

@bp.route('/issues/<int:issue_id>/propose_change', methods=['POST'])
def propose_change(issue_id):
    ticket = Ticket.query.get_or_404(issue_id)
    data = request.get_json() or {}

    if 'changes' not in data:
        return jsonify({'error': 'must include changes'}), 400

    proposal = ChangeProposal(
        ticket_id=issue_id,
        comment=data.get('comment'),
        reasoning=data.get('reasoning'),
        changes=json.dumps(data['changes'])
    )
    db.session.add(proposal)
    
    ticket.status = 'in_review'
    db.session.add(ticket)
    
    db.session.commit()

    return jsonify({'message': 'Change proposal submitted'}), 202

@bp.route('/issues/<int:issue_id>/comments', methods=['POST'])
def add_comment(issue_id):
    ticket = Ticket.query.get_or_404(issue_id)
    data = request.get_json() or {}

    if 'comment' not in data:
        return jsonify({'error': 'must include comment'}), 400

    comment = ChatMessage(
        ticket_id=issue_id,
        sender_id=data.get('sender_id', 'user'), # Assume user for now
        content=data['comment']
    )
    db.session.add(comment)
    db.session.commit()

    return jsonify({'message': 'Comment added'}), 201
