"""
========================================
INTERNLINK BACKEND - ENTRY POINT
========================================

Creates and starts the Flask development server.
The app instance is configured with database, JWT, CORS, and all blueprints.

@author Iva Hasani
@contributor Deshira Lusha
"""

from app import create_app

# ===== INITIALIZE APPLICATION =====
app = create_app()

# ===== RUN SERVER =====
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
