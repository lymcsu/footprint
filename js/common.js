var FP_HOST = "http://47.94.247.224:8080/";

//$(".icon-home").on("tap", function() {
//	openWebview("index.html", "index");
//})
var openWebview = function(pageUrl, pageId, styles, extras) {
	mui.openWindow({
		url: pageUrl,
		id: pageId,
		styles: styles,
		//		{
		//			top: newpage - top - position, //新页面顶部位置
		//			bottom: newage - bottom - position, //新页面底部位置
		//			width: newpage - width, //新页面宽度，默认为100%
		//			height: newpage - height, //新页面高度，默认为100%
		//			......
		//		}
		extras: extras,
		createNew: true, //是否重复创建同样id的webview，默认为false:不重复创建，直接显示
		show: {
			autoShow: true //页面loaded事件发生后自动显示，默认为true
				//			aniShow: animationType, //页面显示动画，默认为”slide-in-right“；
				//			duration: animationTime //页面动画持续时间，Android平台默认100毫秒，iOS平台默认200毫秒；
		},
		waiting: {
			autoShow: true, //自动显示等待框，默认为true
			title: '客官稍等...' //等待对话框上显示的提示内容
				//			options: {
				//				width: waiting - dialog - widht, //等待框背景区域宽度，默认根据内容自动计算合适宽度
				//				height: waiting - dialog - height, //等待框背景区域高度，默认根据内容自动计算合适高度
				//				......
				//			}
		}
	})
}

function getLocation() {
	plus.geolocation.getCurrentPosition(function(p) {
		var ggPoint = new BMap.Point(p.coords.longitude, p.coords.latitude);
		var convertor = new BMap.Convertor();
		var pointArr = [];
		pointArr.push(ggPoint);
		convertor.translate(pointArr, 3, 5, function(data) {
			var marker = new BMap.Marker(data.points[0]);
			map.addOverlay(marker);
			map.setCenter(data.points[0]);
		})
	}, function(e) {
		mui.toast("定位失败,请允许位置服务或手动选择位置");
		var marker = new BMap.Marker(new BMap.Point(116.404, 39.915));
		map.addOverlay(marker);
		map.setCenter(new BMap.Point(116.404, 39.915));
	});
}

function pickImgs(maxNum, callback) {
	plus.gallery.pick(
		function(path) {
			//把图片base64编码  注意：这里必须在onload事件里执行
			var imgArr = [];
			var imgs = [];
			if(maxNum === 1) {
				imgArr.push(path);
			} else {
				imgArr = path.files;
			}
			for(var i = 0; i < imgArr.length; i++) {
				imgs[i] = new Image();
				imgs[i].src = imgArr[i];
				imgs[i].onload = function() {
					var _me = this;
					EXIF.getData(_me, function() {
						//图片方向角  
						var Orientation = null;
						// alert(EXIF.pretty(this));  
						EXIF.getAllTags(this);
						//alert(EXIF.getTag(this, 'Orientation')); 
						myorientation = EXIF.getTag(this, 'Orientation');
						callback(_me, path, myorientation);
						_me.remove();
					})
				}
			}
		},
		function(e) {
			mui.toast('取消选择');
		}, {
			filter: "image",
			multiple: maxNum === 1 ? false : true,
			maximum: maxNum,
			system: false,
			onmaxed: function() {
				plus.nativeUI.alert('最多选择' + maxNum + '张图片');
			},
			popover: true
		});
}

function getBase64Image(img, size, direction) {
	var canvas = document.createElement("canvas"); //创建canvas DOM元素，并设置其宽高和图片一样
	var width = img.width;
	var height = img.height;
	if(size !== undefined) {
		if(width > height) {
			if(width > size) {
				height = Math.round(height *= size / width);
				width = size;
			}
		} else {
			if(height > size) {
				width = Math.round(width *= size / height);
				height = size;
			}
		}
	}
	canvas.width = width; /*设置新的图片的宽度*/
	canvas.height = height; /*设置新的图片的长度*/
	var ctx = canvas.getContext("2d");
	ctx.drawImage(img, 0, 0, width, height); //使用画布画图
	if(navigator.userAgent.match(/iphone/i)) {
		if(!!direction && direction != 1) {
			switch(direction) {
				case 6: //需要顺时针（向左）90度旋转  
					var degree = 90 * Math.PI / 180;
					canvas.width = height;
                	canvas.height = width;
					ctx.rotate(degree);
					ctx.drawImage(img, 0, -height, width, height); //使用画布画图
					break;
				default:
					break;
			}
		}
	}
	var ext = img.src.substring(img.src.lastIndexOf(".") + 1).toLowerCase(); //动态截取图片的格式
	var dataURL = canvas.toDataURL("image/" + ext); //返回的是一串Base64编码的URL并指定格式
	return dataURL;
}

function rotateImg(img, direction, canvas) {
	//alert(img);  
	//最小与最大旋转方向，图片旋转4次后回到原方向    
	var min_step = 0;
	var max_step = 3;
	//var img = document.getElementById(pid);    
	if(img == null) return;
	//img的高度和宽度不能在img元素隐藏后获取，否则会出错    
	var height = img.height;
	var width = img.width;
	//var step = img.getAttribute('step');    
	var step = 2;
	if(step == null) {
		step = min_step;
	}
	if(direction == 'right') {
		step++;
		//旋转到原位置，即超过最大值    
		step > max_step && (step = min_step);
	} else {
		step--;
		step < min_step && (step = max_step);
	}
	//img.setAttribute('step', step);    
	/*var canvas = document.getElementById('pic_' + pid);   
	if (canvas == null) {   
	    img.style.display = 'none';   
	    canvas = document.createElement('canvas');   
	    canvas.setAttribute('id', 'pic_' + pid);   
	    img.parentNode.appendChild(canvas);   
	}  */
	//旋转角度以弧度值为参数    
	var degree = step * 90 * Math.PI / 180;
	var ctx = canvas.getContext('2d');
	switch(step) {
		case 0:
			//			canvas.width = width;
			//			canvas.height = height;
			ctx.drawImage(img, 0, 0);
			break;
		case 1:
			//			canvas.width = height;
			//			canvas.height = width;
			alert(height);
			ctx.rotate(degree);
			ctx.drawImage(img, 0, -height);
			break;
		case 2:
			//			canvas.width = width;
			//			canvas.height = height;
			ctx.rotate(degree);
			ctx.drawImage(img, -width, -height);
			break;
		case 3:
			//			canvas.width = height;
			//			canvas.height = width;
			ctx.rotate(degree);
			ctx.drawImage(img, -width, 0);
			break;
	}
}

function takePicture(callback) {
	var cmr = plus.camera.getCamera();
	var res = cmr.supportedImageResolutions[0];
	var fmt = cmr.supportedImageFormats[0];
	cmr.captureImage(function(path) {
			var url = plus.io.convertLocalFileSystemURL(path);
			callback(url);
		},
		function(error) {
			mui.toast("取消拍照");
		}, {
			resolution: res,
			format: fmt
		}
	);
}

function ajaxConnector(path, params, method, isAsync, callback) {
	$.ajax({
		type: method,
		url: FP_HOST + path,
		data: params,
		async: isAsync,
		success: function(data) {
			if(typeof callback === "function") {
				callback(data);
			}
		},
		error: function() {
			alert("network error");
		}
	});
}

//function compressImage(src){
//	plus.zip.compressImage({
//			src: src,
//			dst: src + "a.jpg",
//			quality:20
//		},
//		function() {
//			alert("Compress success!");
//			alert(src);
//		},function(error) {
//			alert("Compress error!");
//	});
//}

function sConfirm(opts) {
	var opt = $.extend({
		tips: "确定操作？",
		okFunc: null
	}, opts)
	$("body").append("<div class='sConfirm'>" +
		"<p class='sConfirm-title'>提示</p>" +
		"<p class='sConfirm-tips'>" + opt.tips + "</p>" +
		"<p class='sConfirm-btns'><a class='cancel'>取消</a><a class='confirm'>确认</a></p>" +
		"</div><div class='pop-bg'></div>");
	$(".sConfirm-btns .confirm").on("click", function() {
		$(this).parents(".sConfirm").siblings(".pop-bg").remove().end().remove();
		opt.okFunc && opt.okFunc();
	})
	$(".sConfirm-btns .cancel").on("click", function() {
		$(this).parents(".sConfirm").siblings(".pop-bg").remove().end().remove();
	})
}

Date.prototype.Format = function(fmt) { //author: meizz 
	var o = {
		"M+": this.getMonth() + 1, //月份 
		"d+": this.getDate(), //日 
		"h+": this.getHours(), //小时 
		"m+": this.getMinutes(), //分 
		"s+": this.getSeconds(), //秒 
		"q+": Math.floor((this.getMonth() + 3) / 3), //季度 
		"S": this.getMilliseconds() //毫秒 
	};
	if(/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
	for(var k in o)
		if(new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
	return fmt;
}

//监听类
$(".icon-home").on("tap", function() {
	var pageArr = plus.webview.all();
	var launch = plus.webview.getLaunchWebview();
	pageArr.forEach(function(value) {
		if(value.id != launch.id && value.id != "menuLeft" && value.id != "index_sub") {
			value.close();
		}
	})
})