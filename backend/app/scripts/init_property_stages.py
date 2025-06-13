from app.core.database import SessionLocal
from app.models.property import Property, PropertyStage
from app.models.user import User
from datetime import datetime, timedelta

def init_property_stages():
    db = SessionLocal()
    try:
        # Get all properties
        properties = db.query(Property).all()

        # Correct order and names from frontend
        default_stages = [
            {"stage": "Offer Accepted", "description": "Initial acceptance of offer (managed by agent)", "responsible": "Agent"},
            {"stage": "Instruct Solicitor", "description": "Client chooses and formally instructs their solicitor", "responsible": "Client"},
            {"stage": "Client ID Verification", "description": "Upload proof of ID/address (KYC/AML)", "responsible": "Client"},
            {"stage": "Draft Contract Issued", "description": "Seller's solicitor issues draft contract", "responsible": "Seller Solicitor"},
            {"stage": "Searches Ordered", "description": "Solicitor orders property searches", "responsible": "Solicitor"},
            {"stage": "Searches Received & Reviewed", "description": "Results reviewed, issues flagged", "responsible": "Solicitor"},
            {"stage": "Survey Booked", "description": "Buyer arranges HomeBuyers or Building Survey (Level 2 / 3)", "responsible": "Client"},
            {"stage": "Survey Completed", "description": "Report uploaded, issues discussed", "responsible": "Surveyor"},
            {"stage": "Mortgage Offer Received", "description": "Official mortgage offer from lender, subject to conditions", "responsible": "Client"},
            {"stage": "Enquiries Raised", "description": "Solicitor queries anything unclear or concerning", "responsible": "Solicitor"},
            {"stage": "Enquiries Answered", "description": "Seller's solicitor provides responses", "responsible": "Seller Solicitor"},
            {"stage": "Contract Approved", "description": "Final contract approved by all parties", "responsible": "Solicitor"},
            {"stage": "Deposit Paid", "description": "Buyer pays deposit to solicitor", "responsible": "Client"},
            {"stage": "Exchange of Contracts", "description": "Contracts exchanged between solicitors, deal becomes legally binding", "responsible": "Solicitor"},
            {"stage": "Final Arrangements", "description": "Final arrangements before completion", "responsible": "Client"},
            {"stage": "Completion", "description": "Full funds transferred, keys released", "responsible": "Solicitor"},
            {"stage": "Stamp Duty Payment", "description": "Solicitor pays SDLT to HMRC", "responsible": "Solicitor"},
            {"stage": "Land Registry Submission", "description": "Register buyer as new owner", "responsible": "Solicitor"},
            {"stage": "Handover Materials Provided", "description": "Manuals, guarantees, alarm codes, Wi-Fi, etc.", "responsible": "Seller"},
            {"stage": "Final Report to Client", "description": "Summary pack of title, registration, SDLT, warranties etc", "responsible": "Solicitor"},
        ]

        for property in properties:
            # Delete all existing stages for this property
            db.query(PropertyStage).filter(PropertyStage.property_id == property.id).delete()
            db.commit()

            # Create stages with dates
            start_date = datetime.now()
            for i, stage_data in enumerate(default_stages):
                stage = PropertyStage(
                    property_id=property.id,
                    stage=stage_data['stage'],
                    status='pending',
                    description=stage_data['description'],
                    responsible=stage_data['responsible'],
                    start_date=start_date + timedelta(days=i*3),
                    due_date=start_date + timedelta(days=(i+1)*3)
                )
                db.add(stage)
            db.commit()
            print(f"Initialized stages for property {property.id}")

    finally:
        db.close()

if __name__ == "__main__":
    init_property_stages() 