document.addEventListener("plusready", function() {
	if(!localStorage.getItem("userinfo")) {
		openWebview("userinfo.html", "userinfo", {}, {
			type: "bindInfo"
		})
	}
	window.INDEX_PAGE = plus.webview.currentWebview();
	mui.init({
		gestureConfig: {
			doubletap: true
		},
		subpages: [{
			url: 'index_sub.html',
			id: 'index_sub',
			styles: {
				top: '60px',
				bottom: '0px',
				zindex: -1
			}
		}]
	});
	var indexFunc = new IndexFunc();
	indexFunc.initLeftMenu();
	indexFunc.listenOperation();
	window.addEventListener("closeMenu", function() {
		indexFunc.closeMenu();
	})
})
var IndexFunc = function() {};
IndexFunc.prototype = {
	initLeftMenu: function initLeftMenu() {
		this.menuLeft = mui.preload({
			url: 'menuLeft.html',
			id: 'menuLeft',
			styles: {
				left: "-100%",
				zindex: -9997,
				render: 'always'
			}
		});
	},
	showMenu: function showMenu() {
		var self = this;
		self.menuLeft.show('none', 0, function() {
			self.menuLeft.setStyle({
				left: '0',
				width: '70%',
				transition: {
					duration: 100
				}
			});
		});
		// 主界面右移  
		window.INDEX_PAGE.show('none', 0, function() {
			window.INDEX_PAGE.setStyle({
				mask: 'rgba(0,0,0,0.5)',
				transition: {
					duration: 0
				}
			});
			window.INDEX_PAGE.setStyle({
				left: '70%',
				transition: {
					duration: 300
				}
			});
		});
	},
	closeMenu: function closeMenu() {
		var self = this;
		window.INDEX_PAGE.setStyle({
			left: '0',
			top: '0',
			bottom: '0',
			mask: 'none',
			transition: {
				duration: 150
			}
		});
		//		window.INDEX_PAGE.setStyle({
		//			mask: 'none',
		//			transition: {
		//				duration: 0
		//			}
		//		});
		// 侧滑界面移出显示区域之外  
		self.menuLeft.setStyle({
			left: "-100%",
			transition: {
				duration: 300
			}
		});
	},
	listenOperation: function listenOperation() {
		var self = this;
		$(".mui-action-menu").on("tap", function() {
			self.showMenu();
		});
		$("#placeSearch").on("tap", function() {
			if($(this).hasClass("searching")) {
				self.fireSearchPlace();
			} else {
				$(this).addClass("searching");
				$(".header-logo").hide();
				$(".fp-search-input").show().animate({
					width: "80%"
				});
			}
		});
		$(".fp-search-input").on("blur", function(e) {
			$("#placeSearch").removeClass("searching");
			$(this).css({
				width: 0
			}).hide();
			$(".header-logo").show();
		})
		window.INDEX_PAGE.addEventListener("maskClick", function() {
			self.closeMenu();
		}, false);
	},
	fireSearchPlace: function fireSearchPlace() {
		var subPage = plus.webview.getWebviewById("index_sub");
		mui.fire(subPage, "searchplace", {
			placeName: $(".fp-search-input").val()
		});
	}
}