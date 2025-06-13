from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.models.property import Property, PropertyStatus
from app.models.conveyancing_case import ConveyancingCase
from app.core.security import hash_password
from datetime import datetime

# Default user credentials
BUYER_EMAIL = "buyer@example.com"
BUYER_PASSWORD = "buyer123"
BUYER_FIRST_NAME = "John"
BUYER_LAST_NAME = "Doe"
BUYER_PHONE = "+447700900001"

SOLICITOR_BUYER_EMAIL = "buyer.solicitor@example.com"
SOLICITOR_BUYER_PASSWORD = "solicitorbuyer123"
SOLICITOR_BUYER_FIRST_NAME = "Beatrice"
SOLICITOR_BUYER_LAST_NAME = "BuyerSol"
SOLICITOR_BUYER_COMPANY = "Buyer Law Firm"
SOLICITOR_BUYER_SRA = "SRA123456"
SOLICITOR_BUYER_PHONE = "+447700900002"

SOLICITOR_SELLER_EMAIL = "seller.solicitor@example.com"
SOLICITOR_SELLER_PASSWORD = "solicitorseller123"
SOLICITOR_SELLER_FIRST_NAME = "Samuel"
SOLICITOR_SELLER_LAST_NAME = "SellerSol"
SOLICITOR_SELLER_COMPANY = "Seller Law Firm"
SOLICITOR_SELLER_SRA = "SRA789012"
SOLICITOR_SELLER_PHONE = "+447700900003"

ESTATE_AGENT_EMAIL = "agent@example.com"
ESTATE_AGENT_PASSWORD = "password123"
ESTATE_AGENT_FIRST_NAME = "Alex"
ESTATE_AGENT_LAST_NAME = "Agent"
ESTATE_AGENT_COMPANY = "Test Estate Agents"
ESTATE_AGENT_REG = "EA123456"
ESTATE_AGENT_PHONE = "+447700900004"

SELLER_EMAIL = "seller@example.com"
SELLER_PASSWORD = "seller123"
SELLER_FIRST_NAME = "Sarah"
SELLER_LAST_NAME = "Seller"
SELLER_PHONE = "+447700900005"

def create_default_users():
    db = SessionLocal()
    try:
        # Create buyer
        buyer = db.query(User).filter(User.email == BUYER_EMAIL).first()
        if not buyer:
            buyer = User(
                email=BUYER_EMAIL,
                hashed_password=hash_password(BUYER_PASSWORD),
                first_name=BUYER_FIRST_NAME,
                last_name=BUYER_LAST_NAME,
                role=UserRole.BUYER,
                phone_number=BUYER_PHONE,
                is_verified=True,
                verified_at=datetime.utcnow()
            )
            db.add(buyer)
            print(f"Created buyer: {BUYER_EMAIL}")
        else:
            print(f"Buyer {BUYER_EMAIL} already exists")

        # Create buyer's solicitor
        buyer_solicitor = db.query(User).filter(User.email == SOLICITOR_BUYER_EMAIL).first()
        if not buyer_solicitor:
            buyer_solicitor = User(
                email=SOLICITOR_BUYER_EMAIL,
                hashed_password=hash_password(SOLICITOR_BUYER_PASSWORD),
                first_name=SOLICITOR_BUYER_FIRST_NAME,
                last_name=SOLICITOR_BUYER_LAST_NAME,
                role=UserRole.SOLICITOR,
                company_name=SOLICITOR_BUYER_COMPANY,
                registration_number=SOLICITOR_BUYER_SRA,
                phone_number=SOLICITOR_BUYER_PHONE,
                is_verified=True,
                verified_at=datetime.utcnow()
            )
            db.add(buyer_solicitor)
            print(f"Created buyer's solicitor: {SOLICITOR_BUYER_EMAIL}")
        else:
            print(f"Buyer's solicitor {SOLICITOR_BUYER_EMAIL} already exists")

        # Create seller's solicitor
        seller_solicitor = db.query(User).filter(User.email == SOLICITOR_SELLER_EMAIL).first()
        if not seller_solicitor:
            seller_solicitor = User(
                email=SOLICITOR_SELLER_EMAIL,
                hashed_password=hash_password(SOLICITOR_SELLER_PASSWORD),
                first_name=SOLICITOR_SELLER_FIRST_NAME,
                last_name=SOLICITOR_SELLER_LAST_NAME,
                role=UserRole.SOLICITOR,
                company_name=SOLICITOR_SELLER_COMPANY,
                registration_number=SOLICITOR_SELLER_SRA,
                phone_number=SOLICITOR_SELLER_PHONE,
                is_verified=True,
                verified_at=datetime.utcnow()
            )
            db.add(seller_solicitor)
            print(f"Created seller's solicitor: {SOLICITOR_SELLER_EMAIL}")
        else:
            print(f"Seller's solicitor {SOLICITOR_SELLER_EMAIL} already exists")

        # Create estate agent
        estate_agent = db.query(User).filter(User.email == ESTATE_AGENT_EMAIL).first()
        if not estate_agent:
            estate_agent = User(
                email=ESTATE_AGENT_EMAIL,
                hashed_password=hash_password(ESTATE_AGENT_PASSWORD),
                first_name=ESTATE_AGENT_FIRST_NAME,
                last_name=ESTATE_AGENT_LAST_NAME,
                role=UserRole.ESTATE_AGENT,
                company_name=ESTATE_AGENT_COMPANY,
                registration_number=ESTATE_AGENT_REG,
                phone_number=ESTATE_AGENT_PHONE,
                is_verified=True,
                verified_at=datetime.utcnow()
            )
            db.add(estate_agent)
            print(f"Created estate agent: {ESTATE_AGENT_EMAIL}")
        else:
            print(f"Estate agent {ESTATE_AGENT_EMAIL} already exists")

        # Create seller
        seller = db.query(User).filter(User.email == SELLER_EMAIL).first()
        if not seller:
            seller = User(
                email=SELLER_EMAIL,
                hashed_password=hash_password(SELLER_PASSWORD),
                first_name=SELLER_FIRST_NAME,
                last_name=SELLER_LAST_NAME,
                role=UserRole.SELLER,
                phone_number=SELLER_PHONE,
                is_verified=True,
                verified_at=datetime.utcnow()
            )
            db.add(seller)
            print(f"Created seller: {SELLER_EMAIL}")
        else:
            print(f"Seller {SELLER_EMAIL} already exists")

        db.commit()
        print("\nDefault users created successfully!")
        print("\nLogin credentials:")
        print(f"Buyer: {BUYER_EMAIL} / {BUYER_PASSWORD}")
        print(f"Seller: {SELLER_EMAIL} / {SELLER_PASSWORD}")
        print(f"Buyer's Solicitor: {SOLICITOR_BUYER_EMAIL} / {SOLICITOR_BUYER_PASSWORD}")
        print(f"Seller's Solicitor: {SOLICITOR_SELLER_EMAIL} / {SOLICITOR_SELLER_PASSWORD}")
        print(f"Estate Agent: {ESTATE_AGENT_EMAIL} / {ESTATE_AGENT_PASSWORD}")

        # Create a test property
        property_address = "123 Main Street"
        prop = db.query(Property).filter(Property.address == property_address).first()
        if not prop and buyer and seller and buyer_solicitor and seller_solicitor and estate_agent:
            prop = Property(
                address=property_address,
                postcode="SW1A 1AA",
                price=350000.00,
                status=PropertyStatus.AVAILABLE,
                description="A beautiful semi-detached house",
                bedrooms=3,
                bathrooms=2,
                square_footage=1500.00,
                property_type="Semi-detached house",
                tenure="Freehold",
                buyer_id=buyer.id,
                seller_id=seller.id,
                buyer_solicitor_id=buyer_solicitor.id,
                seller_solicitor_id=seller_solicitor.id,
                estate_agent_id=estate_agent.id
            )
            db.add(prop)
            db.commit()
            print(f"Created property at {property_address}")

            # Create a test conveyancing case
            case = ConveyancingCase(
                property_id=prop.id,
                buyer_id=buyer.id,
                seller_id=seller.id,
                buyer_solicitor_id=buyer_solicitor.id,
                seller_solicitor_id=seller_solicitor.id,
                estate_agent_id=estate_agent.id,
                status="IN_PROGRESS",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(case)
            db.commit()
            print(f"Created conveyancing case for property at {property_address}")

    except Exception as e:
        print(f"Error creating users: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_default_users() 