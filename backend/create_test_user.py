from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash
from datetime import datetime

def create_test_user():
    db = SessionLocal()
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == "buyer@example.com").first()
        if existing_user:
            print("Test user already exists")
            return

        # Create test user
        test_user = User(
            email="buyer@example.com",
            hashed_password=get_password_hash("password123"),
            first_name="Test",
            last_name="Buyer",
            role=UserRole.BUYER,
            is_active=True,
            phone_number="+447700900000",  # Required field
            is_verified=True,  # Set to True for test user
            verified_at=datetime.utcnow()  # Set verification timestamp
        )
        db.add(test_user)
        db.commit()
        print("Test user created successfully")
    except Exception as e:
        print(f"Error creating test user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user() 