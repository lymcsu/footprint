var localInfo = JSON.parse(localStorage.getItem("userinfo"));
document.addEventListener("plusready", function() {
	var self = plus.webview.currentWebview();
	window.CURRENT_USERID = self.userId || JSON.parse(localStorage.getItem("userinfo")).userId;
	var personal = new Personal();
	personal.init(window.CURRENT_USERID);
	window.addEventListener('refresh', function() {
		setTimeout(function() {
			personal.initNoteList(window.CURRENT_USERID);
		}, 2000);
	});
});

var Personal = function() {};
Personal.prototype = {
	messageArr: [],
	init: function init(userId) {
		this.initNoteList(userId);
		this.listenOperation();
		this.initPersonalInfo(userId);
	},
	initPersonalInfo: function initUserinfo(userId) {
		var self = this;
		if(userId != localInfo.userId) {
			initFollow();
			$(".fp-personal-wrap-userinfo-btn.follow").css("display", "block");
			$(".fp-personal-wrap-userinfo-btn.message").hide();
		} else {
			$(".fp-personal-wrap-userinfo-btn.follow").hide();
			$(".fp-personal-wrap-userinfo-btn.message").css("display", "block");
		}
		ajaxConnector("fp/fpServer", {
			type: "getPersonInfo",
			userId: userId
		}, "GET", true, function(data) {
			var jsondata = JSON.parse(data);
			$(".fp-userpic-img").attr("src", jsondata.userpic);
			jsondata._whtag == 0 ? $(".fp-userpic-img").css({
				"height": "100%",
				"width": "auto"
			}) : $(".fp-userpic-img").css({
				"width": "100%",
				"height": "auto"
			});
			$(".fp-personal-wrap-userinfo-username").text(jsondata.username);
		});
		ajaxConnector("fp/fpServer", {
			type: "initMessage",
			userId: localInfo.userId
		}, "GET", true, function(data) {
			var jsondata = JSON.parse(data);
			if(jsondata[0] && jsondata[0].isRead == "0") {
				$(".hotPoint").show();
			} else {
				$(".hotPoint").hide();
			}
			self.messageArr = jsondata;
		})

		function initFollow() {
			ajaxConnector("fp/fpServer", {
				type: "isFollowed",
				followFrom: localInfo.userId,
				followTo: window.CURRENT_USERID
			}, "GET", true, function(data) {
				if(data == "1") {
					$(".fp-personal-wrap-userinfo-btn.follow").addClass("following");
				}
			})
		}
	},
	initNoteList: function initNoteList(userId) {
		ajaxConnector("fp/fpServer", {
			type: "initPersonal",
			userId: userId
		}, "GET", true, function(data) {
			var jsondata = JSON.parse(data);
			if(jsondata.noteList.length == 0) {
				$(".fp-personal-content-notelist").children().remove().end().append("<p class='noDataTips'>暂无游记</p>")

			} else {
				var myNoteList = renderList(jsondata.noteList);
				$(".fp-personal-content-notelist").children().remove().end().append(myNoteList);
			}
			$(".fp-personal-wrap-userinfo-fans").text(jsondata.fansNum);
			$(".fp-personal-wrap-userinfo-follows").text(jsondata.followNum);
		})

		function renderList(data) {
			var newHtml = "";
			data.forEach(function(value) {
				newHtml += '<li style="background: url(' + value.cover + ') no-repeat center center">' +
					'<a class="noteEntry" href="javascript:;" data-id="' + value.noteId + '">' +
					'<h3 class="fp-personal-content-notelist-title">' + value.title + '</h3>' +
					'<div class="fp-personal-content-notelist-infos">' +
					'<span class="fp-personal-content-notelist-view">' + value.viewtime + '</span>/' +
					'<span class="fp-personal-content-notelist-like">' + value.likeTimes + '</span>/' +
					'<span class="fp-personal-content-notelist-comment">' + value.commentTimes + '</span>' +
					'</div>' +
					'</a>' +
					'</li>';
			});
			return newHtml;
		}
	},
	listenOperation: function listenOperation() {
		var self = this;
		$(".fp-personal-content-notelist").on("tap", ".noteEntry", function() {
			var noteId = $(this).attr("data-id");
			if(window.CURRENT_USERID == localInfo.userId) {
				openWebview("newnotes.html", "newnotes", {}, {
					noteId: noteId,
					isSaved: true,
					type: "editNote"
				})
			} else {
				openWebview("notedis.html", "notedis", {}, {
					noteId: noteId
				});
			}
		})
		$(".fp-personal-content-notelist").on("longtap", ".noteEntry", function() {
			if(window.CURRENT_USERID != localInfo.userId){
				return;
			}
			var noteId = $(this).attr("data-id");
			sConfirm({
				tips: "删除该游记？",
				okFunc: function() {
					ajaxConnector("fp/fpServer", {
						type: "deleteNote",
						noteId: noteId
					}, "GET", true, function(data) {
						mui.toast(data);
						self.initNoteList(localInfo.userId);
						var i = plus.webview.getWebviewById("index_sub");
						mui.fire(i, "refreshList");
					})
				}
			})
		})
		$(".fp-personal-wrap-userinfo-btn.follow").on("tap", function() {
			$(this).toggleClass("following");
			var isFollow = $(this).hasClass("following") ? 1 : 0;
			ajaxConnector("fp/fpServer", {
				type: "doFollow",
				followFrom: localInfo.userId,
				followTo: window.CURRENT_USERID,
				isFollow: isFollow,
				time: new Date().getTime()
			}, "GET", true, function(data) {
				mui.toast(data);
			})
		})
		$(".fp-personal-wrap-userinfo-fans").on("tap", function() {
			openWebview("fanslist.html", "fanslist", {}, {
				userId: window.CURRENT_USERID
			})
		})
		$(".fp-personal-wrap-userinfo-follows").on("tap", function() {
			openWebview("followslist.html", "followslist", {}, {
				userId: window.CURRENT_USERID
			})
		})
		$(".collectionLink").on("tap", function() {
			openWebview("collectionlist.html", "collectionlist", {}, {
				userId: window.CURRENT_USERID
			})
		})
		$(".fp-personal-wrap-userinfo-btn.message").on("tap", function() {
			$(".hotPoint").hide();
			openWebview("mynews.html", "mynews", {}, {
				messageArr: self.messageArr
			})
		})
	}
}