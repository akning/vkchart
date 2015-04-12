function VKChart(contentId) {
		this.vkContent = $('#' + contentId);
		this.ctx;
		this.data = {
			items: []
		};
		this.temp = {
			startX: 0,
			startTime: 0,
			//显示的数据条数
			dataShowCount: 15,
			dataEndIndex: -1,
			minPrice: 0,
			maxDiff: 0,
			maxVolume: 0,
			maxCloseDiff: 0
		};
		this.allData;
		var contentWidth = this.vkContent.width();
		var contentHeight = this.vkContent.height();
		this.options = {
			//显示的时间格式类型
			dateTimeType: 'time',
			//价格线区域
			region: {
				x: 0,
				y: 65.5,
				width: contentWidth,
				height: contentHeight - 160
			},
			//线条颜色
			priceLineColor: '#6568FF',
			middleLineColor: '#473F49',
			otherSplitLineColor: '#473F49',
			borderColor: '#817F82',
			tipColor: 'white',
			//水平线与垂直线的条数
			horizontalLineCount: 3,
			verticalLineCount: 1,
			maxDotsCount: 120,
			timeCount: 5,
			//y轴颜色
			fallColor: '#5ece96',
			riseColor: '#a95263',
			normalColor: '#E67E65',
			//左面的数字
			yScalerFont: '10px 宋体',
			volumeHeight: 60,
			volumeMarginTop: 7
		};
	}
	/**
	 * 画线的类型
	 */
VKChart.Type = {
		mins: 1,
		kline: 2
	}
	/**
	 * 公共方法
	 */
VKChart.Util = {
	/**
	 * 画横线或竖线
	 * @param {Object} ctx
	 * @param {Number} x0
	 * @param {Number} y0
	 * @param {Number} x1
	 * @param {Number} y1
	 * @param {String} color
	 */
	paintLine: function(ctx, x0, y0, x1, y1, color) {
		ctx.beginPath();
		ctx.strokeStyle = color;
		ctx.lineWidth = 1;
		ctx.moveTo(x0, y0);
		ctx.lineTo(x1, y1);
		ctx.stroke();
	},
	/**
	 *
	 * @param {Object} type
	 * @param {Object} formatDate
	 */
	getKlineTimeString: function(type, formatDate) {
		if (type == 'time') {
			return moment(formatDate).format("HH:mm");
		} else if (type == 'date') {
			return moment(formatDate).format("MM-DD");
		}
	}
}
VKChart.prototype = {
	/**
	 * 绘制
	 * @param {Object} data
	 * @param {Object} type
	 */
	paint: function(data, type) {
		var vkChart=this;
		vkChart.init();
		vkChart.allData = data;
		vkChart.repaint(data, type);
		if (type == VKChart.Type.kline) {
			vkChart.bindEvent();
		}
	},
	repaint: function(data, type) {
		var vkChart = this;
		vkChart.ctx.clearRect(0, vkChart.options.region.y, vkChart.options.region.width, vkChart.vkContent.height() - vkChart.options.region.y);
		if (type == VKChart.Type.mins) {
			vkChart.data = data;
		} else if (type == VKChart.Type.kline) {
			if (vkChart.temp.dataEndIndex == -1) {
				vkChart.temp.dataEndIndex = data.items.length - 1;
			}
			vkChart.data.items = data.items.slice(vkChart.temp.dataEndIndex + 1 - vkChart.temp.dataShowCount, vkChart.temp.dataEndIndex + 1);
		}
		vkChart.paintTopText();
		vkChart.paintTime();
		if (type == VKChart.Type.mins) {
			vkChart.paintMins();
		} else if (type == VKChart.Type.kline) {
			vkChart.paintKline();
		}
		vkChart.paintVolume();
	},
	/**
	 * 初始化
	 * @param {Object} data
	 * @param {Object} type
	 */
	init: function() {
		var vkChart = this;
		vkChart.vkContent.html("");
		//画布的大小不能在CSS中定义
		var str = "<div id='vkY' style='display:none;z-index:1000;position: absolute;width: 1px;height:" + (this.options.region.height + this.options.volumeHeight) + "px;top:" + this.options.region.y + "px;background:" + this.options.tipColor + ";'></div>";
		str = str + "<div id='vkX' style='display:none;z-index:1000;position: absolute;height: 1px;width:" + this.options.region.width + "px;left:" + this.options.region.x + "px;background:" + this.options.tipColor + ";'></div>";
		str = str + "<canvas style='z-index: 999; position: absolute;' width='" + vkChart.vkContent.width() + "' height='" + vkChart.vkContent.height() + "'></canvas>";
		vkChart.vkContent.html(str);
		var canvas = vkChart.vkContent.find("canvas")[0];
		vkChart.ctx = canvas.getContext('2d');
		vkChart.ctx.backgroundAlpha = 0;
	},
	/**
	 * 画量
	 */
	paintVolume: function() {
		var vkChart = this;
		$.each(vkChart.data.items, function(i, item) {
			var w = vkChart.options.region.width / vkChart.data.items.length;
			var h = item.volume / vkChart.temp.maxVolume * vkChart.options.volumeHeight - vkChart.options.volumeMarginTop;
			var x = w * i + w * 0.1;
			w = w * 0.8;
			var y = vkChart.options.volumeHeight - h + vkChart.options.region.y + vkChart.options.region.height;
			var close = item.close;
			var preClose = (i == 0 ? item.close : vkChart.data.items[i - 1].close);
			var isRise = close > preClose;
			var isFall = close < preClose;
			var color = isRise ? vkChart.options.riseColor : (isFall ? vkChart.options.fallColor : vkChart.options.normalColor);
			vkChart.ctx.fillStyle = color;
			vkChart.ctx.fillRect(x, y, w, h);
		});
	},
	/**
	 * 画时间
	 */
	paintTime: function() {
		var data = this.data;
		var ctx = this.ctx;
		var options = this.options;
		var times = new Array();
		var dataLength = data.items.length;
		var space = Math.round(dataLength / options.timeCount);
		for (var i = 0; i < options.timeCount; i++) {
			times.push(VKChart.Util.getKlineTimeString(this.options.dateTimeType, new Date(data.items[dataLength - 1 - i * space].date)));
			if (i == (options.timeCount - 1)) {
				if ((dataLength - 1 - i * space) > space * 0.6) {
					times.push(VKChart.Util.getKlineTimeString(this.options.dateTimeType, new Date(data.items[0].date)));
				}
			}
		}
		var str = "";
		times = times.reverse();
		var timesLengthHalf = parseInt(times.length / 2);
		var oneWidth = Math.floor(options.region.width / (times.length - 1));
		$.each(times, function(i, time) {
			var x = oneWidth * i;
			var y = options.region.y + options.region.height + options.volumeHeight;
			ctx.font = "12px 宋体";
			ctx.fillStyle = "#917295";
			ctx.textBaseline = "top";
			ctx.textAlign = i < timesLengthHalf ? "left" : (i == timesLengthHalf ? "center" : "right");
			ctx.fillText(time, x, y);
		});
	},
	/**
	 * 画分时
	 */
	paintMins: function() {
		var vkChart = this;
		//画边框
		vkChart.ctx.beginPath();
		vkChart.ctx.strokeStyle = vkChart.options.borderColor;
		vkChart.ctx.rect(vkChart.options.region.x, vkChart.options.region.y, vkChart.options.region.width, vkChart.options.region.height);
		vkChart.ctx.stroke();
		//水平线
		var horizontalMiddleIndex = (vkChart.options.horizontalLineCount + vkChart.options.horizontalLineCount % 2) / 2;
		var horizontalSplitCount = vkChart.options.horizontalLineCount + 1;
		for (var i = 1; i <= vkChart.options.horizontalLineCount; i++) {
			var color = (i == horizontalMiddleIndex ? vkChart.options.middleLineColor : vkChart.options.otherSplitLineColor);
			var y = vkChart.options.region.y + vkChart.options.region.height * i / horizontalSplitCount;
			VKChart.Util.paintLine(vkChart.ctx, vkChart.options.region.x, y, vkChart.options.region.width, y, color);
		}
		//垂直线 
		var verticalSplitCount = vkChart.options.verticalLineCount + 1;
		for (var i = 1; i <= vkChart.options.verticalLineCount; i++) {
			var x = vkChart.options.region.x + vkChart.options.region.width * i / verticalSplitCount;
			VKChart.Util.paintLine(vkChart.ctx, x, vkChart.options.region.y, x, vkChart.options.region.y + vkChart.options.region.height, vkChart.options.otherSplitLineColor);
		}
		var preClose = vkChart.data.items[0].close;
		$.each(vkChart.data.items, function(i, item) {
			var diff = Math.abs(preClose - item.close);
			vkChart.temp.maxCloseDiff = Math.max(diff, vkChart.temp.maxCloseDiff);
			vkChart.temp.maxVolume = Math.max(vkChart.temp.maxVolume, item.volume);
		});
		vkChart.temp.minPrice = preClose - vkChart.temp.maxCloseDiff;
		//价格线
		var xSpace = vkChart.options.region.width / vkChart.data.items.length;
		vkChart.ctx.beginPath();
		vkChart.ctx.strokeStyle = vkChart.options.priceLineColor;
		vkChart.ctx.lineWidth = 1;
		vkChart.ctx.moveTo(vkChart.options.region.x, vkChart.options.region.height / 2 + vkChart.options.region.y);
		$.each(vkChart.data.items, function(i, item) {
			var x = xSpace * i + 0.5 * xSpace;
			var y = vkChart.options.region.height - ((item.close - vkChart.temp.minPrice) / 2) / vkChart.temp.maxCloseDiff * vkChart.options.region.height + vkChart.options.region.y;
			vkChart.ctx.lineTo(x, y);
		});
		vkChart.ctx.stroke();
		//y轴
		var scalersLeft = [];
		var scalersRight = [];
		var space = vkChart.temp.maxCloseDiff * 2 / (vkChart.options.horizontalLineCount + 1);
		for (var i = vkChart.options.horizontalLineCount + 1; i >= 0; i--) {
			var val = vkChart.temp.minPrice + i * space;
			scalersLeft.push(val.toFixed(2));
			var percent = (val - preClose) * 100 / preClose;
			scalersRight.push(percent.toFixed(2) + '%');
		}
		for (var i = 0; i < scalersLeft.length; i++) {
			var y = vkChart.options.region.y + i * vkChart.options.region.height / horizontalSplitCount;
			var color = i < horizontalMiddleIndex ? vkChart.options.riseColor : (i == horizontalMiddleIndex ? vkChart.options.normalColor : vkChart.options.fallColor);
			vkChart.ctx.font = vkChart.options.yScalerFont;
			vkChart.ctx.fillStyle = color;
			vkChart.ctx.textBaseline = "top";
			vkChart.ctx.textAlign = "left";
			vkChart.ctx.fillText(scalersLeft[i], 0, y);
		}
		for (var i = 0; i < scalersRight.length; i++) {
			var y = vkChart.options.region.y + i * vkChart.options.region.height / horizontalSplitCount;
			var color = i < horizontalMiddleIndex ? vkChart.options.riseColor : (i == horizontalMiddleIndex ? vkChart.options.normalColor : vkChart.options.fallColor);
			vkChart.ctx.font = vkChart.options.yScalerFont;
			vkChart.ctx.fillStyle = color;
			vkChart.ctx.textBaseline = "top";
			vkChart.ctx.textAlign = "right";
			vkChart.ctx.fillText(scalersRight[i], vkChart.options.region.width, y);
		}
		vkChart.vkContent.bind('touchstart', function(e) {
			e.preventDefault();
		})
		vkChart.vkContent.bind('mousemove touchmove', function(e) {
			var pos = 0;
			if (e.type == "mousemove") {
				pos = e.clientX - vkChart.vkContent.offset().left;
			} else {
				pos = e.originalEvent.changedTouches[0].clientX - vkChart.vkContent.offset().left;
			}
			var index = Math.floor(pos / vkChart.options.region.width * vkChart.data.items.length);
			index = index >= vkChart.data.items.length ? vkChart.data.items.length - 1 : index;
			var x = index * vkChart.options.region.width / vkChart.data.items.length + vkChart.options.region.width / vkChart.data.items.length / 2;
			var y = vkChart.options.region.height - ((vkChart.data.items[index].close - vkChart.temp.minPrice) / 2) / vkChart.temp.maxCloseDiff * vkChart.options.region.height + vkChart.options.region.y - 0.5;
			vkChart.paintTopText(index);
			vkChart.vkContent.find('#vkY').css('display', 'block');
			vkChart.vkContent.find('#vkX').css('display', 'block');
			vkChart.vkContent.find('#vkY').css('left', x);
			vkChart.vkContent.find('#vkX').css('top', y);
		});
		vkChart.vkContent.bind('touchend mouseleave', function(e) {
			vkChart.paintTopText();
			vkChart.vkContent.find('#vkY').css('display', 'none');
			vkChart.vkContent.find('#vkX').css('display', 'none');
		});
	},
	/**
	 * 画K线
	 */
	paintKline: function() {
		var vkChart = this;
		//画边框
		vkChart.ctx.beginPath();
		vkChart.ctx.strokeStyle = vkChart.options.borderColor;
		vkChart.ctx.rect(vkChart.options.region.x, vkChart.options.region.y, vkChart.options.region.width, vkChart.options.region.height);
		vkChart.ctx.stroke();
		//水平线
		var horizontalMiddleIndex = (vkChart.options.horizontalLineCount + vkChart.options.horizontalLineCount % 2) / 2;
		var horizontalSplitCount = vkChart.options.horizontalLineCount + 1;
		for (var i = 1; i <= vkChart.options.horizontalLineCount; i++) {
			var color = (i == vkChart.horizontalMiddleIndex ? vkChart.options.middleLineColor : vkChart.options.otherSplitLineColor);
			var y = vkChart.options.region.y + vkChart.options.region.height * i / horizontalSplitCount;
			VKChart.Util.paintLine(vkChart.ctx, vkChart.options.region.x, y, vkChart.options.region.width, y, color);
		}
		//垂直线 
		var verticalSplitCount = vkChart.options.verticalLineCount + 1;
		for (var i = 1; i <= vkChart.options.verticalLineCount; i++) {
			var x = vkChart.options.region.x + vkChart.options.region.width * i / verticalSplitCount;
			VKChart.Util.paintLine(vkChart.ctx, x, vkChart.options.region.y, x, vkChart.options.region.y + vkChart.options.region.height, vkChart.options.otherSplitLineColor);
		}
		var preClose = vkChart.data.items[0].close;
		$.each(data.items, function(i, item) {
			var highDiff = Math.abs(preClose - item.high);
			var lowDiff = Math.abs(preClose - item.low);
			var diff = Math.max(highDiff, lowDiff);
			vkChart.temp.maxDiff = Math.max(diff, vkChart.temp.maxDiff);
			vkChart.temp.maxVolume = Math.max(vkChart.temp.maxVolume, item.volume);
		});
		vkChart.temp.minPrice = preClose - vkChart.temp.maxDiff;
		//价格线
		var xSpace = vkChart.options.region.width / vkChart.data.items.length;
		vkChart.ctx.beginPath();
		vkChart.ctx.strokeStyle = vkChart.options.priceLineColor;
		vkChart.ctx.lineWidth = 1;
		vkChart.ctx.moveTo(vkChart.options.region.x, vkChart.options.region.height / 2 + vkChart.options.region.y);
		var barWidth = vkChart.options.region.width / vkChart.data.items.length * 0.8;
		$.each(vkChart.data.items, function(i, item) {
			var x = xSpace * i;
			var highY = vkChart.options.region.height - ((item.high - vkChart.temp.minPrice) / 2) / vkChart.temp.maxDiff * vkChart.options.region.height + vkChart.options.region.y;
			var lowY = vkChart.options.region.height - ((item.low - vkChart.temp.minPrice) / 2) / vkChart.temp.maxDiff * vkChart.options.region.height + vkChart.options.region.y;
			var openY = vkChart.options.region.height - ((item.open - vkChart.temp.minPrice) / 2) / vkChart.temp.maxDiff * vkChart.options.region.height + vkChart.options.region.y;
			var closeY = vkChart.options.region.height - ((item.close - vkChart.temp.minPrice) / 2) / vkChart.temp.maxDiff * vkChart.options.region.height + vkChart.options.region.y;
			var isRise = item.close > item.open;
			var isFall = item.close < item.open;
			var color = isRise ? vkChart.options.riseColor : (isFall ? vkChart.options.fallColor : vkChart.options.normalColor);
			VKChart.Util.paintLine(vkChart.ctx, x + barWidth * 0.6, highY, x + barWidth * 0.6, lowY, color);
			vkChart.ctx.fillStyle = color;
			if (isRise) {
				vkChart.ctx.fillRect(x + barWidth * 0.1, closeY, barWidth, (openY - closeY) < 1 ? 1 : openY - closeY);
			} else {
				vkChart.ctx.fillRect(x + barWidth * 0.1, openY, barWidth, (closeY - openY) < 1 ? 1 : closeY - openY);
			}
		});
		//y轴
		var scalersLeft = [];
		var scalersRight = [];
		var space = vkChart.temp.maxDiff * 2 / (vkChart.options.horizontalLineCount + 1);
		for (var i = vkChart.options.horizontalLineCount + 1; i >= 0; i--) {
			var val = vkChart.temp.minPrice + i * space;
			scalersLeft.push(val.toFixed(2));
			var percent = (val - preClose) * 100 / preClose;
			scalersRight.push(percent.toFixed(2) + '%');
		}
		for (var i = 0; i < scalersLeft.length; i++) {
			var y = vkChart.options.region.y + i * vkChart.options.region.height / horizontalSplitCount;
			var color = i < horizontalMiddleIndex ? vkChart.options.riseColor : (i == horizontalMiddleIndex ? vkChart.options.normalColor : vkChart.options.fallColor);
			vkChart.ctx.font = vkChart.options.yScalerFont;
			vkChart.ctx.fillStyle = color;
			vkChart.ctx.textBaseline = "top";
			vkChart.ctx.textAlign = "left";
			vkChart.ctx.fillText(scalersLeft[i], 0, y);
		}
		for (var i = 0; i < scalersRight.length; i++) {
			var y = vkChart.options.region.y + i * vkChart.options.region.height / horizontalSplitCount;
			var color = i < horizontalMiddleIndex ? vkChart.options.riseColor : (i == horizontalMiddleIndex ? vkChart.options.normalColor : vkChart.options.fallColor);
			vkChart.ctx.font = vkChart.options.yScalerFont;
			vkChart.ctx.fillStyle = color;
			vkChart.ctx.textBaseline = "top";
			vkChart.ctx.textAlign = "right";
			vkChart.ctx.fillText(scalersRight[i], vkChart.options.region.width, y);
		}
	},
	/**
	 * 画顶部提示信息
	 * @param {Object} index
	 */
	paintTopText: function(index) {
		var data = this.data;
		var ctx = this.ctx;
		var options = this.options;
		if (typeof index == 'undefined' || index >= (data.items.length - 1)) {
			index = data.items.length - 1;
		}
		var close = data.items[index].close;
		var open = data.items[index].open;
		var time = VKChart.Util.getKlineTimeString(this.options.dateTimeType, new Date(data.items[index].date));
		var isRise = close > open;
		var isFall = close < open;
		var diff = (close - open).toFixed(2);
		var color = (isRise ? options.riseColor : (isFall ? options.fallColor : options.normalColor));
		var oneWidth = Math.floor(options.region.width / 3);
		ctx.clearRect(0, 0, options.region.width, options.region.y - 1);
		ctx.font = "20px 雅黑";
		ctx.fillStyle = color;
		ctx.textBaseline = "top";
		ctx.textAlign = "left";
		ctx.fillText((isRise ? "↑" : (isFall ? "↓" : "")) + diff, 5, 5);
		ctx.fillText("(" + (diff * 100 / open).toFixed(2) + "%)", 5, 35);
		ctx.font = "12px 宋体";
		ctx.fillStyle = options.riseColor;
		ctx.fillText("最高：" + data.items[index].high.toFixed(2), oneWidth, 5);
		ctx.fillStyle = options.fallColor
		ctx.fillText("最低：" + data.items[index].low.toFixed(2), oneWidth, 25);
		ctx.fillStyle = "#917295";
		ctx.fillText("成交：" + data.items[index].volume.toFixed(2), oneWidth, 45);
		ctx.fillText("时间：" + time, oneWidth * 2, 45);
		ctx.fillStyle = (isRise ? options.fallColor : (isFall ? options.riseColor : options.normalColor));
		ctx.fillText("开盘：" + data.items[index].open.toFixed(2), oneWidth * 2, 5);
		ctx.fillStyle = (isRise ? options.riseColor : (isFall ? options.fallColor : options.normalColor));
		ctx.fillText("收盘：" + data.items[index].close.toFixed(2), oneWidth * 2, 25);
	},
	/**
	 * 绑定事件
	 */
	bindEvent: function() {
		var vkChart = this;
		vkChart.vkContent.bind('touchstart', function(e) {
			e.preventDefault();
			vkChart.temp.startX = e.originalEvent.changedTouches[0].clientX - vkChart.vkContent.offset().left;
			vkChart.temp.startY = e.originalEvent.changedTouches[0].clientY - vkChart.vkContent.offset().top;
			vkChart.temp.startTime = (new Date()).getTime();
		});
		vkChart.vkContent.bind('touchend', function(e) {
				var endX = e.originalEvent.changedTouches[0].clientX - vkChart.vkContent.offset().left;
				var endY = e.originalEvent.changedTouches[0].clientY - vkChart.vkContent.offset().top;
				var endTime = (new Date()).getTime();
				canvasWidth = vkChart.vkContent.width();
				canvasHeight = vkChart.vkContent.height();
				canvasWidth = Number(canvasWidth);
				//左右移动时产生的增量
				var xIncrement = Math.abs(Math.round((vkChart.temp.startX - endX) / canvasWidth * vkChart.temp.dataShowCount));
				if ((vkChart.temp.startX - endX) / canvasWidth > 0.3 && (endTime - vkChart.temp.startTime) < 1000) {
					var isPaint = false;
					if (vkChart.temp.dataEndIndex < (vkChart.allData.items.length - xIncrement - 1)) {
						vkChart.temp.dataEndIndex = vkChart.temp.dataEndIndex + xIncrement;
						isPaint = true;
					} else {
						if (vkChart.temp.dataEndIndex != (vkChart.allData.items.length - 1)) {
							vkChart.temp.dataEndIndex = vkChart.allData.items.length - 1;
							isPaint = true;
						}
					}
					if (isPaint) {
						vkChart.repaint(vkChart.allData, VKChart.Type.kline);
					}
				} else if ((vkChart.temp.startX - endX) / canvasWidth < -0.3 && (endTime - vkChart.temp.startTime) < 1000) {
					if (vkChart.temp.dataEndIndex > vkChart.temp.dataShowCount + xIncrement) {
						vkChart.temp.dataEndIndex = vkChart.temp.dataEndIndex - xIncrement;
						isPaint = true;
					} else {
						if (vkChart.temp.dataEndIndex > vkChart.temp.dataShowCount) {
							vkChart.temp.dataEndIndex = vkChart.temp.dataShowCount;
							isPaint = true;
						}
					}
					if (isPaint) {
						vkChart.repaint(vkChart.allData, VKChart.Type.kline);
					}
				} else if ((vkChart.temp.startY - endY) / canvasHeight < -0.35 && (endTime - vkChart.temp.startTime) < 1000) {
					if (Math.floor(vkChart.temp.dataShowCount * 1.5 - 1) <= vkChart.temp.dataEndIndex) {
						vkChart.temp.dataShowCount = Math.floor(vkChart.temp.dataShowCount * 1.5);
						vkChart.repaint(vkChart.allData, VKChart.Type.kline);
					}
				} else if ((vkChart.temp.startY - endY) / canvasHeight > 0.35 && (endTime - vkChart.temp.startTime) < 1000) {
					if (Math.floor(vkChart.temp.dataShowCount * 0.7) > 5) {
						vkChart.temp.dataShowCount = Math.floor(vkChart.temp.dataShowCount * 0.7);
						vkChart.repaint(vkChart.allData, VKChart.Type.kline);
					}
				}
		});
		vkChart.vkContent.bind('mousemove touchmove', function(e) {
			var pos = 0;
			if (e.type == "mousemove") {
				pos = e.clientX - vkChart.vkContent.offset().left;
			} else {
				pos = e.originalEvent.changedTouches[0].clientX - vkChart.vkContent.offset().left;
			}
			var index = Math.floor(pos / vkChart.options.region.width * vkChart.data.items.length);
			index = index >= vkChart.data.items.length ? vkChart.data.items.length - 1 : index;
			var x = index * vkChart.options.region.width / vkChart.data.items.length + vkChart.options.region.width / vkChart.data.items.length / 2;
			var y = vkChart.options.region.height - ((vkChart.data.items[index].close - vkChart.temp.minPrice) / 2) / vkChart.temp.maxDiff * vkChart.options.region.height + vkChart.options.region.y - 1;
			vkChart.paintTopText(index);
			vkChart.vkContent.find('#vkY').css('display', 'block');
			vkChart.vkContent.find('#vkX').css('display', 'block');
			vkChart.vkContent.find('#vkY').css('left', x);
			vkChart.vkContent.find('#vkX').css('top', y);
		});
		vkChart.vkContent.bind('touchend mouseleave', function(e) {
			vkChart.paintTopText();
			vkChart.vkContent.find('#vkY').css('display', 'none');
			vkChart.vkContent.find('#vkX').css('display', 'none');
		});
	}
}