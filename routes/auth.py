import bcrypt
from functools import wraps
from flask import Blueprint, request, session, jsonify, render_template, redirect, url_for
# from routes.auth import login_required_api

auth_routes = Blueprint('auth_routes', __name__)
db = None  # This will be set from app.py

def init_db(database):
    global db
    db = database




# Export the login_required_api so it can be imported in app.py
# def login_required_api(f):
#     @wraps(f)
#     def decorated_function(*args, **kwargs):
#         if 'email' not in session:
#             return jsonify({'success': False, 'message': 'Login required'}), 401
#         return f(*args, **kwargs)
#     return decorated_function



@auth_routes.route('/api/signup', methods=['POST'])
def api_signup():
    users = db['users']
    data = request.json
    name = data.get('name')
    contact = data.get('contact')
    email = data.get('email')
    password = data.get('password')

    if users.find_one({'email': email}):
        return jsonify({'success': False, 'message': 'Email already exists'}), 409

    # Hash the password
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    # Store hashed password in MongoDB (as binary or decode if needed)
    users.insert_one({
        'name': name,
        'contact': contact,
        'email': email,
        'password': hashed_password.decode('utf-8'),  # Store as string
        'role': 'user'
    })

    return jsonify({'success': True, 'message': 'User registered successfully'}), 201

@auth_routes.route('/api/login', methods=['POST'])
def api_login():
    users = db['users']
    data = request.json
    email = data.get('email')
    password = data.get('password')

    user = users.find_one({'email': email})
    if user:
        stored_hashed_password = user['password'].encode('utf-8')
        if bcrypt.checkpw(password.encode('utf-8'), stored_hashed_password):
            session['email'] = email
            session['role'] = user.get('role', 'user')
            return jsonify({'success': True, 'message': 'Login successful'}), 200
        else:
            # print("❌ Password mismatch")
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
    else:
        # print("❌ User not found")
        return jsonify({'success': False, 'message': 'User not found'}), 404

    return jsonify({'success': False, 'message': 'Invalid credentials'}), 401


@auth_routes.route('/api/user', methods=['GET'])
def get_user():
    if 'email' in session:
        return jsonify({
            'email': session['email'],
            'role': session.get('role', 'user'),
            'logged_in': True
        })
    return jsonify({'logged_in': False}), 401

@auth_routes.route('/api/logout', methods=['GET'])
def api_logout():
    session.clear()
    return jsonify({'success': True, 'message': 'Logged out'}), 200



@auth_routes.route('/dashboard')
def dashboard():
    if 'email' not in session:
        return render_template('auth/login.html')  # Redirect to login if not logged in
    return render_template('chat/index.html', user=session['email'])

@auth_routes.route('/logout')
def logout():
    session.clear()  # Clear all session data
    return render_template('auth/login.html')
