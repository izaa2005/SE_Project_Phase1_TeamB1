#!/usr/bin/env python3
"""Development database setup and large data seeding for InternLink."""

import os
import random
import secrets
import sys
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(__file__))

from app import create_app, db
from app.models import Application, Opportunity, User


PASSWORD = 'password123'


def _make_user(email, name, role, is_verified=True, is_approved=True, verification_token=None):
    user = User(
        email=email,
        name=name,
        role=role,
        is_verified=is_verified,
        is_approved=is_approved,
        verified_at=datetime.utcnow() if is_verified else None,
        verification_token=verification_token,
    )
    user.set_password(PASSWORD)
    return user


def _seed_base_test_users():
    unverified_token = secrets.token_urlsafe(32)

    base_users = [
        _make_user('admin@internlink.local', 'Admin User', 'admin'),
        _make_user('university@internlink.local', 'University Staff', 'university'),
        _make_user('company@internlink.local', 'Company User', 'company'),
        _make_user('pending@internlink.local', 'Pending Student', 'student', is_verified=True, is_approved=False),
        _make_user(
            'unverified@internlink.local',
            'Unverified Student',
            'student',
            is_verified=False,
            is_approved=False,
            verification_token=unverified_token,
        ),
        _make_user('approved@internlink.local', 'Approved Student', 'student', is_verified=True, is_approved=True),
    ]

    for user in base_users:
        db.session.add(user)

    return unverified_token


def _seed_bulk_users():
    students = []
    companies = []
    universities = []
    admins = []

    for i in range(1, 31):
        user = _make_user(
            email=f'student{i:02d}@internlink.local',
            name=f'Student {i:02d}',
            role='student',
            is_verified=True,
            is_approved=True,
        )
        students.append(user)
        db.session.add(user)

    for i in range(1, 11):
        user = _make_user(
            email=f'company{i:02d}@internlink.local',
            name=f'Company {i:02d}',
            role='company',
            is_verified=True,
            is_approved=True,
        )
        companies.append(user)
        db.session.add(user)

    for i in range(1, 6):
        user = _make_user(
            email=f'university{i:02d}@internlink.local',
            name=f'University Staff {i:02d}',
            role='university',
            is_verified=True,
            is_approved=True,
        )
        universities.append(user)
        db.session.add(user)

    for i in range(1, 6):
        user = _make_user(
            email=f'admin{i:02d}@internlink.local',
            name=f'Admin {i:02d}',
            role='admin',
            is_verified=True,
            is_approved=True,
        )
        admins.append(user)
        db.session.add(user)

    return students, companies, universities, admins


def _seed_opportunities(companies, universities):
    categories = ['internship', 'workshop', 'competition', 'event']
    locations = ['Tirana', 'Durres', 'Vlore', 'Remote', 'Hybrid']
    types = ['full-time', 'part-time', 'remote', 'hybrid']

    pending_opportunities = []
    approved_pending_apps = []
    approved_chosen_apps = []
    approved_untouched = []

    # 50 pending approval
    for i in range(1, 51):
        opp = Opportunity(
            title=f'Pending Opportunity {i:03d}',
            description=f'Pending verification opportunity {i:03d}',
            category=random.choice(categories),
            location=random.choice(locations),
            type=random.choice(types),
            deadline=datetime.utcnow() + timedelta(days=random.randint(14, 120)),
            application_link=f'https://internlink.local/apply/pending-{i:03d}',
            company_id=random.choice(companies).id,
            status='pending',
        )
        pending_opportunities.append(opp)
        db.session.add(opp)

    # 100 approved with many pending decisions
    for i in range(1, 101):
        opp = Opportunity(
            title=f'Approved In-Review Opportunity {i:03d}',
            description=f'Approved opportunity with ongoing review {i:03d}',
            category=random.choice(categories),
            location=random.choice(locations),
            type=random.choice(types),
            deadline=datetime.utcnow() + timedelta(days=random.randint(30, 150)),
            application_link=f'https://internlink.local/apply/review-{i:03d}',
            company_id=random.choice(companies).id,
            status='approved',
            verified_by=random.choice(universities).id,
            verified_at=datetime.utcnow() - timedelta(days=random.randint(1, 15)),
        )
        approved_pending_apps.append(opp)
        db.session.add(opp)

    # 100 approved with many chosen students
    for i in range(1, 101):
        opp = Opportunity(
            title=f'Approved Filled Opportunity {i:03d}',
            description=f'Approved opportunity with selected candidates {i:03d}',
            category=random.choice(categories),
            location=random.choice(locations),
            type=random.choice(types),
            deadline=datetime.utcnow() + timedelta(days=random.randint(30, 150)),
            application_link=f'https://internlink.local/apply/filled-{i:03d}',
            company_id=random.choice(companies).id,
            status='approved',
            verified_by=random.choice(universities).id,
            verified_at=datetime.utcnow() - timedelta(days=random.randint(1, 20)),
        )
        approved_chosen_apps.append(opp)
        db.session.add(opp)

    # 50 approved and untouched
    for i in range(1, 51):
        opp = Opportunity(
            title=f'Approved Untouched Opportunity {i:03d}',
            description=f'Approved opportunity with no applications yet {i:03d}',
            category=random.choice(categories),
            location=random.choice(locations),
            type=random.choice(types),
            deadline=datetime.utcnow() + timedelta(days=random.randint(30, 180)),
            application_link=f'https://internlink.local/apply/untouched-{i:03d}',
            company_id=random.choice(companies).id,
            status='approved',
            verified_by=random.choice(universities).id,
            verified_at=datetime.utcnow() - timedelta(days=random.randint(1, 20)),
        )
        approved_untouched.append(opp)
        db.session.add(opp)

    return pending_opportunities, approved_pending_apps, approved_chosen_apps, approved_untouched


def _seed_applications(students, approved_pending_apps, approved_chosen_apps):
    # 100 approved opportunities with lots of undecided applications
    for opp in approved_pending_apps:
        applied_students = random.sample(students, k=min(20, len(students)))
        for student in applied_students:
            status = random.choice(['submitted', 'under_review'])
            db.session.add(
                Application(
                    student_id=student.id,
                    opportunity_id=opp.id,
                    status=status,
                    notes='Application pending company decision',
                )
            )

    # 100 approved opportunities with lots of chosen students
    for opp in approved_chosen_apps:
        accepted_students = set(student.id for student in random.sample(students, k=min(8, len(students))))
        applied_students = random.sample(students, k=min(20, len(students)))
        for student in applied_students:
            status = 'accepted' if student.id in accepted_students else 'rejected'
            db.session.add(
                Application(
                    student_id=student.id,
                    opportunity_id=opp.id,
                    status=status,
                    notes='Application processed by company',
                )
            )


def main():
    app = create_app()

    with app.app_context():
        random.seed(42)

        print('🔧 Setting up database schema...')
        print('  - Recreating all tables...')
        db.drop_all()
        db.create_all()
        print('  ✓ Database schema created successfully!')

        print('\n👤 Creating base test users...')
        unverified_token = _seed_base_test_users()

        print('👥 Creating bulk users...')
        students, companies, universities, admins = _seed_bulk_users()

        db.session.commit()

        print('📢 Creating opportunities...')
        pending_opps, approved_pending_apps, approved_chosen_apps, approved_untouched = _seed_opportunities(
            companies=companies,
            universities=universities,
        )

        db.session.commit()

        print('📝 Creating applications...')
        _seed_applications(
            students=students,
            approved_pending_apps=approved_pending_apps,
            approved_chosen_apps=approved_chosen_apps,
        )

        db.session.commit()

        total_students = User.query.filter_by(role='student').count()
        total_companies = User.query.filter_by(role='company').count()
        total_universities = User.query.filter_by(role='university').count()
        total_admins = User.query.filter_by(role='admin').count()

        total_opportunities = Opportunity.query.count()
        total_pending_opportunities = Opportunity.query.filter_by(status='pending').count()
        total_approved_opportunities = Opportunity.query.filter_by(status='approved').count()

        undecided_pending_count = Application.query.join(Opportunity).filter(
            Opportunity.id.in_([o.id for o in approved_pending_apps]),
            Application.status.in_(['submitted', 'under_review']),
        ).count()
        chosen_count = Application.query.join(Opportunity).filter(
            Opportunity.id.in_([o.id for o in approved_chosen_apps]),
            Application.status == 'accepted',
        ).count()
        untouched_count = Application.query.join(Opportunity).filter(
            Opportunity.id.in_([o.id for o in approved_untouched]),
        ).count()

        print('\n✅ Setup complete!')
        print('\nBase test credentials (password: password123):')
        print('  Admin:      admin@internlink.local')
        print('  University: university@internlink.local')
        print('  Company:    company@internlink.local')
        print('  Student (pending approval): pending@internlink.local')
        print('  Student (verified, approved): approved@internlink.local')
        print('  Student (unverified): unverified@internlink.local')
        print(f'  Verification token for unverified: {unverified_token}')

        print('\nSeed summary:')
        print(f'  Students:   {total_students} (includes 30 bulk + test users)')
        print(f'  Companies:  {total_companies} (includes 10 bulk + test users)')
        print(f'  University: {total_universities} (includes 5 bulk + test users)')
        print(f'  Admins:     {total_admins} (includes 5 bulk + test users)')
        print(f'  Opportunities: {total_opportunities}')
        print(f'    - Pending approval: {total_pending_opportunities}')
        print(f'    - Approved: {total_approved_opportunities}')
        print(f'      - Approved with many undecided applications: {len(approved_pending_apps)} opportunities, {undecided_pending_count} applications')
        print(f'      - Approved with many chosen students: {len(approved_chosen_apps)} opportunities, {chosen_count} accepted applications')
        print(f'      - Approved untouched: {len(approved_untouched)} opportunities, {untouched_count} applications')


if __name__ == '__main__':
    main()
