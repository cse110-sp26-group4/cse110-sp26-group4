from app import db
import datetime

class Ticket(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    reasoning = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    creator_id = db.Column(db.String(255))
    assignee_id = db.Column(db.String(255))
    status = db.Column(db.String(64), default='open')
    priority = db.Column(db.String(64), default='medium')
    points = db.Column(db.Integer)
    dependencies = db.Column(db.String(255)) # Simple comma-separated string for now
    category = db.Column(db.String(128))

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    skills = db.Column(db.String(255)) # Simple comma-separated string

class Agent(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    type = db.Column(db.String(255))
    status = db.Column(db.String(64), default='active')
    # Performance metrics will be calculated, not stored directly as a single object
    tickets_closed = db.Column(db.Integer, default=0)
    rejection_rate = db.Column(db.Float, default=0.0)

class Activity(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey('ticket.id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    actor_id = db.Column(db.String(255))
    action = db.Column(db.String(255))
    details = db.Column(db.Text)

class ChatMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey('ticket.id'))
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    sender_id = db.Column(db.String(255))
    content = db.Column(db.Text)

class ChangeProposal(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey('ticket.id'), nullable=False)
    comment = db.Column(db.Text)
    reasoning = db.Column(db.Text)
    changes = db.Column(db.Text) # Storing JSON as text for simplicity
    status = db.Column(db.String(64), default='pending') # pending, approved, rejected
