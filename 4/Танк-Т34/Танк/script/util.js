/* 
    автор(с): Кудуштеев Алексей
              JavaScript ES6 HTML5
*/

const FONT_FACE = "px Georgia,Verdana,Arial,Helvetica,Sans-serif,Tahoma";

const obj_at = (id) => {
	return (document.getElementById) ? document.getElementById(id) : document.all[id];
}

const splay = (s) => {
	try {
		s.play();
	} catch(e){
	}
}

const sstop = (s) => {
	try {
		s.pause();
		s.currentTime = 0;
	} catch(e){
	}
}

const splay_loop = (s) => {
	if(typeof(s.loop) == "undefined"){
		try {
			s.addEventListener("ended", () => { 
				this.currentTime = 0;
				this.play();
				} , false);
		} catch(e){}
	} else
		s.loop = true;
	splay(s);
}

const is_play = (s) => {
	try {
		if(s.currentTime > 0)
			return true;
	} catch(e){}
	return false;
}

const svolume = (s,n) => {
	if(typeof(s.volume) != "undefined"){
		try {
			s.volume = n;
		} catch(e){}
	}
}


var g_inf = { 
	paint:null,
	update:null,
	kdown:null,
	umouse:null,
	dmouse:null,
	mmouse:null,
	kup:null,
	frame:null,
	prev:0,
	obj:null,
	fps:0,
	cnt:0,
	delay:10,
	delta:0.0,
	last:0
};

//заливка холста тайлом
function fillCanvas(hdc, px, py, width, height, img, ox, oy, w, h){
	let mx = width  % w;
	let my = height % h;

	width  += px;
	height += py;
	let cx = width;
	let cy = height;

	if(mx > 0)
		cx -= w;
	if(my > 0)
		cy -= h;

	let x, y = py;
	for(; y < cy; y += h){
		x = px;
		for(; x < cx; x += w)
			hdc.drawImage(img, ox, oy, w, h, x, y, w, h);

		if(x < width)
			hdc.drawImage(img, ox, oy, mx, h, x, y, mx, h);
	}

	if(y < height){
		for(x = px; x < cx; x += w)
			hdc.drawImage(img, ox, oy, w, my, x, y, w, my);

		if(x < width)
			hdc.drawImage(img, ox, oy, mx, my, x, y, mx, my);
	}
}


//пересечение прямоугольника с прямоугольником
const isRectToRect = (x1, y1, w1, h1, x2, y2, w2, h2) => {
	const r1 = x1 + w1;
	const b1 = y1 + h1;
	const r2 = x2 + w2;
	const b2 = y2 + h2;
	return (x1 < r2) && (x2 < r1) && (y1 < b2) && (y2 < b1);
}


function load_images(imgs, files, _load){
	if(imgs.length != files.length)
		throw new Error("Разные размеры массивов!");

	for(let i = 0; i < imgs.length; ++i){
		imgs[i].src = files[i];
		imgs[i].addEventListener("load", _load);
	}
}

function load_sounds(snds, files, _load){
	if(snds.length != files.length)
		throw new Error("Разные размеры массивов!");

	for(let i = 0; i < snds.length; ++i){
		snds[i] = new Audio(files[i]);
		snds[i].addEventListener("loadeddata", _load, false);
	}
}


//матрица 8-бит(фиксированная без динамического роста)
class matrix {
	constructor(_rows, _cols){
		this.irows = _rows;
		this.icols = _cols;
		this.arr   = new Uint8Array(_rows * _cols);
		this.fill  = 0;
	}

	setAt(r, c, v){
		this.arr[r * this.icols + c] = v;
	}

	getAt(r, c){
		return this.arr[r * this.icols + c];
	}

	get data(){
		return this.arr;
	}

	set fill(v){
		for(let i = 0; i < this.arr.length; ++i)
			this.arr[i] = v;
	}

	get rows(){
		return this.irows;
	}

	get cols(){
		return this.icols;
	}

	set rows(n){
		if(this.arr.length >= (n * this.icol))
			this.irows = n;
	}

	set cols(n){
		if(this.arr.length >= (n * this.irow))
			this.icols = n;
	}

	setSize(_rows, _cols){
		if(this.arr.length >= (_rows * _cols)){
			this.irows = _rows;
			this.icols = _cols;
		}
	}

	copy_transponse(mat){
		this.fill  = 0;
		this.irows = mat.cols;
		this.icols = mat.rows;
		for(let i = 0; i < mat.rows; ++i){
			for(let j = 0; j < mat.cols; ++j)
				this.setAt(j, i, mat.getAt(i, j));
		}
	}

	transponse(){
		if(this.irows != this.icols)
			return;
		let t;
		for(let i = 0; i < this.irows; ++i){
			for(let j = i; j < this.icols; ++j){
				t = this.getAt(i, j);
				this.setAt(i, j, this.getAt(j, i));
				this.setAt(j, i, t);
			}
		}	
	}

	copy(mat){
		this.irows = mat.rows;
		this.icols = mat.cols;
		for(let i = 0; i < mat.arr.length; ++i)
			this.arr[i] = mat.arr[i];
	}

	reverse_horz(){
		let v, i  = 0;
		for(let j = this.icols - 1; i < j; ++i, --j){
			for(let r = 0; r < this.irows; ++r){
				v = this.getAt(r, i);
				this.setAt(r, i, this.getAt(r, j));
				this.setAt(r, j, v);
			}
		}
	}

	reverse_vert(){
		let v, i  = 0;
		for(let j = this.irows - 1; i < j; ++i, --j){
			for(let c = 0; c < this.icols; ++c){
				v = this.getAt(i, c);
				this.setAt(i, c, this.getAt(j, c));
				this.setAt(j, c, v);
			}
		}
	}

	compare(mat){
		if((mat.cols != this.icols) || (mat.rows != this.irows))
			return false;

		for(let i = 0; i < this.arr.length; ++i){
			if(this.arr[i] != mat.arr[i])
				return false;
		}
		return true;
	}
}


//холст-изображение
class cimage {
	constructor(filename, cx, cy, fun){
		this.load    = false;
		this.can     = null;
		this.img     = new Image();
		this.img.src = filename;
		this.img.addEventListener("load", () => {
			this.can = document.createElement("canvas");
			this.can.width  = cx;
			this.can.height = cy;

			let hdc = this.can.getContext("2d", {alpha:true});
			hdc.drawImage(this.img, 0, 0, parseInt(this.img.width), parseInt(this.img.height), 0, 0, cx, cy);

			this.img.src = "";
			delete this.img;
			this.img = null;
			hdc = null;
			this.load = true;
			fun();
		});
	}

	get width(){
		return this.can.width;
	}

	get height(){
		return this.can.height;
	}

	get handle(){
		return this.can;
	}

	get complete(){
		return this.load;
	}
}


//массив массивов
class array {
	constructor(...args){
		this.arr  = new Array(args.length);
		this.cnt = 0;
		for(let i = 0; i < args.length; ++i)
			this.arr[i] = args[i];
	}

	add(...args){
		const n = Math.min(this.arr.length, args.length);
		for(let i = 0; i < n; ++i)
			this.arr[i][this.cnt] = args[i];
		++this.cnt;
	}

	at(i, j){
		return this.arr[i][j];
	}

	put(i, j, v){
		this.arr[i][j] = v;
	}

	get size(){
		return this.arr.length;
	}

	get count(){
		return this.cnt;
	}

	get max_size(){
		return this.arr[0].length;
	}

	erase(inx){
		if((inx >= 0) && (inx < this.cnt)){
			--this.cnt;
			for(let j = 0; j < this.arr.length; ++j){
				for(let i = inx; i < this.cnt; ++i)
					this.arr[j][i] = this.arr[j][i + 1];
			}
		}
	}

	reset(){
		this.cnt = 0;
	}
}


//массив
function carray(n) {
	this.px  = new Float32Array(n);
	this.py  = new Float32Array(n);
	this.cnt = 0;

	this.add = (x, y) => {
		if(this.cnt < this.px.length){
			this.px[this.cnt] = x;
			this.py[this.cnt] = y;
			++this.cnt;
		}
	}

	this.removeAt = (inx) => {
		if((inx >= 0) && (inx < this.cnt)){
			--this.cnt;
			for(let i = inx; i < this.cnt; ++i){
				this.px[i] = this.px[i + 1];
				this.py[i] = this.py[i + 1];
			}
		}
	}

	this.setValue = (i, x, y) => {
		this.px[i] = x;
		this.py[i] = y;
	}

	this.reset = () => {
		this.cnt = 0;
	}

	this.max_size = () => {
		return this.px.length;
	}

	this.size = () => {
		return this.cnt;
	}

	this.getX = (i) => {
		return this.px[i];
	}

	this.getY = (i) => {
		return this.py[i];
	}

	this.setX = (i, v) => {
		this.px[i] = v;
	}

	this.setY = (i, v) => {
		this.py[i] = v;
	}

	this.free = () => {
		if(this.px != null){
			delete this.px;
			this.px = null;
		}

		if(this.py != null){
			delete this.py;
			this.py = null;
		}
		this.cnt = 0;
	}
}


//флаги для управления воспроизведением спрайта
const g_state = {
	stop:0,
	play:1,
	loop:2,
	back:3,
	loopback:4,
	nextback:5,
	nextback_loop:6
}

//спрайт
function sprite() {
	this.x     = 0;
	this.y     = 0;
	this.inc   = 0.0;
	this.px    = 0;
	this.py    = 0;
	this.sizey = 0;
	this.sizex = 0;
	this.cx    = 0;
	this.cy    = 0;
	this.state = g_state.stop;

	this.create  = (rows, cols, cx, cy) => {
		this.sizey = rows * cy;
		this.sizex = cols * cx;
		this.cx    = cx;
		this.cy    = cy;
	}

	this.play = (mode) => {
		this.inc   = 0.0;
		this.px    = 0;
		this.py    = 0;
		this.state = mode;

		switch(mode){
		case g_state.back:
		case g_state.loopback:
			this.px = this.sizex - this.cx;
			this.py = this.sizey - this.cy;
			break;
		}
	}

	this.stop = () => {
		this.state = g_state.stop;
	}

	this.draw = (hdc, img, x, y) => {
		hdc.drawImage(img, this.px, this.py, this.cx, this.cy, x, y, this.cx, this.cy);
	}

	this.draw_off = (hdc, img, x, y, ox, oy) => {
		hdc.drawImage(img, ox + this.px, oy + this.py, this.cx, this.cy, x, y, this.cx, this.cy);		
	}

	this.draw_s = (hdc, img, x, y, w, h) => {
		hdc.drawImage(img, this.px, this.py, this.cx, this.cy, x, y, w, h);
	}

	this.draw_s_off = (hdc, img, x, y, w, h, ox, oy) => {
		hdc.drawImage(img, ox + this.px, oy + this.py, this.cx, this.cy, x, y, w, h);		
	}

	this.updateFrame = (ft, vel) => {
		let st = this.state & 0xFF;

		switch(st){
		case g_state.play:
		case g_state.loop:
			this.inc += ft * vel;
			if(this.inc < 1.0)
				break;
			this.inc = 0.0;

			this.px += this.cx;
			if(this.px >= this.sizex){
				this.px = 0;
				this.py += this.cy;
				if(this.py >= this.sizey){
					this.py = 0;
					if(st == g_state.play)
						this.stop();
				}
			}
			break;
		case g_state.back:
		case g_state.loopback:
			this.inc += ft * vel;
			if(this.inc < 1.0)
				break;
			this.inc = 0.0;

			this.px -= this.cx;
			if(this.px < 0){
				this.px = this.sizex - this.cx;
				this.py -= this.cy;
				if(this.py < 0){
					this.py = this.sizey - this.cy;
					if(st == g_state.back)
						this.stop();
				}
			}
			break;
		case g_state.nextback:
		case g_state.nextback_loop:
			this.inc += ft * vel;
			if(this.inc < 1.0)
				break;
			this.inc = 0.0;

			if((this.state & 0x800) == 0){
				this.px += this.cx;
				if(this.px >= this.sizex){
					this.px = 0;
					this.py += this.cy;
					if(this.py >= this.sizey){
						this.px     = this.sizex - (this.cx << 1);
						this.py     = this.sizey - this.cy;
						this.state |= 0x800;
					}
				}
			} else {
				this.px -= this.cx;
				if(this.px < 0){
					this.px = this.sizex - this.cx;
					this.py -= this.cy;
					if(this.py < 0){
						this.py = this.sizey - this.cy;
						if(st == g_state.nextback){
							this.px = this.py = 0;
							this.stop();
						} else {
							this.px     = this.cx;
							this.py     = 0;
							this.state &= ~0x800;
						}
					}
				}
			}
			break;
		}
	}

	this.isPlay = () => {
		return ((this.state & 0xFF) != g_state.stop);
	}

	this.isStop = () => {
		return ((this.state & 0xFF) == g_state.stop);
	}
}


//класс холст-игры
class canvas {
	//создание
	static create(obj){
		g_inf.obj = obj;	
	}

	//добавление обработчиков
	static set eventPaint(paint){
		g_inf.paint = paint;
	}

	static set eventUpdate(update){
		g_inf.update = update;
	}

	static set eventClick(click){
		g_inf.obj.onclick = click;
	}

	static set eventMouseDown(down){
		g_inf.obj.onmousedown = down;
	}

	static set eventMouseUp(up){
		g_inf.obj.onmouseup = up;
	}

	static set eventMouseMove(move){
		g_inf.obj.onmousemove = move;
	}

	static eventKeyDownUp(down, up){
		g_inf.kdown = down;
		g_inf.kup   = up;
 		if(typeof(window.onkeydown) != "undefined")
			window.onkeydown  = canvas.key_down;
		else if(typeof(window.onkeypress) != "undefined")
			window.onkeypress = canvas.key_down;
		window.onkeyup = canvas.key_up;
	}

	static key_down(e){
		let key = window.event || e;
		g_inf.kdown(key.keyCode);
	}

	static key_up(e){
		let key = window.event || e;
		g_inf.kup(key.keyCode);
	}

	//запуск
	static run(){
		g_inf.fps   = g_inf.cnt  = 0;
		g_inf.prev  = g_inf.last = performance.now();
		canvas.render(g_inf.prev);
	}

	//остановка
	static stop(){
		if(g_inf.frame != null)
			cancelAnimationFrame(g_inf.frame);
		g_inf.frame = null;
		g_inf.last  = 0;
	}

	static isStop(){
		return (g_inf.last == 0);
	}

	static set delay(msec){
		g_inf.delay = msec;
	}

	static get delay(){
		return g_inf.delay;
	}

	static get FPS(){
		return g_inf.fps;
	}

	static get elapsed(){
		return g_inf.delta;
	}

	static get tick(){
		return performance.now();
	}

	//перерисовка
	static render(time){
		const cur = time - g_inf.prev;
		g_inf.prev  = time;
		g_inf.delta = cur * 0.1;

		if(cur > g_inf.delay){
			g_inf.update(time, g_inf.delta);
			g_inf.paint();
		}

		++g_inf.cnt;
		if((time - g_inf.last) >= 1000){
			g_inf.last = time;
			g_inf.fps  = g_inf.cnt;
			g_inf.cnt  = 0;
		}
		g_inf.frame = requestAnimationFrame(canvas.render);
	}
}


function getLevel(){
	if(typeof(localStorage) != "undefined"){
		try {
			const cur = localStorage.getItem("level");
			if(cur == null)
				return 0;
			else 
				return parseInt(cur);
		} catch(e){
		}
	} else {
		try {
			let s = document.cookie.match(/(level\=)\d+/);
			if((s == null) || (s.length == 0))
				return 0;
			return parseInt(s[0].substring(6, s[0].length));
		} catch(e){}
	}
	return 0;
}


function putLevel(level){
	if(typeof(localStorage) != "undefined")
		localStorage.setItem("level", level);
	else {
		if(typeof(document.cookie) != "undefined")
			document.cookie = "level=" + level + ";" + "max-age=" + (60*60*24*365);
	}
}
