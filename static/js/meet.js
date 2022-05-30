var myStatus;
var matchedUser;
function fetchMatchUser() {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: "/api/fetch_pairing_status",
            type: "POST",
            success: function (res) {
                resolve(res)
            },
            fail: function (xhr, ajaxOptions, thrownError) {
                reject(false)
            },
        })
    })
}

async function init() {
    try {
        var res = JSON.parse(await fetchMatchUser());
        myStatus = res['data']['pairing_status'];
        matchedUser = res['data']['matched_user'];
        // console.log(matchedUser)
        checkStatus();
        renderPairInfo(matchedUser);
        // console.log(myStatus, matchedUser);
    } catch (err) {
        console.log(err);
    }
}

function checkStatus() {
    console.log("myStatus: ", myStatus);
    if (myStatus === 1) {
        $("#meet-wait").hide();
        $("#meet-action").text("LIKE");
        $("#meet-action").show();
    }
    else if (myStatus === 2) {
        $("#meet-action").hide();
        $("#meet-wait").text("Waiting for another person...");
        $("#meet-wait").show();
        $("#meet-like").addClass("action");
    }
    else if (myStatus === 3) {
        $("#meet-wait").hide();
        $("#meet-action").text("SEND TRANSACTION");
        $("#meet-action").show();
    }
    else if (myStatus === 4) {
        $("#meet-action").hide();
        $("#meet-wait").text("Waiting for another person...");
        $("#meet-wait").show();
        $("#meet-trans").addClass("action");
    }
    else if (myStatus === 5) {
        $("#meet-wait").hide();
        $("#meet-action").text("CHAT");
        $("#meet-action").show();
        $("#meet-paired").addClass("action");
        $("#meet-action").attr("href", "/chat");
    }
}

function renderPairInfo(matchedUser) {
    $("#meet-name").text(matchedUser['username']);
    $("#meet-age").text(matchedUser['age']);
    $("#meet-birthday").text(matchedUser['birthday']);
    $("#meet-gender").text(matchedUser['gender']);
    $("#meet-hobby").text(matchedUser['hobby']);
    $("#meet-pubkey").text('@' + matchedUser['pubkey']);
}

init();
