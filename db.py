from os import curdir
import sqlite3
import hashlib
from verify import generate_match_id

def get_db():
    conn = sqlite3.connect('solution.db', check_same_thread=False)
    conn.row_factory = sqlite3.Row
    print ("connected to db")
    return conn
    
def create_tables(conn):
    c = conn.cursor()

    c.execute('''CREATE TABLE User
        (pubkey             TEXT PRIMARY KEY     NOT NULL,
         username           TEXT                 NOT NULL,
         birthday           TEXT                 NOT NULL,
         gender             TEXT                 NOT NULL,
         hobby              TEXT                 NOT NULL,
         nft_addr           TEXT                         ,
         img_url            TEXT                         ,
         level              INTEGER                              
        );''')
    
    c.execute('''CREATE TABLE Match
        (id                 TEXT                 NOT NULL,
         user1              TEXT                 NOT NULL,
         user2              TEXT                 NOT NULL,
         txid               TEXT                 
        );''')
    
    c.execute('''CREATE TABLE Message
        (id                INTEGER PRIMARY KEY   AUTOINCREMENT,
         room              TEXT                  NOT NULL,
         user              TEXT                  NOT NULL,
         message           TEXT                  NOT NULL,
         timestamp         TEXT                  NOT NULL
        );''')
    
    c.execute('''CREATE TABLE PairingStatus
        (user              TEXT PRIMARY KEY      NOT NULL,
         matched_user      TEXT                  NOT NULL,
         status            INTEGER               NOT NULL
        );''')
    
    print ("create table successfully")
    conn.commit()
    conn.close()

def get_user_by_pubkey(conn, pubkey):
    cur = conn.cursor()
    cur.execute(f"SELECT * FROM User WHERE pubkey = '{pubkey}'")

    row = cur.fetchone()
    if row:
        return row
    else:
        return None

def register_new_user(conn, pubkey):
    cur = conn.cursor()
    cur.execute(f"INSERT INTO User (pubkey, username, birthday, hobby, gender) VALUES ('{pubkey}', 'user_{pubkey}', '1999-03-01', 'None', 'male');")
    conn.commit()

def add_match_record(conn, pubkey1, pubkey2):
    match_id = generate_match_id(pubkey1, pubkey2)
    cur = conn.cursor()
    cur.execute(f"INSERT INTO Match (id, user1, user2) VALUES ('{match_id}', '{pubkey1}', '{pubkey2}');")
    cur.execute(f"INSERT INTO Match (id, user1, user2) VALUES ('{match_id}', '{pubkey2}', '{pubkey1}');")
    conn.commit()
    

def check_match_exist(conn, pubkey1, pubkey2):
    cur = conn.cursor()
    cur.execute(f"SELECT * FROM Match WHERE user1 = '{pubkey1}' AND user2 = '{pubkey2}'")
    row = cur.fetchone()
    if row:
        return True
    else:
        return False

def get_matched_user_by_pubkey(conn, pubkey):
    cur = conn.cursor()
    cur.execute(f"SELECT * FROM Match WHERE user1 = '{pubkey}' ORDER BY user2 ASC")
    rows = cur.fetchall()
    if rows == []:
        return None
    else:
        ids = []
        match_ids = []
        tx_ids = []
        for row in rows:
            ids.append(row['user2'])
            match_ids.append(row['id'])
            tx_ids.append(row['txid'])
        #print(match_ids)
        query = f"SELECT * FROM User WHERE pubkey in ({','.join(['?']*len(ids))}) ORDER BY pubkey ASC"
        cur.execute(query, ids)
        rows = cur.fetchall()
        
        assert(len(match_ids) == len(rows))
        res = []
        for i in range(len(rows)):
            tmp = {}
            tmp['room_id'] = match_ids[i]
            tmp['txid'] = tx_ids[i]
            tmp['pubkey'] = rows[i]['pubkey']
            tmp['username'] = rows[i]['username']
            # if the matched user still have nft
            if rows[i]['nft_addr']:
                res.append(tmp)
            
        return res
        
def get_info_by_pubkey(conn, pubkey):
    user = get_user_by_pubkey(conn, pubkey)
    assert user is not None
    res = {}
    res['username'] = user['username']
    res['birthday'] = user['birthday']
    res['gender'] = user['gender']
    res['hobby'] = user['hobby']
    res['pubkey'] = user['pubkey']
    res['img_url'] = user['img_url']
    res['nft_addr'] = user['nft_addr']
    res['level'] = user['level']
    return res

def set_info_by_pubkey(conn, pubkey, username, birthday, gender, hobby):
    cur = conn.cursor()
    cur.execute(f"UPDATE User SET username = '{username}', birthday = '{birthday}', gender = '{gender}', hobby = '{hobby}' WHERE pubkey = '{pubkey}';")
    conn.commit()

#use when entering room
def get_another_user_info(conn, pubkey, room_id):
    cur = conn.cursor()
    cur.execute(f"SELECT * FROM Match WHERE user1 = '{pubkey}' AND id = '{room_id}'")
    row = cur.fetchone()
    assert row
    cur.execute(f"SELECT * FROM User WHERE pubkey = '{row['user2']}'")
    row = cur.fetchone()
    return dict(row)

def commit_chat_record(conn, pubkey, room_id, msg, timestamp):
    cur = conn.cursor()
    cur.execute(f"INSERT INTO Message (room, user, message, timestamp) VALUES ('{room_id}', '{pubkey}', '{msg}', '{timestamp}');")
    conn.commit()

def get_chat_record(conn, room_id):
    cur = conn.cursor()
    cur.execute(f"SELECT user, message, timestamp FROM Message WHERE room = '{room_id}' ORDER BY timestamp ASC")
    rows = cur.fetchall()

    if rows:
        res = []
        for row in rows:
            tmp = {}
            tmp['pubkey'] = row['user']
            tmp['message'] = row['message']
            tmp['timestamp'] = row['timestamp']
            res.append(tmp)
        return res
    else:
        return []

def get_all_user(conn):
    cur = conn.cursor()
    cur.execute(f"SELECT * FROM User")
    rows = cur.fetchall()
    return rows

def get_all_matched(conn):
    cur = conn.cursor()
    cur.execute(f"SELECT * FROM Match")
    rows = cur.fetchall()
    return rows

def reset_pairing_status(conn, pairing_result):
    cur = conn.cursor()
    cur.execute(f"DELETE FROM PairingStatus;")
    for user,matched_user in pairing_result.items():
        if matched_user != 'None':
            status = 1
        else:
            status = 0
        cur.execute(f"INSERT INTO PairingStatus (user, matched_user, status) VALUES ('{user}', '{matched_user}', {status});")
    conn.commit()
    
def get_pairing_status(conn, pubkey):
    cur = conn.cursor()
    cur.execute(f"SELECT * FROM PairingStatus WHERE user = '{pubkey}';")
    result = cur.fetchone()
    if result:
        return dict(result)
    else:
        # new user
        return None

def update_pairing_status(conn, pubkey, status):
    cur = conn.cursor()
    cur.execute(f"UPDATE PairingStatus SET status = {status} WHERE user = '{pubkey}';")
    conn.commit()

def update_user_nft(conn, pubkey, nft_pubkey, img_url, level):
    cur = conn.cursor()
    cur.execute(f"UPDATE User SET nft_addr='{nft_pubkey}', img_url ='{img_url}', level={level} WHERE pubkey = '{pubkey}';")
    conn.commit()

def clear_user_nft(conn, pubkey):
    cur = conn.cursor()
    cur.execute(f"UPDATE User SET nft_addr = null, img_url = null, level = null WHERE pubkey = '{pubkey}';")
    conn.commit()

def check_user_have_nft(conn, pubkey):
    cur = conn.cursor()
    cur.execute(f"SELECT * FROM User WHERE pubkey = '{pubkey}' and nft_addr IS NOT NULL and img_url IS NOT NULL;")
    res = cur.fetchone()
    if res:
        return True
    else:
        return False

def get_txid(conn, room_id):
    cur = conn.cursor()
    cur.execute(f"SELECT * FROM Match WHERE id = '{room_id}';")
    row = cur.fetchone()
    assert row
    txid = row['txid']
    return txid

def set_txid(conn, room_id, txid):
    cur = conn.cursor()
    cur.execute(f"UPDATE Match SET txid = '{txid}' WHERE id = '{room_id}';")
    conn.commit()


#create_tables(get_db())