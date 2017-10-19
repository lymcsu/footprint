document.addEventListener("plusready", function() {
	var self = plus.webview.currentWebview();
	var userId = self.userId;
	var fansList = new FansList();
	fansList.init(userId);
})

var FansList = function() {};
FansList.prototype = {
	init: function(userId) {
		this.initList(userId);
		this.listenOperation();
	},
	initList: function(userId) {
		ajaxConnector("fp/fpServer", {
			type: "initFansList",
			userId: userId
		}, "GET", true, function(data) {
			var jsondata = JSON.parse(data);
			if(jsondata.length == 0){
				$(".fp-comment-list").children().remove().end().append("<li class='noDataTips'>暂无粉丝</li>");
				return;
			}
			jsondata.forEach(function(value) {
				value.time = utils.unix2Date(Number(value.time));
			})
			var fansListHtml = "";
			for(var i = 0; i < jsondata.length; i++) {
				var whTagClass = jsondata[i]._whtag == 0?"wider":"higher";
				fansListHtml += '<li data-id="'+ jsondata[i].fansId +'" class="clear-fix">' +
					'	<a href="javascript:;">' +
					'		<div class="fp-userpic-box">' +
					'			<img class="fp-userpic-img '+ whTagClass +'" src="'+ jsondata[i].userpic +'" />' +
					'		</div>' +
					'		<div class="fp-comment-list-info clear-fix">' +
					'			<p class="fp-comment-list-info-username">'+ jsondata[i].username +'</p>' +
					'			<span class="fp-comment-list-info-time">'+ jsondata[i].time +'</span>' +
					'		</div>' +
					'	</a>' +
					'</li>';
			}
			$(".fp-comment-list").children().remove().end().append(fansListHtml);
		})
	},
	listenOperation: function(){
		$(".fp-comment-list").on("tap", "li", function(){
			var userId = $(this).attr("data-id");
			openWebview("personal.html", "personal", {}, {
				userId: userId
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
		return _year + "-" + _month + "-" + _date;
	}
}