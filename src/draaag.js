/**
 * config参数说明
 * dragItemClass {String}: 可拖拽item的类名，根据类名获取item，默认'drag-item'
 * chosenElClass {String}: 当前选中（拖拽中）item类名，默认'chosenElClass'
 * dragElClass {String}: 当前选中（拖拽中）浮层类名，默认'dragElClass'
 * dragElId {String}: 当前选中（拖拽中）浮层id，默认'dragElId'
 * handle {String}: 如果要使用handle，传入handle类名，默认为null（不使用handle）
 * enableDrag {Boolean}: 是否启用拖拽，默认true（启用）
 * pointerX {Number}: 拖拽浮层与鼠标位置在X轴上的偏差距离，默认0
 * pointerY {Number}: 拖拽浮层与鼠标位置在Y轴上的偏差距离，默认0
 * ifHide {Boolean}: 拖拽时是否隐藏原本item，默认false
 * minMove {Number}: 移动阈值，小于该值不执行移动的相关操作，默认3
 * onDrag {Function}: 回调函数，开始拖拽时执行
 * onMove {Function}: 回调函数，拖拽过程中执行
 * onDrop {Function}: 回调函数，拖拽释放时执行
 */

var Draaag = function(el, opts) {
    var init = function(el, opts) {
        if (!(el && el.nodeType === 1)) {
            console.log('drag target must be elements!');
            return;
        }
        this.conf = utils._extends({
            dragItemClass: 'drag-item',
            chosenElClass: 'chosenEl',
            dragElClass: 'dragElClass',
            dragElId: 'dragElId',
            handle: null,
            enableDrag: true,
            pointerX: 0,
            pointerY: 0,
            ifHide: false,
            minMove: 3,
            ifAnimated: false,
            aniDuration: 300,
            onDrag: function() {},
            onMove: function() {},
            onDrop: function() {}
        }, opts);
        this._initDoms(el);
        this._initState();
        this._initEvent();
    };

    /**
     * utils
     */
    var utils = {
        _id: function(id) {
            return document.getElementById(id);
        },
        _hasClass: function(element, name) {
            var re = new RegExp('(^| )' + name + '( |$)');
            return re.test(element.className);
        },
        _addClass: function(element, name) {
            if (!utils._hasClass(element, name)) {
                element.className += ' ' + name;
            }
        },
        _removeClass: function(element, name) {
            if (utils._hasClass(element, name)) {
                var reg = new RegExp('(\\s|^)' + name + '(\\s|$)');
                element.className = element.className.replace(reg, '');
            }
        },
        _class: function(searchClass, node, tag) {
            var classElements = [],
                els, elsLen, pattern;
            if (node == null) node = document.body;
            if (tag == null) tag = '*';
            if (node.getElementsByClassName) {
                return node.getElementsByClassName(searchClass);
            }
            els = node.getElementsByTagName(tag);
            elsLen = els.length;
            pattern = new RegExp('(^|\\s)' + searchClass + '(\\s|$)');
            for (var i = 0, j = 0; i < elsLen; i++) {
                if (pattern.test(els[i].className)) {
                    classElements[j] = els[i];
                    j++;
                }
            }
            return classElements;
        },
        _extends: function(destination, source) {
            for (var property in source) {
                destination[property] = source[property];
            }
            return destination;
        },
        _addEvent: function(el, type, handler) {
            if (el.addEventListener) {
                el.addEventListener(type, handler, false);
            } else if (el.attachEvent) {
                el.attachEvent('on' + type, handler);
            } else {
                el['on' + type] = handler;
            }
        },
        _removeEvent: function(el, type, handler) {
            if (el.removeEventListener) {
                el.removeEventListener(type, handler, 'false');
            } else if (el.detachEvent) {
                el.detachEvent(type, handler);
            } else {
                el['on' + type] = null;
            }
        },
        _getTarget: function(evt) {
            return evt.target || evt.srcElement;
        },
        _preventDefault: function(evt) {
            if (evt.preventDefault) {
                evt.preventDefault();
            } else {
                evt.returnValue = false;
            }
        },
        _getPos: function(el) {
            var pos = {
                x: 0,
                y: 0
            };

            while (el.offsetParent) {
                pos.y += el.offsetTop;
                pos.x += el.offsetLeft;
                el = el.offsetParent;
            }
            return pos;
        },
        _css: function(el, prop, val) {
            var style = el && el.style;

            if (style) {
                if (val === void 0) {
                    if (document.defaultView && document.defaultView.getComputedStyle) {
                        val = document.defaultView.getComputedStyle(el, '');
                    } else if (el.currentStyle) {
                        val = el.currentStyle;
                    }

                    return prop === void 0 ? val : val[prop];
                } else {
                    if (!(prop in style)) {
                        prop = '-webkit-' + prop;
                    }
                    style[prop] = val + (typeof val === 'string' ? '' : 'px');
                }
            }
        },
        _getMargin: function(el) {
            var style = utils._css(el);
            return {
                top: style.marginTop,
                right: style.marginRight,
                bottom: style.marginBottom,
                left: style.marginLeft
            };
        },
        _insertAfter: function(targetEl, relatedEl) {
            var parentEl = targetEl.parentNode;

            if (parentEl && parentEl.lastchild === relatedEl) {
                parentEl.appendChild(targetEl);
            } else {
                parentEl.insertBefore(targetEl, relatedEl.nextSibling);
            }
        },
        _disableSelect: function(target) {
            if (typeof target.onselectstart != 'undefined') {
                target.onselectstart = function() {
                    return false;
                };
            }
            //for firefox
            else if (typeof target.style.MozUserSelect != 'undefined') {
                target.style.MozUserSelect = 'none';
            }
        },
        _enableSelect: function(target) {
            if (target.onselectstart) {
                target.onselectstart = null;
            } else if (target.style.MozUserSelect) {
                target.style.MozUserSelect = '';
            }
        },
        _disableDefaultDrag: function(target) {
            var snapshot = target.draggable;

            target.draggable = false;
            target.ondragstart = function() {
                return false;
            };

            return snapshot;
        },
        _enableDefaultDrag: function(target) {
            //恢复默认值
            if (target.supportDrag) {
                target.draggable = target.supportDrag;
            }
            target.supportDrag = null;
            if (target.ondragstart) {
                target.ondragstart = null;
            }

        },
        _supportCSSProp: function(prop) {
            var style = document.documentElement.style,
                capLetter = prop.substr(0, 1).toUpperCase(),
                rest = prop.substr(1),
                prefix = ['webkit', 'Moz', 'ms', 'O'],
                tmpProp;

            if (prop in style) {
                return prop;
            }

            for (var i = 0, len = prefix.length; i < len; i++) {
                tmpProp = prefix[i] + capLetter + rest;
                if (tmpProp in style) {
                    return tmpProp;
                }
            }

            return false;
        }
    };

    /**
     * drag function
     */
    init.prototype = {
        //获取拖拽列表中子项总数
        _getItemCount: function(el) {
            var count = 0,
                child;
            if (el.childElementCount) {
                count = el.childElementCount;
            } else if (el.children) {
                count = el.children.length;
            } else {
                child = el.firstChild;
                while (child) {
                    if (child.nodeType == 1) {
                        count++;
                    }
                    child = child.nextSibling;
                }
            }

            return count;
        },
        //获取item中心点位置
        _getCenterPos: function(ele) {
            var itemPos = utils._getPos(ele),
                centerTop = itemPos.y + ele.offsetHeight / 2,
                centerLeft = itemPos.x + ele.offsetWidth / 2;
            return {
                top: centerTop,
                left: centerLeft
            };
        },
        //获取离pointer最近的item
        _getNearest: function(pointer) {
            var d = this.doms,
                s = this.state,
                tmpItemEl,
                tmpItemPos,
                x = pointer.pageX || pointer.clientX + document.body.scrollLeft + document.documentElement.scrollLeft,
                y = pointer.pageY || pointer.clientY + document.body.scrollTop + document.documentElement.scrollTop,
                dirX, dirY,
                distance,
                minDistance,
                nearestItemEl,
                nearestItemPos,
                nearestIndex;

            // 遍历itemlist
            for (var i = 0, len = s.itemCount; i < len; i++) {
                tmpItemEl = d.itemList[i];
                tmpItemPos = this._getCenterPos(tmpItemEl);
                //判断距离
                distance = Math.sqrt(Math.pow(y - tmpItemPos.top, 2) + Math.pow(x - tmpItemPos.left, 2));
                if (!minDistance || (distance < minDistance)) {
                    minDistance = distance;
                    nearestItemEl = tmpItemEl;
                    nearestIndex = i;
                }
            }
            //判断最近item相对于pointer的方位
            //dirX : 1 --- 在pointer右边   -1 --- 在pointer左边;
            //dirY : 1 --- 在pointer下边   -1 --- 在pointer上边;
            nearestItemPos = this._getCenterPos(nearestItemEl);
            dirX = nearestItemPos.left > x ? 1 : -1;
            dirY = nearestItemPos.top > y ? 1 : -1;

            return {
                index: nearestIndex,
                dirX: dirX,
                dirY: dirY
            };
        },
        /**
         * 初始化节点
         * this.doms:
         * rootEl : 列表容器
         * itemList : 可拖拽item集合
         * dragEl : 拖拽浮层
         * chosenEl : 选中item
         * handleEl : handle元素
         * mouseDownEl : 按下拖拽的最初target，记录是否默认支持拖拽supportDrag
         */
        _initDoms: function(el) {
            var c = this.conf,
                items;

            items = utils._class(c.dragItemClass, el);
            this.doms = {
                rootEl: el,
                itemList: items,
                dragEl: null,
                chosenEl: null,
                handleEl: null,
                mouseDownEl: null
            };
        },
        /**
         * 初始化状态
         * this.state:
         * direction : 列表方向（水平列表或垂直列表）
         * itemCount : 可拖拽item数目
         * ifDragging : 是否处在拖拽状态
         * innerX : pointer位于拖拽项中的水平位置
         * innerY : pointer位于拖拽项中的垂直位置
         * startX : 开始拖拽时pointer水平位置
         * startY : 开始拖拽时pointer垂直位置
         * curX : 拖拽过程中pointer的水平位置
         * curY : 拖拽过程中pointer的垂直位置
         * dropX : 拖拽释放时pointer的水平位置
         * dropY : 拖拽释放时pointer的垂直位置
         */
        _initState: function() {
            var d = this.doms,
                css,
                itemCount,
                direction = null;

            //vertical or horizontal
            if (d.itemList[0]) {
                css = utils._css(d.itemList[0]);
                if (css.float === 'left' || css.display === 'inline-block' || css.display === 'inline') {
                    direction = 'horizontal';
                } else {
                    direction = 'vertical';
                }
            }
            itemCount = d.itemList.length;
            this.state = {
                direction: direction,
                itemCount: itemCount,
                ifDragging: false,
                innerX: null,
                innerY: null,
                startX: null,
                startY: null,
                curX: null,
                curY: null,
                dropX: null,
                dropY: null,
            };
        },
        _initEvent: function() {
            var that = this,
                c = this.conf,
                d = this.doms,
                s = this.state,
                startEvtType,
                moveEvtType,
                endEvtType;

            //判断事件类型
            startEvtType = ('ontouchstart' in window) ? 'touchstart' : 'mousedown';
            moveEvtType = ('ontouchmove' in window) ? 'touchmove' : 'mousemove';
            endEvtType = ('ontouchend' in window) ? 'touchend' : 'mouseup';

            //bind events
            utils._addEvent(d.rootEl, startEvtType, function(e) {
                var target = utils._getTarget(e);
                //target不是拖拽项或不允许拖拽时跳过
                if (target === d.rootEl || !c.enableDrag) {
                    return;
                }
                that._onDragStart(e);
            });
            utils._addEvent(document.documentElement, moveEvtType, function(e) {
                if (!(c.enableDrag && s.ifDragging)) {
                    return;
                }
                that._onDragMove(e);
            });
            utils._addEvent(document.documentElement, endEvtType, function(e) {
                if (!(c.enableDrag && s.ifDragging)) {
                    return;
                }
                that._onDragEnd(e);
            });
        },
        //创建浮层用于拖拽
        _appendDragEl: function(pointer) {
            var c = this.conf,
                d = this.doms,
                s = this.state,
                margin,
                oriTop,
                oriLeft;

            if (!d.dragEl) {
                d.dragEl = d.chosenEl.cloneNode(true);
                //设置dragEl初始属性
                utils._removeClass(d.dragEl, c.chosenElClass);
                utils._addClass(d.dragEl, c.dragElClass);
                utils._css(d.dragEl, 'position', 'fixed');
                utils._css(d.dragEl, 'z-index', '999');
                utils._css(d.dragEl, 'cursor', 'move');

                // 清除原来元素设好的margin，浮层不需要带着margin的位移
                utils._css(d.dragEl, 'margin', '0');


                //fixed相对于浏览器窗口进行定位
                //补上margin造成的位置差
                margin = utils._getMargin(d.chosenEl);
                //@TODO: margin设为auto的话就会出现问题
                oriTop = pointer.clientY - c.pointerY - s.innerY - parseInt(margin.top, 10);
                oriLeft = pointer.clientX - c.pointerX - s.innerX - parseInt(margin.left, 10);
                utils._css(d.dragEl, 'top', oriTop);
                utils._css(d.dragEl, 'left', oriLeft);

                d.rootEl.appendChild(d.dragEl);

                //ie:允许视窗外拖拽
                if (d.dragEl.setCapture) {
                    d.dragEl.setCapture();
                }
            }
        },
        _dragOverAnimate: function(targetEl, curEl) {
            var c = this.conf,
                d = this.doms,
                s = this.state,
                targetPos = utils._getPos(targetEl),
                curPos = utils._getPos(curEl),
                deltaX, deltaY,
                transformProp,
                transitionProp;

            //检测是否支持动画
            transformProp = utils._supportCSSProp('transform');
            transitionProp = utils._supportCSSProp('transition');
            if (!transformProp || !transitionProp) {
                return;
            }

            //要移动的距离
            deltaX = targetPos.x - curPos.x;
            deltaY = targetPos.y - curPos.y;

            utils._css(curEl, transitionProp, 'none');
            utils._css(curEl, transformProp, 'translate3d(' + deltaX + 'px,' + deltaY + 'px,0)');

            //force repaint
            curEl.offsetWidth;

            //滑动回新插入的位置
            utils._css(curEl, transitionProp, 'all ' + c.aniDuration + 'ms');
            utils._css(curEl, transformProp, 'translate3d(0,0,0)');

            if(curEl.aniTimeout){
                clearTimeout(curEl.aniTimeout);
                curEl.aniTimeout = null;
            }

            curEl.aniTimeout = setTimeout(function() {
                utils._css(curEl, transitionProp, '');
                utils._css(curEl, transformProp, '');
                curEl.aniTimeout = null;
            }, c.aniDuration);
        },
        //开始拖拽
        _onDragStart: function(evt) {
            var c = this.conf,
                d = this.doms,
                s = this.state,
                target = utils._getTarget(evt),
                touch = evt.touches ? evt.touches[0] : null,
                pointer = touch || evt,
                elePos,
                pageX,
                pageY;

            d.mouseDownEl = target;
            // 禁用默认拖拽API
            utils._disableDefaultDrag(d.mouseDownEl);

            //如果设置了handle
            if (c.handle) {
                while (!utils._hasClass(target, c.handle) && target.parentNode) {
                    target = target.parentNode;
                    if (target === d.rootEl) {
                        return;
                    }
                }
                d.handleEl = target;
            }


            //判断target:若拖拽的为item子元素
            while (!utils._hasClass(target, c.dragItemClass) && target.parentNode) {
                target = target.parentNode;
                if (target === d.rootEl) {
                    return;
                }
            }

            s.ifDragging = true;
            //禁用selection
            utils._disableSelect(document.body);

            //设置选中item属性
            d.chosenEl = target;
            utils._addClass(d.chosenEl, c.chosenElClass);

            //记录开始拖拽时鼠标位置
            s.startX = pointer.clientX;
            s.startY = pointer.clientY;

            //记录鼠标相对元素左上角位置
            elePos = utils._getPos(d.chosenEl);
            pageX = pointer.pageX || pointer.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
            pageY = pointer.pageY || pointer.clientY + document.body.scrollTop + document.documentElement.scrollTop;
            s.innerX = pageX - elePos.x;
            s.innerY = pageY - elePos.y;

            //callback
            c.onDrag && c.onDrag.call(this);
        },
        //拖拽移动
        _onDragMove: function(evt) {
            var c = this.conf,
                d = this.doms,
                s = this.state,
                moveX, moveY, //拖拽元素要移动的值
                touch = evt.touches ? evt.touches[0] : null,
                pointer = touch || evt,
                x = pointer.clientX,
                y = pointer.clientY,
                nearest,
                nearestEl,
                margin;

            utils._preventDefault(evt);

            //移动小于阈值，不进行操作
            if (Math.abs(x - s.startX) < c.minMove && Math.abs(y - s.startY) < c.minMove) {
                return;
            }
            //插入拖拽浮层并隐藏选中item（如果需要）
            this._appendDragEl(pointer);
            if (c.ifHide) {
                utils._css(d.chosenEl, 'visibility', 'hidden');
            }

            //记录鼠标位置
            s.curX = x;
            s.curY = y;

            //处理dragEl跟踪鼠标
            margin = utils._getMargin(d.chosenEl);
            moveX = x - c.pointerX - s.innerX;
            moveY = y - c.pointerY - s.innerY;
            utils._css(d.dragEl, 'top', moveY);
            utils._css(d.dragEl, 'left', moveX);

            //如果pointer没有移出当前选中项范围，跳过
            if (y > d.chosenEl.offsetTop && y < d.chosenEl.offsetTop + d.chosenEl.offsetHeight && x > d.chosenEl.offsetLeft && x < d.chosenEl.offsetLeft + d.chosenEl.offsetWidth) {
                return;
            }

            //取得最近的item
            nearest = this._getNearest(pointer);
            nearestEl = d.itemList[nearest.index];

            //判断方向，插入选中item
            if (s.direction === 'vertical') {
                if (nearest.dirY > 0) {
                    utils._insertAfter(d.chosenEl, nearestEl);
                } else {
                    d.rootEl.insertBefore(d.chosenEl, nearestEl);
                }
            }

            if (s.direction === 'horizontal') {
                if (nearest.dirX > 0) {
                    utils._insertAfter(d.chosenEl, nearestEl);
                } else {
                    d.rootEl.insertBefore(d.chosenEl, nearestEl);
                }
            }

            //  dragover 动画
            if (c.ifAnimated) {
                this._dragOverAnimate(d.chosenEl, nearestEl);
            }
            //callback
            c.onMove && c.onMove.call(this);

        },
        //释放拖拽
        _onDragEnd: function(evt) {
            var c = this.conf,
                d = this.doms,
                s = this.state,
                touch = evt.touches ? evt.touches[0] : null,
                pointer = touch || evt,
                x = pointer.clientX,
                y = pointer.clientY;

            s.ifDragging = false;
            s.dropX = x;
            s.dropY = y;

            //ie: 视窗外拖拽
            try {
                if (d.dragEl.releaseCapture) {
                    d.dragEl.releaseCapture();
                }
            } catch (err) {}

            //恢复初始状态
            if (c.ifHide) {
                utils._css(d.chosenEl, 'visibility', '');
            }
            utils._removeClass(d.chosenEl, c.chosenElClass);
            if (d.dragEl) {
                utils._removeClass(d.dragEl, c.dragElClass);
                d.rootEl.removeChild(d.dragEl);
                d.dragEl = null;
            }

            //恢复selection
            utils._enableSelect(document.body);

            //恢复默认拖拽API
            utils._enableDefaultDrag(d.mouseDownEl);

            //callback
            c.onDrop && c.onDrop.call(this);
        },

        /**
         * export
         */
        //启用
        enableDrag: function() {
            var c = this.conf;
            if (!c) {
                return;
            }
            c.enableDrag = true;
        },
        //禁用
        disableDrag: function() {
            var c = this.conf;
            if (!c) {
                return;
            }
            c.enableDrag = false;
        },
        //更新
        update: function() {
            var d = this.doms,
                c = this.conf,
                s = this.state,
                items = utils._class(c.dragItemClass, el),
                css;

            d.itemList = items;
            s.itemCount = d.itemList.length;

            if (d.itemList[0]) {
                css = utils._css(d.itemList[0]);
                if (css.float === 'left' || css.display === 'inline-block' || css.display === 'inline') {
                    s.direction = 'horizontal';
                } else {
                    s.direction = 'vertical';
                }
            }

        }
    };

    return init;
}();
