var localInfo = JSON.parse(localStorage.getItem("userinfo"));

document.addEventListener("plusready", function() {
	var self = plus.webview.currentWebview();
	window.NOTEID = self.noteId;
	var commentor = new Comment();
	commentor.init();
})

var Comment = function() {};
Comment.prototype = {
	init: function() {
		this.getComments();
		this.listenComment();
	},
	getComments: function() {
		ajaxConnector("fp/fpServer", {
			type: "getComments",
			noteId: window.NOTEID
		}, "GET", true, function(data) {
			var jsondata = JSON.parse(data);
			$(".fp-comment-list").children().remove();
			if(jsondata.length == 0) {
				$(".fp-comment-list").append("<li class='noDataTips'>暂无评论</li>");
			}
			var commentList = "";
			for(var i = 0; i < jsondata.length; i++) {
				jsondata[i].time = utils.unix2Date(Number(jsondata[i].time));
				var whtagClass = jsondata[i]._whtag == 0 ? "wider" : "higher";
				var replyTo = "";
				if(jsondata[i].toUserId) {
					replyTo = "<i> To </i>" + jsondata[i].replyuser + "";
				}
				commentList += '<li data-id="'+ jsondata[i].id +'" data-userId="' + 
				jsondata[i].fromUserId + '" class="clear-fix">' +
					'<div class="fp-userpic-box">' +
					'<img class="fp-userpic-img ' + whtagClass + '" src="' + jsondata[i].userpic + '" />' +
					'</div>' +
					'<div class="fp-comment-list-info">' +
					'<p class="fp-comment-list-info-cont">' +
					'<span class="fp-comment-list-info-username"><span class="commenter">' + jsondata[i].username + "</span>" + replyTo +
					'：</span>' + jsondata[i].content +
					'</p>' +
					'<span class="fp-comment-list-info-time">' + jsondata[i].time + '</span>' +
					'</div>' +
					'</li>';
			}
			$(".fp-comment-list").append(commentList);
		})
	},
	addComments: function(obj) {
		var self = this;
		ajaxConnector("fp/fpServer", {
			type: "addComments",
			noteId: window.NOTEID,
			fromUserId: obj.fromUserId,
			toUserId: obj.toUserId || null,
			content: obj.content,
			time: new Date().getTime()
		}, "GET", true, function(data) {
			mui.toast(data);
			self.getComments();
			$(".fp-comment-input").val("");
		})
	},
	listenComment: function() {
		var self = this;
		$(".fp-comment-submitbtn").on("tap", function() {
			if($(".fp-comment-input").val() == "") {
				mui.toast("评论内容不能为空");
				return;
			}
			var params = {};
			params.toUserId = $(".fp-comment-input").attr("data-touser");
			params.fromUserId = localInfo.userId;
			params.content = $(".fp-comment-input").val();
			self.addComments(params);
		})
		$(".fp-comment-list").on("tap", "li", function() {
			$(".fp-comment-input").attr("data-touser", $(this).attr("data-userId"));
			$(".fp-comment-input").val("").attr("placeholder", "回复" + $(this).find(".commenter").text());
		})
		$(".fp-comment-list").scroll(function() {
			$(".fp-comment-input").attr("data-touser", "");
			$(".fp-comment-input").val("").attr("placeholder", "添加评论");
		})
		$(".fp-comment-input").blur(function() {
			if($(this).val() == "") {
				$(".fp-comment-input").attr("data-touser", "");
				$(".fp-comment-input").attr("placeholder", "添加评论");
			}
		})
		$(".fp-comment-list").on("longtap", "li", function() {
			var id = $(this).attr("data-id");
			if($(this).attr("data-userId") != localInfo.userId) {
				return;
			}
			sConfirm({
				tips: "删除该评论？",
				okFunc: function() {
					ajaxConnector("fp/fpServer", {
						type: "deleteComment",
						commentId: id
					}, "GET", true, function(data) {
						mui.toast(data);
						self.getComments();
					})
				}
			})
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