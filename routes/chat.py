from flask import Blueprint, render_template, session, redirect, url_for

chat_routes = Blueprint('chat_routes', __name__)

def init_db(database):
    global db
    db = database

@chat_routes.route('/')
def chat_dashboard():
    if 'email' not in session:
        return redirect(url_for('auth_routes.login_page'))
    return render_template('dashboard.html', user=session['email'])
