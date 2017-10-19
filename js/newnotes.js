var map = new BMap.Map("mc"); // 创建Map实例
map.centerAndZoom(new BMap.Point(116.404, 39.915), 16); // 初始化地图,设置中心点坐标和地图级别
//map.setCurrentCity("北京"); // 设置地图显示的城市 此项是必须设置的
map.disableScrollWheelZoom();
map.disableDoubleClickZoom();
map.disableDragging();

document.addEventListener("plusready", function() {
	var self = plus.webview.currentWebview();
	window.IS_SAVED = self.isSaved;
	window.PATH_TYPE = self.type;
	if(!self.isSaved && self.noteId == undefined) {
		window.CURRENT_NOTEID = "note" + new Date().getTime();
		localStorage.setItem("currentNote", window.CURRENT_NOTEID);
	} else {
		window.CURRENT_NOTEID = self.noteId;
	}
	var newNote = new NewNote();
	newNote.init();
	window.addEventListener('refresh', function() {
		setTimeout(function(){
			newNote.initList(window.CURRENT_NOTEID);
		}, 2000);
	});
});
var NewNote = function() {}
NewNote.prototype = {
	init: function init() {
		var self = this;
		if(!window.IS_SAVED) {
			this.initNote();
			this.listenOperation();
		} else {
			ajaxConnector("fp/fpServer", {
				noteId: window.CURRENT_NOTEID,
				type: "getNoteInfo"
			}, "GET", true, function(data) {
				var jsondata = JSON.parse(data);
				self.initNote(jsondata);
				self.listenOperation();
			})
		}
		this.cityPicker = new mui.PopPicker({
			layer: 2
		});
		this.cityPicker.setData(cityData);
		this.citySelect();
	},
	initNote: function initNote(opts) {
		var self = this;
		var localInfo = JSON.parse(localStorage.getItem("userinfo"));
		var opt = $.extend({
			title: localStorage.getItem("title") || "点击输入标题",
			cover: localStorage.getItem("cover") || "./img/shh.jpg",
			userpic: localInfo?localInfo.userpic:"./img/cbd.jpg",
			_whtag: localInfo?localInfo._whtag:0,
			noteId: window.CURRENT_NOTEID
		}, opts);
		$(".fp-newnotes-cover").css("background", "url(" + opt.cover + ") no-repeat center center");
		getLocation();
		self.initList(opt.noteId);
		$(".fp-userpic-img").attr("src", opt.userpic);
		opt._whtag == 0 ? $(".fp-userpic-img").css({
			"height": "100%",
			"width": "auto"
		}) : $(".fp-userpic-img").css({
			"width": "100%",
			"height": "auto"
		});
		$(".fp-newnotes-cover-title input").val(opt.title);
	},
	listenOperation: function listenOperation() {
		$(".fp-newnotes-content").on("tap", ".fp-newnotes-content-imglist-info", function() {
			var imgSrc = $(this).hasClass("withImg") ? $(this).parents("li").find(".fp-newnotes-content-imglist-img-box img").attr("src") : "";
			var desc = $(this).find(".fp-newnotes-content-imglist-info-desc").text();
			var loca = $(this).find(".fp-newnotes-content-imglist-info-loca").text();
			var time = $(this).find(".fp-newnotes-content-imglist-info-time").text();
			var id = $(this).parents("li").attr("data-id");
			var opts = {
				imgSrc: imgSrc,
				desc: desc,
				loca: loca,
				time: time,
				footprintId: id,
				noteId: window.CURRENT_NOTEID
			}
			openWebview("editfp.html", "editfp", {}, opts);
		});
		$(".fp-newnotes-foot-gallery").on("tap", function() {
			pickImgs(1, function(img, path, direction) {
//				path = path.replace("file://", "");
				var imgTime = null;
				EXIF.getData(img, function() {
					imgTime = EXIF.getTag(this, 'DateTimeOriginal') && EXIF.getTag(this, 'DateTimeOriginal').substr(0, 16).replace(/(\d+)\:(\d+)\:(\d+)/, "$1-$2-$3");
				});
				plus.zip.compressImage({
						src: path,
						dst: path.replace(".jpg", "zip.jpg"),
						width: "400px",
						quality: 80,
						overwrite: true
					},
					function() {
						openWebview("editfp.html", "editfp", {}, {
							imgSrc: path.replace(".jpg", "zip.jpg"),
							imgTime: imgTime,
							noteId: window.CURRENT_NOTEID
						});
					},
					function(error) {
						alert(error.message)
						alert("Compress error!");
					});
			});
		});
		$(".fp-newnotes-foot-text").on("tap", function() {
			openWebview("editfp.html", "editfp", {}, {
				noteId: window.CURRENT_NOTEID,
				time: new Date().Format("yyyy-MM-dd hh:mm")
			});
		});
		$(".fp-newnotes-foot-camera").on("tap", function() {
			takePicture(function(path) {
				var img = new Image();
				img.src = path;
				img.onload = function() {
					EXIF.getData(img, function() {
						imgTime = EXIF.getTag(this, 'DateTimeOriginal') && EXIF.getTag(this, 'DateTimeOriginal').substr(0, 16).replace(/(\d+)\:(\d+)\:(\d+)/, "$1-$2-$3");
					});
					plus.zip.compressImage({
							src: path,
							dst: path.replace(".jpg", "zip.jpg"),
							width: "400px",
							overwrite: true,
							quality: 80
						},
						function() {
							openWebview("editfp.html", "editfp", {}, {
								imgSrc: path.replace(".jpg", "zip.jpg"),
								imgTime: imgTime,
								noteId: window.CURRENT_NOTEID
							});
						},
						function(error) {
							alert("Compress error!");
						});
				}
			})
		});
//		$(".fp-newnotes-finishbtn").on("tap", function() {
//
//		});
		$(".fp-newnotes-cover").on("tap", function() {
			sConfirm({
				tips: "更换封面？",
				okFunc: function() {
					utils.changeCover();
				}
			})
		});
		$(".fp-userpic-box").on("tap", function(e) {
			e.stopPropagation();
		});
		$(".fp-newnotes-cover-title input").on("tap", function(e) {
			e.stopPropagation();
		});
		$("#fp-newnotes-title-input").on("blur", function(){
			if($(this).val() != ""){
				localStorage.setItem("title", $(this).val());
			}
		})
	},
	initList: function initList(id) {
		ajaxConnector("fp/fpServer", {
			type: "initFootPrintList",
			noteId: id,
		}, "GET", true, function(data) {
			var jsondata = JSON.parse(data);
			$(".fp-newnotes-content-imglist").children().remove();
			var newList = "";
			for(var dateKey in jsondata) {
				for(var i = 0; i < jsondata[dateKey].length; i++) {
					var pointClass = i == 0 ? "head" : "body";
					var dateDisp = i == 0 ? dateKey : "";
					if(!jsondata[dateKey][i].img) {
						newList += '<li data-id="' + jsondata[dateKey][i].id + '" class="clear-fix">' +
							'			<span class="timePoint ' + pointClass + '">' + dateDisp + '</span>' +
							'			<div class="fp-newnotes-content-imglist-info">' +
							'				<p class="fp-newnotes-content-imglist-info-desc">' + jsondata[dateKey][i].content + '</p>' +
							'				<p class="fp-newnotes-content-imglist-info-time">' + jsondata[dateKey][i].time + '</p>' +
							'				<p class="fp-newnotes-content-imglist-info-loca">' + jsondata[dateKey][i].location + '</p>' +
							'			</div>' +
							'		</li>';
					} else {
						var img = document.createElement("img");
						img.src = jsondata[dateKey][i].img;
						img.id = jsondata[dateKey][i].img.substr(-20, 16);
						$(img).attr({
							"data-preview-src": "",
							"data-preview-group": 1
						});
						newList += '<li data-id="' + jsondata[dateKey][i].id + '" class="clear-fix">' +
							'			<span class="timePoint ' + pointClass + '">' + dateDisp + '</span>' +
							'			<div class="fp-newnotes-content-imglist-img">' +
							'				<div class="fp-newnotes-content-imglist-img-box">' + img.outerHTML +
							'				</div>' +
							'			</div>' +
							'			<div class="fp-newnotes-content-imglist-info withImg">' +
							'				<p class="fp-newnotes-content-imglist-info-desc">' + jsondata[dateKey][i].content + '</p>' +
							'				<p class="fp-newnotes-content-imglist-info-time">' + jsondata[dateKey][i].time + '</p>' +
							'				<p class="fp-newnotes-content-imglist-info-loca">' + jsondata[dateKey][i].location + '</p>' +
							'			</div>' +
							'		</li>';
						img.onload = function() {
							if(this.width > this.height) {
								$("#" + this.src.substr(-20, 16)).css("height", "100%");
							} else {
								$("#" + this.src.substr(-20, 16)).css("width", "100%");
							}
						}
					}
				}
			}
			$(".fp-newnotes-content-imglist").append(newList);
		})
	},
	citySelect: function citySelect() {
		var self = this;
		var showCityPickerButton = $('#showCityPicker');
		showCityPickerButton.on('tap', function(event) {
			self.cityPicker.show(function(items) {
				self.city = items[0].text + "," + items[1].text;
				plus.nativeUI.showWaiting();
				var img = new Image();
				img.src = $(".fp-newnotes-cover").css("background").match(/url\(["]*([^"]+)["]*\)/)[1];
				img.onload = function() {
					var imgData = getBase64Image(this, 900);
					var newImgbase = imgData.split(",")[1];
					var imgId = "img" + new Date().getTime();
					var data = {
						img: newImgbase,
						id: imgId
					};
					ajaxConnector("fp/imgUpload", data, "POST", false, function(data) {
						if(data == "success") {
							var noteData = {};
							noteData.title = $(".fp-newnotes-cover-title input").val();
							noteData.userId = JSON.parse(localStorage.getItem("userinfo")).userId;
							noteData.id = window.CURRENT_NOTEID;
							noteData.cover = "http://47.94.247.224:8080/fp/img/" + imgId + ".png";
							noteData.city = self.city;
							if(window.PATH_TYPE != "editNote"){
								noteData.time = new Date().Format("yyyy-MM-dd");
							}
							ajaxConnector("fp/fpServer", {
								type: window.PATH_TYPE,
								param: JSON.stringify(noteData)
							}, "GET", true, function(data) {
								if(data == "success") {
									plus.nativeUI.closeWaiting();
									mui.toast("保存成功");
									localStorage.removeItem("currentNote");
									localStorage.setItem("cover", "./img/shh.jpg");
									localStorage.setItem("title", "点击输入标题");
									var i = window.PATH_TYPE=="addNote"?plus.webview.getWebviewById("index_sub"):plus.webview.getWebviewById("personal");
									mui.fire(i, 'refreshList');
									mui.back();
								}
							})
						}
					})
					img.remove();
				}
			});
		});
	}
}

var utils = {
	changeCover: function() {
		if(!window.IS_SAVED) {
			pickImgs(1, function(img, path, direction) {
				$(".fp-newnotes-cover").css("background", "url(" + path + ") no-repeat center center");
				localStorage.setItem("cover", path);
			});
		} else {
			pickImgs(1, function(img, path, direction) {
				plus.nativeUI.showWaiting();
				var data = getBase64Image(img, 900, direction); //base64编码
				var newImgbase = data.split(",")[1]; //通过逗号分割到新的编码
				var imgId = "img" + new Date().getTime();
				var data = {
					img: newImgbase,
					id: imgId
				};
				ajaxConnector("fp/imgUpload", data, "POST", false, function(data) {
					if(data == "success") {
						ajaxConnector("fp/fpServer", {
							type: "changeCover",
							cover: "http://47.94.247.224:8080/fp/img/" + imgId + ".png",
							noteId: window.CURRENT_NOTEID
						}, "GET", true, function(data) {
							if(data == "success") {
								$(".fp-newnotes-cover").css("background", "url(" + path + ") no-repeat center center");
								plus.nativeUI.closeWaiting();
								mui.toast("保存成功");
							}
						})
					}
				})
			});
		}
	}
}