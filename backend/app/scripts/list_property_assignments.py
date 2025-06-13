from app.core.database import SessionLocal
from app.models.property import Property
from app.models.user import User

def main():
    db = SessionLocal()
    props = db.query(Property).all()
    for p in props:
        print(
            f"Property {p.id}: "
            f"buyer_id={p.buyer_id}, seller_id={p.seller_id}, "
            f"buyer_solicitor_id={p.buyer_solicitor_id}, seller_solicitor_id={p.seller_solicitor_id}, "
            f"estate_agent_id={p.estate_agent_id}"
        )
    db.close()

if __name__ == "__main__":
    main() 