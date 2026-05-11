import requests

users = [
    "student@epoka.edu.al",
    "company@example.com",
    "university@epoka.edu.al",
    "admin@internlink.com"
]
password = "password123"
url = "http://127.0.0.1:5001/api/auth/login"

for email in users:
    payload = {"email": email, "password": password}
    try:
        response = requests.post(url, json=payload)
        status = response.status_code
        success = "success" if status == 200 else "failed"
        print(f"User: {email}, Status: {status}, Login: {success}")
    except Exception as e:
        print(f"User: {email}, Error: {str(e)}")
