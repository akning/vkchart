//画横线或竖线
function line(ctx, x0, y0, x1, y1, color, width) {
	ctx.beginPath();
	ctx.strokeStyle = color;
	ctx.lineWidth = 1;
	ctx.moveTo(x0, y0);
	ctx.lineTo(x1, y1);
	ctx.stroke();
}

function MinsChart(contentId) {
	this.contentId = contentId;
	this.ctx;
	this.data;
	this.maxCloseDiff = 0;
	this.maxVolume = 0;
	var vkContent = $('#vkContent');
	var contentWidth = vkContent.width();
	var contentHeight = vkContent.height();
	this.options = {
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
MinsChart.prototype = {
	paint: function(data) {
		this.data = data;
		this.init();
		this.paintChart();
		this.paintTopText();
		this.paintTime();
		// this.fillBottomText(data);
		this.paintVolume();
	},
	init: function() {
		var vkContent = $('#' + this.contentId);
		var str = "<div id='vkY' style='display:none;z-index:1000;position: absolute;width: 1px;height:" + (this.options.region.height + this.options.volumeHeight) + "px;top:" + this.options.region.y + "px;background:" + this.options.tipColor + ";'></div>";
		str = str + "<div id='vkX' style='display:none;z-index:1000;position: absolute;height: 1px;width:" + this.options.region.width + "px;left:" + this.options.region.x + "px;background:" + this.options.tipColor + ";'></div>";
		str = str + "<div id='vkTopText' style='position: absolute; left: 0px; top: 0px; height: 50px; width: 100%; font-size: 12px; line-height: 25px;'></div>";
		//画布的大小不能在CSS中定义
		str = str + "<canvas style='z-index: 999; position: absolute;' width='" + vkContent.width() + "' height='" + vkContent.height() + "'></canvas>";
		vkContent.html(str);
		var canvas = $("#" + this.contentId + " canvas")[0];
		this.ctx = canvas.getContext('2d');
		this.ctx.backgroundAlpha = 0;
	},
	paintVolume: function() {
		var data = this.data;
		var ctx = this.ctx;
		var options = this.options;
		var maxVolume = this.maxVolume;
		$.each(data.items, function(i, item) {
			var w = options.region.width / data.items.length;
			var h = item.volume / maxVolume * options.volumeHeight;
			var x = w * i+w*0.15;
			w=w*0.7;
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
			times.push(moment(new Date(data.items[dataLength - 1 - i * space].date)).format("HH:mm"));
			if (i == (options.timeCount - 1)) {
				if ((dataLength - 1 - i * space) > space * 0.6) {
					times.push(moment(new Date(data.items[0].date)).format("HH:mm"));
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
		var maxCloseDiff = 0;
		var maxVolume = 0;
		$.each(data.items, function(i, item) {
			var diff = Math.abs(preClose - item.close);
			maxCloseDiff = Math.max(diff, maxCloseDiff);
			maxVolume = Math.max(maxVolume, item.volume);
		});
		this.maxCloseDiff = maxCloseDiff;
		this.maxVolume = maxVolume;
		var min = preClose - maxCloseDiff;
		//价格线
		var xSpace = options.region.width / data.items.length;
		ctx.beginPath();
		ctx.strokeStyle = options.priceLineColor;
		ctx.lineWidth = 1;
		ctx.moveTo(options.region.x, options.region.height / 2 + options.region.y);
		$.each(data.items, function(i, item) {
			var x = xSpace * i;
			var y = options.region.height - ((item.close - min) / 2) / maxCloseDiff * options.region.height + options.region.y;
			ctx.lineTo(x, y);
		});
		ctx.stroke();
		//y轴
		var scalersLeft = [];
		var scalersRight = [];
		var space = maxCloseDiff * 2 / (options.horizontalLineCount + 1);
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
		var that = this;
		$('#vkContent canvas').bind('touchstart', function(e) {
			e.preventDefault();
		})
		$('#vkContent canvas').bind('touchmove', function(e) {
			var x = e.originalEvent.changedTouches[0].clientX - $('#vkContent').offset().left;
			var index = Math.round(x / options.region.width * data.items.length);
			var y = options.region.height - ((data.items[index].close - min) / 2) / maxCloseDiff * options.region.height + options.region.y;
			that.paintTopText(index);
			$('#vkY').css('display', 'block');
			$('#vkX').css('display', 'block');
			$('#vkY').css('left', x);
			$('#vkX').css('top', y);
		});
		$('#vkContent canvas').bind('mousemove', function(e) {
			var x = e.clientX - $('#vkContent').offset().left;
			var index = Math.round(x / options.region.width * data.items.length);
			var y = options.region.height - ((data.items[index].close - min) / 2) / maxCloseDiff * options.region.height + options.region.y;
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
	},
	//画提示信息
	paintTopText: function(index) {
		var data = this.data;
		var options = this.options;
		if (typeof index == 'undefined' || index >= (data.items.length - 1)) {
			index = data.items.length - 1;
		}
		var close = data.items[index].close;
		var time = moment(new Date(data.items[index].date)).format("HH:mm");
		var preClose = (index == 0 ? data.items[index].close : data.items[index - 1].close);
		var isRise = close > preClose;
		var isFall = close < preClose;
		var diff = (close - preClose).toFixed(2);
		var txtRiseFall = (isRise ? '↑' : (isFall ? '↓' : '')) + diff + ('(') + (diff * 100 / preClose).toFixed(2) + '%)';
		var str = "<div style='width:40%;float:left; padding-left: 5px;color:" + (isRise ? options.riseColor : (isFall ? options.fallColor : options.normalColor));
		str = str + ";'><span  style='font-size: 25px; line-height: 30px;'>" + close;
		str = str + "</span><br />" + txtRiseFall;
		str = str + "</div><div style='width:30%;float:left;'>最高：<span style='color:" + options.riseColor;
		str = str + ";'>" + data.items[index].high;
		str = str + "</span><br />最低：<span style='color:" + options.fallColor;
		str = str + ";'>" + data.items[index].low;
		str = str + "</span></div><div style='float:left;'>成交：" + data.items[index].volume.toFixed(2);
		str = str + "<br />时间：" + time;
		str = str + "</div>";
		$('#vkTopText').html(str);
	}
}