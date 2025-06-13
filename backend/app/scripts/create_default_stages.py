from app.core.database import SessionLocal
from app.models.property import PropertyStage
from datetime import datetime

# Define default stages
DEFAULT_STAGES = [
    ("Offer Accepted", "pending", "Initial acceptance of offer by the estate agent"),
    ("Buyer ID Verification", "pending", "Buyer provides proof of ID and address"),
    ("Seller ID Verification", "pending", "Seller provides proof of ID and address"),
    ("Draft Contract Issued", "pending", "Seller's solicitor prepares and issues draft contract"),
    ("Searches Ordered", "pending", "Buyer's solicitor orders property searches"),
    ("Searches Received & Reviewed", "pending", "Buyer's solicitor reviews search results"),
    ("Survey Booked", "pending", "Buyer arranges property survey"),
    ("Survey Completed", "pending", "Surveyor completes property survey"),
    ("Mortgage Offer Received", "pending", "Buyer receives mortgage offer from lender"),
    ("Enquiries Raised", "pending", "Buyer's solicitor raises enquiries with seller's solicitor"),
    ("Enquiries Answered", "pending", "Seller's solicitor answers enquiries"),
    ("Exchange Contracts", "pending", "Contracts are exchanged and deposit is paid"),
    ("Completion", "pending", "Final payment is made and ownership is transferred")
]

def create_default_stages(property_id=1):
    db = SessionLocal()
    try:
        for i, (stage, status, description) in enumerate(DEFAULT_STAGES):
            exists = db.query(PropertyStage).filter_by(property_id=property_id, stage=stage).first()
            if not exists:
                db.add(PropertyStage(
                    property_id=property_id,
                    stage=stage,
                    status=status,
                    description=description,
                    order=i,
                    is_draft=False,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                ))
        db.commit()
        print(f"Default stages created for property_id={property_id}")
    except Exception as e:
        print(f"Error creating stages: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_default_stages() 