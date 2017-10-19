document.addEventListener("plusready", function() {
	mui.init();
	var menuLeft = new MenuLeft();
	menuLeft.listenOperation();
	utils.picHandler();
	window.addEventListener("updatePic", function() {
		setTimeout(function() {
			utils.picHandler();
		}, 1500)
	})
})

var MenuLeft = function() {};
MenuLeft.prototype = {
	listenOperation: function listenOperation() {
		$('body').on("tap", "#j_userpage", function() {
			if(localStorage.getItem("isLogin") == "1") {
				openWebview("personal.html", "personal");
			} else {
				var params = {
					type: "bindInfo"
				}
				openWebview("userinfo.html", "userinfo", {}, params);
			}
		});
		$("body").on("tap", "#j_userinfo", function() {
			var type = localStorage.getItem("isLogin") == "1" ? "updateInfo" : "bindInfo";
			openWebview("userinfo.html", "userinfo", {}, {
				type: type
			});
		})
		$("body").on("tap", "#j_index", function() {
			var i = plus.webview.getLaunchWebview();
			mui.fire(i, "closeMenu");
		})
	}
}

var utils = {
	picHandler: function() {
		var localInfo = JSON.parse(localStorage.getItem("userinfo"));
		var _whtag = localInfo ? localInfo._whtag : 0;
		var userpic = localInfo ? localInfo.userpic : "./img/cbd.jpg";
		$(".fp-userpic-img").attr("src", userpic);
		_whtag == 0 ? $(".fp-userpic-img").css({
			"height": "100%",
			"width": "auto"
		}) : $(".fp-userpic-img").css({
			"width": "100%",
			"height": "auto"
		});
	}
}