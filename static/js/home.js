var firstTime = -1;
window.onload = () => {
    if (!check_wallet_install()) {
        $("#wallet-not-installed").show();
        step1Disable();
        step2Disable();
    }
    else {
        check_auth().then(result => {
            if (result['is_auth']) {
                firstTime = result['first_time'];
                step1Finished();
                step2Finished();
            }
            else {
                $("#wallet-installed").show();
                step1Enable();
                if (check_wallet_connect()) {
                    step1Finished()
                    step2Enable();
                    check_auth().then(result => {
                        firstTime = result['first_time'];
                        if (result['is_auth']) {
                            step2Finished();
                        }
                        else {
                            console.log('no auth');
                        }
                    });
                }
                else {
                    step2Disable();
                    console.log('not connected');
                }
            }
        });
    }
}

function step1Disable() {
    notAllFinished()
    $("#action-connect-wallet").removeClass("action");
    $("#connect-wallet").attr("src", "/static/img/wallet2.png");
    $("#connect-wallet-text").html("Download Wallet First");
    $("#action-connect-wallet").off('click');
    $("#action-connect-wallet").mouseover(function () {
        $("#connect-wallet-text").show();
    });
    $("#action-connect-wallet").mouseleave(function () {
        $("#connect-wallet").attr("src", "/static/img/wallet2.png");
        $("#connect-wallet-text").hide();
    });
}

function step2Disable() {
    notAllFinished()
    $("#action-authentication").removeClass("action");
    $("#authentication").attr("src", "/static/img/insurance2.png");
    $("#authentication-text").html("Connect Wallet First");
    $("#action-authentication").off('click');
    $("#action-authentication").mouseover(function () {
        $("#authentication-text").show();
    });
    $("#action-authentication").mouseleave(function () {
        $("#authentication-text").hide();
    });
}

function step1Enable() {
    $("#action-connect-wallet").addClass("action");
    $("#connect-wallet").attr("src", "/static/img/wallet.png");
    $("#connect-wallet-text").html("Connect Solflare Wallet");
    $("#action-connect-wallet").mouseover(function () {
        $("#connect-wallet").attr("src", "/static/img/wallet2.png");
        $("#connect-wallet-text").show();
    });
    $("#action-connect-wallet").mouseleave(function () {
        $("#connect-wallet").attr("src", "/static/img/wallet.png");
        $("#connect-wallet-text").hide();
    });
    $("#action-connect-wallet").click(function () {
        do_connect_wallet().then(() => {
            if (check_wallet_connect()) {
                step1Finished();
                step2Enable();
            }
        });
    });
}

function step2Enable() {
    $("#action-authentication").addClass("action");
    $("#authentication").attr("src", "/static/img/insurance.png");
    $("#authentication-text").html("Sign Authentication Message");
    $("#action-authentication").mouseover(function () {
        $("#authentication").attr("src", "/static/img/insurance2.png");
        $("#authentication-text").show();
    });
    $("#action-authentication").mouseleave(function () {
        $("#authentication").attr("src", "/static/img/insurance.png");
        $("#authentication-text").hide();
    });
    $("#action-authentication").click(function () {
        do_auth().then(() => {
            check_auth().then(result => {
                firstTime = result['first_time'];
                if (result['is_auth']) {
                    step2Finished();
                }
            });
        });
    });
}

function step1Finished() {
    $("#step1").show();
    $("#step1").addClass("animate__animated animate__heartBeat");
    $("#action-connect-wallet").off('click');
    $("#action-connect-wallet").off('mouseover');
    $("#action-connect-wallet").off('mouseleave');
    $("#action-connect-wallet").removeClass("action");
    $("#connect-wallet").attr("src", "/static/img/wallet.png");
    $("#connect-wallet-text").html("");
}

function step2Finished() {
    $("#step2").show();
    $("#step2").addClass("animate__animated animate__heartBeat");
    $("#action-authentication").off('click');
    $("#action-authentication").off('mouseover');
    $("#action-authentication").off('mouseleave');
    $("#action-authentication").removeClass("action");
    $("#authentication").attr("src", "/static/img/insurance.png");
    $("#authentication-text").html("");
    finishedAll();
}

function notAllFinished() {
    $("#header-meet").hide();
    $("#header-chat").hide();
    $("#header-info").hide();
}

function finishedAll() {
    $("#wallet-installed").show();
    $("#header-meet").show();
    $("#header-chat").show();
    $("#header-info").show();
    if(firstTime) $("#firstTimeModal").show(); //remember to remove "!"
}

$("#close").click(function () {
    $("#firstTimeModal").hide();
})