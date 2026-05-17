from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from app.models import Ticket, User, Agent, ChatMessage, ChangeProposal

class TicketSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Ticket
        include_relationships = True
        load_instance = True

class UserSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = User
        include_relationships = True
        load_instance = True

class AgentSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Agent
        include_relationships = True
        load_instance = True

class ChatMessageSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = ChatMessage
        include_relationships = True
        load_instance = True

class ChangeProposalSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = ChangeProposal
        include_relationships = True
        load_instance = True
