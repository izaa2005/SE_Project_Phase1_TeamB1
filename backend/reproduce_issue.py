import os
import sys
from datetime import datetime, timedelta
from app import create_app, db
from app.models import User, Opportunity
from flask_jwt_extended import create_access_token

def setup_test_data():
    # Create a student user
    student = User.query.filter_by(email='student@test.com').first()
    if not student:
        student = User(email='student@test.com', name='Test Student', role='student')
        student.set_password('password')
        db.session.add(student)
    
    # Create a company user
    company = User.query.filter_by(email='company@test.com').first()
    if not company:
        company = User(email='company@test.com', name='Test Company', role='company')
        company.set_password('password')
        db.session.add(company)
    
    db.session.commit()
    
    # Create an approved opportunity
    opp = Opportunity.query.filter_by(title='Test Opportunity').first()
    if not opp:
        opp = Opportunity(
            title='Test Opportunity',
            description='A test opportunity',
            category='internship',
            location='Remote',
            type='remote',
            deadline=datetime.utcnow() + timedelta(days=30),
            status='approved',
            company_id=company.id
        )
        db.session.add(opp)
    
    db.session.commit()
    return student

def run_test():
    app = create_app()
    with app.app_context():
        # Setup
        student = setup_test_data()
        
        # Create token
        token = create_access_token(
            identity=str(student.id),
            additional_claims={'role': student.role}
        )
        
        # Test the route
        client = app.test_client()
        response = client.get('/api/student/opportunities', headers={'Authorization': f'Bearer {token}'})
        
        print(f"Status: {response.status_code}")
        print(f"Data: {response.get_data(as_text=True)}")

if __name__ == '__main__':
    run_test()
