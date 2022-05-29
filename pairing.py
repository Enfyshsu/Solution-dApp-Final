from db import *

def pairing_implement(db):
    all_user = [user['pubkey'] for user in get_all_user(db)]
    all_match = get_all_matched(db)
    already_matched = {}
    for match in all_match:
        if match['user1'] not in already_matched:
            already_matched[match['user1']] = [match['user2']]
        else:
            already_matched[match['user1']].append(match['user2'])
    
    pairable = {}
    for user in all_user:
        filter(lambda person: person['name'] == 'Pam', people)
    print(already_matched)