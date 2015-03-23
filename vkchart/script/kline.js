//画横线或竖线
function line(ctx, x0, y0, x1, y1, color, width) {
	ctx.beginPath();
	ctx.strokeStyle = color;
	ctx.lineWidth = 1;
	ctx.moveTo(x0, y0);
	ctx.lineTo(x1, y1);
	ctx.stroke();
}

function getKlineTimeString(type, formatDate) {
	if (type == 'time') {
		return moment(formatDate).format("HH:mm");
	} else if (type == 'date') {
		return moment(formatDate).format("MM-HH");
	}
}

function KlineChart(contentId) {
	this.contentId = contentId;
	this.ctx;
	this.min = 0;
	this.maxDiff = 0;
	this.maxVolume = 0;
	this.dataEndIndex = 0;
	this.data = {
		items: []
	};
	this.allData;
	var vkContent = $('#vkContent');
	var contentWidth = vkContent.width();
	var contentHeight = vkContent.height();
	this.options = {
		//显示的数据条数
		dataShowCount: 15,
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
		priceLineColor: 'blue',
		avgPriceLineColor: 'red',
		middleLineColor: '#aaa',
		otherSplitLineColor: '#ddd',
		borderColor: 'gray',
		tipColor: 'seagreen',
		//水平线与垂直线的条数
		horizontalLineCount: 3,
		verticalLineCount: 1,
		maxDotsCount: 120,
		timeCount: 5,
		//y轴颜色
		fallColor: 'green',
		riseColor: 'red',
		normalColor: 'black',
		//左面的数字
		yScalerFont: '11px',
		yScalerFix: 2,
		volumeHeight: 60
	};
}
KlineChart.prototype = {
	paint: function(data) {
		this.init(data);
		this.paintChart();
		this.paintTopText();
		this.paintTime();
		this.paintVolume();
		this.bindEvent();
	},
	init: function(data) {
		var vkContent = $('#' + this.contentId);
		vkContent.html("");
		var str = "<div id='vkY' style='display:none;z-index:1000;position: absolute;width: 1px;height:" + (this.options.region.height + this.options.volumeHeight) + "px;top:" + this.options.region.y + "px;background:" + this.options.tipColor + ";'></div>";
		str = str + "<div id='vkX' style='display:none;z-index:1000;position: absolute;height: 1px;width:" + this.options.region.width + "px;left:" + this.options.region.x + "px;background:" + this.options.tipColor + ";'></div>";
		str = str + "<div id='vkTopText' style='position: absolute; left: 0px; top: 0px; height: 50px; width: 100%; font-size: 12px; line-height: 20px;'></div>";
		//画布的大小不能在CSS中定义
		str = str + "<canvas style='z-index: 999; position: absolute;' width='" + vkContent.width() + "' height='" + vkContent.height() + "'></canvas>";
		vkContent.html(str);
		var canvas = $("#" + this.contentId + " canvas")[0];
		this.ctx = canvas.getContext('2d');
		this.ctx.backgroundAlpha = 0;
		this.allData = data;
		if (this.dataEndIndex == 0) {
			this.dataEndIndex = data.items.length - 1;
		}
		this.data.items = data.items.slice(this.dataEndIndex +1- this.options.dataShowCount, this.dataEndIndex + 1);
	},
	//画量
	paintVolume: function() {
		var data = this.data;
		var ctx = this.ctx;
		var options = this.options;
		var maxVolume = this.maxVolume;
		$.each(data.items, function(i, item) {
			var w = options.region.width / data.items.length;
			var h = item.volume / maxVolume * options.volumeHeight;
			var x = w * i + w * 0.1;
			w = w * 0.8;
			var y = options.volumeHeight - h + options.region.y + options.region.height;
			var close = item.close;
			var preClose = (i == 0 ? item.close : data.items[i - 1].close);
			var isRise = close > preClose;
			var isFall = close < preClose;
			var color = isRise ? options.riseColor : (isFall ? options.fallColor : options.normalColor);
			ctx.fillStyle = color;
			ctx.fillRect(x, y, w, h);
		});
	},
	//画时间
	paintTime: function() {
		var data = this.data;
		var options = this.options;
		var times = new Array();
		var dataLength = data.items.length;
		var space = Math.round(dataLength / options.timeCount);
		for (var i = 0; i < options.timeCount; i++) {
			times.push(getKlineTimeString(this.options.dateTimeType, new Date(data.items[dataLength - 1 - i * space].date)));
			if (i == (options.timeCount - 1)) {
				if ((dataLength - 1 - i * space) > space * 0.6) {
					times.push(getKlineTimeString(this.options.dateTimeType, new Date(data.items[0].date)));
				}
			}
		}
		var str = "";
		times = times.reverse();
		var timesLengthHalf = parseInt(times.length / 2);
		$.each(times, function(i, time) {
			var oneWidth = Math.round(options.region.width / times.length);
			var x = oneWidth * i;
			var y = options.region.y + options.region.height + options.volumeHeight;
			var textAlign = i < timesLengthHalf ? "left" : (i == timesLengthHalf ? "center" : "right");
			str = str + "<div style='font-size: 12px;text-align:" + textAlign + ";width:" + oneWidth + "px;position: absolute;top:" + y + "px;left: " + x + "px;'>" + time + "</div>";
		});
		$('#' + this.contentId).append(str);
	},
	paintChart: function() {
		var data = this.data;
		var ctx = this.ctx;
		var options = this.options;
		//画边框
		ctx.beginPath();
		ctx.strokeStyle = options.borderColor;
		ctx.rect(options.region.x, options.region.y, options.region.width, options.region.height);
		ctx.stroke();
		//水平线
		var horizontalMiddleIndex = (options.horizontalLineCount + options.horizontalLineCount % 2) / 2;
		var horizontalSplitCount = options.horizontalLineCount + 1;
		for (var i = 1; i <= options.horizontalLineCount; i++) {
			var color = (i == horizontalMiddleIndex ? options.middleLineColor : options.otherSplitLineColor);
			var y = options.region.y + options.region.height * i / horizontalSplitCount;
			line(ctx, options.region.x, y, options.region.width, y, color);
		}
		//垂直线 
		var verticalSplitCount = options.verticalLineCount + 1;
		for (var i = 1; i <= options.verticalLineCount; i++) {
			var x = options.region.x + options.region.width * i / verticalSplitCount;
			line(ctx, x, options.region.y, x, options.region.y + options.region.height, options.otherSplitLineColor);
		}
		var preClose = data.items[0].close;
		var maxDiff = 0;
		var maxVolume = 0;
		$.each(data.items, function(i, item) {
			var highDiff = Math.abs(preClose - item.high);
			var lowDiff = Math.abs(preClose - item.low);
			var diff = Math.max(highDiff, lowDiff);
			maxDiff = Math.max(diff, maxDiff);
			maxVolume = Math.max(maxVolume, item.volume);
		});
		maxDiff = maxDiff * 1.2;
		this.maxDiff = maxDiff;
		this.maxVolume = maxVolume;
		var min = preClose - maxDiff;
		this.min = min;
		//价格线
		var xSpace = options.region.width / data.items.length;
		ctx.beginPath();
		ctx.strokeStyle = options.priceLineColor;
		ctx.lineWidth = 1;
		ctx.moveTo(options.region.x, options.region.height / 2 + options.region.y);
		var barWidth = options.region.width / data.items.length * 0.8;
		$.each(data.items, function(i, item) {
			var x = xSpace * i;
			var highY = options.region.height - ((item.high - min) / 2) / maxDiff * options.region.height + options.region.y;
			var lowY = options.region.height - ((item.low - min) / 2) / maxDiff * options.region.height + options.region.y;
			var openY = options.region.height - ((item.open - min) / 2) / maxDiff * options.region.height + options.region.y;
			var closeY = options.region.height - ((item.close - min) / 2) / maxDiff * options.region.height + options.region.y;
			var isRise = item.close > item.open;
			var isFall = item.close < item.open;
			var color = isRise ? options.riseColor : (isFall ? options.fallColor : options.normalColor);
			line(ctx, x + barWidth * 0.6, highY, x + barWidth * 0.6, lowY, color);
			ctx.fillStyle = color;
			if (isRise) {
				ctx.fillRect(x + barWidth * 0.1, closeY, barWidth, (openY - closeY) < 1 ? 1 : openY - closeY);
			} else {
				ctx.fillRect(x + barWidth * 0.1, openY, barWidth, (closeY - openY) < 1 ? 1 : closeY - openY);
			}
		});
		//y轴
		var scalersLeft = [];
		var scalersRight = [];
		var space = maxDiff * 2 / (options.horizontalLineCount + 1);
		for (var i = options.horizontalLineCount + 1; i >= 0; i--) {
			var val = min + i * space;
			scalersLeft.push(val.toFixed(2));
			var percent = (val - preClose) * 100 / preClose;
			scalersRight.push(percent.toFixed(2) + '%');
		}
		for (var i = 0; i < scalersLeft.length; i++) {
			var y = options.region.y + i * options.region.height / horizontalSplitCount;
			var color = i < horizontalMiddleIndex ? options.riseColor : (i == horizontalMiddleIndex ? options.normalColor : options.fallColor);
			var str = "<div style='position: absolute;left: " + options.region.x;
			str = str + "px; font-size:" + options.yScalerFont;
			str = str + ";top: " + (Math.round(y) - options.yScalerFix);
			str = str + "px;color:" + color;
			str = str + ";'>" + scalersLeft[i] + "</div>";
			$('#vkContent').append(str);
		}
		for (var i = 0; i < scalersRight.length; i++) {
			var y = options.region.y + i * options.region.height / horizontalSplitCount;
			var color = i < horizontalMiddleIndex ? options.riseColor : (i == horizontalMiddleIndex ? options.normalColor : options.fallColor);
			var str = "<div style='position: absolute;left: " + (options.region.width - 60);
			str = str + "px; font-size:" + options.yScalerFont;
			str = str + ";top: " + (Math.round(y) - options.yScalerFix);
			str = str + "px;color:" + color;
			str = str + ";width:60px;text-align:right;'>" + scalersRight[i] + "</div>";
			$('#vkContent').append(str);
		}
	},
	//画提示信息
	paintTopText: function(index) {
		var data = this.data;
		var options = this.options;
		if (typeof index == 'undefined' || index >= (data.items.length - 1)) {
			index = data.items.length - 1;
		}
		var close = data.items[index].close;
		var open = data.items[index].open;
		var time = getKlineTimeString(this.options.dateTimeType, new Date(data.items[index].date));
		var isRise = close > open;
		var isFall = close < open;
		var diff = (close - open).toFixed(2);
		var txtRiseFall = (isRise ? '↑' : (isFall ? '↓' : '')) + diff + '<br />(' + (diff * 100 / open).toFixed(2) + '%)';
		var str = "<div style='width:35%;float:left; padding-left: 5px;color:" + (isRise ? options.riseColor : (isFall ? options.fallColor : options.normalColor));
		str = str + ";'><span  style='font-size: 15px; line-height: 27px;'>" + txtRiseFall;
		str = str + "</span></div><div style='width:32%;float:left;'>最高：<span style='color:" + options.riseColor;
		str = str + ";'>" + data.items[index].high.toFixed(2);
		str = str + "</span><br />最低：<span style='color:" + options.fallColor;
		str = str + ";'>" + data.items[index].low.toFixed(2);
		str = str + "</span><br /><span>成交：" + data.items[index].volume.toFixed(2);
		str = str + "</span></div><div style='float:left;'>开盘：<span style='color:" + (isRise ? options.fallColor : (isFall ? options.riseColor : options.normalColor));
		str = str + "'>" + data.items[index].open.toFixed(2);
		str = str + "</span><br />收盘：<span style='color:" + (isRise ? options.riseColor : (isFall ? options.fallColor : options.normalColor));
		str = str + "'>" + data.items[index].close.toFixed(2);;
		str = str + "</span><br />时间：" + time;
		str = str + "</div>";
		$('#vkTopText').html(str);
	},
	bindEvent: function() {
		var data = this.data;
		var options = this.options;
		var min = this.min;
		var maxDiff = this.maxDiff;
		//that为当前klineChart
		var that = this;
		that.stratX = 0;
		$('#vkContent canvas').bind('touchstart', function(e) {
			e.preventDefault();
			that.stratX = e.originalEvent.changedTouches[0].clientX - $('#vkContent').offset().left;
		});
		$('#vkContent canvas').bind('touchend', function(e) {
			var endX = e.originalEvent.changedTouches[0].clientX - $('#vkContent').offset().left;
			canvasWidth = $('canvas').attr('width');
			if (Math.abs(that.stratX - endX) / canvasWidth > 0.4) {
				var isPaint = false;
				if (that.stratX > endX) {
					if (that.dataEndIndex < (that.allData.items.length - that.options.dataShowCount - 1)) {
						that.dataEndIndex = that.dataEndIndex + Math.round(that.options.dataShowCount * 2 / 3);
						isPaint = true;
					} else {
						if (that.dataEndIndex != (that.allData.items.length - 1)) {
							that.dataEndIndex = that.allData.items.length - 1;
							isPaint = true;
						}
					}
				} else {
					if (that.dataEndIndex > 2 * that.options.dataShowCount) {
						that.dataEndIndex = that.dataEndIndex - Math.round(that.options.dataShowCount * 2 / 3);
						isPaint = true;
					} else {
						if (that.dataEndIndex > that.options.dataShowCount) {
							that.dataEndIndex = that.options.dataShowCount;
							isPaint = true;
						}
					}
				}
				if (isPaint) {
					that.init(that.allData);
					that.paintChart();
					that.paintTopText();
					that.paintTime();
					that.paintVolume();
					that.bindEvent();
				}
			}

		});
		$('#vkContent canvas').bind('pinchopen', function(e) {
			if (Math.floor(that.options.dataShowCount * 0.7)>5) {
				that.dataEndIndex = 0;
				that.options.dataShowCount = Math.floor(that.options.dataShowCount * 0.7);
				that.init(that.allData);
				that.paintChart();
				that.paintTopText();
				that.paintTime();
				that.paintVolume();
				that.bindEvent();
			}
		});
		$('#vkContent canvas').bind('pinchclose', function(e) {
			if ( Math.floor(that.options.dataShowCount * 1.5)<that.allData.items.length) {
				that.dataEndIndex = 0;
				that.options.dataShowCount = Math.floor(that.options.dataShowCount * 1.5);
				that.init(that.allData);
				that.paintChart();
				that.paintTopText();
				that.paintTime();
				that.paintVolume();
				that.bindEvent();
			}
		});
		$('#vkContent canvas').bind('touchmove', function(e) {
			var index = Math.floor((e.originalEvent.changedTouches[0].clientX - $('#vkContent').offset().left) / (options.region.width / data.items.length));
			var x = index * options.region.width / data.items.length + options.region.width / data.items.length / 2;
			var y = options.region.height - ((data.items[index].close - min) / 2) / maxDiff * options.region.height + options.region.y - 1;
			that.paintTopText(index);
			$('#vkY').css('display', 'block');
			$('#vkX').css('display', 'block');
			$('#vkY').css('left', x);
			$('#vkX').css('top', y);
			var x = e.originalEvent.changedTouches[0].clientX - $('#vkContent').offset().left;
		});
		$('#vkContent canvas').bind('mousemove', function(e) {
			var index = Math.floor((e.clientX - $('#vkContent').offset().left) / (options.region.width / data.items.length));
			var x = index * options.region.width / data.items.length + options.region.width / data.items.length / 2;
			var y = options.region.height - ((data.items[index].close - min) / 2) / maxDiff * options.region.height + options.region.y - 1;
			that.paintTopText(index);
			$('#vkY').css('display', 'block');
			$('#vkX').css('display', 'block');
			$('#vkY').css('left', x);
			$('#vkX').css('top', y);
		});
		$('#vkContent canvas').bind('touchend mouseleave', function(e) {
			that.paintTopText();
			$('#vkY').css('display', 'none');
			$('#vkX').css('display', 'none');
		});
	}
}