import sys
from app import create_app, db
from app.models import User
import uuid
import urllib.parse

app = create_app()

def test_verification():
    with app.app_context():
        # User 1 for unquoted token
        email1 = f"test_{uuid.uuid4().hex[:8]}@example.com"
        user1 = User(name="Test User", email=email1, role="student")
        user1.set_password("password123")
        db.session.add(user1)
        db.session.commit()
        
        token1 = user1.verification_token
        print(f"Testing User 1 (Unquoted): {email1}, Token: {token1}")
        
        with app.test_client() as client:
            # Test unquoted
            resp1 = client.get(f"/api/auth/verify?token={token1}")
            print(f"Unquoted response status: {resp1.status_code}")
            print(f"Unquoted response JSON: {resp1.get_json()}")

        # User 2 for quoted+encoded token
        email2 = f"test_{uuid.uuid4().hex[:8]}@example.com"
        user2 = User(name="Test User 2", email=email2, role="student")
        user2.set_password("password123")
        db.session.add(user2)
        db.session.commit()
        
        token2 = user2.verification_token
        quoted_token2 = urllib.parse.quote(f"'{token2}'")
        print(f"Testing User 2 (Quoted+Encoded): {email2}, Token: {token2}, Quoted: {quoted_token2}")
        
        with app.test_client() as client:
            # Test quoted+encoded
            resp2 = client.get(f"/api/auth/verify?token={quoted_token2}")
            print(f"Quoted+Encoded response status: {resp2.status_code}")
            print(f"Quoted+Encoded response JSON: {resp2.get_json()}")

if __name__ == "__main__":
    test_verification()
