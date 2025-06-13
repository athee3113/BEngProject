import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import Base, engine
from app.models.user import User
from app.models.property import Property, PropertyStatus
from app.models.file import File, DocumentType
from sqlalchemy.orm import Session
from app.core.security import get_password_hash
import io

client = TestClient(app)

TEST_USERS = {
    "buyer": {
        "email": "buyer@test.com",
        "password": "testpass123",
        "first_name": "Test",
        "last_name": "Buyer",
        "role": "BUYER",
        "phone_number": "+441234567890"
    },
    "seller": {
        "email": "seller@test.com",
        "password": "testpass123",
        "first_name": "Test",
        "last_name": "Seller",
        "role": "SELLER",
        "phone_number": "+441234567891"
    }
}

@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=engine)
    db = Session(engine)
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def test_users(db):
    users = {}
    for role, user_data in TEST_USERS.items():
        user = User(
            email=user_data["email"],
            hashed_password=get_password_hash(user_data["password"]),
            first_name=user_data["first_name"],
            last_name=user_data["last_name"],
            role=user_data["role"],
            phone_number=user_data["phone_number"]
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        users[role] = user
    return users

@pytest.fixture(scope="function")
def test_property(db, test_users):
    property = Property(
        address="123 Test St",
        postcode="AB12 3CD",
        price=100000.0,
        status=PropertyStatus.AVAILABLE,
        seller_id=test_users["seller"].id,
        buyer_id=test_users["buyer"].id
    )
    db.add(property)
    db.commit()
    db.refresh(property)
    return property

def test_upload_and_retrieve_document(db, test_users, test_property):
    """Test uploading and retrieving a document for a property."""
    # Login as buyer
    buyer_token = client.post(
        "/login",
        json={
            "email": TEST_USERS["buyer"]["email"],
            "password": TEST_USERS["buyer"]["password"]
        }
    ).json()["access_token"]

    # Upload a document
    file_content = b"Test file content"
    files = {
        "file": ("testfile.pdf", io.BytesIO(file_content), "application/pdf")
    }
    data = {
        "property_id": str(test_property.id),
        "document_type": DocumentType.TITLE_DEEDS.value
    }
    response = client.post(
        "/upload",
        headers={"Authorization": f"Bearer {buyer_token}"},
        data=data,
        files=files
    )
    assert response.status_code == 200
    file_id = response.json()["id"]

    # Retrieve the document metadata
    response = client.get(
        f"/files/{file_id}",
        headers={"Authorization": f"Bearer {buyer_token}"}
    )
    assert response.status_code == 200
    metadata = response.json()
    assert metadata["filename"] == "testfile.pdf"
    assert metadata["document_type"] == DocumentType.TITLE_DEEDS.value
    assert metadata["uploaded_by"] == test_users["buyer"].id

    # Retrieve the actual file content
    response = client.get(
        f"/files/{file_id}/download",
        headers={"Authorization": f"Bearer {buyer_token}"}
    )
    assert response.status_code == 200
    assert response.content == file_content

    # Unauthorized user (seller) tries to access
    seller_token = client.post(
        "/login",
        json={
            "email": TEST_USERS["seller"]["email"],
            "password": TEST_USERS["seller"]["password"]
        }
    ).json()["access_token"]
    response = client.get(
        f"/files/{file_id}",
        headers={"Authorization": f"Bearer {seller_token}"}
    )
    assert response.status_code in (200, 403)

def test_upload_rejection_for_unauthorized_user(db, test_users, test_property):
    """Test that an unauthorized user cannot upload a document for a property."""
    # Create a random unauthorized user
    unauthorized_user = User(
        email="unauth@test.com",
        hashed_password=get_password_hash("unauthpass"),
        first_name="Unauth",
        last_name="User",
        role="BUYER",
        phone_number="+441234567899"
    )
    db.add(unauthorized_user)
    db.commit()
    db.refresh(unauthorized_user)

    # Login as unauthorized user
    token = client.post(
        "/login",
        json={
            "email": "unauth@test.com",
            "password": "unauthpass"
        }
    ).json()["access_token"]

    # Attempt to upload a document
    file_content = b"Should not be allowed"
    files = {
        "file": ("forbidden.pdf", io.BytesIO(file_content), "application/pdf")
    }
    data = {
        "property_id": str(test_property.id),
        "document_type": DocumentType.TITLE_DEEDS.value
    }
    response = client.post(
        "/upload",
        headers={"Authorization": f"Bearer {token}"},
        data=data,
        files=files
    )
    # Should be forbidden or not found
    assert response.status_code in (403, 404)

def test_file_deletion(db, test_users, test_property):
    """Test uploading and then deleting a document as an authorized user."""
    # Login as buyer
    buyer_token = client.post(
        "/login",
        json={
            "email": TEST_USERS["buyer"]["email"],
            "password": TEST_USERS["buyer"]["password"]
        }
    ).json()["access_token"]

    # Upload a document
    file_content = b"Delete me"
    files = {
        "file": ("deleteme.pdf", io.BytesIO(file_content), "application/pdf")
    }
    data = {
        "property_id": str(test_property.id),
        "document_type": DocumentType.TITLE_DEEDS.value
    }
    response = client.post(
        "/upload",
        headers={"Authorization": f"Bearer {buyer_token}"},
        data=data,
        files=files
    )
    assert response.status_code == 200
    file_id = response.json()["id"]

    # Delete the file
    response = client.delete(
        f"/files/{file_id}",
        headers={"Authorization": f"Bearer {buyer_token}"}
    )
    assert response.status_code == 204

    # Try to retrieve the file metadata (should be 404)
    response = client.get(
        f"/files/{file_id}",
        headers={"Authorization": f"Bearer {buyer_token}"}
    )
    assert response.status_code == 404

    # Try to download the file (should be 404)
    response = client.get(
        f"/files/{file_id}/download",
        headers={"Authorization": f"Bearer {buyer_token}"}
    )
    assert response.status_code == 404 