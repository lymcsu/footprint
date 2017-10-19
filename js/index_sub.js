document.addEventListener("plusready", function() {
	var fpIndex = new FpIndex();
	fpIndex.init();
	var gallery = mui('.mui-slider');
	gallery.slider({
		interval: 3000 //自动轮播周期，若为0则不自动播放，默认为0；
	});
	mui.init({
		pullRefresh: {
			container: "#pullRefresh", //待刷新区域标识，querySelector能定位的css选择器均可，比如：id、.class等
			up: {
				height: 50, //可选.默认50.触发上拉加载拖动距离
				auto: true, //可选,默认false.自动上拉加载一次
				contentrefresh: "正在加载...", //可选，正在加载状态时，上拉加载控件上显示的标题内容
				contentnomore: '没有更多数据了', //可选，请求完毕若没有更多数据时显示的提醒内容；
				callback: pullFunc.initNoteList.bind(pullFunc) //必选，刷新函数，根据具体业务来编写，比如通过ajax从服务器获取新数据；
			}
		}
	});
	window.addEventListener('refreshList', function() {
		setTimeout(function() {
			fpIndex.initWrapper();
			$(".fp-index-noteslist").children().remove();
			mui('#pullRefresh').pullRefresh().refresh(true);
			pullFunc.currentPage = 0;
			pullFunc.initNoteList();
		}, 2000);
	});
	window.addEventListener('searchplace', function(ev) {
		mui('#pullRefresh').pullRefresh().refresh(true);
		pullFunc.currentPage = 0;
		pullFunc.place = ev.detail.placeName;
		$(".fp-index-noteslist").children().remove();
		pullFunc.initNoteList();
	})
});

var FpIndex = function() {};
FpIndex.prototype = {
	currentPage: 0,
	place: "",
	init: function init() {
		this.listenOperation();
		this.initWrapper();
	},
	listenOperation: function listenOperation() {
		$('body').on("tap", ".noteDispLink", function() {
			var noteId = $(this).attr("data-id");
			openWebview("notedis.html", "notedis", {}, {
				noteId: noteId
			});
		})
		$('body').on("tap", "#j_addNotes", function() {
			if($(".fp-index-edit-btn").is(":visible")) {
				$(".fp-index-edit-btn").hide();
			} else {
				$(".fp-index-edit-btn").fadeIn("fast");
			}
		})
		$(".fp-index-edit-btn").on("tap", function() {
			openWebview("newnotes.html", "newnotes", {}, {
				noteId: localStorage.getItem("currentNote"),
				isSaved: false,
				type: "addNote"
			});
		})
		$("body").on("tap", function(e) {
			if(!$(e.target).hasClass("fp-index-add")) {
				$(".fp-index-edit-btn").hide();
			}
		})
		$(".mui-slider-item").on("tap", function() {
			var noteId = $(this).attr("data-id");
			openWebview("notedis.html", "notedis", {}, {
				noteId: noteId
			})
		})
	},
	initWrapper: function() {
		ajaxConnector("fp/fpServer", {
			type: "initWrapper"
		}, "GET", true, function(data) {
			var jsondata = JSON.parse(data);
			var wrappers = $(".mui-slider-item");
			wrappers.each(function(index, el) {
				var idx = index - 1;
				if(index == 0) {
					idx = 2;
				} else if(index == 4) {
					idx = 0;
				}
				$(el).children("a").css("background", "url(" + jsondata[idx].cover + ") no-repeat center center");
				$(el).find(".hotNoteTag-title").text(jsondata[idx].title);
				$(el).attr("data-id", jsondata[idx].noteId);
			})
		})
	}
}

var pullFunc = {
	currentPage: 0,
	place: "",
	initNoteList: function() {
		var self = this;
		ajaxConnector("fp/fpServer", {
			type: "initIndex",
			placeName: self.place,
			pageNum: self.currentPage++
		}, "GET", true, function(data) {
			var jsondata = JSON.parse(data);
			if(jsondata.length == 0) {
				mui("#pullRefresh").pullRefresh().endPullupToRefresh(true);
			} else {
				var list = self.appendList(jsondata);
				$(".fp-index-noteslist").append(list);
				mui("#pullRefresh").pullRefresh().endPullupToRefresh(false);
			}
		})
	},
	appendList: function(data) {
		var newHtml = "";
		for(var i = 0; i < data.length; i++) {
			newHtml += '<li class="fp-index-noteItem" style="background:url(' + data[i].cover + ') no-repeat center center">' +
				'<a class="noteDispLink" href="javascript:;" data-id="' + data[i].noteId + '">' +
				'<p class="fp-index-note-title">' + data[i].title + '</p>' +
				'<p>' +
				'<span class="fp-idnex-note-disp">' + data[i].time + '</span>' +
				'<span class="fp-idnex-note-disp">' + data[i].city + '</span>' +
				'<span class="fp-idnex-note-disp">' + data[i].viewtime + '次浏览</span>' +
				'</p>' +
				'<div class="fp-idnex-note-writer">' +
				'<div class="fp-userpic-box" style="background:url(' + data[i].userpic + ')"></div>' +
				'<span><i>By</i>' + data[i].username + '</span>' +
				'</div>' +
				'</a>' +
				'</li>';
		}
		return newHtml;
	}
}