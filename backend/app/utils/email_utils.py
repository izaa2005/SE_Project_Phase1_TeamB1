"""
========================================
EMAIL UTILITIES
========================================

Send verification and password reset emails to users via SMTP.
Sends HTML emails with frontend links. Configuration from environment variables:
SMTP_SERVER, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, FROM_EMAIL

@author Deshira Lusha
@contributor Iva Hasani
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr
import os

def _load_email_config():
    smtp_server = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
    smtp_port = int(os.environ.get('SMTP_PORT', 587))
    smtp_user = os.environ.get('SMTP_USER')
    smtp_password = os.environ.get('SMTP_PASSWORD')
    from_email = os.environ.get('FROM_EMAIL') or smtp_user
    return smtp_server, smtp_port, smtp_user, smtp_password, from_email

# ===== EMAIL VERIFICATION =====
def send_verification_email(to_email, verify_url):
    """
    Send verification email to new user.
    They click the link to confirm they own the email address.
    """
    # ===== SMTP CONFIGURATION =====
    smtp_server, smtp_port, smtp_user, smtp_password, from_email = _load_email_config()

    # ===== EMAIL CONTENT =====
    # Izabela: "Nice HTML template with the verification link"
    subject = 'Verify your email for InternLink'
    body = f"""
    <h2>Welcome to InternLink!</h2>
    <p>Please verify your email by clicking the link below:</p>
    <a href='{verify_url}'>Verify Email</a>
    <p>If you did not register, you can ignore this email.</p>
    """

    if not smtp_user or not smtp_password or not from_email:
        print('SMTP credentials are not configured. Verification email will not be sent.')
        return False

    # ===== BUILD EMAIL MESSAGE =====
    # Deshira: "Multipart message - allows both plain text and HTML versions"
    msg = MIMEMultipart()
    msg['From'] = formataddr(('InternLink', from_email))
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'html'))

    # ===== SEND EMAIL =====
    # Iva: "Connect to SMTP server and send"
    try:
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()  # Upgrade to encrypted connection
            server.login(smtp_user, smtp_password)
            server.sendmail(from_email, to_email, msg.as_string())
        return True
    except Exception as e:
        print(f"Email send error: {e}")
        return False


# ===== PASSWORD RESET =====
def send_password_reset_email(to_email, reset_url):
    """
    Izabela: Send password reset email.
    User clicks link to go to reset page on frontend.
    """
    # ===== SMTP CONFIGURATION =====
    # Deshira: "Same as above - read from environment"
    smtp_server, smtp_port, smtp_user, smtp_password, from_email = _load_email_config()

    # ===== EMAIL CONTENT =====
    # Iva: "Include warning that link expires in 1 hour"
    subject = 'Reset your InternLink password'
    body = f"""
    <h2>InternLink Password Reset</h2>
    <p>We received a request to reset your password.</p>
    <p>Click the link below to choose a new password:</p>
    <a href='{reset_url}'>Reset Password</a>
    <p>This link expires in 1 hour.</p>
    <p>If you did not request this, you can safely ignore this email.</p>
    """

    # ===== BUILD EMAIL MESSAGE =====
    # Izabela: "Same structure as verification email"
    msg = MIMEMultipart()
    msg['From'] = formataddr(('InternLink', from_email))
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'html'))

    # ===== SEND EMAIL =====
    # Deshira: "Try to send, but don't crash if it fails"
    try:
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(from_email, to_email, msg.as_string())
        return True
    except Exception as e:
        print(f"Password reset email send error: {e}")
        return False