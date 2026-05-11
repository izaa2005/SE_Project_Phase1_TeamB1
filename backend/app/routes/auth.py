import os
import re
import secrets
from datetime import datetime

from flask import Blueprint, request, jsonify, current_app
from app import db, jwt
from app.models import User
from app.utils.email_utils import send_verification_email
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Helper: validate email format
def is_valid_email(email):
    pattern = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
    return re.match(pattern, email) is not None

# Helper: validate role
def is_valid_role(role):
    return role in ['student', 'company', 'university', 'admin']

# Helper: normalize token formatting from frontend input
# Accept quoted or whitespace-padded tokens.
def _normalize_token(token):
    if not token:
        return None
    token = token.strip()
    if token.startswith(("'", '"')) and token.endswith(("'", '"')):
        token = token[1:-1]
    return token.strip()

@bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    data = request.get_json()
    # TODO: maybe use a proper validation library later
    if not data:
        return jsonify({'message': 'No JSON data provided'}), 400
    
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    role = data.get('role')
    
    # Validate required fields
    if not email or not password or not name or not role:
        return jsonify({'message': 'Missing required fields'}), 400
    
    if not is_valid_email(email):
        return jsonify({'message': 'Invalid email format'}), 400
    
    if len(password) < 6:
        return jsonify({'message': 'Password must be at least 6 characters'}), 400
    
    if not is_valid_role(role):
        return jsonify({'message': 'Invalid role'}), 400
    
    # Check if email already exists
    existing = User.query.filter_by(email=email).first()
    if existing:
        return jsonify({'message': 'Email already registered'}), 409
    
    # Create new user
    try:
        token = secrets.token_urlsafe(32)
        user = User(email=email, name=name, role=role, verification_token=token)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        # Build verification link for email flow and local development
        frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:3000').rstrip('/')
        verify_url = f"{frontend_url}/verify/{token}"
        email_sent = send_verification_email(email, verify_url)

        response_data = {
            'message': 'Account created successfully. Please check your email to verify your account.',
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name,
                'role': user.role,
                'created_at': user.created_at.isoformat() if user.created_at else None,
                'is_verified': user.is_verified,
                'is_approved': user.is_approved,
            },
            'verification_email_sent': email_sent,
            'requires_verification': True,
        }

        if user.role == 'student':
            response_data['requires_approval'] = True

        if current_app.config.get('DEBUG', False) or not email_sent:
            response_data['verification_url'] = verify_url
        return jsonify(response_data), 201
    except Exception as e:
        db.session.rollback()
        # Log error for debugging (in prod, use proper logging)
        print(f"Registration error: {e}")  # human residue: console.log
        return jsonify({'message': 'Internal server error'}), 500

@bp.route('/login', methods=['POST'])
def login():
    """Authenticate user and return JWT tokens"""
    data = request.get_json()
    if not data:
        return jsonify({'message': 'No JSON data provided'}), 400
    
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'message': 'Missing email or password'}), 400
    
    # Find user
    user = User.query.filter_by(email=email).first()
    if not user:
        # For security, don't reveal if user exists
        return jsonify({'message': 'Invalid credentials'}), 401
    
    if not user.check_password(password):
        return jsonify({'message': 'Invalid credentials'}), 401
    
    # Check if user is active
    if not user.is_active:
        return jsonify({'message': 'Account deactivated'}), 403
    
    # Check if email is verified (all roles require verification)
    if not user.is_verified:
        return jsonify({'message': 'Email not verified. Please check your email to verify your account.'}), 403
    
    # Check if student is approved by university (students require approval)
    if user.role == 'student' and not user.is_approved:
        return jsonify({'message': 'Your account is pending approval from your university. Please wait for approval.'}), 403
    
    # Generate tokens
    access_token = create_access_token(identity=str(user.id), additional_claims={'role': user.role})
    refresh_token = create_refresh_token(identity=str(user.id), additional_claims={'role': user.role})
    
    # TODO: maybe update last login timestamp
    return jsonify({
        'message': 'Login successful',
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': {
            'id': user.id,
            'email': user.email,
            'name': user.name,
            'role': user.role,
            'created_at': user.created_at.isoformat() if user.created_at else None
        }
    }), 200

@bp.route('/verify', methods=['GET'])
def verify_email_token():
    """Check whether a verification token is valid."""
    token = _normalize_token(request.args.get('token'))
    if not token:
        return jsonify({'message': 'Verification token is missing'}), 400

    user = User.query.filter_by(verification_token=token).first()
    if not user:
        return jsonify({'message': 'Invalid verification token'}), 404

    if user.is_verified:
        return jsonify({
            'verified': True,
            'message': 'Email has already been verified.'
        }), 200

    return jsonify({
        'verified': False,
        'message': 'Verification token is valid. Confirm to verify your account.'
    }), 200

@bp.route('/verify', methods=['POST'])
def verify_email():
    """Verify a user's email using the provided token."""
    data = request.get_json() or {}
    token = _normalize_token(data.get('token'))
    if not token:
        return jsonify({'message': 'Verification token is missing'}), 400

    user = User.query.filter_by(verification_token=token).first()
    if not user:
        return jsonify({'message': 'Invalid verification token'}), 404

    if user.is_verified:
        return jsonify({'message': 'Email is already verified.', 'verified': True}), 200

    user.is_verified = True
    user.verified_at = datetime.utcnow()
    user.verification_token = None
    db.session.commit()

    return jsonify({
        'message': 'Email verified successfully.',
        'verified': True,
        'user': {
            'id': user.id,
            'email': user.email,
            'role': user.role,
            'is_verified': user.is_verified,
            'is_approved': user.is_approved,
        }
    }), 200

@bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    current_identity = get_jwt_identity()
    if current_identity is None:
        return jsonify({'message': 'Invalid token identity'}), 401

    try:
        user_id = int(current_identity)
    except (TypeError, ValueError):
        return jsonify({'message': 'Invalid token identity'}), 401

    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
    if not user.is_active:
        return jsonify({'message': 'Account deactivated'}), 403
    if not user.is_verified:
        return jsonify({'message': 'Email not verified. Please check your email to verify your account.'}), 403
    if user.role == 'student' and not user.is_approved:
        return jsonify({'message': 'Your account is pending approval from your university. Please wait for approval.'}), 403

    new_access_token = create_access_token(identity=str(user.id), additional_claims={'role': user.role})
    return jsonify({
        'access_token': new_access_token
    }), 200

@bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user (client-side token removal)"""
    # TODO: Implement server-side token blacklist if needed
    # For now, just return success; client should delete tokens
    return jsonify({'message': 'Logout successful'}), 200

@bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user profile"""
    current_identity = get_jwt_identity()
    if current_identity is None:
        return jsonify({'message': 'Invalid token identity'}), 401

    try:
        user_id = int(current_identity)
    except (TypeError, ValueError):
        return jsonify({'message': 'Invalid token identity'}), 401

    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
    if not user.is_active:
        return jsonify({'message': 'Account deactivated'}), 403
    if not user.is_verified:
        return jsonify({'message': 'Email not verified. Please check your email to verify your account.'}), 403
    if user.role == 'student' and not user.is_approved:
        return jsonify({'message': 'Your account is pending approval from your university. Please wait for approval.'}), 403
    
    # Return user data (excluding password hash)
    return jsonify({
        'user': {
            'id': user.id,
            'email': user.email,
            'name': user.name,
            'role': user.role,
            'created_at': user.created_at.isoformat() if user.created_at else None,
            'is_active': user.is_active,
            'is_verified': user.is_verified,
            'is_approved': user.is_approved,
        }
    }), 200