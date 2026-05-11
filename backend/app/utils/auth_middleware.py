"""
========================================
AUTHENTICATION MIDDLEWARE & DECORATORS
========================================

Role-based access control decorators and utilities. Ensures only authorized
users can access specific endpoints. Decorators enforce permissions before
route handlers execute.

@author Iva Hasani
@contributor Izabela Lako
"""

from functools import wraps
from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.models import User


def get_current_user_id():
    """Extract the current authenticated user ID from JWT claims."""
    identity = get_jwt_identity()
    try:
        return int(identity)
    except (TypeError, ValueError):
        return None


def get_current_user():
    """Fetch the current authenticated user from the database."""
    user_id = get_current_user_id()
    if user_id is None:
        return None
    return User.query.get(user_id)


def validate_user_status(user):
    """Ensure the user account is active, verified, and approved if required."""
    if not user:
        return False, 'User not found'
    if not user.is_active:
        return False, 'Account deactivated'
    if not user.is_verified:
        return False, 'Email not verified. Please check your email to verify your account.'
    if user.role == 'student' and not user.is_approved:
        return False, 'Your account is pending approval from your university. Please wait for approval.'
    return True, None


def get_current_user_role():
    """
    Iva: Extract the user's role from JWT claims.
         Falls back to legacy identity format if needed.
    """
    claims = get_jwt()
    role = claims.get('role')
    if role:
        return role

    identity = get_jwt_identity()
    if isinstance(identity, dict):
        return identity.get('role')
    return None

# ===== ROLE-BASED DECORATORS =====

def require_role(role):
    """
    Izabela: Decorator to restrict a route to a specific role.
    
    Usage:
        @require_role('admin')
        def admin_only_endpoint():
            ...
    
    If the user doesn't have the required role, returns 403 Forbidden.
    """
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def decorated_function(*args, **kwargs):
            user = get_current_user()
            valid, message = validate_user_status(user)
            if not valid:
                return jsonify({'message': message}), 403
            user_role = get_current_user_role()
            if user_role != role:
                return jsonify({'message': f'Insufficient permissions. Required role: {role}'}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def require_roles(roles):
    """
    Deshira: Decorator to restrict a route to multiple roles.
    
    Usage:
        @require_roles(['admin', 'university'])
        def admin_or_university_endpoint():
            ...
    
    User must have at least one of the specified roles.
    """
    def decorator(f):
        @wraps(f)
        @jwt_required()
        def decorated_function(*args, **kwargs):
            user = get_current_user()
            valid, message = validate_user_status(user)
            if not valid:
                return jsonify({'message': message}), 403
            user_role = get_current_user_role()
            if user_role not in roles:
                return jsonify({'message': f'Insufficient permissions. Allowed roles: {roles}'}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# ===== FUTURE IMPROVEMENTS =====
# Iva: "TODO: Add verification that user account is still active (is_active=True)
#       TODO: Add logging for permission denials to catch security attacks
#       TODO: Add rate limiting to prevent brute force attacks"