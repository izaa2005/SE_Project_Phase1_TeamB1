from app import create_app, db
from app.models import User
import uuid
from datetime import datetime
import secrets

app = create_app()
app.app_context().push()

# Create a unique user
email = f"test_{uuid.uuid4().hex}@example.com"
name = "Test User"
token = secrets.token_hex(16)
user = User(
    email=email, 
    name=name, 
    role='student', 
    verification_token=token,
    is_verified=False
)
user.password_hash = "fake_hash"
db.session.add(user)
db.session.commit()

print(f"Token: {token}")

with app.test_client() as client:
    # First call
    response1 = client.get(f"/api/auth/verify?token={token}")
    print(f"First call - Status: {response1.status_code}, Message: {response1.get_json().get('message')}")
    
    # Second call
    response2 = client.get(f"/api/auth/verify?token={token}")
    print(f"Second call - Status: {response2.status_code}, Message: {response2.get_json().get('message')}")

# Cleanup
db.session.delete(user)
db.session.commit()
