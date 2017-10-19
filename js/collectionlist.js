document.addEventListener("plusready", function() {
	var self = plus.webview.currentWebview();
	var userId = self.userId;
	var collectionList = new Collection();
	collectionList.init(userId);
})

var Collection = function() {};
Collection.prototype = {
	init: function(userId) {
		this.initList(userId);
		this.listenOperation();
	},
	initList: function(userId) {
		ajaxConnector("fp/fpServer", {
			type: "initCollectionList",
			userId: userId
		}, "GET", true, function(data) {
			var jsondata = JSON.parse(data);
			if(jsondata.length == 0){
				$(".fp-collection-list").children().remove().end().append("<li class='noDataTips' style='background: none'>暂无喜欢的游记</li>");
				return;
			}
			var collectionListHtml = "";
			for(var i = 0; i < jsondata.length; i++) {
				collectionListHtml += '<li style="background: url('+ jsondata[i].cover +') no-repeat center center">'+
				'	<div class="cover-mask"></div>' +
'					<a href="javascript:;">'+
'						<h3 class="fp-personal-content-notelist-title">'+ jsondata[i].title +'</h3>'+
'						<div class="fp-personal-content-notelist-infos">'+
'							<span class="fp-personal-content-notelist-view">'+ jsondata[i].viewtime +'</span>'+
'							<span class="fp-personal-content-notelist-like">'+ jsondata[i].likeTimes +'</span>'+
'							<span class="fp-personal-content-notelist-comment">'+ jsondata[i].commentTimes +'</span>'+
'						</div>'+
'					</a>'+
'				</li>';;
			}
			$(".fp-collection-list").children().remove().end().append(collectionListHtml);
		})
	},
	listenOperation: function(){
		$(".fp-collection-list").on("tap", "li", function(){
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