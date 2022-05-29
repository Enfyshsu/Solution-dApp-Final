var curr_room_id = "1";
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

function renderMatchList(data) {
  console.log(data);
  if (data) {
    data.forEach(function (value) {
      // console.log(value['username']);
      var room_id = value['room_id'];
      var username = value['username'];
      var pubkey = "@" + value['pubkey'].slice(0, 20) + "...";
      $("#chat-list").append(
        `<div id="` + room_id + `" class="chat-list-person">
        <div class="chat-list-name">` + username + `</div>
        <div class="chat-list-content">` + pubkey + `</div>
        </div>`);
    });
  }
  else {
    window.location.replace("/nomatch");
  }
}

async function init() {
  try {
    var data = JSON.parse(await fetchMatchUsers());
    renderMatchList(data);
    // console.log(data);
    if (data) joinFirstRoom(data);
    listenJoinRoom();
  } catch (err) {
    console.log(err);
  }
}

function joinFirstRoom(data) {
  console.log(data[0]['room_id']);
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
    console.log(curr_room_id);
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

function renderRecord(record) {
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
            <img src="/static/img/head1.jpg" class="rounded-circle mr-1" alt="Sharon Lessman" width="40" height="40">
            <div class="time small text-nowrap mt-2">${time}</div>
          </div>&nbsp&nbsp&nbsp
          <div class="flex-shrink-1 bg-light rounded-new py-new px-new ml-3">
            <div class="font-weight-bold mb-1">${message}</div>
          </div>
        </div>`);
      }
      else {
        $('#chatting').append(
          `<div class="chat-message-right mb-4">
          <div>
            <img src="/static/img/head2.jpg" class="rounded-circle mr-1" alt="Chris Wood" width="40" height="40">
            <div class="time small text-nowrap mt-2">${time}</div>
          </div>&nbsp&nbsp&nbsp
          <div class="flex-shrink-1 bg-right rounded-new py-new px-new mr-3">
            <div class="font-weight-bold mb-1">${message}</div>
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
    console.log(message);
    $("#chatting-name").text(message['another_user']['username']);
    recordData = await fetchRecord(message['room_id']);
    if (recordData['status'] === "success") {
      renderRecord(recordData['data']);
      $("#status").attr("class", message['another_user']['active'] ? 'status online' : 'status offline');
      $("#status-text").html(message['another_user']['active'] ? 'online' : 'offline');
    }
  });
  socket.on('message_response', function (message) {
    renderRecord([message]);
    document.getElementById('footer').scrollIntoView(false);
  });
  socket.on('change_status', function (message) {
    $("#status").attr("class", message['active'] ? 'status online' : 'status offline');
    $("#status-text").html(message['active'] ? 'online' : 'offline');
  });
  $("#send-button").click(function () {
    if ($("#input-box").val() != "") {
      socket.emit('message', { room_id: curr_room_id, pubkey: $.cookie("pubKey"), message: $("#input-box").val() });
      $("#input-box").val("");
    }
  });
});