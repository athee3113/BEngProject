from app.core.database import SessionLocal
from app.models.property import Property, PropertyStage
from app.models.user import User
from datetime import datetime, timedelta

def update_property_stages():
    db = SessionLocal()
    try:
        # Find the property at 123 Main Street
        prop = db.query(Property).filter(Property.address == "123 Main Street").first()
        if not prop:
            print("Property not found")
            return

        # Delete existing stages
        db.query(PropertyStage).filter(PropertyStage.property_id == prop.id).delete()
        db.commit()

        # New stages
        stages = [
            {"stage": "Offer Accepted", "responsible_role": "estate_agent", "description": "Initial acceptance of offer by the estate agent"},
            {"stage": "Buyer ID Verification", "responsible_role": "buyer", "description": "Buyer provides proof of ID and address"},
            {"stage": "Seller ID Verification", "responsible_role": "seller", "description": "Seller provides proof of ID and address"},
            {"stage": "Draft Contract Issued", "responsible_role": "seller_solicitor", "description": "Seller's solicitor prepares and issues draft contract"},
            {"stage": "Searches Ordered", "responsible_role": "buyer_solicitor", "description": "Buyer's solicitor orders property searches"},
            {"stage": "Searches Received & Reviewed", "responsible_role": "buyer_solicitor", "description": "Buyer's solicitor reviews search results"},
            {"stage": "Survey Booked", "responsible_role": "buyer", "description": "Buyer arranges property survey"},
            {"stage": "Survey Completed", "responsible_role": "surveyor", "description": "Surveyor completes property survey"},
            {"stage": "Mortgage Offer Received", "responsible_role": "buyer", "description": "Buyer receives mortgage offer from lender"},
            {"stage": "Proof of Funds Verified", "responsible_role": "buyer", "description": "Buyer provides proof of funds"},
            {"stage": "Enquiries Raised by Buyer's Solicitor", "responsible_role": "buyer_solicitor", "description": "Buyer's solicitor raises enquiries"},
            {"stage": "Enquiries Answered by Seller's Solicitor", "responsible_role": "seller_solicitor", "description": "Seller's solicitor answers enquiries"},
            {"stage": "Final Contract Approved", "responsible_role": "both_solicitors", "description": "Both solicitors approve final contract"},
            {"stage": "Contracts Signed by Buyer & Seller", "responsible_role": "both_parties", "description": "Buyer and seller sign contracts"},
            {"stage": "Completion Date Agreed", "responsible_role": "both_solicitors", "description": "Both solicitors agree on completion date"},
            {"stage": "Deposit Paid by Buyer", "responsible_role": "buyer", "description": "Buyer pays deposit to solicitor"},
            {"stage": "Contracts Exchanged", "responsible_role": "both_solicitors", "description": "Solicitors exchange contracts"},
            {"stage": "Final Checks & Funds Requested", "responsible_role": "buyer_solicitor", "description": "Buyer's solicitor requests final funds"},
            {"stage": "Completion Day", "responsible_role": "buyer_solicitor", "description": "Property ownership transfers to buyer"},
            {"stage": "Keys Released & Registration", "responsible_role": "estate_agent", "description": "Keys released and property registered"}
        ]

        # Create new stages with dates
        start_date = datetime.now()
        for i, stage_data in enumerate(stages):
            stage = PropertyStage(
                property_id=prop.id,
                stage=stage_data["stage"],
                status="pending",
                description=stage_data["description"],
                responsible_role=stage_data["responsible_role"],
                start_date=start_date + timedelta(days=i*3),
                due_date=start_date + timedelta(days=(i+1)*3),
                order=i
            )
            db.add(stage)
        
        db.commit()
        print(f"Updated stages for property at {prop.address}")

        # Reset timeline approval fields
        prop.timeline_locked = False
        prop.timeline_approved_by_buyer_solicitor = False
        prop.timeline_approved_by_seller_solicitor = False
        db.commit()

        # Ensure all current stages have sequential order numbers
        stages = db.query(PropertyStage).filter(PropertyStage.property_id == prop.id).order_by(PropertyStage.id).all()
        for idx, stage in enumerate(stages):
            stage.order = idx
        db.commit()
    except Exception as e:
        print(f"Error updating property stages: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    update_property_stages() 