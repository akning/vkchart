# **VKChart**

一款基于html5轻量级的行情图工具，适配移动设响应式布局，包含分时图与K线图等

## Documents

 1. 使用

		//画分时图
		var chart1 = new VKChart('vkContent1');
		var data = getQuote();
		chart1.paint(data,VKChart.Type.mins);
		//画K线图
		var chart2 = new VKChart('vkContent2');
		var data = getQuote();
		chart2.paint(data,VKChart.Type.kline);

 2. 依赖

		<script type="text/javascript" src="script/jquery-1.9.1.min.js"></script>
		<script type="text/javascript" src="script/hidpi-canvas.js" ></script>
		<script type="text/javascript" src="script/moment.js"></script>
		<script type="text/javascript" src="data.js"></script>
		<script type="text/javascript" src="script/vkchart.js" ></script>
