var localInfo = JSON.parse(localStorage.getItem("userinfo"));
document.addEventListener("plusready", function() {
	var self = plus.webview.currentWebview();
	window.messageArr = self.messageArr;
	var initMessage = new InitMessage();
	initMessage.init();
})

var InitMessage = function() {};
InitMessage.prototype = {
	init: function() {
		ajaxConnector("fp/fpServer", {
			type: "readMessage",
			userId: localInfo.userId
		}, "GET", true, function(data) {
			if(data == "success") {

			}
		})
		this.initMessageList();
		this.listenOperation();
	},
	initMessageList: function() {
		$(".fp-comment-list").children().remove();
		var messageList = "",
		typeClassArr = ["like", "comment", "follow"];
		window.messageArr.forEach(function(value) {
			value.time = utils.unix2Date(Number(value.time));
		})
		if(window.messageArr.length == 0){
			$(".fp-comment-list").append("<li class='noDataTips'>暂无消息</li>");
			return;
		}
		for(var i = 0; i < window.messageArr.length; i++) {
			var whtagClass = window.messageArr[i].fromUserWhtag == 0 ? "wider" : "higher";
			var typeClass = typeClassArr[+window.messageArr[i].type];
			messageList += '<li data-type="'+ typeClass +'" class="clear-fix message-item" data-id="'+ window.messageArr[i].noteId +'">' +
				'<a href="javascript:;">' +
				'<div class="fp-userpic-box" data-userid="'+ window.messageArr[i].fromUserId +'">' +
				'<img class="fp-userpic-img ' + whtagClass + '" src="'+ window.messageArr[i].fromUserpic +'" />' +
				'</div>' +
				'<div class="fp-comment-list-info">' +
				'<p class="fp-comment-list-info-username">'+ window.messageArr[i].fromUsername +'</p>' +
				'<p class="clear-fix">' +
				'<span class="fp-message-list-'+ typeClass +'"></span>' +
				'<span class="fp-comment-list-info-time">'+ window.messageArr[i].time +'</span>' +
				'</p>' +
				'</div>' +
				'</a>' +
				'</li>';
		}
		$('.fp-comment-list').append(messageList);
	},
	listenOperation: function(){
		$(".fp-comment-list").on("tap", ".message-item", function(){
			var type = $(this).attr("data-type");
			var noteId = $(this).attr("data-id");
			switch(type){
				case "like":
				openWebview("notedis.html", "notedis", {}, {noteId: noteId});
				break;
				case "comment":
				openWebview("comment.html", "comment", {}, {noteId: noteId});
				break;
				case "follow":
				openWebview("fanslist.html", "fanslist", {}, {userId: localInfo.userId});
				bread;
			}
		});
		$(".fp-comment-list").on("tap", ".fp-userpic-box", function(e){
			var userId = $(this).attr("data-userid");
			openWebview("personal.html", "personal", {}, {
				userId: userId
			})
			e.stopPropagation();
		})
	}
}

var utils = {
	unix2Date: function(unix) {
		var time = new Date(unix);
		var _year = time.getFullYear();
		var _month = time.getMonth() + 1;
		var _date = time.getDate();
		return _year + "-" + _month + "-" + _date + " " + time.toTimeString().substr(0, 8);
	}
}