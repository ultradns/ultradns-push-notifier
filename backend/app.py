from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
from datetime import datetime
import os
import requests
import uuid
import sqlalchemy

# Load .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

# Key for sessions 
app.secret_key = os.urandom(32).hex()

# Configure SQLite database in the /data folder
os.makedirs('data', exist_ok=True)

# Absolute path for the database
base_dir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{base_dir}/data/data.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Generate an internal API token for the frontend to use
INTERNAL_API_TOKEN = os.urandom(32).hex()
print(f"Generated frontend API Token: {INTERNAL_API_TOKEN}", flush=True)  # Log this for the frontend

# Determine if IP filtering is enabled
FILTER_IPS = os.getenv("FILTER_IPS", "false").lower() == "true"

# List of allowed IPs for external endpoints
ALLOWED_ULTRADNS_IPS = [
    "52.87.134.132",
    "52.201.155.120",
    "52.201.103.62",
    "52.201.155.234",
    "52.10.123.90",
    "52.10.63.3",
    "52.39.68.132",
]

def is_request_from_frontend():
    """
    Validate if the request includes the correct API token.
    """
    api_token = request.headers.get("X-Api-Token")
    return api_token == INTERNAL_API_TOKEN

def is_request_from_allowed_ips():
    """
    Conditionally check if the request comes from allowed UltraDNS IPs.
    - If IP filtering is disabled (FILTER_IPS=False), always return True.
    - If enabled (FILTER_IPS=True), apply the X-Forwarded-For and client IP checks.
    """
    if not FILTER_IPS:
        print("IP filtering is disabled. Allowing all requests.", flush=True)
        return True

    # IP filtering logic
    client_ip = request.remote_addr
    headers = {key: value for key, value in request.headers.items()}

    # Log headers and client IP for debugging
    print(f"Client IP (remote_addr): {client_ip}", flush=True)
    print(f"Request Headers: {headers}", flush=True)

    # Check if the X-Forwarded-For header exists
    x_forwarded_for = request.headers.get("X-Forwarded-For")
    if x_forwarded_for:
        # Extract the list of IPs from the header
        ip_list = [ip.strip() for ip in x_forwarded_for.split(",")]
        print(f"X-Forwarded-For IPs: {ip_list}", flush=True)

        # Check if any IP in the list matches the allowed IPs
        if any(ip in ALLOWED_ULTRADNS_IPS for ip in ip_list):
            print("Request is from an allowed IP (via X-Forwarded-For).", flush=True)
            return True
    else:
        # Fallback: check the client IP (remote_addr)
        if client_ip in ALLOWED_ULTRADNS_IPS:
            print("Request is from an allowed IP (via remote_addr).", flush=True)
            return True

    # If no match found
    print("Request is NOT from an allowed IP.", flush=True)
    return False

# Apply access control to internal API endpoints
@app.before_request
def restrict_access():
    # Protect internal endpoints
    if request.path.startswith(('/api/status', '/api/login', '/api/logout', '/api/setup', '/api/webhooks')):
        if not is_request_from_frontend():
            return jsonify({"error": "Forbidden"}), 403

    # Protect external endpoints
    if request.path.startswith(('/api/slack', '/api/teams')):
        if not is_request_from_allowed_ips():
            return jsonify({"error": "Forbidden"}), 403

# Setup global
setup_complete = False

# Define models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)

class WebhookConnection(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(20), nullable=False)  # e.g., 'teams', 'slack', 'discord'
    token = db.Column(db.String(100), unique=True, nullable=False)
    webhook_url = db.Column(db.String(500), nullable=False)
    status = db.Column(db.String(20), nullable=False)  # e.g., 'pending', 'verified'

# Create database tables if they don't exist
with app.app_context():
    db.create_all()

@app.route('/api/gui-status', methods=['GET'])
def get_gui_status():
    """
    Returns the GUI status (enabled/disabled) based on the environment variable.
    """
    gui_disabled = os.getenv("DISABLE_GUI", "false").lower() == "true"
    return jsonify({"gui_disabled": gui_disabled}), 200

@app.route('/api/init', methods=['GET'])
def init():
    """
    Expose the API token to the frontend during initialization.
    """
    return jsonify({"api_token": INTERNAL_API_TOKEN})

@app.route('/api/status', methods=['GET'])
def status():
    admin = User.query.filter_by(username='admin').first()
    has_admin_password = bool(admin)
    has_webhooks = WebhookConnection.query.count() > 0
    logged_in = session.get('logged_in', False)

    return jsonify({
        "has_admin_password": has_admin_password,
        "has_webhooks": has_webhooks,
        "logged_in": logged_in,
        "setup_complete": setup_complete,  # Include setup_complete flag
        "webhooks": [
            {
                "type": connection.type,
                "status": connection.status,  # Include the status field
                "webhook_url": connection.webhook_url,
                "token": connection.token,
            }
            for connection in WebhookConnection.query.all()
        ] if logged_in and has_webhooks else [],
    }), 200

@app.route('/api/login', methods=['POST'])
def login():
    """
    Handles login requests.
    - If no admin password is set, allow setting it.
    - If the password is set, validate login credentials.
    """
    data = request.json
    password = data.get("password")
    
    if not password:
        return jsonify({"message": "Password is required"}), 400

    admin = User.query.filter_by(username='admin').first()
    
    # Allow setting the password if no admin exists
    if not admin:
        admin = User(username='admin', password=password)
        db.session.add(admin)
        db.session.commit()
        session['logged_in'] = True
        return jsonify({"message": "Password set and logged in."}), 200
    
    # Validate login if admin exists
    if admin.password == password:
        session['logged_in'] = True
        return jsonify({"message": "Logged in successfully."}), 200

    return jsonify({"message": "Invalid password"}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    """
    Logs the user out by clearing the session.
    """
    session.clear()
    return jsonify({"message": "Logged out successfully"}), 200

@app.route('/api/setup', methods=['GET', 'POST'])
def setup():
    global setup_complete
    if request.method == 'POST':
        data = request.json

        # Handle admin password setup
        admin = User.query.filter_by(username='admin').first()
        if not admin:
            password = data.get('password')
            if password:
                admin = User(username='admin', password=password)
                db.session.add(admin)
                db.session.commit()
                return jsonify({"message": "Admin password set."}), 200

        # Handle webhook URL setup (Teams or Slack)
        webhook_url = data.get('webhook_url')
        platform = data.get('platform')  # Expect 'teams' or 'slack'

        if webhook_url and platform in ['teams', 'slack']:
            token = str(uuid.uuid4())  # Generate a unique token
            connection = WebhookConnection(
                type=platform,
                token=token,
                webhook_url=webhook_url,
                status='pending'
            )

            try:
                db.session.add(connection)
                db.session.commit()
            except sqlalchemy.exc.IntegrityError:
                db.session.rollback()
                return jsonify({"message": "Duplicate token detected. Please retry."}), 400

            # Get current time
            current_timestamp = datetime.now()
            formatted_timestamp = current_timestamp.strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]

            # Send a test message to the webhook
            test_event = {
                "accountName": "none",
                "telemetryEventType": "TEST_WEBHOOK_ENDPOINT",
                "telemetryEvent": {
                    "objectType": "Setup",
                    "changeType": "Sending a test message to webhook",
                    "changeTime": formatted_timestamp,
                    "object": "Test Object",
                    "user": "none",
                    "application": "Setup Process"
                }
            }

            try:
                if platform == 'teams':
                    teams_message = transform_to_teams_card(test_event)
                    send_to_teams(webhook_url, teams_message)
                elif platform == 'slack':
                    slack_message = transform_to_slack_block(test_event)
                    send_to_slack(webhook_url, slack_message)
            except Exception as e:
                return jsonify({"message": f"Failed to send test message: {e}"}), 500

            # Wait for the test telemetry event to be received
            setup_complete = False  # Reset to false until test succeeds
            return jsonify({
                "message": f"{platform.capitalize()} URL set and test message sent.",
                "token": token,
                "waiting_for_test": True
            }), 200

    # GET method checks setup status
    admin_exists = User.query.filter_by(username='admin').first() is not None
    webhook_exists = WebhookConnection.query.count() > 0
    setup_complete = admin_exists and webhook_exists
    return jsonify({"setup_complete": setup_complete}), 200

@app.route('/api/webhooks/<token>', methods=['DELETE'])
def delete_webhook(token):
    webhook = WebhookConnection.query.filter_by(token=token).first()
    if webhook:
        db.session.delete(webhook)
        db.session.commit()
        return jsonify({"message": "Webhook deleted successfully."}), 200
    else:
        return jsonify({"error": "Webhook not found."}), 404

@app.route('/api/slack/<token>', methods=['POST'])
def slack_webhook(token):
    global setup_complete
    # Validate the provided token
    connection = WebhookConnection.query.filter_by(token=token, type="slack").first()
    if not connection:
        return jsonify({"error": "Invalid token"}), 404

    # Parse the incoming request
    payload = request.json
    if not payload:
        return jsonify({"error": "Invalid request format"}), 400

    events = payload.get("telemetryEvents")
    if not events or not isinstance(events, list):
        app.logger.warning("Invalid telemetryEvents format")
        return jsonify({"error": "Invalid telemetryEvents format"}), 400

    for event in events:
        telemetry_event_type = event.get("telemetryEventType")
        if telemetry_event_type == "TEST_TELEMETRY_WEBHOOK":
            # Update connection status
            connection.status = "verified"
            db.session.commit()

            # Send test telemetry event to Slack
            slack_block = transform_to_slack_block(format_test_telemetry(event))
            try:
                requests.post(
                    connection.webhook_url,
                    json=slack_block,
                    headers={"Content-Type": "application/json"}
                )
            except requests.RequestException as e:
                app.logger.error(f"Error sending Slack notification: {str(e)}")
                return jsonify({"error": "Failed to send test to webhook"}), 500

            # Complete the setup process
            setup_complete = True  # Transition to the dashboard in frontend
            return '', 200

        # Handle regular telemetry events
        else:
            slack_block = transform_to_slack_block(event)
            try:
                requests.post(
                    connection.webhook_url,
                    json=slack_block,
                    headers={"Content-Type": "application/json"}
                )
            except requests.RequestException as e:
                app.logger.error(f"Error sending Slack notification: {str(e)}")
                return jsonify({"error": "Failed to send notification"}), 500

    return '', 200

@app.route('/api/teams/<token>', methods=['POST'])
def teams_webhook(token):
    global setup_complete

    # Validate the provided token
    connection = WebhookConnection.query.filter_by(token=token).first()
    if not connection:
        return jsonify({"error": "Invalid token"}), 404

    # Parse the incoming request
    payload = request.json
    if not payload:
        return jsonify({"error": "Invalid request format"}), 400

    print(payload, flush=True)
    events = payload.get("telemetryEvents")
    if not events or not isinstance(events, list):
        app.logger.warning("Invalid telemetryEvents format")
        return jsonify({"error": "Invalid telemetryEvents format"})

    for event in events:
        telemetry_event_type = event.get("telemetryEventType")
        if telemetry_event_type == "TEST_TELEMETRY_WEBHOOK":
            # Update connection status
            connection.status = "verified"
            db.session.commit()

            # Send test telemetry event to Teams
            teams_card = transform_to_teams_card(format_test_telemetry(event))
            try:
                # Post to Teams webhook
                requests.post(
                    connection.webhook_url,  # Webhook URL stored in the database
                    json=teams_card,
                    headers={"Content-Type": "application/json"}
                )
            except requests.RequestException as e:
                app.logger.error(f"Error sending Teams notification: {str(e)}")
                return jsonify({"error": "Failed to send test to webhook"}), 500

            # Complete the setup process
            setup_complete = True  # Transition to the dashboard in frontend
            return '', 200

        # Handle regular telemetry events
        else:
            teams_card = transform_to_teams_card(event)
            try:
                requests.post(
                    connection.webhook_url,
                    json=teams_card,
                    headers={"Content-Type": "application/json"}
                )
            except requests.RequestException as e:
                app.logger.error(f"Error sending Teams notification: {str(e)}")
                return jsonify({"error": "Failed to send notification"}), 500

            return '', 200

    return jsonify({"error": "No supported telemetry events found"}), 400

def transform_to_slack_block(event):
    """
    Transform UltraDNS JSON event to Slack Blocks.
    """
    telemetry_event = event.get('telemetryEvent', {})
    account_name = event.get('accountName', 'Unknown Account')
    telemetry_event_type = event.get('telemetryEventType', 'Unknown Event')
    object_type = telemetry_event.get('objectType', 'Unknown Object')
    change_type = telemetry_event.get('changeType', 'Unknown Change')
    change_time = telemetry_event.get('changeTime', 'Unknown Time')
    ultra_object = telemetry_event.get('object', 'Unknown Object')
    ultra_user = telemetry_event.get('user', 'Unknown User')
    change_source = telemetry_event.get('application', 'Unknown Application')

    # Prepare fields
    fields = [
        {"type": "mrkdwn", "text": "*Time:*"}, {"type": "mrkdwn", "text": change_time},
        {"type": "mrkdwn", "text": "*Object Type:*"}, {"type": "mrkdwn", "text": object_type},
        {"type": "mrkdwn", "text": "*Change Type:*"}, {"type": "mrkdwn", "text": change_type},
        {"type": "mrkdwn", "text": "*Object:*"}, {"type": "mrkdwn", "text": ultra_object},
        {"type": "mrkdwn", "text": "*Account:*"}, {"type": "mrkdwn", "text": account_name},
        {"type": "mrkdwn", "text": "*User:*"}, {"type": "mrkdwn", "text": ultra_user},
        {"type": "mrkdwn", "text": "*Application:*"}, {"type": "mrkdwn", "text": change_source},
    ]

    # Split fields into chunks of 10
    field_sections = []
    for i in range(0, len(fields), 10):
        field_sections.append(fields[i:i+10])

    # Construct Slack blocks
    slack_blocks = [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": f"{account_name} {telemetry_event_type} {object_type} {change_type}",
                "emoji": True
            }
        }
    ]

    for section in field_sections:
        slack_blocks.append({
            "type": "section",
            "fields": section
        })

    return {"blocks": slack_blocks}

def transform_to_teams_card(event):
    """
    Transform UltraDNS JSON event to a Teams Adaptive Card.
    """
    # Top-level attributes
    account_name = event.get('accountName', 'Unknown Account')
    telemetry_event_type = event.get('telemetryEventType', 'Unknown Event')
    telemetry_event_time = event.get('telemetryEventTime', 'Unknown Time')

    # Nested telemetryEvent attributes
    telemetry_event = event.get('telemetryEvent', {})
    object_type = telemetry_event.get('objectType', 'Unknown Object')
    change_type = telemetry_event.get('changeType', 'Unknown Change')
    change_time = telemetry_event.get('changeTime', telemetry_event_time)
    ultra_object = telemetry_event.get('object', 'Unknown Object')
    ultra_user = telemetry_event.get('user', 'Unknown User')
    change_source = telemetry_event.get('application', 'Unknown Application')

    # Define Teams card
    teams_message = {
        "summary": f"{account_name} {telemetry_event_type} {object_type} {change_type}",
        "attachments": [
            {
                "contentType": "application/vnd.microsoft.card.adaptive",
                "content": {
                    "type": "AdaptiveCard",
                    "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                    "version": "1.2",
                    "body": [
                        {
                            "type": "TextBlock",
                            "text": f"**{account_name} {telemetry_event_type}**",
                            "weight": "Bolder",
                            "size": "Medium"
                        },
                        {
                            "type": "FactSet",
                            "facts": [
                                {"title": "Time", "value": change_time},
                                {"title": "Object Type", "value": object_type},
                                {"title": "Change Type", "value": change_type},
                                {"title": "Object", "value": ultra_object},
                                {"title": "Account", "value": account_name},
                                {"title": "User", "value": ultra_user},
                                {"title": "Application", "value": change_source}
                            ]
                        }
                    ]
                }
            }
        ]
    }

    # Handle additional changes if present
    detail = telemetry_event.get('detail', {})
    changes = detail.get('changes', [])
    if changes:
        additional_facts = []
        for change in changes:
            additional_facts.extend([
                {"title": "Value", "value": change.get('value', '-')},
                {"title": "From", "value": change.get('from', '-')},
                {"title": "To", "value": change.get('to', '-')}
            ])
        # Append additional facts to the FactSet
        teams_message["attachments"][0]["content"]["body"][1]["facts"].extend(additional_facts)

    return teams_message

def format_test_telemetry(event):
    account_name = event.get('accountName', 'Unknown Account')
    telemetry_event_id = event.get('telemetryEventId', 'Unknown ID')
    telemetry_event_type = event.get('telemetryEventType', 'Unknown Type')
    telemetry_event_time = event.get('telemetryEventTime', 'Unknown Time')

    # Format a test event that is actually parseable
    test_event = {
        "accountName": account_name,
        "telemetryEventType": telemetry_event_type,
        "telemetryEvent": {
            "objectType": "Setup",
            "changeType": "Testing telemetry from UltraDNS application",
            "changeTime": telemetry_event_time,
            "object": "Test Telemetry",
            "user": account_name,
            "application": "Setup Process"
        }
    }

    return test_event


def send_to_slack(webhook_url, message):
    try:
        response = requests.post(webhook_url, json=message, headers={"Content-Type": "application/json"})
        response.raise_for_status()  # Raise an exception for HTTP errors
    except requests.RequestException as e:
        print(f"Error sending to Slack: {e}", flush=True)

def send_to_teams(webhook_url, message):
    try:
        requests.post(webhook_url, json=message)
        response.raise_for_status()
    except Exception as e:
        print(f"Error sending to Teams: {e}", flush=True)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8087)

