from app.core.database import SessionLocal
from app.models.user import User
from app.models.property import Property
from app.core.security import get_password_hash

# Default estate agent details
AGENT_EMAIL = 'agent@example.com'
AGENT_FIRST_NAME = 'Agent'
AGENT_LAST_NAME = 'Smith'
AGENT_PASSWORD = 'password123'
AGENT_ROLE = 'Estate Agent'

def main():
    db = SessionLocal()
    try:
        # Check if agent exists
        agent = db.query(User).filter(User.email == AGENT_EMAIL).first()
        if not agent:
            agent = User(
                email=AGENT_EMAIL,
                first_name=AGENT_FIRST_NAME,
                last_name=AGENT_LAST_NAME,
                hashed_password=get_password_hash(AGENT_PASSWORD),
                role=AGENT_ROLE
            )
            db.add(agent)
            db.commit()
            db.refresh(agent)
            print(f"Created estate agent: {AGENT_EMAIL}")
        else:
            print(f"Estate agent already exists: {AGENT_EMAIL}")
        # Assign agent to all properties
        properties = db.query(Property).all()
        for prop in properties:
            prop.estate_agent_id = agent.id
        db.commit()
        print(f"Assigned agent {AGENT_EMAIL} to all properties.")
    finally:
        db.close()

if __name__ == "__main__":
    main() 