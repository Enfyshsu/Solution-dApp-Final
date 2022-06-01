var curr_room_id = "1";
var another_img;
var my_img;
var txid;
function fetchMatchUsers() {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: 'POST',
      url: "/api/fetch_matched_users",
      success: function (res) {
        resolve(res)
      },
      fail: function (xhr, ajaxOptions, thrownError) {
        reject(false)
      },
    })
  })
}

function renderMatchList(data, another_user_key) {
  var to_room_id = "";
  if (data) {
    data.forEach(function (value) {
      var room_id = value['room_id'];
      var username = value['username'];
      var pubkey = "@" + value['pubkey'].slice(0, 20) + "...";
      if (another_user_key === value['pubkey']) to_room_id = room_id;
      $("#chat-list").append(
        `<div id="` + room_id + `" class="chat-list-person">
        <div id="` + room_id + `-chat-list-name" class="chat-list-name">` + username + `</div>
        <div class="chat-list-content">` + pubkey + `</div>
        </div>`);
      $("#" + room_id + "-chat-list-name").prepend(`<span id='` + room_id + `-is-verified' style='padding-right: 10px; display: none;'><img src='/static/img/success.png' width='25px;'></span>`);
      if (value['txid']) $("#" + room_id + "-is-verified").show();
    });
    return to_room_id;
  }
  else {
    window.location.replace("/nofriend");
  }
}

async function init(another_user_key) {
  try {
    var data = JSON.parse(await fetchMatchUsers());
    var to_room_id = await renderMatchList(data, another_user_key);
    if (to_room_id.length) {
      joinRoom(to_room_id, $.cookie("pubKey"), $.cookie("auth"));
    }
    else if (data) joinFirstRoom(data);
    listenJoinRoom();
  } catch (err) {
    console.log(err);
  }
}

function joinFirstRoom(data) {
  var room_id = data[0]['room_id'];
  var pubkey = $.cookie("pubKey");
  var auth = $.cookie("auth");
  joinRoom(room_id, pubkey, auth);
}

function listenJoinRoom() {
  $(".chat-list-person").click(function () {
    var room_id = $(this).attr("id");
    var pubkey = $.cookie("pubKey");
    var auth = $.cookie("auth");
    joinRoom(room_id, pubkey, auth);
  });
}

async function joinRoom(room_id, pubkey, auth) {
  if (room_id != curr_room_id) {
    if (curr_room_id != "1" && room_id != curr_room_id) {
      socket.emit('leave_room', { room_id: curr_room_id, pubkey: pubkey });
      $('#chatting').html(""); // reload
    }
    curr_room_id = room_id;
    socket.emit('join_room', { room_id: room_id, pubkey: pubkey, auth: auth });
  }
}

function fetchRecord(room_id) {
  var data = { "room_id": room_id };
  return new Promise((resolve, reject) => {
    $.ajax({
      type: 'POST',
      url: "/api/fetch_chat_records",
      data: JSON.stringify(data),
      dataType: "json",
      contentType: "application/json; charset=utf-8",
      success: function (res) {
        resolve(res);
      },
      fail: function (xhr, ajaxOptions, thrownError) {
        reject(false)
      },
    })
  })
}

function renderRecord(record, another_img_url, my_img_url) {
  if (record) {
    record.forEach(function (record) {
      var pubkey = record['pubkey'];
      var message = record['message'];
      var date = record['timestamp'].split(",")[0];
      var time = record['timestamp'].split(",")[1].slice(0, 5);
      if (pubkey != $.cookie("pubKey")) {
        $('#chatting').append(
          `<div class="chat-message-left pb-4">
          <div>
            <img class="rounded-circle mr-1 another-img" width="40" height="40" src=${another_img_url} onclick="showInfoModal()">
            <div class="time small text-nowrap mt-2">${time}</div>
          </div>&nbsp&nbsp&nbsp
          <div class="flex-shrink-1 bg-light rounded-new py-new px-new ml-3">
            <div class="message font-weight-bold mb-1">${message}</div>
          </div>
        </div>`);
      }
      else {
        $('#chatting').append(
          `<div class="chat-message-right mb-4">
          <div>
            <a href="/information"><img class="rounded-circle mr-1 my-img" width="40" height="40" src=${my_img_url}></a>
            <div class="time small text-nowrap mt-2">${time}</div>
          </div>&nbsp&nbsp&nbsp
          <div class="flex-shrink-1 bg-right rounded-new py-new px-new mr-3">
            <div class="message font-weight-bold mb-1">${message}</div>
          </div>
        </div>`);
      }
      document.getElementById('footer').scrollIntoView(false);
    });
  }
}

window.addEventListener('beforeunload', function (e) {
  socket.emit('leave_room', { room_id: curr_room_id, pubkey: $.cookie("pubKey") });
});

var socket = io();
socket.on('connect', function () {
  socket.on('success_joind', async function (message) {
    console.log(message)
    $("#chatting-name").text(message['another_user']['username']);
    $("#chatting-name").prepend("<span id='" + message['room_id'] + "-chatting-is-verified' style='padding-right: 15px; display: none;'><img src='/static/img/success.png' width='25px;'></span>");
    recordData = await fetchRecord(message['room_id']);
    if (recordData['status'] === "success") {
      another_img = message['another_user']['img_url'];
      my_img = message['my_img_url'];
      txid = message['txid'];
      renderRecord(recordData['data'], another_img, my_img);
      $("#status").attr("class", message['another_user']['active'] ? 'status online' : 'status offline');
      $("#status-text").html(message['another_user']['active'] ? 'online' : 'offline');
      showIsVerified();
      showInfo(message['another_user']);
    }
  });
  socket.on('message_response', function (message) {
    renderRecord([message], another_img, my_img);
    document.getElementById('footer').scrollIntoView(false);
  });
  socket.on('change_status', function (message) {
    $("#status").attr("class", message['active'] ? 'status online' : 'status offline');
    $("#status-text").html(message['active'] ? 'online' : 'offline');
    showIsVerified();
  });
  socket.on('trigger_tx_request', function (message) {
    $("#send-trans").find("button").text("Waiting...");
    $("#send-trans").find("button").attr('disabled', true);
    $("#sendTransModal").show();
  });
  socket.on('trigger_wallet_to_sign_tx', async function (message) {
    console.log(message['users'], message['blockhash']);
    sign(message['users'], message['blockhash']).then(
      res => doTransaction(res, curr_room_id) // success
    ).catch(function (reason) { // someone refuse
      // console.log(reason); 
      socket.emit('get_tx_error', { room_id: curr_room_id, pubkey: $.cookie("pubKey") });
      showIsVerified();
    });
  });
  socket.on('trigger_tx_error', function (message) {
    console.log("error");
    $("#transErrorModal").show();
  });
  socket.on('get_tx_success', function (message) {
    console.log(message);
    txid = message['txid'];
    transactionSuccess();
  });
});

function doTransaction(sign_detail, room_id) {
  var data = sign_detail;
  data['room_id'] = room_id;
  console.log("data: ", data);
  return new Promise((resolve, reject) => {
    $.ajax({
      type: 'POST',
      url: "/api/do_transaction",
      data: JSON.stringify(data),
      dataType: "json",
      contentType: "application/json; charset=utf-8",
      success: function (res) {
        resolve(res);
      },
      fail: function (xhr, ajaxOptions, thrownError) {
        socket.emit('get_tx_error', { room_id: curr_room_id, pubkey: $.cookie("pubKey") });
        reject(false);
      },
    })
  })
}

function transactionSuccess() {
  $("#send-trans").hide();
  $("#" + curr_room_id + "-chatting-is-verified").show();
  $("#" + curr_room_id + "-is-verified").show();
  $("#transaction-addr").attr("href", "https://solscan.io/tx/" + txid + "?cluster=devnet");
  $("#transaction-addr").show();
}

$("#send-button").click(function () {
  if ($("#input-box").val() != "") {
    socket.emit('message', { room_id: curr_room_id, pubkey: $.cookie("pubKey"), message: $("#input-box").val() });
    $("#input-box").val("");
  }
});

function showInfo(another_user) {
  $("#chat-nft").attr("src", another_user['img_url']);
  $("#solscan-url").attr("href", "https://solscan.io/token/" + another_user['nft_addr'] + "?cluster=devnet");
  $("#chat-name").text(another_user['username']);
  $("#chat-gender").text(another_user['gender']);
  $("#chat-birthday").text(another_user['birthday']);
  $("#chat-hobby").text(another_user['hobby']);
  if (txid) {
    $("#transaction-addr").attr("href", "https://solscan.io/tx/" + txid + "?cluster=devnet");
    $("#transaction-addr").show();
  }
  else {
    console.log("no txid")
    $("#transaction-addr").hide();
  }
}


function showInfoModal() {
  $("#showInfoModal").show();
}

$("#info-close").click(function () {
  $("#showInfoModal").attr("style", "display: none");
});

function showIsVerified() {
  var another_status = $("#status").hasClass("online") ? 1 : 0;
  if (!txid && another_status) {
    $("#send-trans").show();
    $("#send-trans").find("button").text("Send Transaction");
    $("#send-trans").find("button").attr('disabled', false);
  }
  else {
    $("#send-trans").hide();
    if (txid) $("#" + curr_room_id + "-chatting-is-verified").show();
  }
}

$("#send-trans").click(function () {
  $(this).find("button").text("Waiting...");
  $(this).find("button").attr('disabled', true);
  socket.emit('request_tx', { room_id: curr_room_id, pubkey: $.cookie("pubKey") });
})

$("#trans-confirm").click(function () {
  $("#send-trans").find("button").text("Signing a Transaction...");
  $("#send-trans").find("button").attr('disabled', false);
  $("#sendTransModal").hide();
  socket.emit('trigger_tx_accept', { room_id: curr_room_id, pubkey: $.cookie("pubKey") });
})

$("#trans-close").click(function () {
  $("#send-trans").find("button").text("Send Transaction");
  $("#send-trans").find("button").attr('disabled', false);
  socket.emit('get_tx_error', { room_id: curr_room_id, pubkey: $.cookie("pubKey") });
  $("#send-trans").find("button").text("Send Transaction");
  $("#send-trans").find("button").attr('disabled', false);
  $("#sendTransModal").hide();
})

$("#trans-error-close").click(function () {
  $("#send-trans").find("button").text("Send Transaction");
  $("#send-trans").find("button").attr('disabled', false);
  $("#transErrorModal").hide();
})