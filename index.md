#dragPlugin 控件说明
***
##Features
* PC端（ie8+）、移动端适用
* 支持水平列表和竖直列表
* 拖拽项可以为任意类型元素
* 支持动态列表
* 支持dragover动画（ie10+）

##Usage
html:
    
	<ul id="js_dragList">
	    <li class="drag-item">item1</li>
	    <li class="drag-item">item2</li>
	    <li class="drag-item">item3</li>
	<ul>
js:

	var el= document.getElementById('js_dragList');
	var drag = new Drag(el);

拖拽项不仅限于`<li>`，可以是任何元素，使用时需要对要拖拽的item赋类名（可在options中配置），默认'drag-item'。传入首参数为拖拽项父容器。

##Options
控件配置参数及默认值如下：

	var drag = new Drag(list, {
    	dragItemClass: 'drag-item',    //要拖拽的item的类名
    	chosenElClass: 'chosenEl',    //当前选中item的类名
    	dragElClass: 'dragElClass',    //拖拽浮层类名
    	dragElId: 'dragElId',    //拖拽浮层id
		handle: null,	//如果要启用handle，传入handle类名
    	enableDrag: true,    //是否启用拖拽
    	pointerX: 0,    //px，拖拽浮层和鼠标的水平位置差
    	pointerY: 0,    //px，拖拽浮层和鼠标的垂直位置差
    	ifHide: false,    //拖拽时是否隐藏选中item
    	minMove: 3,    //px，拖拽时的最小位移阈值，鼠标移动小于该阈值时不作move相关操作
    	ifAnimated: false,	//是否启用dragover动画
		aniDuration: 300,	//ms,dragover动画持续时长

    	onDrag: function(){},    //回调函数，拖拽开始时执行
    	onMove: function(){},    //回调函数，拖拽过程中执行
    	onDrop: function(){},    //回调函数，拖拽释放时执行
	});


注意：ie9以下（包括ie9）不支持dragover动画。

自定义配置  
[demo1](demo/demo1.html)

css：

	.ghost-item{opacity:0.5;}

js：

	var listH = document.getElementById('js_listH'),
    	listV = document.getElementById('js_listV'),
    	dragH = new Drag(listH),
    	dragV = new Drag(listV,{
        	    /*自定义拖拽item类名（默认：drag-item）*/
        	    dragItemClass: 'draggable',

        	    /*隐藏选中项*/
        	    ifHide: true,
	
        	    /*自定义拖拽浮层类名（默认：dragElClass)*/
        	    dragElClass: 'ghost-item',
				
				/*启用拖拽手柄，类名为drag-handle
            	注意：handle必须是拖拽item的子元素（或其本身）*/
            	handle: 'drag-handle',

				/*启用dragover动画*/
				ifAnimated: true
    	});


###callback


* **onDrag: function(){}**  
回调函数，拖拽开始时执行  
eg：
  
			var drag = new Drag(el, {
    			onDrag: function(){  
        		/* this.state.startX: 拖拽开始时pointer水平坐标
        	    	this.state.startY: 拖拽开始时pointer垂直坐标
				*/  
        		var x = drag.state.startX,
           			y = drag.state.startY;

        		console.log('start position: (' + x + ',' + y +')');
    			}
			});



* **onMove: function(){}**  
回调函数，拖拽过程中执行  
eg：  

		var drag = new Drag(el, {
    		onMove: function(){
        	/* this.state.curX: 拖拽过程中pointer水平坐标
            	this.state.curY: 拖拽过程中pointer垂直坐标*/
        	var x = drag.state.curX,
            	y = drag.state.curY;

        	console.log('current position: (' + x + ',' + y +')');
    		}
		});


* **onDrop: function(){}**  
回调函数，拖拽释放时执行  
eg：  

		var drag = new Drag(el, {
    		onDrop: function(){
        	/* this.state.dropX: 拖拽释放时pointer水平坐标
            	this.state.dropY: 拖拽释放时pointer垂直坐标*/
        	var x = drag.state.dropX,
            	y = drag.state.dropY;

        	console.log('drop position: (' + x + ',' + y +')');
    		}
		});


回调函数调用demo： 
[demo2](demo/demo2.html)

###state 状态参数
记录控件相关参数，可供回调函数调用（eg.`drag.state.direction`）：  

* **direction {String}**  
列表方向，有两种值:
 + vertical：垂直列表，direction值为'vertical'；
 + horizontal：当item项应用了`float: left`，`display: inline-block`，`display: inline`其中一种样式时，列表判断为水平，direction值为'horizontal'。

* **itemCount {Number}**  
可拖拽item数目

* **ifDragging {Boolean}**  
是否处在拖拽状态。拖拽开始时值为`true`，释放时值变为`false`。

* **innerX / innerY {Number}**  
拖拽开始时，pointer位于item内部的水平/垂直位置。

* **startX / startY {Number}**  
拖拽开始时，pointer的位于视窗的水平/垂直坐标。

* **curX / curY {Number}**  
拖拽过程中，pointer位于视窗的水平/垂直坐标。

* **dropX / dropY {Number}**  
拖拽释放时，pointer位于视窗的水平/垂直坐标。

##Method
 

* **enableDrag()**  
启用拖拽  
`drag.enableDrag();`

* **disableDrag()**  
禁用拖拽  
`drag.disableDrag();`

* **update()**  
更新拖拽列表（更新item数目和列表方向）  
`drag.update();`


API调用demo：[demo3](demo/demo3.html)  
