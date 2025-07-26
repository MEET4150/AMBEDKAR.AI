from flask import Blueprint, render_template, session, redirect, url_for

admin_routes = Blueprint('admin_routes', __name__)
def init_db(database):
    global db
    db = database


@admin_routes.route('/')
def admin_dashboard():
    return render_template('admin/user/index.html')
    if session.get('role') != 'admin':
        return redirect(url_for('auth_routes.login_page'))
    return render_template('admin_dashboard.html', admin=session['email'])
