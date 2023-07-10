/* 
    автор(с): Кудуштеев Алексей
              JavaScript ES6 HTML5
*/
const MAX_SIZE  = 16;
let      BONUS_N   = 5; 
const USER_LIFE = 10;
const MAX_TANKS = 8;
const ROWS  = 24;
const COLS  = 30;
const LEFT  = 1;
const RIGHT = 2;
const UP    = 4;
const DOWN  = 8;
const STOP  = 9;
const g_tiles = { size:32, mid:16 };
const g_angle = [180,0,270,90];
const BTYPE = {LIFE:0,LAZER:1,SPEED:2};

var BSIZE     = 0;
var BMSIZE  = 0;

var SFIRE    = 0;
var WIDTH   = 0;
var HEIGHT = 0;
var SIZE      = 32;
var MSIZE   = 16;
var MUL      = 0;

var g_ibacks  = null;
var g_iboom = null;
var g_ibonus = null;
var g_itanks  = new Array(3);
var g_iguns   = new Array(3);
var g_sounds = new Array(7);
var g_bonus = null;
var g_iblocks = null;

var g_back   = { obj:null, hdc:null };
var g_fore   = { obj:null, hdc:null };
var g_buffer = { obj:null, hdc:null };

var g_user    = null;
var g_tanks   = [];
var g_bullets = new Array(3);
var g_field   = null;
var g_booms   = [];
var g_crush   = null;
var g_fires   = null;
let  g_nbonus = 0;


const g_tank = { none:0, down:1, up:2, left:3, right:4 };

const to_angle = (r) => r * (Math.PI / 180.0);

const bullet_erase = (p) =>  {
	for(let i = 0; i < g_bullets.length; ++i)
		g_bullets[i].removeAt(p);
};

const bullet_reset = () =>  {
	for(let i = 0; i < g_bullets.length; ++i)
		g_bullets[i].reset();
};

//проверка
const is_field = (x, y) => {
	let c  = Math.floor(x * MUL);
	if(c < 0)
		c = 0;
	else if(c >= COLS)
		c = COLS - 1;

	let r = Math.floor(y * MUL);
	if(r < 0)
		r = 0;
	else if(r >= ROWS)
		r = ROWS - 1;
	return (r << 16) | (c << 8) | g_field.getAt(r, c);
};


const add_crush = (r, c, id) => {
	const p = (SIZE - MSIZE)/2;
	g_crush.add(c * SIZE + p, r * SIZE + p, 0, id & 0xFF);
};


const add_boom = (x, y) => {
	let p = new sprite();
	p.create(1, 9, g_iboom.width / 9, g_iboom.height);
	p.play(g_state.play);
	p.x = x;
	p.y = y;
	g_booms.push(p);
	splay(g_sounds[3]);
};


const add_fires = (id, n) => {
	if((id & 0xFF) <= n){
		const r = (id >> 16) & 0xFF;
		const c = (id >> 8) & 0xFF;
		g_field.setAt(r, c, 0);
		g_fore.hdc.clearRect(c * SIZE, r * SIZE, SIZE, SIZE);
		add_crush(r, c, id);

		const m =  (SIZE - SFIRE)/2;
		g_fires.add(c * SIZE + m, r * SIZE + m, 1); 
		splay(g_sounds[5]);
	}
};


const block_uron = (id) => {
	if((id & 0xFF) <= 9){
		const r = (id >> 16) & 0xFF;
		const c = (id >> 8) & 0xFF;
		g_field.setAt(r, c, 0);
		g_fore.hdc.clearRect(c * SIZE, r * SIZE, SIZE, SIZE);
		add_crush(r, c, id);
		splay(g_sounds[2]);
	}
};


const g_move = [
	(t) => { // down
		if(t.is_down(8)){
			t.angle = to_angle(180);
			t.rot    = t.angle;
			t.type  = g_tank.down;
			return true;
		}
		return false;
	},

	(t) => { //up
		if(t.is_up(8)) {
			t.angle = 0;
			t.rot    = t.angle;
			t.type  = g_tank.up;
			return true;
		}
		return false;
	},

	(t) => { //left
		if(t.is_left(8)) {
			t.angle = to_angle(270);
			t.rot    = t.angle;
			t.type  = g_tank.left;
			return true;
		}
		return false;
	},

	(t) => { //right
		if(t.is_right(8)){
			t.angle = to_angle(90);
			t.rot    = t.angle;
			t.type  = g_tank.right;
			return true;
		} 
		return false;
	}
];


//вражеский танк
class tankX {
	constructor(){
		this.x   = 0;
		this.y   = 0;
		this.rot = 0;
		this.angle = 0;
		this.state = {fire:false, rick:false, inc:0};
		this.pos = {x:0,y:0};
		this.bx  = 0;
		this.by  = 0;
		this.dir  = {x:0, y:0};
		this.type  = 0;
		this.life = 0;
		this.delay = 0;
		this.ftime = 0;
		this.model = 1;
		this.velocity = 0.2;
	}

	initialize(x,y, model){
		const type = (1 + Math.random() * 4) >>> 0;
		this.x = x;
		this.y = y;
		this.velocity = model * 0.1 + 0.2;
		this.model = model;
		this.rot = to_angle(g_angle[type - 1]);
		this.type  = type;
		this.life = 4 + model*2;
		this.ftime = 0;
		this.angle = this.rot;
		this.state.fire = false;
		this.state.rick = false;
		this.state.inc = 0;
	}

	updateMove(delta, time){
		if(g_user.dir == STOP){
			this.state.fire = false;
			this.bx = this.by = -1;
			return;
		}

		const dist = SIZE * (8 + this.model * 2);
		const dir  = SIZE + SIZE;
		const h = Math.abs(g_user.x - this.x);
		const w = Math.abs(g_user.y - this.y);

		if((w <= dist) &&  (h <= dist))
			this.dirgun(time);
		else if((h <= dir) || (w <= dir))
			this.dirgun(time);

		if(this.type != g_tank.none){
			if(w <= dir){ //смена позиции на пользователя
				if(this.x < g_user.x)
					g_move[g_tank.right - 1](this);
				else
					g_move[g_tank.left - 1](this);
			} else if(h <= dir){
				if(this.y < g_user.y)
					g_move[g_tank.down - 1](this);
				else
					g_move[g_tank.up - 1](this);
			}
		} else {
			if(this.delay < time){
				this.type = (1 + Math.random() * 4) >>> 0;
				this.rot = g_angle[this.type - 1];
			}
		}


		const p = delta * this.velocity;
		switch(this.type){
		case g_tank.up:
			{
				if(this.is_up(p))
					this.y -= p;
				else
					this.find();
			}
			break;
		case g_tank.down:
			{
				if(this.is_down(p))
					this.y += p;
				else
					this.find();
			}
			break;
		case g_tank.right:
			{
				if(this.is_right(p))
					this.x += p;
				else
					this.find();
			}
			break;
		case g_tank.left:
			{
				if(this.is_left(p))
					this.x -= p;
				else
					this.find();
			}
			break;
		}

		if(this.state.fire){
			const t =  delta * 0.9;
			this.bx += this.dir.x * t;
			this.by += this.dir.y * t;

			const id = is_field(this.bx, this.by);
			if(id & 0xFF){
				this.cancel_fire(time);
				add_fires(id, 9);
			} else if((this.bx <= 0) || (this.by <= 0) || (this.bx >= WIDTH) || (this.by >= HEIGHT))
				this.cancel_fire(time);
		}

		if(this.state.rick){
			this.state.inc += delta * 0.3;
			if(this.state.inc > SIZE)
				this.state.rick = false;
		}
	}

	draw(hdc){
		hdc.setTransform(1,0,0,1, this.x + g_user.mcx, this.y + g_user.mcy);
		hdc.rotate(this.rot);
		hdc.drawImage(g_itanks[this.model].handle, -g_user.mcx, -g_user.mcy);

		hdc.setTransform(1,0,0,1, this.x + g_user.mcx, this.y + g_user.mcy);
		hdc.rotate(this.angle);
		hdc.drawImage(g_iguns[this.model].handle, -g_user.mcx, -g_user.mcy);
		hdc.setTransform(1,0,0,1,0,0);

		if(this.state.fire){
			hdc.strokeStyle = "#ff0000";
			hdc.beginPath();
			hdc.moveTo(this.bx, this.by);
			hdc.lineTo(this.bx + this.dir.x * MSIZE, this.by + this.dir.y * MSIZE);
			hdc.stroke();
		}

		if(this.state.rick){
			hdc.fillStyle = (g_user.lazer) ? "#00ff00" : "#ffff00";
			const r = Math.PI / 180;
			for(let i = 0; i <= 360; i += 30){
				const p = i * r;
				const x = this.pos.x + this.state.inc * Math.sin(p);
				const y = this.pos.y + this.state.inc * Math.cos(p);
				hdc.fillRect(x - 1, y - 1, 2, 2);
			}
		}
	}

	get X() {
		return (this.type >= g_tank.left) ? (this.x + g_user.mcx - g_user.mcy) : this.x;
	}

	get Y() {
		return  (this.type >= g_tank.left) ? (this.y + g_user.mcy - g_user.mcx) : this.y;
	}

	get Width(){
		return (this.type >= g_tank.left) ? g_user.height : g_user.width;
	}

	get Height(){
		return (this.type >= g_tank.left) ? g_user.width : g_user.height;
	}


	is_collide(user, time){
		if(isRectToRect(this.X, this.Y, this.Width, this.Height, user.rect.x, user.rect.y, user.rect.w, user.rect.h)){
			this.delay = time + 1000 + this.model * 200;
			this.type = g_tank.none;
			return true;
		}
		return false;
	}

	is_bullet(x, y){
		if(this.life <= 0)
			return false;

		const px = this.X;
		const py = this.Y;
		if((x > px) && (x < (px + this.Width)) && (y > py) && (y < (py + this.Height))){
			this.life -= g_user.lazer;
			if(--this.life > 0){
				this.state.rick = true;
				this.state.inc = 0;
				this.pos.x = x;
				this.pos.y = y;
			} else {
				this.type = g_tank.none;
				this.cancel_fire(0);
			}
			return true;
		}
		return false;
	}

	cancel_fire(time){
		this.state.fire = false;
		this.state.bx = -1;
		this.state.by = -1;
		this.ftime = time + 400 + this.model * 100;
	}

	get Life(){
		return this.life;
	}

	get is_fire(){
		return this.state.fire;
	}

	dirgun(time){
		this.angle = -Math.PI/2 + Math.atan2((this.y + g_user.mcy) - (g_user.y + g_user.mcy), (this.x + g_user.mcx)  - (g_user.x + g_user.mcx));

		if(!this.state.fire && (this.ftime < time)){
			this.state.fire = true;
			const x = (this.x + g_user.mcx) + g_user.mcy * Math.sin(this.angle);
			const y = (this.y + g_user.mcy) - g_user.mcy * Math.cos(this.angle);

			let dx = (g_user.x + g_user.mcx) - x;
			let dy = (g_user.y + g_user.mcy) - y;
			const len = Math.sqrt(dx*dx + dy*dy);
			if(len == 0)
				len = 1;
			this.dir.x = dx / len;
			this.dir.y = dy / len;
			this.bx = x;
			this.by = y;
			splay(g_sounds[0]);
		}
	}

	is_left(d){
		const x = this.x + g_user.mcx - g_user.mcy - d;
		const y = this.y + g_user.mcy - g_user.mcx;

		let ok = true;
		let id = 0;
		if((id = is_field(x, y))  & 0xFF)
			ok = false;
		else if(x < 0)
			ok = false;
		else if((id = is_field(x, y + g_user.width)) & 0xFF)
			ok = false;
		else if((id = is_field(x, y + g_user.mcx)) & 0xFF)
			ok = false;

		const t = id & 0xFF;
		if((t >= 1) && (t <= 9)){
			if((Math.random() * 2) | 0){
				block_uron(id);
				ok = true;
			}
		}
		return ok;
	}

	is_right(d){
		const x = this.x + g_user.mcx + g_user.mcy + d;
		const y = this.y + g_user.mcy - g_user.mcx;

		let ok = true;
		let id = 0;
		if((id = is_field(x, y)) & 0xFF) 
			ok = false;
		else if(x >= WIDTH)
			ok = false;
		else if((id = is_field(x, y + g_user.width)) & 0xFF)
			ok = false;
		else if((id = is_field(x, y + g_user.mcx)) & 0xFF)
			ok = false;

		const t = id & 0xFF;
		if((t >= 1) && (t <= 9)){
			if((Math.random() * 3)  > 1){
				block_uron(id);
				ok = true;
			}
		}
		return ok;
	}

	is_up(d){
		let ok = true;
		let id = 0;
		if((id = is_field(this.x, this.y)) & 0xFF)
			ok = false;
		else if(this.y < 0)
			ok = false;
		else if((id = is_field(this.x + g_user.width, this.y)) & 0xFF)
			ok = false;
		else if((id = is_field(this.x + g_user.mcx, this.y)) & 0xFF)
			ok = false;

		const t = id & 0xFF;
		if((t >= 1) && (t <= 9)){
			if((Math.random() * 2) | 0){
				block_uron(id);
				ok = true;
			}
		}
		return ok;
	}

	is_down(d){
		const y = this.y + g_user.height;
		let id = 0;
		let ok = true;
		if((id = is_field(this.x, y)) & 0xFF)
			ok = false;
		else if((this.y + g_user.height) >= HEIGHT)
			ok = false;
		else if((id = is_field(this.x + g_user.width, y)) & 0xFF)
			ok = false;
		else if((id = is_field(this.x + g_user.mcx, y)) & 0xFF)
			ok = false;

		const t = id & 0xFF;
		if((t >= 1) && (t <= 9)){
			if((Math.random() * 3)  > 1){
				block_uron(id);
				ok = true;
			}
		}
		return ok;
	}

	//поиск нового пути
	find(){
		const i = (Math.random() * 4) >>> 0;
		if(!g_move[i](this)){
			if(i < 2){
				for(let j = 0; j < 4; ++j){
					if(g_move[j](this))
						break;
				}
			} else {
				for(let j = 3; j >= 0; --j){
					if(g_move[j](this))
						break;
				}
			}
		}
	}
}


//Мой танк
class user_tank {
	constructor(){
		this.x = 0;
		this.y = 0;
		this.width = 0;
		this.height= 0;
		this.dir = 0;
		this.mcx = 0;
		this.mcy = 0;
		this.angle = 0;
		this.dx = 0;
		this.dy = 0;
		this.rot = 0;
		this.move = 0;
		this.life = 0;
		this.time = 0;
		this.inc = 0;
		this.crush = false;
		this.lazer = false;
		this.velocity = 0;
		this.fpos = {x:0,y:0};
		this.rect = {x:0,y:0,w:0,h:0};
	}

	initialize(x, y){
		this.x = x;
		this.y = y;
		this.dx = 0;
		this.dy = 0;
		this.life = USER_LIFE;
		this.move = 0;
		this.angle = 0;
		this.dir = 0;
		this.rot = 0;
		this.time = 0;
		this.inc = 0;
		this.crush = false;
		this.lazer = false;
		this.velocity = 0.36;
		this.rect.x = x;
		this.rect.y = y;
		this.rect.w = this.width;
		this.rect.h = this.height;
		g_nbonus = 0;
		BONUS_N = 3 + Math.floor(Math.random() * 3);
		bullet_reset();	
	}

	//обновление
	updateFrame(delta, pixel, time){
		if(this.dir == STOP)
			return;

		const p = delta * this.velocity * pixel;
		this.x += p * this.dx;
		this.y += p * this.dy;

		let x, y, id, ok, w;
		const t = delta * 1.2 * pixel;
		for(let i = 0; i < g_bullets[0].size(); ++i){
			x = g_bullets[0].getX(i);
			y = g_bullets[0].getY(i);

			x += t * g_bullets[1].getX(i);
			y += t * g_bullets[1].getY(i);

			id = is_field(x, y);
			w = id & 0xFF;
			ok = (w != 0);
			if(ok){
				if(w <= 9){
					add_fires(id, w);
					if(++g_nbonus >= BONUS_N){
						g_nbonus = 0;
						if(g_bonus.count < g_bonus.max_size)
							g_bonus.add(((id >>> 8) & 0xFF) * SIZE, ((id >>> 16) & 0xFF) * SIZE, (Math.random() * 3) | 0);
					}
				} else if(this.lazer)
					add_fires(id, 18);
			} else {
				let next = false;
				for(let j = 0; j < g_tanks.length; ++j){
					if(g_tanks[j].is_bullet(x, y)){//пересечение снаряда и танка
						let tank = g_tanks[j];
						if(tank.Life <= 0){
							add_boom(tank.X + (tank.Width - BMSIZE)/2, tank.Y + (tank.Height - BMSIZE)/2);
							tank = null;
							delete g_tanks[j];
							g_tanks.splice(j, 1);
						} else
							splay(g_sounds[4]);
						bullet_erase(i--);
						next = true;
						break;
					}
				}

				if(next)
					continue;
			}

			g_bullets[0].setValue(i, x, y);

			if(ok || ((Math.abs(x - g_bullets[2].getX(i)) < 8) && (Math.abs(y - g_bullets[2].getY(i)) < 8))){
				bullet_erase(i--);
				if(!ok){
					g_fires.add(x, y, 0);
					splay(g_sounds[5]);
				}
			}
		}

		//проверка на столкновение
		if(this.dir != 0){
			this.rect.x = this.X;
			this.rect.y = this.Y;
			this.rect.w = this.Width;
			this.rect.h = this.Height;

			const id = this.move_user();
			if(id & 0xFF){
				block_uron(id);
				if(g_nbonus < BONUS_N)
					++g_nbonus;
			} else {
				for(let i = 0; i < g_bonus.count; ++i){
					if(isRectToRect(g_bonus.at(0,i), g_bonus.at(1,i), SIZE, SIZE, this.rect.x, this.rect.y, this.rect.w, this.rect.h)){
						switch(g_bonus.at(2,i)){
						case BTYPE.LIFE:
							this.life = Math.min(this.life + 1, USER_LIFE);
							break;
						case BTYPE.LAZER:
							this.lazer = true;
							bullet_reset();
							break;
						case BTYPE.SPEED:
							this.velocity = 0.45;
							break;
						}
						g_bonus.erase(i--);
					}
				}
			}
		}

		//пересечение со снарядами вражеcких танков
		for(let i = 0; i < g_tanks.length; ++i){
			let tank = g_tanks[i];
			if(tank.is_fire){
				if((tank.bx > this.rect.x) && (tank.bx < (this.rect.x + this.rect.w)) && (tank.by > this.rect.y) && (tank.by < (this.rect.y + this.rect.h))){
					tank.cancel_fire(time);
					if(--this.life > 0){
						this.fpos.x = tank.bx;
						this.fpos.y = tank.by;
						this.crush = true;
						this.inc = SIZE;
						splay(g_sounds[6]);
					} else {
						this.dir = STOP;
						this.dx = this.dy = 0;
						this.crush = false;
						bullet_reset();
						add_boom(this.X + (this.Width - BMSIZE)/2, this.Y + (this.Height - BMSIZE)/2);
						break;
					}
				}
			}

			if(tank.is_collide(this, time)){
				this.x -= p * this.dx * 0.8;
				this.y -= p * this.dy * 0.8;
			}
		}

		if(this.crush){
			this.inc -= p;
			if(this.inc < 0)
				this.crush = false;
		}
	}


	draw(hdc){
		if(this.dir == STOP){
			let t = hdc.save();			
			hdc.shadowBlur  = Math.ceil(SIZE * 0.5);
			hdc.shadowColor = "#000000";
			hdc.translate(this.x + this.mcx, this.y + this.mcy);
			hdc.rotate(this.rot);
			hdc.drawImage(g_itanks[2].handle, -this.mcx, -this.mcy);
			hdc.restore(t);
		} else {
			hdc.setTransform(1,0,0,1, this.x + this.mcx, this.y + this.mcy);
			hdc.rotate(this.rot);
			hdc.drawImage(g_itanks[2].handle, -this.mcx, -this.mcy);

			hdc.setTransform(1,0,0,1, this.x + this.mcx, this.y + this.mcy);
			hdc.rotate(this.angle);
			hdc.drawImage(g_iguns[2].handle, -this.mcx, -this.mcy);
			hdc.setTransform(1,0,0,1,0,0);
		}

		//вывод пуль
		const num = g_bullets[0].size();
		if(num > 0){
			hdc.strokeStyle = (this.lazer) ? "#00ff00"  : "#ffff00";
			for(let i = 0; i < num; ++i){
				const x = g_bullets[0].getX(i);
				const y = g_bullets[0].getY(i);
				hdc.beginPath();
				hdc.moveTo(x, y); 
				hdc.lineTo(x + g_bullets[1].getX(i) * MSIZE, y + g_bullets[1].getY(i) * MSIZE);
				hdc.stroke();
			}
		}

		//поражение
		if(this.crush){
			hdc.fillStyle = "rgba(50,0,0,0.2)";
			for(let i = 0; i < 4; ++i){
				const d = Math.random() * SIZE;
				const t  = d * 0.5;
				const m = this.inc * 0.5;
				hdc.fillRect(this.fpos.x - m - t, this.fpos.y - m - t, this.inc + d, this.inc + d);
			}
		}
	}

	//нажатие мыши
	mouse_down(px, py){
		if(this.crush || (canvas.tick < this.time) || (this.dir == STOP))
			return;

		const x1 = this.x + this.mcx - this.mcy;
		const x2 = this.x + this.mcx + this.mcy;
		if((px > x1) && (px < x2) && (py > this.y) && (py < (this.y + this.height)))
			return;

		this.angle = Math.PI * 0.5 + Math.atan2(py - (this.y + this.mcx), px - (this.x + this.mcy));
		const x = (this.x + this.mcx) + this.mcy * Math.sin(this.angle);
		const y = (this.y + this.mcy) -  this.mcy * Math.cos(this.angle);

		let dx = px - x;
		let dy = py - y;
		const len = Math.sqrt(dx*dx + dy*dy);
		if(len == 0)
			len = 1;
		dx /= len;
		dy /= len;

		g_bullets[0].add(x, y);
		g_bullets[1].add(dx, dy);
		g_bullets[2].add(px, py);
		this.time = canvas.tick + 300;
		splay(g_sounds[1]);
	}

	//движение мыши
	mouse_move(x, y){
		if(this.dir != STOP)
			this.angle = Math.PI * 0.5 + Math.atan2(y - (this.y + this.mcx), x - (this.x + this.mcy));
	}

	//управление клавиатурой
	key_down(k){
		if(this.dir == STOP)
			return;

		switch(k){
		case 38: //вверх
		case 87:
		case 119:
		case 1094:
		case 1062:
			if((this.dir != UP) && this.is_rotate(UP)){
				this.dir = UP;
				this.dx = 0;
				this.dy = -1;
				this.rot = 0;
				this.move |= UP;
			}
			break;
		case 37: //влево
		case 65:
		case 97:
		case 1092:
		case 1060:
			if((this.dir != LEFT) && this.is_rotate(LEFT)){
				this.dir  = LEFT;
				this.dx  = -1;
				this.dy = 0;
				this.rot = to_angle(270);
				this.move |= LEFT;
			}
			break;
		case 39: //вправо
		case 68:
		case 100:
		case 1074:
		case 1042:
			if((this.dir != RIGHT) && this.is_rotate(RIGHT)){
				this.dir = RIGHT;
				this.dx = 1;
				this.dy = 0;
				this.rot =  to_angle(90);
				this.move |= RIGHT;
			}
			break;
		case 40: //вниз
		case 83:
		case 1099:
		case 1067:
		case 115:
			if((this.dir != DOWN) &&  this.is_rotate(DOWN)){
				this.dir = DOWN;
				this.dx = 0;
				this.dy = 1;
				this.rot = to_angle(180);
				this.move |= DOWN;
			}
			break;
		}
	}

	//отжатие клавиши мыши
	key_up(k){
		if(this.dir == STOP)
			return;

		switch(k){
		case 38: //вверх
		case 87:
		case 119:
		case 1094:
		case 1062:
			this.move &= ~UP;
			break;
		case 37: //влево
		case 65:
		case 97:
		case 1092:
		case 1060:
			this.move &= ~LEFT;
			break;
		case 39: //вправо
		case 68:
		case 100:
		case 1074:
		case 1042:
			this.move &= ~RIGHT;
			break;
		case 40: //вниз
		case 83:
		case 1099:
		case 1067:
		case 115:
			this.move &= ~DOWN;
			break;
		}

		if(this.move == 0){
			this.dir = 0;
			this.dx =  this.dy = 0;
		}
	}

	get X() {
		return (this.dir <= RIGHT) ? (this.x + this.mcx - this.mcy) : this.x;
	}

	get Y() {
		return  (this.dir <= RIGHT) ? (this.y + this.mcy - this.mcx) : this.y;
	}

	get Width(){
		return (this.dir <= RIGHT) ? this.height : this.width;
	}

	get Height(){
		return (this.dir <= RIGHT) ? this.width : this.height;
	}

	get Life() {
		return this.life;
	}

	move_user(){
		let id = 0 ;
		if(this.dir == LEFT){
			const x = this.x + this.mcx - this.mcy;
			const y = this.y + this.mcy - this.mcx;

			id = is_field(x, y);
			if(id & 0xFF)
				this.x += (((id >> 8) & 0xFF) + 1) * SIZE - x;
			else if(x < 0)
				this.x = this.mcx;

			if((id & 0xFF) == 0){
				id = is_field(x, y + this.width);
				if(id & 0xFF)
					this.x += (((id >> 8) & 0xFF) + 1) * SIZE - x;
				else if((id = is_field(x, y + this.mcx)) & 0xFF)
					this.x += (((id >> 8) & 0xFF) + 1) * SIZE - x;
			}
		} else if(this.dir == RIGHT){
			const x = this.x + this.mcx + this.mcy;
			const y = this.y + this.mcy - this.mcx;

			id = is_field(x, y);
			if((id & 0xFF) != 0)
				this.x += (((id >> 8) & 0xFF) + 1) * SIZE - (x + this.mcy);
			else if(x >= WIDTH)
				this.x = WIDTH - (this.mcx + this.mcy);

			if((id & 0xFF) == 0){
				id = is_field(x, y + this.width);
				if((id & 0xFF) != 0)
					this.x += (((id >> 8) & 0xFF) + 1) * SIZE - (x + this.mcy);
				else if((id = is_field(x, y + this.mcx)) & 0xFF)
					this.x +=  (((id >> 8) & 0xFF) + 1) * SIZE - (x + this.mcy);
			}
		} else if(this.dir == UP){
			id = is_field(this.x, this.y);
			if((id & 0xFF) != 0)
				this.y += (((id >> 16) & 0xFF) + 1) * SIZE - this.y;
			else if(this.y < 0)
				this.y = 0;

			if((id & 0xFF) == 0){
				id = is_field(this.x + this.width, this.y);
				if((id & 0xFF) != 0)
					this.y += (((id >> 16) & 0xFF) + 1) * SIZE - this.y;
				else if((id = is_field(this.x + this.mcx, this.y)) & 0xFF)
					this.y += (((id >> 16) & 0xFF) + 1) * SIZE - this.y;
			}
		} else if(this.dir == DOWN){
			const y = this.y + this.height;

			id = is_field(this.x, y);
			if((id & 0xFF) != 0)
				this.y += (((id >> 16) & 0xFF) + 1) * SIZE - (y + this.mcy);
			else if((this.y + this.height) >= HEIGHT)
				this.y = HEIGHT - this.height - 1;

			if((id & 0xFF) == 0){
				id = is_field(this.x + this.width, y);
				if((id & 0xFF) != 0)
					this.y += (((id >> 16) & 0xFF) + 1) * SIZE - (y + this.mcy);
				else if((id = is_field(this.x + this.mcx, y)) & 0xFF)
					this.y +=  (((id >> 16) & 0xFF) + 1) * SIZE - (y + this.mcy);
			}
		}
		return id;
	}


	is_rotate(dir){
		let ok = true;
		if(dir ==  LEFT){ 
			const x = this.x + this.mcx - this.mcy;
			const y = this.y + this.mcy - this.mcx;

			if((is_field(x, y) & 0xFF) > 9)
				ok = false;
			else if((is_field(x, y + this.width) & 0xFF) > 9)
				ok = false;
			else if((is_field(x, y + this.mcx) & 0xFF) > 9)
				ok = false;
		} else if(dir == RIGHT){
			const x = this.x + this.mcx + this.mcy;
			const y = this.y + this.mcy - this.mcx;

			if((is_field(x, y) & 0xFF) > 9)
				ok = false;
			else if((is_field(x, y + this.width) & 0xFF) > 9)
				ok = false;
			else if((is_field(x, y + this.mcx) & 0xFF) > 9)
				ok = false;
		} else if(dir == UP){ 
			if((is_field(this.x, this.y) & 0xFF) > 9)
				ok = false;
			else if((is_field(this.x + this.width, this.y) & 0xFF) > 9)
				ok = false;
			else if((is_field(this.x + this.mcx, this.y) & 0xFF) > 9)
				ok = false;
		} else if(dir == DOWN){
			const y = this.y + this.height;

			if((is_field(this.x, y) & 0xFF) > 9)
				ok = false;
			else if((is_field(this.x + this.width, y) & 0xFF) > 9)
				ok = false;
			else if((is_field(this.x + this.mcx, y) & 0xFF) > 9)
				ok = false;
		}
		return ok;
	}
}
