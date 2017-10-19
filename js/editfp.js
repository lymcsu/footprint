var map = new BMap.Map("mc"); // 创建Map实例
map.centerAndZoom(new BMap.Point(116.404, 39.915), 16); // 初始化地图,设置中心点坐标和地图级别
map.disableScrollWheelZoom();
map.disableDoubleClickZoom();
map.disableDragging();

document.addEventListener("plusready", function() {
	var self = plus.webview.currentWebview();
	var imgsrc = self.imgSrc || "";
	var desc = self.desc || "";
	var loca = self.loca || "";
	var time = self.time || self.imgTime || new Date().Format("yyyy-MM-dd hh:mm");
	var footprintId = self.footprintId || "";
	var noteId = self.noteId;
	mapEnable();
	if(imgsrc === "") {
		$(".fp-editfp-content-editarea-input").removeClass("withImg");
		$(".fp-editfp-content-editarea-img").hide();
	} else {
		$(".fp-editfp-content-editarea-input").addClass("withImg");
		$(".fp-editfp-content-editarea-img").css("background", "url(" + imgsrc + ") no-repeat center center").show();
	}

	$(".fp-editfp-content-editarea-input textarea").val(desc);
	$(".fp-editfp-content-addgeo").children("span").text(loca || "点击添加地理位置");
	$("#timespan").text(time);
	if(footprintId != "") {
		ajaxConnector("fp/fpServer", {
			id: footprintId,
			type: "getFpCoord"
		}, "GET", true, function(data) {
			var coord = data;
			if(coord !== "") {
				coord_arr = coord.split(",");
				var fpPoint = new BMap.Point(+coord_arr[0], +coord_arr[1]);
				map.centerAndZoom(fpPoint, 16);
				var marker = new BMap.Marker(fpPoint);
				map.addOverlay(marker);
			} else {
				getLocation();
			}
		})
	} else {
		getLocation();
	}

	$(".fp-editfp-content-addgeo").on("tap", function() {
		if($(".fp-selectGeoPop").length != 0) {
			mui.toast("请勿重复点击添加");
			return;
		}
		$('<div class="fp-selectGeoPop">' +
			'<span class="fp-closeBtn">关闭</span>' +
			'<div id="r-result"><input placeholder="请输入并选择地址" type="text" id="suggestId" size="20" /></div>' +
			'<div id="searchResultPanel"></div></div>').insertBefore($('.mapContainer'));
		selectGeo();
	});
	$(".fp-editfp-content").on("tap", ".fp-closeBtn", function() {
		$(this).parents(".fp-selectGeoPop").remove();
	});
	$(".fp-editfp-finishbtn").on("tap", function() {
		plus.nativeUI.showWaiting();
		var uploadType = footprintId == "" ? "addFootPrint" : "editFootPrint";
		var content = $(".fp-editfp-content-editarea-input textarea").val();
		var location = $(".fp-editfp-content-addgeo").text().trim() == "点击添加地理位置" ? "" : $(".fp-editfp-content-addgeo").text().trim();
		var time = $("#timespan").text();
		var coord = getCoord();
		if(footprintId == "") {
			if(!$(".fp-editfp-content-editarea-input").hasClass("withImg")) {
				var param = {
					content: content,
					location: location,
					time: time,
					coord: coord,
					noteId: noteId
				}
				ajaxConnector("fp/fpServer", {
					type: uploadType,
					param: JSON.stringify(param)
				}, "POST", true, function(data) {
					if(data == "success") {
						plus.nativeUI.closeWaiting();
						mui.toast("保存成功");
						var i = plus.webview.getWebviewById("newnotes");
						mui.fire(i, 'refresh');
						mui.back();
					}
				})
			} else {
				var path = $(".fp-editfp-content-editarea-img").css("background").match(/url\(["]*([^"]+)["]*\)/)[1];
				var img = new Image();
				img.src = path;
				img.onload = function() {
					var imgData = getBase64Image(this);
					var newImgbase = imgData.split(",")[1];
					var imgId = "img" + new Date().getTime();
					var data = {
						img: newImgbase,
						id: imgId
					};
					ajaxConnector("fp/imgUpload", data, "POST", true, function(data) {
						if(data == "success") {
							if(path !== "img/play.png") {
								plus.io.resolveLocalFileSystemURL(path, function(entry) {
									entry.remove(function(entry) {
										console.log("文件删除成功==" + path);
									}, function(e) {
										console.log(e.message);
									});
								});
							}
							var param = {
								img: "http://47.94.247.224:8080/fp/img/" + imgId + ".png",
								content: content,
								location: location,
								time: time,
								coord: coord,
								noteId: noteId
							};
							ajaxConnector("fp/fpServer", {
								type: uploadType,
								param: JSON.stringify(param)
							}, "POST", true, function(data) {
								if(data == "success") {
									plus.nativeUI.closeWaiting();
									mui.toast("保存成功");
									var i = plus.webview.getWebviewById("newnotes");
									mui.fire(i, 'refresh');
									mui.back();
								}
							})
						}
					})
					img.remove();
				}
			}
		} else {
			var param = {
				content: content,
				location: location,
				time: time,
				coord: coord,
				noteId: noteId,
				id: footprintId
			}
			ajaxConnector("fp/fpServer", {
				type: uploadType,
				param: JSON.stringify(param)
			}, "POST", true, function(data) {
				if(data == "success") {
					plus.nativeUI.closeWaiting();
					mui.toast("保存成功");
					var i = plus.webview.getWebviewById("newnotes");
					mui.fire(i, 'refresh');
					mui.back();
				}
			})
		}

	})
	$(".fp-deleteFootprint").on("tap", function() {
		sConfirm({
			tips: "确认删除吗？",
			okFunc: function() {
				var id = plus.webview.currentWebview().footprintId;
				ajaxConnector("fp/fpServer", {
					type: "deleteFootPrint",
					id: id
				}, "GET", true, function(data) {
					if(data == "success") {
						mui.toast("删除成功");
						var i = plus.webview.getWebviewById("newnotes");
						mui.fire(i, 'refresh');
						mui.back();
					}
				})
			}
		});
	})
});

(function($) {
	$.init();
	var result = $('#timespan')[0];
	var timepicker = $('.fp-editfp-content-editarea-time')[0];
	timepicker.addEventListener('tap', function() {
		var optionsJson = this.getAttribute('data-options') || '{}';
		var options = JSON.parse(optionsJson);
		var id = this.getAttribute('id');
		/*
		 * 首次显示时实例化组件
		 * 示例为了简洁，将 options 放在了按钮的 dom 上
		 * 也可以直接通过代码声明 optinos 用于实例化 DtPicker
		 */
		var picker = new $.DtPicker(options);
		picker.show(function(rs) {
			/*
			 * rs.value 拼合后的 value
			 * rs.text 拼合后的 text
			 * rs.y 年，可以通过 rs.y.vaue 和 rs.y.text 获取值和文本
			 * rs.m 月，用法同年
			 * rs.d 日，用法同年
			 * rs.h 时，用法同年
			 * rs.i 分（minutes 的第二个字母），用法同年
			 */
			result.innerText = '' + rs.text;
			/* 
			 * 返回 false 可以阻止选择框的关闭
			 * return false;
			 */
			/*
			 * 释放组件资源，释放后将将不能再操作组件
			 * 通常情况下，不需要示放组件，new DtPicker(options) 后，可以一直使用。
			 * 当前示例，因为内容较多，如不进行资原释放，在某些设备上会较慢。
			 * 所以每次用完便立即调用 dispose 进行释放，下次用时再创建新实例。
			 */
			picker.dispose();
		});
	}, false);
})(mui);

function selectGeo() {
	var ac = new BMap.Autocomplete( //建立一个自动完成的对象
		{
			"input": "suggestId",
			"location": map
		});

	ac.addEventListener("onhighlight", function(e) { //鼠标放在下拉列表上的事件
		var str = "";
		var _value = e.fromitem.value;
		var value = "";
		if(e.fromitem.index > -1) {
			value = _value.province + _value.city + _value.district + _value.street + _value.business;
		}
		str = "FromItem<br />index = " + e.fromitem.index + "<br />value = " + value;

		value = "";
		if(e.toitem.index > -1) {
			_value = e.toitem.value;
			value = _value.province + _value.city + _value.district + _value.street + _value.business;
		}
		str += "<br />ToItem<br />index = " + e.toitem.index + "<br />value = " + value;
		$("#searchResultPanel")[0].innerHTML = str;
	});

	var myValue;
	ac.addEventListener("onconfirm", function(e) { //鼠标点击下拉列表后的事件
		var _value = e.item.value;
		myValue = _value.province + _value.city + _value.district + _value.street + _value.business;
		$("#searchResultPanel")[0].innerHTML = "onconfirm<br />index = " + e.item.index + "<br />myValue = " + myValue;
		$(".fp-editfp-content-addgeo").children("span").text(myValue);
		setPlace();
	});

	function setPlace() {
		function myFun() {
			if(local.getResults().getPoi(0) == undefined) {
				mui.toast("未找到该地址，请手动选择");
				$("#suggestId").blur();
				return;
			}
			map.clearOverlays(); //清除地图上所有覆盖物
			var pp = local.getResults().getPoi(0).point; //获取第一个智能搜索的结果
			map.centerAndZoom(pp, 18);
			map.addOverlay(new BMap.Marker(pp)); //添加标注
			$(".fp-selectGeoPop").remove();
		}
		var local = new BMap.LocalSearch(map, { //智能搜索
			onSearchComplete: myFun
		});
		local.search(myValue);
	}
}

function getCoord() {
	var overlay = map.getOverlays();
	if(overlay.length == 1) {
		var point = overlay[0].getPosition();
	} else {
		var point = overlay[1].getPosition();
	}
	return point.lng + "," + point.lat;
}

function getImgData(img, callback) {
	console.log(EXIF.pretty(img));
}

function mapEnable() {
	$(".pop-cover").show();
	$(".pop-cover").one("tap", function() {
		$(this).hide();
		$("#mc").css("height", "240px");
		map.enableDoubleClickZoom();
		map.enableDragging();
		var marker = map.getOverlays().length == 1 ? map.getOverlays()[0] : map.getOverlays()[1];
		marker.enableDragging();
	})
}