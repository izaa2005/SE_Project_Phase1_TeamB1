from app import create_app, db
from app.models import User, Opportunity, Application
from datetime import datetime, timedelta
import random

def seed_database():
    app = create_app()
    with app.app_context():
        # Clear existing data
        db.drop_all()
        db.create_all()
        
        # Create users for each role
        users = [
            User(email='student@epoka.edu.al', name='John Student', role='student', is_verified=True, is_approved=True, verification_token=None),
            User(email='company@example.com', name='Tech Corp', role='company', is_verified=True, is_approved=True, verification_token=None),
            User(email='university@epoka.edu.al', name='Epoka Staff', role='university', is_verified=True, is_approved=True, verification_token=None),
            User(email='admin@internlink.com', name='System Admin', role='admin', is_verified=True, is_approved=True, verification_token=None),
        ]

        for user in users:
            user.set_password('password123')
            db.session.add(user)

        db.session.commit()
        
        # Create sample opportunities
        categories = ['internship', 'workshop', 'competition', 'event']
        locations = ['Tirana', 'Remote', 'Durrës', 'Vlorë']
        types = ['full-time', 'part-time', 'remote', 'hybrid']
        
        opportunities = []
        for i in range(1, 21):
            opportunity = Opportunity(
                title=f'Sample Opportunity {i}',
                description=f'Description for sample opportunity {i}. This is a great chance for students to gain experience.',
                category=random.choice(categories),
                location=random.choice(locations),
                type=random.choice(types),
                deadline=datetime.utcnow() + timedelta(days=random.randint(1, 60)),
                application_link=f'https://example.com/apply/{i}',
                company_id=users[1].id,  # company user
                status=random.choice(['pending', 'approved', 'rejected'])
            )
            opportunities.append(opportunity)
            db.session.add(opportunity)
        
        db.session.commit()
        
        # Create sample applications (ensure unique opportunity per application)
        sampled_opps = random.sample(opportunities, k=min(5, len(opportunities)))
        for opp in sampled_opps:
            application = Application(
                student_id=users[0].id,
                opportunity_id=opp.id,
                status=random.choice(['submitted', 'under_review', 'accepted', 'rejected'])
            )
            db.session.add(application)
        db.session.commit()
        
        print('Database seeded successfully!')
        print('Created:')
        print(f'  - {len(users)} users')
        print(f'  - {len(opportunities)} opportunities')
        print(f'  - 5 applications')

if __name__ == '__main__':
    seed_database()
