/* 
    автор(с): Кудуштеев Алексей
              JavaScript ES6 HTML5
*/
const g_game = {load:0,title:1,level:2,play:3,death:4,over:5,pause:6, help:7};
let g_count = 0;
let g_level = 0;
let g_logo = null;
let g_time = 0;
let g_cnt = 0;
let g_funs = new  Array(8);
let g_point = {x:0,y:0};
let g_select = -1;
let g_stage = g_game.load;


class game  {
	constructor(){ 
		SIZE   = Math.floor(Math.min(window.innerWidth, window.innerHeight) * 0.032) >>> 0;
		MSIZE  = SIZE / 2;
		BSIZE  = SIZE * 2;
		BMSIZE = BSIZE + MSIZE;
		WIDTH  = SIZE * COLS;
		HEIGHT = SIZE * ROWS;
		SFIRE  = SIZE / 3;
		MUL    = 1.0 / SIZE;

		g_user = new user_tank();
		g_user.width = SIZE + Math.ceil(SIZE * 0.2);
		g_user.height = SIZE * 2 + Math.ceil(SIZE * 0.2);
		g_user.mcx = g_user.width / 2;
		g_user.mcy = g_user.height / 2;

		g_field = new matrix(ROWS, COLS);

		g_ibacks   = new Image();
		g_iboom   = new Image();
		g_iblocks  = new Image();
		g_ibonus = new Image();
		g_logo = new Image();

		const files = ["images/backs.bmp", "images/blocks.png", "images/boom.png", "images/logo.bmp", "images/bonus.png"];
		let    imgs = [g_ibacks, g_iblocks, g_iboom, g_logo, g_ibonus];

		const cs = ["images/tank1.png", "images/gun1.png",  "images/tank2.png", "images/gun2.png", "images/platform.png", "images/gun.png"];

		const sfiles = ["sound/fire1.wav", "sound/fire2.wav", "sound/crush.wav", "sound/boom.wav", "sound/rick.wav", "sound/circle.wav", "sound/uron.wav"];

		const _load = () => {
			if(--g_count == 0)
				game.on_create();
		}

		try {
			g_cnt = g_count = files.length + sfiles.length + cs.length;

			for(let i = 0; i < 3; ++i){
				g_itanks[i] = new cimage(cs[i*2 + 0], g_user.width, g_user.height, _load);
				g_iguns[i]  = new cimage(cs[i*2 + 1], g_user.width, g_user.height, _load);
			}

			load_images(imgs, files, _load);
			load_sounds(g_sounds, sfiles, _load); 
		} catch(e){
			alert(e);
		}

		g_crush = new array(new Float32Array(MAX_SIZE), new Float32Array(MAX_SIZE), new Float32Array(MAX_SIZE), new Uint8Array(MAX_SIZE));
		g_fires  = new array(new Float32Array(MAX_SIZE), new Float32Array(MAX_SIZE), new Float32Array(MAX_SIZE));
		g_bonus = new array(new Int32Array(8), new Int32Array(8), new Uint8Array(8));

		for(let i = 0; i < g_bullets.length; ++i)
			g_bullets[i] = new carray(8);

		g_buffer.obj = obj_at("hdc");
		g_buffer.obj.width  = WIDTH;
		g_buffer.obj.height = HEIGHT;
		g_buffer.hdc          = g_buffer.obj.getContext("2d");

		g_back.obj = obj_at("back");
		g_back.obj.width = WIDTH;
		g_back.obj.height = HEIGHT;
		g_back.hdc = g_back.obj.getContext("2d", {alpha:false});

		g_fore.obj = obj_at("fore");
		g_fore.obj.width  = WIDTH;
		g_fore.obj.height = HEIGHT;
		g_fore.hdc          = g_fore.obj.getContext("2d");

		g_funs[g_game.load]   = game.draw_load;
		g_funs[g_game.title]     = game.draw_title;
		g_funs[g_game.level]   = game.draw_level;
		g_funs[g_game.play]    = game.draw_game;
		g_funs[g_game.death] = game.draw_death;
		g_funs[g_game.over]    = game.draw_over;
		g_funs[g_game.pause] = game.draw_pause;
		g_funs[g_game.help]    = game.draw_help;

		canvas.create(g_buffer.obj);
		canvas.delay = 10;
		canvas.eventPaint = () => g_funs[g_stage]();
		canvas.eventUpdate = game.on_update;
		canvas.eventMouseDown = game.on_mousedown;
		canvas.eventMouseUp = game.on_mouseup;
		canvas.eventMouseMove = game.on_mousemove;
		canvas.eventKeyDownUp(game.on_keydown, game.on_keyup);

		const left = Math.round((window.innerWidth  - WIDTH) /2);
		const top  = Math.round((window.innerHeight - HEIGHT)/2);
		g_back.obj.style.left = left;
		g_back.obj.style.top  = top;
		g_buffer.obj.style.left = left;
		g_buffer.obj.style.top = top;
		g_fore.obj.style.left = left;
		g_fore.obj.style.top = top;
		canvas.run();
	}


	//создание после загрузки ресурсов игры
	static on_create(){
		g_level = getLevel();
		game.start_title();
	}


	//инициализация
	static on_initialize(){
		g_buffer.hdc.lineWidth = 2;
		g_fore.hdc.clearRect(0, 0, WIDTH, HEIGHT);
		g_field.fill = 0;
		g_crush.reset();
		g_fires.reset();
		g_bonus.reset();

		while(g_tanks.length > 0){
			delete g_tanks[g_tanks.length - 1];
			g_tanks.pop();
		}

		while(g_booms.length > 0){
			delete g_booms[g_booms.length - 1];
			g_booms.pop();
		}

		const _0 = '0'.charCodeAt(0);
		const _9 = '9'.charCodeAt(0);
		const _A = 'A'.charCodeAt(0);
		const _X = 'X'.charCodeAt(0);
		const user_t = 19;
		const alien_t = 21; 

		for(let i = 0; i < g_levels[g_level].length; ++i){ //парсируем уровень
			let c = g_levels[g_level].charCodeAt(i);
			if((c >= _0) && (c <= _9))
				g_field.data[i] = c - _0;
			else if((c >= _A) && (c < _X))
				g_field.data[i] = c - _A + 10;
			else
				g_field.data[i] = c - _X + user_t;
		}

		let x, y, id;
		for(let i = 0; i < g_field.rows; ++i){ //заполняем уровень
			for(let j = 0; j < g_field.cols; ++j){
				id = g_field.getAt(i, j);
				if(id == 0)
					continue;

				x = j * SIZE;
				y = i * SIZE;
				if(id < user_t){
					--id;
					const r = (id  / 9) | 0;
					const c = id % 9;
					g_fore.hdc.drawImage(g_iblocks, c * g_tiles.size, r * g_tiles.size, g_tiles.size, g_tiles.size, x, y, SIZE, SIZE);
				} else if(id == user_t){
					g_user.initialize(x, y);
					g_field.setAt(i, j, 0);
				} else if((id > user_t) && (id <= alien_t)){
					let tank = new tankX();
					tank.initialize(x, y, id - user_t - 1);
					g_tanks.push(tank);
					g_field.setAt(i, j, 0);
				} else
					g_field.setAt(i, j, 0);
			}
		}
		fillCanvas(g_back.hdc, 0, 0, WIDTH, HEIGHT, g_ibacks, (g_level % 3) * 64, 0, 64, 64);
	}


	//обновление
	static on_update(time, delta){
		if(g_stage != g_game.play)
			return;

		const pixel = SIZE * 0.1;
		const per   = delta * 0.36 * pixel;

		g_user.updateFrame(delta, pixel, time);

		//полёт осколков от блоков
		let k;
		for(let i = 0; i < g_crush.count; ++i){
			k  = g_crush.at(2, i) + per;
			if(k > SIZE)
				g_crush.erase(i--);
			else
				g_crush.put(2, i, k);
		}

		//взрыв
		for(let i = 0;i < g_booms.length; ++i){
			g_booms[i].updateFrame(delta, 0.14);
			if(g_booms[i].isStop()){
				delete g_booms[i];
				g_booms.splice(i, 1);
				--i;

				if(g_booms.length == 0){
					if(g_user.Life <= 0)
						game.start_death();
					else if(g_tanks.length == 0){
						if(++g_level >= g_levels.length){
							g_level = 0;
							game.start_over();
						} else 
							game.run_level();
						putLevel(g_level);
					}
					break;
				}
			}
		}

		//окружность взрыва
		for(let i = 0; i < g_fires.count; ++i){
			k = g_fires.at(2, i) + per;
			if(k > SIZE)
				g_fires.erase(i--);
			else
				g_fires.put(2, i, k);
		}

		k = delta* pixel;
		for(let i = 0; i < g_tanks.length; ++i)
			g_tanks[i].updateMove(k, time);
	}


	//вывод игры
	static draw_game(){
		let x, y, d, id;
		let hdc = g_buffer.hdc;
		hdc.clearRect(0, 0, WIDTH, HEIGHT);

		for(let i = 0; i < g_tanks.length; ++i)
			g_tanks[i].draw(hdc);
		g_user.draw(hdc);

		//вывод окружность взрыва
		const N = g_fires.count;
		if(N > 0){
			hdc.fillStyle = "rgba(0,0,0,0.1)";
			for(let i = 0; i < N; ++i){
				d = g_fires.at(2,i);
				const r =  180.0 / Math.PI;
				const m = SFIRE / 2;
				for(let j = 0; j <= 360; j += 10){
					const t = j * r;
					x = g_fires.at(0,i) + d * Math.cos(t);
					y = g_fires.at(1,i) + d * Math.sin(t);
					hdc.fillRect(x - m, y - m, SFIRE, SFIRE);
				}
			}
		}

		//вывод осколков
		let top, left;
		for(let i = 0; i < g_crush.count; ++i){
			x = g_crush.at(0, i);
			y = g_crush.at(1, i);
			d = g_crush.at(2, i);
			id = g_crush.at(3, i);

			top = Math.floor((id - 1) / 9)  * g_tiles.size;
			left = (id - 1) % 9 * g_tiles.size;
			let a = 0;
			for(let r = -1; r <= 1; r += 2, ++a){
				let b = 0;
				for(let c = -1; c <= 1; c += 2, ++b)
					hdc.drawImage(g_iblocks, left + b*g_tiles.mid, top + a*g_tiles.mid, g_tiles.mid, g_tiles.mid, x + c*d, y + r*d, MSIZE, MSIZE);
			}
		}

		for(let i = 0; i < g_bonus.count; ++i){
			id = g_bonus.at(2,i) * g_tiles.size;
			hdc.drawImage(g_ibonus, id, 0, g_tiles.size, g_tiles.size, g_bonus.at(0,i), g_bonus.at(1,i), SIZE, SIZE);
		}

		//вывод взрыва
		for(let i = 0; i < g_booms.length; ++i)
			g_booms[i].draw_s(hdc, g_iboom, g_booms[i].x, g_booms[i].y, BMSIZE, BMSIZE);

		hdc.fillStyle = "rgba(0,255,0,0.33)";
		hdc.strokeStyle = hdc.fillStyle;
		const m = MSIZE * 0.5;
		const w = g_user.Life * m;
		hdc.fillRect(m, m, w, m);
		hdc.strokeRect(m, m, USER_LIFE * m, m);
	}


	static draw_load(){ //загрузка ресурсов игры
		let hdc = g_buffer.hdc;
		const w = MSIZE * g_cnt;
		const x = (WIDTH - w)/2;
		const y = (HEIGHT - MSIZE)/2;

		hdc.fillStyle = "#ff0000";
		hdc.fillRect(x, y, w, MSIZE);
		hdc.fillStyle = "#0000ff";
		hdc.fillRect(x, y, (g_cnt - g_count) * MSIZE, MSIZE);
	}

	static draw_title(){
		g_select = game.cmd_frame(g_buffer.hdc, g_point.x, g_point.y, 2);
	}

	static draw_help(){
		const bw = SIZE * 10;
		g_select = game.click_buttons(g_buffer.hdc, g_point.x, g_point.y, (WIDTH - bw)/2, HEIGHT - SIZE*5, bw, SIZE, 1,  "#ffffff","#555555");
	}

	static draw_level(){
		if(canvas.tick > g_time){
			g_stage = g_game.play;
			game.on_initialize();
		}
	}

	static draw_pause(){
		const bw = SIZE * 6;
		g_select = game.click_buttons(g_buffer.hdc, g_point.x, g_point.y,  (WIDTH - (bw*2 + MSIZE))/2,  (HEIGHT - SIZE)/2 + SIZE + MSIZE, bw, SIZE, 2, "#00ff00", "#005500");
	}

	static draw_death(){
		const bw = SIZE * 6;
		g_select = game.click_buttons(g_buffer.hdc, g_point.x, g_point.y,  (WIDTH - (bw*2 + MSIZE))/2,  (HEIGHT - SIZE)/2 + SIZE + MSIZE, bw, SIZE, 2, "#ff0000", "#880000");
	}

	static draw_over(){
		const bw = SIZE * 6;
		g_select = game.click_buttons(g_buffer.hdc, g_point.x, g_point.y,  (WIDTH - (bw*2 + MSIZE))/2,  (HEIGHT - SIZE)/2 + SIZE + MSIZE, bw, SIZE, 2,  "#ffff00", "#999900");
	}


	//нажатие мыши
	static on_mousedown(e){
		switch(g_stage){
		case g_game.play:
			g_user.mouse_down(e.offsetX, e.offsetY);
			break;
		case g_game.title:
			{
				if(g_select == 0)
					game.run_level();
				else if(g_select == 1)
					game.start_help();
			}
			break;
		case g_game.help:
			{
				if(g_select == 0)
					game.start_title();
			}
			break;
		case g_game.death:
			{
				if(g_select == 0)
					game.run_level();
				else if(g_select == 1)
					game.start_title();
			}
			break;
		case g_game.pause:
			{
				if(g_select == 0)
					g_stage = g_game.play;
				else if(g_select == 1)
					game.start_title();
			}
			break;
		case g_game.over:
			{
				if(g_select == 0)
					game.run_level();
				else if(g_select == 1)
					game.start_title();
			}
			break;
		}
	}


	//отпускание мыши
	static on_mouseup(e){
		//canvas.stop();
	}


	//движение мыши
	static on_mousemove(e){
		if(g_stage == g_game.play)
			g_user.mouse_move(e.offsetX, e.offsetY);
		else {
			g_point.x = e.offsetX;
			g_point.y = e.offsetY;
		}
	}


	//управление клавиатурой
	static on_keydown(k){
		if(g_stage == g_game.play)
			g_user.key_down(k);
	}


	static on_keyup(k){
		switch(g_stage){
		case g_game.play:
			g_user.key_up(k);
			if(k == 27)
				game.start_pause();
			break;
		case g_game.death:
		case g_game.over:
		case g_game.title:
			if(k == 13)
				game.run_level();
			break;
		case g_game.pause:
			g_stage = g_game.play;
			break;
		}
	}


	//справка
	static start_help(){
		g_stage = g_game.help;
		let hdc = g_buffer.hdc;
		
		const w = WIDTH  * 0.8;
		const h = HEIGHT * 0.8;
		const x = (WIDTH - w)/2;
		const y = (HEIGHT - h)/2;
		hdc.fillStyle = "rgba(0,0,0,0.9)";
		hdc.fillRect(x,y,w,h);
		hdc.strokeStyle = "#ff00ff";
		hdc.strokeRect(x,y,w,h);

		const help = [
			"Вращение башней танка - движение мышью", "Стрельба из танка - нажатие кнопок мыши", 
			"Движение танка влево клавиша влево или A", "Движение танка вправо клавиша вправо или D", 
			"Движение танка вверх клавиша вверх или W", "Движение танка вниз клавиша вниз или S"
		];

		hdc.font = (MSIZE + 1) + FONT_FACE;

		const px = x + BSIZE;
		let py = y + BSIZE;

		const cols = ["#ccddff", "#ffffff"];

		hdc.fillStyle = cols[0];
		hdc.fillText("Описание бонусов:", px, py);
		py += MSIZE;

		const items = ["Аптечка - дополнительнaя жизнь", "Бронебойный снаряд - возможность пробивать все блоки", "Увеличение скорости танка"];
		const edge = MSIZE / 2;
		hdc.fillStyle = cols[1];
		for(let i = 0; i < items.length; ++i, py += SIZE + edge){
			hdc.drawImage(g_ibonus, i * g_tiles.size, 0, g_tiles.size, g_tiles.size, px, py, SIZE, SIZE);
			hdc.fillText(items[i], px + SIZE + edge, py + MSIZE + edge);
		}

		py += SIZE * 2;
		hdc.fillStyle = cols[0];
		hdc.fillText("Управление игрой мышью и клавиатурой:", px, py);
		py += SIZE;
		hdc.fillStyle = cols[1];
		for(let i = 0; i < help.length; ++i, py += MSIZE + edge)
			hdc.fillText(help[i], px, py);

		const cmds = ["Закрыть справку"];
		const bw = SIZE * 10;
		game.draw_buttons(hdc, (WIDTH - bw)/2, HEIGHT - SIZE*5, bw, SIZE, cmds, "#884422", "#00ff00", MSIZE + 1);
	}


	static start_over(){
		g_stage = g_game.over;
		let hdc = g_buffer.hdc;
		const w = WIDTH * 0.5;
		const h = HEIGHT * 0.4;
		const x = (WIDTH - w)/2;
		const y = (HEIGHT- h)/2;

		hdc.fillStyle = "rgba(0,55,0,0.6)";
		hdc.fillRect(x, y, w, h);
		hdc.strokeStyle = "#00aa00";
		hdc.strokeRect(x, y, w, h);

		hdc.save();
		hdc.font = (MSIZE + 1) + FONT_FACE;
		hdc.fillStyle = "#ffff00";

		const s = "ВЫ ПРОШЛИ ВСЮ ИГРУ";
		hdc.fillText(s, (WIDTH - hdc.measureText(s).width)/2, (HEIGHT - SIZE)/2 - SIZE*2);

		const cmds = ["Начать заново", "Выйти в меню"];
		const bw = SIZE * 6;
		game.draw_buttons(hdc, (WIDTH - (bw*2 + MSIZE))/2,  (HEIGHT - SIZE)/2 + SIZE + MSIZE, bw, SIZE, cmds, "rgba(0,55,55,0.8)", "#ffffff", MSIZE + 1);
		hdc.restore();
	}


	static start_death(){
		g_stage = g_game.death;
		let hdc = g_buffer.hdc;
		const w = WIDTH * 0.5;
		const h = HEIGHT * 0.34 - SIZE*3;
		const x = (WIDTH - w)/2;
		const y = (HEIGHT- h)/2;

		hdc.save();
		hdc.fillStyle = "rgba(70,0,0,0.5)";
		hdc.fillRect(x, y, w, h);
		hdc.strokeStyle = "#ff0000";
		hdc.strokeRect(x, y, w, h);

		hdc.font = (MSIZE + 1) + FONT_FACE;
		hdc.fillStyle = "#ff3300";

		const s = "ВЫ ПРОИГРАЛИ БИТВУ";
		hdc.fillText(s, (WIDTH - hdc.measureText(s).width)/2, (HEIGHT - SIZE)/2 - MSIZE);

		const cmds = ["Начать заново", "Закрыть игру"];
		const bw = SIZE * 6;
		game.draw_buttons(hdc, (WIDTH - (bw*2 + MSIZE))/2,  (HEIGHT - SIZE)/2 + SIZE + MSIZE, bw, SIZE, cmds, "rgba(0,0,55,0.8)", "#ffbb77", MSIZE + 1);
		hdc.restore();
	}


	static start_title(){
		g_stage = g_game.title;
		let hdc = g_buffer.hdc;
		hdc.lineWidth = 2;
		hdc.fillStyle = "#ffffff";
		hdc.fillRect(0, 0, WIDTH, HEIGHT);

		const w = WIDTH * 0.3;
		const h = HEIGHT * 0.3;
		hdc.drawImage(g_logo, SIZE, SIZE, w, h);
		let left = SIZE * 2 + w;

		const cy = SIZE * 3;
		const str = "Танк - T34";

		hdc.font = cy + FONT_FACE;
		const fx = left + ((WIDTH - left) - hdc.measureText(str).width)/2;
		const fy = cy * 2;

		hdc.save();
		hdc.shadowBlur  = Math.ceil(MSIZE / 2);
		hdc.shadowColor = "#000000";
		hdc.fillStyle  = "#00cc00";
		hdc.fillText(str, fx, fy);
		hdc.strokeStyle  = "#00dd00";
		hdc.strokeText(str, fx, fy);
		hdc.restore();

		const cmd = ["Начать играть", "Справка о игре"];
		hdc.font = (MSIZE + MSIZE/3) + FONT_FACE;

		const cx = WIDTH * 0.7;
		const x  = (WIDTH - cx)/2;
		let y = (HEIGHT - cy)/2 + cy;

		hdc.save();
		hdc.fillStyle = "#002233";
		hdc.fillRect(0, y - BSIZE, WIDTH, HEIGHT - y + MSIZE);

		let ld = hdc.createLinearGradient(x, y, cx, cy);
		ld.addColorStop(0, "rgba(128,128,0,1)");
		ld.addColorStop(1, "rgba(0,0,128,1)");

		const ty = cy + SIZE;
		const oy = cy/2 + MSIZE/3;
		for(let i = 0; i < cmd.length; ++i, y += ty){
			hdc.fillStyle = ld;
			hdc.fillRect(x, y, cx, cy);
			hdc.strokeStyle = "#cccccc";
			hdc.strokeRect(x, y, cx, cy);
			hdc.fillStyle = "#ffff11";
			hdc.fillText(cmd[i], (WIDTH - hdc.measureText(cmd[i]).width)/2, y + oy);
		}

		const author = "Кудуштеев Алексей";
		hdc.fillStyle = "#777777";
		hdc.fillText(author, (WIDTH - hdc.measureText(author).width)/2, HEIGHT - MSIZE);
		hdc.restore();
	}


	static start_pause(){
		g_stage = g_game.pause;
		let hdc = g_buffer.hdc;
		const w = WIDTH * 0.5;
		const h = HEIGHT * 0.4;
		const r = Math.max(w / 2, h / 2) + SIZE;

		hdc.save();
		hdc.beginPath();
		hdc.fillStyle = "rgba(0,0,0,0.6)";
		hdc.arc(WIDTH / 2, HEIGHT / 2, r, 0, Math.PI * 2);
		hdc.fill();
		hdc.strokeStyle = "#aaaaaa";
		hdc.arc(WIDTH / 2, HEIGHT / 2, r, 0, Math.PI * 2);
		hdc.stroke();
		hdc.font = (MSIZE + 1) + FONT_FACE;
		hdc.fillStyle = "#aaddff";

		const s = "ПАУЗА";
		hdc.fillText(s, (WIDTH - hdc.measureText(s).width)/2, (HEIGHT - SIZE)/2 - SIZE*2);

		const cmds = ["Продолжить", "Прервать игру"];
		const bw = SIZE * 6;
		game.draw_buttons(hdc, (WIDTH - (bw*2 + MSIZE))/2,  (HEIGHT - SIZE)/2 + SIZE + MSIZE, bw, SIZE, cmds, "rgba(95,95,15,0.8)", "#ffff00", MSIZE + 1);
		hdc.restore();
	}


	static run_level(){
		g_stage = g_game.level;
		g_time  = canvas.tick + 1500;
		let hdc = g_buffer.hdc;
		hdc.fillStyle = "#000000";
		hdc.fillRect(0,0,WIDTH,HEIGHT);

		const str = "УРОВЕНЬ - " + (g_level + 1);
		hdc.fillStyle = "#ffffff";
		hdc.fillText(str, (WIDTH - hdc.measureText(str).width)/2, (HEIGHT - SIZE)/2 + MSIZE);
	}


	static draw_buttons(hdc, x, y, w, h, cmds, col, fcol, fh){
		const p =  fh + fh/4;
		for(let i = 0; i < cmds.length; ++i, x += w + MSIZE){
			hdc.fillStyle = col;
			hdc.fillRect(x, y, w, h);
			hdc.fillStyle = fcol;
			hdc.fillText(cmds[i], x + (w - hdc.measureText(cmds[i]).width)/2, y + p);
		}
	}

	static click_buttons(hdc, px, py, x, y, w, h, N, col1, col2){
		let inx = -1;
		for(let i = 0; i < N; ++i, x += w + MSIZE){
			if((px > x) && (px < (x + w)) && (py > y) && (py < (y + h))){
				inx = i;
				hdc.strokeStyle = col1;
			} else
				hdc.strokeStyle = col2;
			hdc.strokeRect(x, y, w, h);
		}
		return inx;
	}

	static cmd_frame(hdc, px, py, N){
		const cx = WIDTH * 0.7;
		const cy = SIZE * 3;
		const x  = (WIDTH - cx)/2;
		const m = cy + SIZE;
		let y = (HEIGHT - cy)/2 + cy;
		let inx = -1;
		for(let i = 0; i < N; ++i, y += m){
			if((px > x) && (px < (x + cx)) && (py > y) && (py < (y + cy))){
				hdc.strokeStyle = "#ffffff";
				inx = i;
			} else
				hdc.strokeStyle = "#444444";
			hdc.strokeRect(x, y, cx, cy);
		}
		return inx;
	}
};
