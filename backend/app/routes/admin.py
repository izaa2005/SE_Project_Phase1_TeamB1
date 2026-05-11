"""
========================================
ADMIN ROUTES
========================================

Endpoints for administrators with superuser access. Manage all users, override any opportunity,
and see platform-wide statistics. Includes user management (create, update, disable accounts),
search, filter, export data, and bypass normal workflows.

@author Izabela Lako
@contributor Deshira Lusha
"""

from flask import Blueprint, request, jsonify
from app import db
from app.models import User, Opportunity, Application, AuditLog
from flask_jwt_extended import jwt_required
from app.utils.auth_middleware import get_current_user_id, get_current_user_role
from sqlalchemy import or_
from datetime import datetime, timedelta

bp = Blueprint('admin', __name__, url_prefix='/api/admin')

# ===== ADMIN AUTHORIZATION =====

def admin_required(f):
    """Decorator to ensure user is an admin."""
    
    from functools import wraps
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        current_user_id = get_current_user_id()
        current_user_role = get_current_user_role()
        user = User.query.get(current_user_id)
        if not user or current_user_role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

# ===== USER MANAGEMENT =====

@bp.route('/users', methods=['GET'])
@admin_required
def get_users():
    """
    Deshira: Get all users with pagination and filtering.
    
    Query parameters:
    - page: Pagination page (default 1)
    - per_page: Items per page (default 20)
    - role: Filter by role (student, company, university, admin)
    - is_active: Filter by active status (true/false)
    - search: Search email or name (substring match)
    """
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    role = request.args.get('role')
    is_active = request.args.get('is_active', type=lambda v: v.lower() == 'true' if v else None)
    search = request.args.get('search', '').strip()
    
    # ===== BUILD QUERY =====
    # Iva: "Start with all users"
    query = User.query
    
    # ===== APPLY FILTERS =====
    # Izabela: "Filter by role if specified"
    if role in ('student', 'company', 'university', 'admin'):
        query = query.filter(User.role == role)
    
    # Deshira: "Filter by active status if specified"
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    
    # Search in email or name
    if search:
        query = query.filter(or_(
            User.email.ilike(f'%{search}%'),
            User.name.ilike(f'%{search}%')
        ))
    
    # Pagination
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    users = pagination.items
    
    # Serialize
    user_list = []
    for u in users:
        user_list.append({
            'id': u.id,
            'email': u.email,
            'name': u.name,
            'role': u.role,
            'is_active': u.is_active,
            'created_at': u.created_at.isoformat() if u.created_at else None,
        })
    
    return jsonify({
        'users': user_list,
        'page': pagination.page,
        'per_page': pagination.per_page,
        'total': pagination.total,
        'pages': pagination.pages,
    })


@bp.route('/users/<int:user_id>', methods=['PUT'])
@admin_required
def update_user(user_id):
    """Update user role or status.
    Request body can include:
    - role (optional)
    - is_active (optional)
    """
    user = User.query.get_or_404(user_id)
    data = request.get_json()

    current_user_id = get_current_user_id()
    if current_user_id == user.id and ('is_active' in data and data['is_active'] is False):
        return jsonify({'error': 'You cannot disable your own account'}), 400
    
    # Keep old values for audit log
    old_role = user.role
    old_is_active = user.is_active
    
    updates = {}
    if 'role' in data and data['role'] in ('student', 'company', 'university', 'admin'):
        updates['role'] = data['role']
    if 'is_active' in data and isinstance(data['is_active'], bool):
        updates['is_active'] = data['is_active']
    
    if not updates:
        return jsonify({'error': 'No valid fields to update'}), 400
    
    # Apply updates
    for key, value in updates.items():
        setattr(user, key, value)
    
    db.session.commit()
    
    # Audit log
    AuditLog.create_log(
        user_id=current_user_id,
        action='UPDATE_USER',
        table_name='users',
        record_id=user.id,
        old_values=f'role={old_role}, is_active={old_is_active}',
        new_values=f'role={user.role}, is_active={user.is_active}'
    )
    
    return jsonify({
        'message': 'User updated successfully',
        'user': {
            'id': user.id,
            'role': user.role,
            'is_active': user.is_active,
        }
    })


@bp.route('/users/<int:user_id>/toggle', methods=['POST'])
@admin_required
def toggle_user(user_id):
    """Enable/disable user account."""
    user = User.query.get_or_404(user_id)

    current_user_id = get_current_user_id()
    if current_user_id == user.id:
        return jsonify({'error': 'You cannot disable your own account'}), 400
    
    old_status = user.is_active
    user.is_active = not user.is_active
    
    db.session.commit()
    
    # Audit log
    AuditLog.create_log(
        user_id=current_user_id,
        action='TOGGLE_USER',
        table_name='users',
        record_id=user.id,
        old_values=f'is_active={old_status}',
        new_values=f'is_active={user.is_active}'
    )
    
    return jsonify({
        'message': f"User {'activated' if user.is_active else 'deactivated'}",
        'is_active': user.is_active
    })


@bp.route('/opportunities', methods=['GET'])
@admin_required
def get_all_opportunities_admin():
    """Get all opportunities with admin filters.
    Query parameters:
    - page, per_page
    - status (pending, approved, rejected)
    - company_id
    - category (internship, workshop, competition, event)
    - type (full-time, part-time, remote, hybrid)
    - verified (true/false) - whether verified_by is not null
    """
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status = request.args.get('status')
    company_id = request.args.get('company_id', type=int)
    category = request.args.get('category')
    opp_type = request.args.get('type')
    verified = request.args.get('verified', type=lambda v: v.lower() == 'true' if v else None)
    
    query = Opportunity.query
    
    if status in ('pending', 'approved', 'rejected'):
        query = query.filter(Opportunity.status == status)
    if company_id:
        query = query.filter(Opportunity.company_id == company_id)
    if category in ('internship', 'workshop', 'competition', 'event'):
        query = query.filter(Opportunity.category == category)
    if opp_type in ('full-time', 'part-time', 'remote', 'hybrid'):
        query = query.filter(Opportunity.type == opp_type)
    if verified is not None:
        if verified:
            query = query.filter(Opportunity.verified_by.isnot(None))
        else:
            query = query.filter(Opportunity.verified_by.is_(None))
    
    # Order by latest
    query = query.order_by(Opportunity.created_at.desc())
    
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    opportunities = pagination.items
    
    opp_list = []
    for opp in opportunities:
        opp_list.append({
            'id': opp.id,
            'title': opp.title,
            'company_id': opp.company_id,
            'company_name': opp.company.name if opp.company else None,
            'status': opp.status,
            'category': opp.category,
            'type': opp.type,
            'deadline': opp.deadline.isoformat() if opp.deadline else None,
            'created_at': opp.created_at.isoformat() if opp.created_at else None,
            'verified_by': opp.verified_by,
            'verified_at': opp.verified_at.isoformat() if opp.verified_at else None,
            'verification_reason': opp.verification_reason,
        })
    
    return jsonify({
        'opportunities': opp_list,
        'page': pagination.page,
        'per_page': pagination.per_page,
        'total': pagination.total,
        'pages': pagination.pages,
    })


@bp.route('/opportunities/<int:opportunity_id>', methods=['PUT'])
@admin_required
def admin_update_opportunity(opportunity_id):
    """Admin can update any opportunity.
    Allowed fields: title, description, category, location, type, deadline, application_link, status.
    """
    opportunity = Opportunity.query.get_or_404(opportunity_id)
    data = request.get_json()
    
    # Keep old values for audit
    old_values = {f: getattr(opportunity, f) for f in ['title', 'description', 'category', 'location', 'type', 'deadline', 'application_link', 'status']}
    
    allowed_fields = ['title', 'description', 'category', 'location', 'type', 'deadline', 'application_link', 'status']
    updates = {}
    for field in allowed_fields:
        if field in data:
            # Validate enum fields
            if field == 'category' and data[field] not in ('internship', 'workshop', 'competition', 'event'):
                continue
            if field == 'type' and data[field] not in ('full-time', 'part-time', 'remote', 'hybrid'):
                continue
            if field == 'status' and data[field] not in ('pending', 'approved', 'rejected'):
                continue
            # deadline must be a valid datetime string
            if field == 'deadline':
                try:
                    from datetime import datetime
                    deadline = datetime.fromisoformat(data[field].replace('Z', '+00:00'))
                    updates[field] = deadline
                except:
                    return jsonify({'error': f'Invalid deadline format'}), 400
            else:
                updates[field] = data[field]
    
    if not updates:
        return jsonify({'error': 'No valid fields to update'}), 400
    
    # Apply updates
    for key, value in updates.items():
        setattr(opportunity, key, value)
    
    db.session.commit()
    
    # Audit log
    current_user_id = get_current_user_id()
    AuditLog.create_log(
        user_id=current_user_id,
        action='ADMIN_UPDATE_OPPORTUNITY',
        table_name='opportunities',
        record_id=opportunity.id,
        old_values=str(old_values),
        new_values=str({f: getattr(opportunity, f) for f in updates.keys()})
    )
    
    return jsonify({
        'message': 'Opportunity updated successfully',
        'opportunity': {
            'id': opportunity.id,
            'title': opportunity.title,
            'status': opportunity.status,
        }
    })


@bp.route('/opportunities/<int:opportunity_id>', methods=['DELETE'])
@admin_required
def admin_delete_opportunity(opportunity_id):
    """Admin can delete any opportunity."""
    opportunity = Opportunity.query.get_or_404(opportunity_id)
    current_user_id = get_current_user_id()

    old_values = {
        'title': opportunity.title,
        'company_id': opportunity.company_id,
        'status': opportunity.status,
    }

    db.session.delete(opportunity)

    AuditLog.create_log(
        user_id=current_user_id,
        action='ADMIN_DELETE_OPPORTUNITY',
        table_name='opportunities',
        record_id=opportunity_id,
        old_values=str(old_values),
        new_values=None,
    )
    db.session.commit()

    return jsonify({'message': 'Opportunity deleted successfully'})


@bp.route('/activity', methods=['GET'])
@admin_required
def get_system_activity():
    """Get recent system activity from audit logs."""
    limit = request.args.get('limit', 20, type=int)
    table_name = request.args.get('table_name')
    action = request.args.get('action')

    query = AuditLog.query
    if table_name:
        query = query.filter(AuditLog.table_name == table_name)
    if action:
        query = query.filter(AuditLog.action == action)

    logs = query.order_by(AuditLog.timestamp.desc()).limit(max(1, min(limit, 100))).all()

    activity = []
    for log in logs:
        activity.append({
            'id': log.id,
            'user_id': log.user_id,
            'action': log.action,
            'table_name': log.table_name,
            'record_id': log.record_id,
            'old_values': log.old_values,
            'new_values': log.new_values,
            'timestamp': log.timestamp.isoformat() if log.timestamp else None,
        })

    return jsonify({'activity': activity, 'total': len(activity)})


@bp.route('/dashboard', methods=['GET'])
@admin_required
def admin_dashboard():
    """Get admin dashboard statistics.
    Returns counts of users by role, opportunities by status, etc.
    """
    # User counts
    user_counts = {}
    for role in ['student', 'company', 'university', 'admin']:
        user_counts[role] = User.query.filter_by(role=role, is_active=True).count()
    
    # Opportunity counts by status
    opp_counts = {}
    for status in ['pending', 'approved', 'rejected']:
        opp_counts[status] = Opportunity.query.filter_by(status=status).count()
    
    # Total applications
    total_applications = Application.query.count()

    # Recent pending opportunities (last 7 days)
    week_ago = datetime.utcnow() - timedelta(days=7)
    recent_pending = Opportunity.query.filter(
        Opportunity.status == 'pending',
        Opportunity.created_at >= week_ago
    ).count()
    
    # Shkurtim i datës së fundit të verifikimit (për vizualizim)
    last_verification = Opportunity.query.filter(
        Opportunity.verified_at.isnot(None)
    ).order_by(Opportunity.verified_at.desc()).first()
    
    return jsonify({
        'summary': {
            'total_users': User.query.count(),
            'active_users': User.query.filter_by(is_active=True).count(),
            'total_opportunities': Opportunity.query.count(),
            'pending_actions': Opportunity.query.filter_by(status='pending').count(),
        },
        'users': user_counts,
        'opportunities': opp_counts,
        'total_applications': total_applications,
        'recent_pending_opportunities': recent_pending,
        'last_verification': last_verification.verified_at.isoformat() if last_verification else None,
        'timestamp': datetime.utcnow().isoformat()
    })
