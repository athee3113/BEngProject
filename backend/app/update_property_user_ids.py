from app.core.database import SessionLocal
from app.models.user import User
from app.models.property import Property

def update_property_user_ids():
    db = SessionLocal()
    try:
        buyer = db.query(User).filter(User.email == 'buyer@example.com').first()
        buyer_solicitor = db.query(User).filter(User.email == 'buyer_solicitor@example.com').first()
        seller_solicitor = db.query(User).filter(User.email == 'seller_solicitor@example.com').first()
        agent = db.query(User).filter(User.email == 'agent@example.com').first()
        prop = db.query(Property).filter(Property.address == '123 Main Street').first()
        if not (buyer and buyer_solicitor and seller_solicitor and agent and prop):
            print('One or more users or the property not found.')
            return
        prop.buyer_id = buyer.id
        prop.buyer_solicitor_id = buyer_solicitor.id
        prop.seller_solicitor_id = seller_solicitor.id
        prop.estate_agent_id = agent.id
        db.commit()
        print(f"Updated property '{prop.address}' with buyer_id={buyer.id}, buyer_solicitor_id={buyer_solicitor.id}, seller_solicitor_id={seller_solicitor.id}, estate_agent_id={agent.id}")
    except Exception as e:
        print(f'Error updating property: {e}')
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    update_property_user_ids() 