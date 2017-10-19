var userId = null;
var localInfo = JSON.parse(localStorage.getItem("userinfo"));
var _whtag = localInfo ? localInfo._whtag : 0;
var userImg = null;

mui.plusReady(function() {
	mui.init({
		beforeback: function() {
			if(!localStorage.getItem("userinfo")) {
				mui.toast("请绑定个人信息");
				return false;
			} else {
				return true;
			}
		}
	});
	var self = plus.webview.currentWebview();
	var type = self.type;
	if(localInfo) {
		userId = localInfo.userId;
	} else {
		userId = plus.device.uuid.split(",")[0];
	}
	if(type == "updateInfo") {
		$(".mui-title").text("账户设置");
		var userInfo = JSON.parse(localStorage.getItem("userinfo"));
		$(".fp-userpic-img").attr("src", userInfo.userpic);
		JSON.parse(localStorage.getItem("userinfo"))._whtag == 0 ? $(".fp-userpic-img").css({
			"height": "100%",
			"width": "auto"
		}) : $(".fp-userpic-img").css({
			"width": "100%",
			"height": "auto"
		});
		$("#j_username").val(userInfo.username);
		$("#j_tel").val(userInfo.tel);
		$("#j_email").val(userInfo.email);
		$(".mui-table-view-cell:eq(" + userInfo.gender + ")").addClass("mui-selected").siblings().removeClass("mui-selected");
	} else {
		$(".fp-userpic-img").css({
			"height": "100%",
			"width": "auto"
		})
	}
	$(".fp-userinfo-finishbtn").on("tap", function() {
		if($("#j_username").val() == "") {
			mui.toast("请填写用户名");
			return;
		} else {
			submitUserinfo(type);
		}
	})
	$(".fp-userpic-box").on("tap", function() {
		uploadUserpic();
	})
});

function uploadUserpic() {
	pickImgs(1, function(img, path, direction) {
		if(direction == 6) {
			_whtag = img.width > img.height ? 1 : 0;
		} else{
			_whtag = img.width > img.height ? 0 : 1;
		}
		plus.nativeUI.showWaiting();
		var data = getBase64Image(img, 300, direction); //base64编码
		var newImgbase = data.split(",")[1]; //通过逗号分割到新的编码
		userImg = "img" + new Date().getTime();
		var data = {
			img: newImgbase,
			id: userImg
		};
		ajaxConnector("fp/imgUpload", data, "POST", false, function(data) {
			if(data == "success") {
				$(".fp-userpic-img").attr("src", path);
				_whtag == 0 ? $(".fp-userpic-img").css({
					"height": "100%",
					"width": "auto"
				}) : $(".fp-userpic-img").css({
					"width": "100%",
					"height": "auto"
				});
				plus.nativeUI.closeWaiting();
				if(!!localInfo) {
					sConfirm({
						tips: "您已更换头像，是否保存用户信息",
						okFunc: function() {
							submitUserinfo("updateInfo");
						}
					})
				}
			}
		})
	});
}

function submitUserinfo(type) {
	var userpic = userImg == null ? $(".fp-userpic-img").attr("src") : "http://47.94.247.224:8080/fp/img/" + userImg + ".png";
	var username = $("#j_username").val();
	var tel = $("#j_tel").val();
	var email = $("#j_email").val();
	var gender = $(".gender-selector .mui-selected").index();
	var userInfo = {
		userpic: userpic,
		username: username,
		tel: tel,
		email: email,
		gender: gender,
		userId: userId,
		_whtag: _whtag
	}
	plus.nativeUI.showWaiting();
	ajaxConnector("fp/fpServer", {
		type: type,
		param: JSON.stringify(userInfo)
	}, "GET", true, function(data) {
		if(data == 'success') {
			plus.nativeUI.closeWaiting();
			localStorage.setItem("userinfo", JSON.stringify(userInfo));
			localStorage.setItem("isLogin", "1");
			mui.toast("信息绑定成功");
			var leftMenu = plus.webview.getWebviewById("menuLeft");
			mui.fire(leftMenu, "updatePic");
			mui.back();
		} else {
			mui.toast('something wrong')	
		}
	})
}