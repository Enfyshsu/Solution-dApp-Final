from db import *
import random

def pairing_implement(db):
    all_user = [user['pubkey'] for user in get_all_user(db) if user['nft_addr'] is not None]
    all_match = get_all_matched(db)
    already_matched = {}
    for match in all_match:
        if match['user1'] not in already_matched:
            already_matched[match['user1']] = [match['user2']]
        else:
            already_matched[match['user1']].append(match['user2'])
    
    pair_priority = {}
    is_paired = {}
    for user in all_user:
        is_paired[user] = False
        if user in already_matched:
            pair_priority[user] = len(already_matched[user])
        else:
            pair_priority[user] = 0
    
    pair_priority = dict(sorted(pair_priority.items(), key=lambda item: item[1], reverse=True))

    
    
    # start pairing
    result = {}
    for user1, _ in pair_priority.items():
        random_users =  list(pair_priority.keys())
        random.shuffle(random_users)
        for user2 in random_users:
            if (user1 != user2) and (is_paired[user1] == False) and (is_paired[user2] == False) and ((user1 not in already_matched) or (user2 not in already_matched[user1])):
                is_paired[user1] = True
                is_paired[user2] = True
                result[user1] = user2
                result[user2] = user1
    
    # useless, just for checking = =
    for u1, u2 in result.items():
        assert (u1 not in already_matched) or (u2 not in already_matched[u1]) 
        assert (u2 not in already_matched) or (u1 not in already_matched[u2]) 
    
    for user, paired in is_paired.items():
        if paired == False:
            result[user] = 'None'
    
    assert len(result) == len(all_user)
    
    reset_pairing_status(db, result)

# status 0: no pairing
# status 1: waiting for like (self)
# status 2: waiting for like (matched_user)
# status 3: waiting for sending transcation (self)
# status 4: waiting for sending transcation (matched_user)
# status 5: paired