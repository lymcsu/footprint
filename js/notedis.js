var map = new BMap.Map("track-mc"); // 创建Map实例
map.centerAndZoom(new BMap.Point(116.404, 39.915), 16); // 初始化地图,设置中心点坐标和地图级别
//map.setCurrentCity("北京"); // 设置地图显示的城市 此项是必须设置的
map.disableScrollWheelZoom();
map.disableDoubleClickZoom();
map.disableDragging();
var localInfo = JSON.parse(localStorage.getItem("userinfo"));
var dispTimer = [];
var moveTimer = null;

document.addEventListener("plusready", function() {
	mui.init({
		beforeback: function() {
			if($("header").is(":visible")) {
				return true;
			} else {
				$("#fpNodeDisp").remove();
				utils.userIcon && utils.userIcon.remove();
				utils.mapZoonOut(noteDisp.dispData);
				clearTimeout(moveTimer);
				for(var i in dispTimer) {
					clearTimeout(dispTimer[i]);
				}
				return false;
			}
		}
	});
	mui.previewImage();
	var self = plus.webview.currentWebview();
	window.DISP_NOTEID = self.noteId;
	collection.initCollection();
	var noteDisp = new NoteDisp();
	noteDisp.init();
}, false)

var NoteDisp = function() {};
NoteDisp.prototype = {
	noteInfo: null,
	pageCount: 0,
	dispData: [],
	init: function init() {
		var self = this;
		this.noteId = window.DISP_NOTEID;
		ajaxConnector("fp/fpServer", {
			type: "initNoteDisplay",
			noteId: window.DISP_NOTEID,
		}, "GET", true, function(data) {
			var jsondata = JSON.parse(data);
			window.NOTE_WRITER = jsondata.userId;
			window.WRITER_PIC = jsondata.userpic;
			if(window.NOTE_WRITER != localInfo.userId) {
				utils.pvCounter();
				collection.listenHandler();
			} else {
				$(".fp-travels-navbtn.like").hide();
			}
			self.noteInfo = jsondata;
			console.log(data);
			self.listenHandler();
			self.renderNote();
			self.renderMapInfo();
			setTimeout(function() {
				self.renderFootprint();
			}, 100)
		})
	},
	renderNote: function renderNote() {
		var self = this;
		$(".fp-travels-head-track-userpic").css("background", "url(" + self.noteInfo.userpic + ") no-repeat center center");
		$(".fp-travels-head-maininfo h2").text(self.noteInfo.title);
		$(".note-editTime").text(self.noteInfo.time);
		$(".note-city").text(self.noteInfo.city.split(",")[1]);
		$(".note-likeTimes").text(self.noteInfo.likeTimes);
		$(".fp-travels-head-track-username").html("<i>By</i>" + self.noteInfo.username);
	},
	renderFootprint: function renderFootprint() {
		console.log('renderFp')
		var self = this;
		ajaxConnector("fp/fpServer", {
			type: "getFootPrintById",
			noteId: window.DISP_NOTEID,
			pageNum: self.pageCount++
		}, "GET", false, function(data) {
			var jsondata = JSON.parse(data);
			console.log(data)
			if($.isEmptyObject(jsondata)) {
				$(window).off("scroll");
				return;
			}
			var newHtml = "";

			for(var dateKey in jsondata) {
				for(var i = 0; i < jsondata[dateKey].length; i++) {
					if(i == 0) {
						newHtml += '<div class="fp-card fp-card-first">' +
							'<div class="fp-card-node">' +
							'<i></i>' +
							'<span>' + dateKey + '</span>' +
							'</div>';
					} else {
						newHtml += '<div class="fp-card">';
					}
					if(!!jsondata[dateKey][i].img) {
						newHtml += '<div class="fp-card-img">' +
							'<img src="' + jsondata[dateKey][i].img + '" data-preview-src="" data-preview-group="1" />' +
							'</div>' +
							'<div class="fp-card-cont">' +
							'<p>' + jsondata[dateKey][i].content + '</p>' +
							'</div>' +
							'<div class="fp-card-info clear-fix">' +
							'<span class="fp-card-info-time"><i class="iconfont icon-time"></i>' + jsondata[dateKey][i].time.substr(5) + '</span>' +
							'<span class="fp-card-info-loc">' + jsondata[dateKey][i].location + '</span>' +
							'</div>' +
							'</div>';
					} else {
						newHtml += '<div class="fp-card-cont">' +
							'<p>' + jsondata[dateKey][i].content + '</p>' +
							'</div>' +
							'<div class="fp-card-info clear-fix">' +
							'<span class="fp-card-info-time"><i class="iconfont icon-time"></i>' + jsondata[dateKey][i].time.substr(5) + '</span>' +
							'<span class="fp-card-info-loc">' + jsondata[dateKey][i].location + '</span>' +
							'</div>' +
							'</div>';
					}
				}
			}
			console.log(newHtml)
			$(".fp-card-list").append(newHtml);
		})
	},
	listenHandler: function listenHandler() {
		var self = this;
		$(window).on("scroll", function() {
			var scrollTop = $(this).scrollTop();　　
			var scrollHeight = $(document).height();　　
			var windowHeight = $(this).height();
			if(scrollTop + windowHeight == scrollHeight) {　　　　
				self.renderFootprint(self.noteId);
			}
		});
		$(".fp-travels-head-track-top").on("tap", function() {
			utils.mapZoomIn(self.dispData);
		});
		$(".mui-content").on("tap", ".playBtn", function() {
			utils.playFunc(self.dispData);
		})
		$(".fp-travels-head-track-userpic").on("tap", function() {
			openWebview("personal.html", "personal", {}, {
				userId: window.NOTE_WRITER
			});
		})
		$(".fp-travels-navbtn.comment").on("tap", function() {
			openWebview("comment.html", "comment", {}, {
				noteId: window.DISP_NOTEID
			})
		})
	},
	renderMapInfo: function renderMapInfo() {
		var self = this;
		console.log('renderMap');
		ajaxConnector("fp/fpServer", {
			type: "initDispMap",
			noteId: window.DISP_NOTEID
		}, "GET", false, function(data) {
			var jsondata = JSON.parse(data);
			console.log(data)
			self.dispData = jsondata;
			for(var i = 0; i < self.dispData.length; i++) {
				var point = self.dispData[i].coord.split(",");
				addMarker(new BMap.Point(+point[0], +point[1]));
				if(i + 1 < self.dispData.length) {
					var _point = self.dispData[i + 1].coord.split(",");
					drawPolyline(point, _point);
				}
			}
			var firstPoint = self.dispData[0].coord.split(",");
			map.centerAndZoom(new BMap.Point(+firstPoint[0], +firstPoint[1]), 11);

			function addMarker(point) {
				var marker = new BMap.Marker(point);
				map.addOverlay(marker);
			}

			function drawPolyline(fPoint, sPoint) {
				var polyline = new BMap.Polyline([
					new BMap.Point(fPoint[0], fPoint[1]), //起始点的经纬度
					new BMap.Point(sPoint[0], sPoint[1]) //终止点的经纬度
				], {
					strokeColor: "#4ABDCC", //设置颜色 
					strokeWeight: 2, //宽度
					strokeOpacity: 1
				}); //透明度
				map.addOverlay(polyline);
			}
		})
	}
}

var utils = {
	userIcon: null,
	mapZoomIn: function(data) {
		var points = [];
		for(var i = 0; i < data.length; i++) {
			var pt = new BMap.Point(+data[i].coord.split(",")[0], +data[i].coord.split(",")[1]);
			points.push(pt);
		}
		var self = this;
		$("header").hide();
		map.enableDoubleClickZoom();
		map.enableDragging();
		var docHeight = $(window).height();
		$("#track-mc").css({
			"z-index": 999,
			"position": "fixed"
		}).animate({
			"top": "0px",
			"bottom": "0px",
			"height": docHeight + "px",
		}, 200, function() {
			self.setZoom(points);
		});
		$("<span class='playBtn iconfont icon-play'></span>").appendTo($(".mui-content"));
	},
	mapZoonOut: function(data) {
		map.removeOverlay(this.userIcon);
		$("header").show();
		$(".playBtn").remove();
		map.disableDoubleClickZoom();
		map.disableDragging();
		$("#track-mc").css({
			"z-index": 0,
			"position": "relative"
		}).animate({
			"top": "0px",
			"height": "190px",
		}, 200, function() {
			map.centerAndZoom(new BMap.Point(+data[0].coord.split(",")[0], +data[0].coord.split(",")[1]), 11);
		});
	},
	setZoom: function(points) {
		if(points.length > 0) {
			var maxLng = points[0].lng;
			var minLng = points[0].lng;
			var maxLat = points[0].lat;
			var minLat = points[0].lat;
			var res;
			for(var i = points.length - 1; i >= 0; i--) {
				res = points[i];
				if(res.lng > maxLng) maxLng = res.lng;
				if(res.lng < minLng) minLng = res.lng;
				if(res.lat > maxLat) maxLat = res.lat;
				if(res.lat < minLat) minLat = res.lat;
			};
			var cenLng = (parseFloat(maxLng) + parseFloat(minLng)) / 2;
			var cenLat = (parseFloat(maxLat) + parseFloat(minLat)) / 2;
			var zoom = this.getZoom(maxLng, minLng, maxLat, minLat);
			map.centerAndZoom(new BMap.Point(cenLng, cenLat), zoom);
		} else {
			//没有坐标，显示全中国  
			map.centerAndZoom(new BMap.Point(103.388611, 35.563611), 5);
		}
	},
	getZoom: function(maxLng, minLng, maxLat, minLat) {
		var zoom = ["50", "100", "200", "500", "1000", "2000", "5000", "10000", "20000", "25000", "50000", "100000", "200000", "500000", "1000000", "2000000"] //级别18到3。  
		var pointA = new BMap.Point(maxLng, maxLat); // 创建点坐标A  
		var pointB = new BMap.Point(minLng, minLat); // 创建点坐标B  
		var distance = map.getDistance(pointA, pointB).toFixed(1); //获取两点距离,保留小数点后两位  
		for(var i = 0, zoomLen = zoom.length; i < zoomLen; i++) {
			if(zoom[i] - distance > 0) {
				return 18 - i + 3; //之所以会多3，是因为地图范围常常是比例尺距离的10倍以上。所以级别会增加3。  
			}
		};
	},
	playFunc: function(data) {
		var self = this;
		$(".playBtn").fadeOut(400);
		//添加进度条
		var firstPoint = new BMap.Point(+data[0].coord.split(",")[0], +data[0].coord.split(",")[1]);
		map.centerAndZoom(firstPoint, 14);
		var img = new Image();
		img.src = window.WRITER_PIC;
		var myIcon = new BMap.Icon(window.WRITER_PIC, new BMap.Size(40, 40), { //小车图片
			imageOffset: new BMap.Size(0, 0), //图片的偏移量。为了是图片底部中心对准坐标点。
			imageSize: new BMap.Size(40, 40)
		});
		self.userIcon = new BMap.Marker(firstPoint, {
			icon: myIcon
		});
		map.addOverlay(self.userIcon);
		var num = 0;
		var dataCount = 0;
		imgDisplay(data[dataCount]);
		dataCount++;
		moveTimer = setTimeout(function() {
			move();
		}, 3000);

		function move() {
			var fpNums = data.length;
			var myP1 = new BMap.Point(+data[num].coord.split(",")[0], +data[num].coord.split(",")[1]);
			var myP2 = new BMap.Point(+data[num + 1].coord.split(",")[0], +data[num + 1].coord.split(",")[1]);
			if(myP1.lng == myP2.lng && myP1.lat == myP2.lat) {
				$("#fpNodeDisp").remove();
				imgDisplay(data[dataCount]);
				dataCount++;
				moveTimer = setTimeout(function() {
					num++;
					if(num < fpNums - 1) {
						move();
					} else {
						$("#fpNodeDisp").remove();
						self.userIcon.remove();
						$(".playBtn").fadeIn(400);
					}
				}, 3000);
				return;
			}
			self.setZoom([myP1, myP2]);
			var lngDistance = myP2.lng - myP1.lng;
			var latDistance = myP2.lat - myP1.lat;

			var scale = lngDistance / latDistance;
			var latCount = latDistance / 100;
			var ptArr = [];
			for(var i = 1; i <= 100; i++) {
				var point = new BMap.Point((latCount * i) * scale + myP1.lng, latCount * i + myP1.lat);
				ptArr.push(point);
			}
			var i = 0;
			while(i < 100) {
				(function(k) {
					dispTimer.push(setTimeout(function() {
						self.userIcon.setPosition(ptArr[k]);
						//						map.setCenter(ptArr[k]);
						if(k == 99) {
							num++;
							$("#fpNodeDisp").remove();
							map.setCenter(ptArr[99]);
							imgDisplay(data[dataCount]);
							dataCount++;
							moveTimer = setTimeout(function() {
								if(num < fpNums - 1) {
									move();
								} else {
									$("#fpNodeDisp").remove();
									self.userIcon.remove();
									$(".playBtn").fadeIn(400);
								}
							}, 3000);
						}
					}, 30 * k));
					i++;
				})(i);
			}
		}

		function imgDisplay(dispData) {
			function ComplexCustomOverlay(obj) {
				this._point = new BMap.Point(+obj.coord.split(",")[0], +obj.coord.split(",")[1]);
				this._img = obj.img;
				this._content = obj.content;
			}
			ComplexCustomOverlay.prototype = new BMap.Overlay();
			ComplexCustomOverlay.prototype.initialize = function(map) {
				this._map = map;
				var div = this._div = document.createElement("div");
				div.id = "fpNodeDisp";
				div.style.position = "absolute";
				div.style.backgroundColor = "#FFF";
				div.style.padding = "8px";
				div.style.zIndex = BMap.Overlay.getZIndex(this._point.lat);
				div.style.boxShadow = "2px 2px 5px #666";
				div.style.height = "140px";
				div.style.width = "200px";
				div.style.overflow = "auto";
				if(!this._img) {
					var span = document.createElement("span");
					span.style.color = "#666";
					span.style.fontSize = "12px";
					div.appendChild(span);
					span.appendChild(document.createTextNode(this._content));
				} else {
					var imgDiv = document.createElement("div");
					imgDiv.style.height = "100%";
					imgDiv.style.background = "url(" + this._img + ") no-repeat center center";
					imgDiv.style.backgroundSize = "cover";
					imgDiv.style.padding = "2px";
					imgDiv.style.backgroundClip = "content-box";
					imgDiv.style.border = "1px solid #ddd";
					imgDiv.style.boxShadow = "2px 2px 2px #666";
					div.appendChild(imgDiv);
				}

				var that = this;
				var arrow = this._arrow = document.createElement("div");
				arrow.style.position = "absolute";
				arrow.style.width = "0px";
				arrow.style.height = "0px";
				arrow.style.border = "4px solid";
				arrow.style.borderColor = "transparent transparent #FFF #FFF";
				arrow.style.transform = "rotateZ(-45deg)";
				arrow.style.top = "136px";
				arrow.style.left = "100px";
				arrow.style.overflow = "hidden";
				div.appendChild(arrow);
				map.getPanes().labelPane.appendChild(div);
				return div;
			}
			ComplexCustomOverlay.prototype.draw = function() {
				var map = this._map;
				var pixel = map.pointToOverlayPixel(this._point);
				this._div.style.left = pixel.x - parseInt(this._arrow.style.left) + "px";
				this._div.style.top = pixel.y - 180 + "px";
			}
			var myCompOverlay = new ComplexCustomOverlay(dispData);
			map.addOverlay(myCompOverlay);
		}
	},
	pvCounter: function() {
		ajaxConnector("fp/fpServer", {
			type: "pvCounter",
			noteId: window.DISP_NOTEID
		}, "GET", true, function(data) {
			console.log(data);
		})
	}
}

var collection = {
	listenHandler: function() {
		var self = this;
		$(".icon-like2").on("tap", function() {
			$(this).toggleClass("collecting");
			$(this).toggleClass("icon-like1");
			self.collectionFire($(this).hasClass("collecting"));
		})
	},
	collectionFire: function(isClt) {
		var cltFlag = isClt ? 1 : 0;
		ajaxConnector("fp/fpServer", {
			type: "doCollection",
			noteId: window.DISP_NOTEID,
			userId: localInfo.userId,
			cltFlag: cltFlag,
			time: new Date().getTime()
		}, "GET", true, function(data) {
			mui.toast(data);
		})
	},
	initCollection: function() {
		ajaxConnector("fp/fpServer", {
			type: "initCollection",
			noteId: window.DISP_NOTEID,
			userId: localInfo.userId
		}, "GET", true, function(data) {
			if(data == "1") {
				$(".icon-like2").addClass("icon-like1 collecting");
			}
		})
	}
}