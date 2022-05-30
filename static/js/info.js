var infoData;
function fetchUserInfo() {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: 'POST',
      url: "/api/fetch_user_info",
      success: function (res) {
        resolve(res)
      },
      fail: function (xhr, ajaxOptions, thrownError) {
        reject(false)
      },
    })
  })
}

function renderUserInfo(data) {
  // console.log($("#info-data-name").text());
  $("#info-data-name").text(data['username']);
  $("#info-data-birthday").text(data['birthday']);
  $("#info-data-gender").text(data['gender']);
  $("#info-data-hobby").text(data['hobby']);
  $("#info-data-addr").text(data['pubkey']);

  $("#info-data").show();
  $("#info-edit").hide();
}

async function init() {
  try {
    var data = JSON.parse(await fetchUserInfo());
    infoData = data;
    await renderUserInfo(data);
  } catch (err) {
    console.log(err);
  }
}

function edit() {
  $("#info-edit-name").attr("value", infoData['username']);
  $("#info-edit-birthday").attr("value", infoData['birthday']);
  // $("#info-edit-gender").attr("value", infoData['gender']);
  $("input:radio[name=gender][value=" + infoData['gender'] + "]").attr('checked', true);
  $("#info-edit-hobby").attr("value", infoData['hobby']);
  $("#info-data").hide();
  $("#info-edit").show();
}

function edit_submit() {
  var edit_content = {};
  edit_content['name'] = $("#info-edit-name").val();
  edit_content['birthday'] = $("#info-edit-birthday").val();
  edit_content['gender'] = $('input[name=gender]:checked').val()
  edit_content['hobby'] = $("#info-edit-hobby").val();
  // console.log(JSON.stringify(edit_content));
  $.ajax({
    url: "/api/edit_user_info",
    type: "POST",
    dataType: "json",
    contentType: "application/json; charset=utf-8",
    data: JSON.stringify(edit_content),
    success: function (res) {
      if (res['status'] == "failed") alert(res['reason']);
      else init();
      console.log(res);
    }, error: function (res) {
      console.log(res);
    }
  });
}
