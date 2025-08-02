import bcrypt
from functools import wraps
from flask import Blueprint, request, session, jsonify, render_template, redirect, url_for
# import razorpa
import razorpay
from dotenv import load_dotenv
import os
import razorpay
from datetime import datetime

load_dotenv()

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")

razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))



from pymongo import MongoClient

# Assuming you're already connected like this:
from pymongo import MongoClient
client = MongoClient("mongodb://localhost:27017/")
db = client["user_payment"]

auth_routes = Blueprint('auth_routes', __name__)

def init_db(database):
    global db
    db = database



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

@auth_routes.route('/')
def home():
        return render_template('home/index.html')



# Payment Code start

@auth_routes.route('/payment')
def payment():
    if 'email' not in session:
        return render_template('auth/login.html')  # Redirect to login if not logged in
    return render_template('payment.html', user=session['email'])

@auth_routes.route('/create-order', methods=['POST'])
def create_order():
    try:
        email = session.get('email')
        if not email:
            return jsonify({"success": False, "message": "User not logged in."})

        user = db.users.find_one({"email": email})
        if not user:
            return jsonify({"success": False, "message": "User not found in DB."})

        data = request.get_json()
        selected_plan = data.get('plan', 'basic').capitalize()


        # Set plan amount based on selected plan
        plan_amounts = {
            "basic": 99,
            "Standard": 555,
            "Premium": 999
        }
        if selected_plan not in plan_amounts:
            return jsonify({"success": False, "message": "Invalid plan selected."})

        amount = plan_amounts[selected_plan] * 100  # paise

        razorpay_order = razorpay_client.order.create({
            "amount": amount,
            "currency": "INR",
            "payment_capture": 1
        })

        return jsonify({
            "success": True,
            "currency": "INR",
            "data": {
                "order_id": razorpay_order["id"],
                "order_total": plan_amounts[selected_plan],
                "userDetail": {
                    "name": user['name'],
                    "email": user['email'],
                    "contact": user['contact']
                }
            }
        })

    except Exception as e:
        return jsonify({"success": False, "message": str(e)})


@auth_routes.route('/save-payment', methods=['POST'])
def save_payment():
    try:
        data = request.get_json()
        email = data['user']['email']
        plan = data['plan']
        payment_id = data['razorpay_payment_id']
        order_id = data['razorpay_order_id']

        # Save payment
        db.payments.insert_one({
            "payment_id": payment_id,
            "order_id": order_id,
            "plan": plan,
            "user": data['user'],
            "status": "success",
            "timestamp": datetime.now()
        })

        # Save tokens only after payment
        plan_tokens = {
            "Basic": 10000,
            "Standard": 40000,
            "Premium": 100000
        }
        tokens_allocated = plan_tokens.get(plan, 0)

        # Check if user already has a token record
        existing = db.tokens.find_one({"email": email})
        if existing:
            db.tokens.update_one(
                {"email": email},
                {
                    "$set": {
                        "tokens": tokens_allocated,
                        "plan": plan,
                        "timestamp": datetime.now(),
                        "used_tokens": 0
                    }
                }
            )
        else:
            db.tokens.insert_one({
                "email": email,
                "plan": plan,
                "tokens": tokens_allocated,
                "timestamp": datetime.now(),
                "used_tokens": 0
            })

        return jsonify({"success": True, "message": "Payment & tokens saved successfully."})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)})


@auth_routes.route('/order-confirm')
def order_confirm():
    return "✅ Payment Successful! Thank you for your order."


# payment code end