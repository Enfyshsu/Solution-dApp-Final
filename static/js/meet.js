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

async function fetchPairing() {
    try {
        var res = JSON.parse(await fetchMatchUser());
        if (res['data']['pairing_status'] > 0) {
            console.log(res['data']);
            myStatus = res['data']['pairing_status'];
            matchedUser = res['data']['matched_user'];
            checkStatus(matchedUser['pubkey']);
            renderPairInfo(matchedUser);
        }
        else {
            document.cookie = "pairing_status=" + res['data']['pairing_status'];
            window.location.replace("/nomatch");
        }

    } catch (err) {
        console.log(err);
    }
}

function checkStatus(another_user_pubkey) {
    if (myStatus === 1) {
        $("#meet-wait").hide();
        $("#meet-action").text("LIKE");
        $("#meet-action").show();
    }
    else if (myStatus === 2) {
        $("#meet-action").hide();
        $("#meet-wait").text("Waiting for another person...");
        $("#meet-wait").show();
    }
    else if (myStatus === 3) {
        $("#meet-wait").hide();
        $("#meet-action").text("CHAT");
        $("#meet-action").attr("href", "/chat?to=" + another_user_pubkey);
        $("#meet-action").show();
    }
}

// function checkStatus() {
//     if (myStatus === 1) {
//         $("#meet-wait").hide();
//         $("#meet-action").text("LIKE");
//         $("#meet-action").show();
//         // $("#meet-like").attr("class", "circle processing");
//         // $("#meet-trans").attr("class", "circle");
//         // $("#meet-paired").attr("class", "circle");
//     }
//     else if (myStatus === 2) {
//         $("#meet-action").hide();
//         $("#meet-wait").text("Waiting for another person...");
//         $("#meet-wait").show();
//         // $("#meet-like").attr("class", "circle processing");
//         // $("#meet-trans").attr("class", "circle");
//         // $("#meet-paired").attr("class", "circle");
//     }
//     else if (myStatus === 3) {
//         $("#meet-wait").hide();
//         $("#meet-action").text("SEND TRANSACTION");
//         $("#meet-action").show();
//         // $("#meet-like").attr("class", "circle finished");
//         // $("#meet-trans").attr("class", "circle processing");
//         // $("#meet-paired").attr("class", "circle");
//     }
//     else if (myStatus === 4) {
//         $("#meet-action").hide();
//         $("#meet-wait").text("Waiting for another person...");
//         $("#meet-wait").show();
//         // $("#meet-like").attr("class", "circle finished");
//         // $("#meet-trans").attr("class", "circle processing");
//         // $("#meet-paired").attr("class", "circle");
//     }
//     else if (myStatus === 5) {
//         $("#meet-wait").hide();
//         $("#meet-action").text("CHAT");
//         $("#meet-action").show();
//         $("#meet-paired").addClass("active");
//         $("#meet-action").attr("href", "/chat");
//         // $("#meet-like").attr("class", "circle finished");
//         // $("#meet-trans").attr("class", "circle finished");
//         // $("#meet-paired").attr("class", "circle finished");
//     }
//     // $(".processing").attr("style", "animation-name: shining")
// }

function renderPairInfo(matchedUser) {
    $("#meet-photo").attr("src", matchedUser['img_url']);
    $("#meet-solscan-url").attr("href", "https://solscan.io/token/" + matchedUser['nft_addr'] + "?cluster=devnet");
    $("#meet-name").text(matchedUser['username']);
    $("#meet-age").text(matchedUser['age']);
    $("#meet-birthday").text(matchedUser['birthday']);
    $("#meet-gender").text(matchedUser['gender']);
    $("#meet-hobby").text(matchedUser['hobby']);
    $("#meet-pubkey").text('@' + matchedUser['pubkey']);
}

$("#meet-action").click(function () {
    if (myStatus === 1) {
        $.ajax({
            url: "/api/like_matched_user",
            type: "POST",
            success: function (res) {
                console.log(res);
            }, error: function (res) {
                console.log(res);
            }
        })
    }

    fetchPairing();
})