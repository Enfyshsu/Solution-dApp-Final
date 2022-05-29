import json
from flask import Flask, render_template, request, redirect, escape
from flask_socketio import SocketIO, join_room, leave_room
from datetime import datetime,timezone,timedelta
from verify import verify_signed_msg
from db import *
from pairing import pairing_implement 
import solana_api

app = Flask(__name__, static_folder='static', template_folder='templates')
socketio = SocketIO()
socketio.init_app(app)
db = get_db()


def verify_auth(request):
    try:
        signed_auth = json.loads(request.cookies.get('auth'))['data']
        pubKey = request.cookies.get('pubKey')
        verified = verify_signed_msg('Authentication', signed_auth, pubKey)
    except:
        return False
    
    if verified:
        # check whether the verified user registed in db or not
        if get_user_by_pubkey(db, pubKey) is None:
            register_new_user(db, pubKey)
        return True
    else:
        return False

user_room_pair = {}


@app.route("/api/fetch_matched_users", methods=['POST'])
def fetch_matched_users():
    if verify_auth(request):
        pubkey = request.cookies.get('pubKey')
        matched_user = get_matched_user_by_pubkey(db, pubkey)
        return json.dumps(matched_user)
    else:
        return 'Authentication Unverified'

@app.route("/api/fetch_user_info", methods=['POST'])
def fetch_user_info():
    if verify_auth(request):
        pubkey = request.cookies.get('pubKey')
        user_info = get_info_by_pubkey(db, pubkey)
        return json.dumps(user_info)
    else:
        return json.dumps({'status':'failed'})

@app.route("/api/edit_user_info", methods=['POST'])
def edit_user_info():
    if verify_auth(request):
        pubkey = request.cookies.get('pubKey')
        data = request.json
        birthday = data['birthday']
        username = data['name']
        gender = data['gender']
        hobby = data['hobby']
        if birthday == '' or username == '' or gender == '' or hobby == '':
            return json.dumps({'status':'failed', 'reason':'empty input'})
        else:
            set_info_by_pubkey(db, pubkey, username, birthday, gender, hobby)
            return json.dumps({'status':'success'})
    else:
        return json.dumps({'status':'failed', 'reason':'authentication failed'})

@app.route("/api/fetch_chat_records", methods=['POST'])
def fetch_chat_records():
    if verify_auth(request):
        room_id  = request.json['room_id']
        pubkey = request.cookies.get('pubKey')
        if pubkey in user_room_pair and user_room_pair[pubkey] == room_id: 
            chat_records = get_chat_record(db, room_id)
            return json.dumps({'status':'success', 'data': chat_records})
        else:
            return json.dumps({'status':'failed', 'reason':'you are not in this room'})
    else:
        return json.dumps({'status':'failed', 'reason':'authentication failed'})

@app.route("/api/check_auth", methods=['POST'])
def check_auth():
    try:
        signed_auth = json.loads(request.cookies.get('auth'))['data']
        pubKey = request.cookies.get('pubKey')
        verified = verify_signed_msg('Authentication', signed_auth, pubKey)
    except:
        return json.dumps({'is_auth': False, 'first_time': False})
        
    if verified:
        # check whether the verified user registed in db or not
        if get_user_by_pubkey(db, pubKey) is None:
            register_new_user(db, pubKey)
            return json.dumps({'is_auth': True, 'first_time': True})
        else:
            return json.dumps({'is_auth': True, 'first_time': False})
    else:
        return json.dumps({'is_auth': False, 'first_time': False})

@app.errorhandler(404)
def page_not_found(e):
    # note that we set the 404 status explicitly
    return render_template('error.html'), 404

@app.route("/")
def index():
    return render_template('home.html')

    
@app.route("/test")
def test():
    solana_api.test()
    return render_template('home.html')

@app.route("/match")
def match():
    pubkey1 = request.args.get('pubkey1')
    pubkey2 = request.args.get('pubkey2')
    if check_match_exist(db, pubkey1, pubkey2):
        return 'already exist'
    else:
        add_match_record(db, pubkey1, pubkey2)
        return 'success'

@app.route("/pairing")
def pairing():
    pairing_implement(db)
    return 'test'

@app.route("/chat")
def chat():
    # In particular, if user pass the test, cookie must contain 'pubkey' & 'auth'
    if verify_auth(request):
        return render_template('chat.html')
    else:
        return redirect('/')


@app.route("/meet")
def meet():
    if verify_auth(request):
        return render_template('meet.html')
    else:
        return redirect('/')

@app.route("/information")
def information():
    if verify_auth(request):
        return render_template('information.html')
    else:
        return redirect('/')
    

@app.route("/header")
def header():
    return render_template('header.html')

@app.route("/footer")
def footer():
    return render_template('footer.html')

@app.route("/nomatch")
def nomatch():
    return render_template('nomatch.html')

@socketio.on('message')
def handle_message(data):
    pubkey = data['pubkey']
    room_id = data['room_id']
    # check the user in the room
    if pubkey in user_room_pair and user_room_pair[pubkey] == room_id:
        data['timestamp'] = datetime.utcnow().replace(tzinfo=timezone.utc).astimezone(timezone(timedelta(hours=8))).strftime("%Y-%m-%d,%H:%M:%S")
        data['message'] = escape(data['message'])
        print(f'{pubkey} send a msg to {room_id}')
        commit_chat_record(db, pubkey, room_id, data['message'], data['timestamp'])
        socketio.emit('message_response', data, to=room_id)
    else:
        print('User not in this room!')

@socketio.on('join_room')
def on_join(data):
    room_id = data['room_id']
    pubkey = data['pubkey']
    auth = json.loads(data['auth'])['data']
    if verify_signed_msg('Authentication', auth, pubkey):
        join_room(room_id)
        user_room_pair[pubkey] = room_id
        another_user_info = get_another_user_info(db, pubkey, room_id)
        another_user_info['active'] = (another_user_info['pubkey'] in user_room_pair and user_room_pair[another_user_info['pubkey']] == room_id)
        #socketio.emit('success_joind', f'You have entered the room {room_id}.', to=room_id)
        res = {}
        res['room_id'] = room_id
        res['another_user'] = another_user_info 
        print(f'{pubkey} just join {room_id}.')
        socketio.emit('change_status', {'active':True}, to=room_id, include_self=False)
        socketio.emit('success_joind', res, to=request.sid)
        
    else:
        print('Join room failed.')

@socketio.on('leave_room')
def on_leave(data):
    room_id = data['room_id']
    pubkey = data['pubkey']
    user_room_pair[pubkey] = None
    print(f'{pubkey} just left {room_id}.')
    socketio.emit('change_status', {'active':False}, to=room_id, include_self=False)
    socketio.send('success_leave' + f'You have entered the room {room_id}', to=room_id)
    leave_room(room_id)
    

if __name__ == "__main__":
    #app.run('0.0.0.0',debug=True)
    socketio.run(app, host='0.0.0.0', debug=True)  