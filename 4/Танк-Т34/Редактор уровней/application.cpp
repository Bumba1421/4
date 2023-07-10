/*
	 автор(с): Кудуштеев Алексей
	    Среда: Code::Blocks
	Версия ЯП: C++14
*/
#include "headers.h"
#include "resource.h"
#define CELL_SIZE    32
#define BLOCK_HEIGHT 36
#define TANK_USER    19
static void listbox_create(HWND hwnd, int num) noexcept;



application::application(void) noexcept : base_dialog(),
                                          blocks{},
                                          tiles(nullptr),
                                          field(nullptr),
                                          hlevel(nullptr),
                                          font(nullptr),
                                          fheight(0),
                                          pen(nullptr),
                                          cell_cx(0),
                                          cell_cy(0),
                                          frame{},
                                          ilevel(-1),
                                          controls{},
                                          bgcolor{},
                                          background{},
                                          levels{} {
	this->put_event(WM_INITDIALOG, &application::onInitialize);
	this->put_event(WM_COMMAND, &application::onCommand);
	this->put_event(WM_LBUTTONDOWN, &application::onMouseDown);
	this->put_event(WM_RBUTTONDOWN, &application::onMouseDown);
	this->put_event(WM_CLOSE, &application::onClose);
	this->put_event(WM_SIZE, &application::onSize);
	this->put_event(WM_SIZING, &application::onSizing);
	this->put_event(WM_MEASUREITEM, &application::onMeasureItem);
	this->put_event(WM_DRAWITEM, &application::onDrawItem);
}


application::~application() {
	::DeleteObject(pen);
	bgcolor.dispose();
	background.dispose();
}


//инициализация диалога
INT_PTR __fastcall application::onInitialize(WPARAM wParam, LPARAM lParam) noexcept {
	::SendMessageW(this->getHandle(), WM_SETICON, ICON_SMALL, (LPARAM)LoadIconW(this->getModule(), MAKEINTRESOURCEW(IDI_ICON_APP)));
	std::memset(path, 0, sizeof(path));
	tiles  = ::GetDlgItem(this->getHandle(), IDC_LIST_OBJECTS);
	field  = ::GetDlgItem(this->getHandle(), IDC_CANVAS);
	hlevel = ::GetDlgItem(this->getHandle(), IDC_COMBO_LEVELS);
	listbox_create(tiles, 21);

	pen  = ::CreatePen(PS_DOT, 1, RGB(0xDD,0xAA,0xCC));
	font = (HFONT)::GetStockObject(DEFAULT_GUI_FONT);
	HDC     hdc = ::GetDC(this->getHandle());
	HGDIOBJ old = ::SelectObject(hdc, font);

	TEXTMETRICW tt;
	if(::GetTextMetricsW(hdc, &tt))
		fheight = tt.tmHeight;

	::SelectObject(hdc, old);
	::ReleaseDC(this->getHandle(), hdc);

	auto bs = ::image_load_resource(this->getModule(), IDB_BLOCKS);
	if(bs != nullptr)
		blocks = std::move(decltype(blocks)(bs));

	tiles = ::GetDlgItem(this->getHandle(), IDC_LIST_OBJECTS);
	bgcolor.load(this->getModule(), IDB_BACKGROUND);

	//для изменения размеров контролов
	const UINT ids[] {IDC_CANVAS, IDC_LIST_OBJECTS, IDC_BUTTON_CLEAN, IDC_BUTTON_CLOSE, IDC_LABEL_ABOUT };
	const UINT fgs[] {
		C_RESIZE_WIDTH | C_RESIZE_HEIGHT, C_RESIZE_HEIGHT, C_RESIZE_OFFSET_X, C_RESIZE_OFFSET_X | C_RESIZE_OFFSET_Y, C_RESIZE_OFFSET_Y
	};
	::controls_pack(this->getHandle(), controls, ids, fgs, sizeof(ids)/sizeof(ids[0]));
	return TRUE;
}


//обработчик команд кнопок, флажков, меню...
INT_PTR __fastcall application::onCommand(WPARAM wParam, LPARAM lParam) noexcept {
	switch(LOWORD(wParam)){
	case IDC_BUTTON_CLEAN:
		{
			if(ilevel != -1){
				std::memset(levels[ilevel].field, 0, sizeof(levels[ilevel].field));
				::InvalidateRect(field, nullptr, TRUE);
			}
		}
		return TRUE;
	case IDC_BUTTON_ADD:
		{
			wchar_t cb[16];
			int     ret = (int)::SendMessageW(hlevel, CB_GETCOUNT, 0, 0);
			::snwprintf(cb, 15, L"Уровень - %d", ret + 1);

			ret = (int)::SendMessageW(hlevel, CB_ADDSTRING, 0, (LPARAM)cb);
			if(ret != CB_ERR){
				try {
					field_t lvl;
					std::memset(&lvl, 0, sizeof(lvl));
					levels.push_back(lvl);
				} catch(...){
					break;
				}
				::SendMessageW(hlevel, CB_SETCURSEL, (WPARAM)ret, 0);
				this->onOpenLevel(ret);
			}
		}
		return TRUE;
	case IDC_BUTTON_REMOVE:
		{
			if(::SendMessageW(hlevel, CB_GETCOUNT, 0, 0) > 0){
				int id = ::MessageBoxW(this->getHandle(), L"Вы хотите удалить уровень? Да или Нет?", L"Редактор", MB_YESNO | MB_ICONINFORMATION);
				if((ilevel != -1) && (id == IDYES)){
					levels.erase(levels.begin() + ilevel);
					::SendMessageW(hlevel, CB_DELETESTRING, (WPARAM)ilevel, 0);

					if(!levels.empty()){
						if(ilevel > 0)
							--ilevel;

						::SendMessageW(hlevel, CB_SETCURSEL, (WPARAM)ilevel, 0);
						this->onOpenLevel(ilevel);
					} else {
						ilevel = -1;
						::InvalidateRect(field, nullptr, TRUE);
					}
				}
			}
		}
		return TRUE;
	case IDC_BUTTON_CLEAR:
		{
			if(::SendMessageW(hlevel, CB_GETCOUNT, 0, 0) > 0){
				int id = ::MessageBoxW(this->getHandle(), L"Вы хотите удалить все уровни? Да или Нет?", L"Редактор", MB_YESNO | MB_ICONINFORMATION);
				if(id == IDYES){
					ilevel = -1;
					levels.clear();
					::SendMessageW(hlevel, CB_RESETCONTENT, 0, 0);
					::InvalidateRect(field, nullptr, TRUE);
				}
			}
		}
		return TRUE;
	case IDC_COMBO_LEVELS:
		if(HIWORD(wParam) == CBN_SELCHANGE){
			int ret = (int)::SendMessageW(hlevel, CB_GETCURSEL, 0, 0);
			if(ret != -1)
				this->onOpenLevel(ret);
		}
		return TRUE;
	case IDC_BUTTON_LOAD:
		this->onLoadLevels();
		return TRUE;
	case IDC_BUTTON_SAVE:
		this->onSaveLevels();
		return TRUE;
	}
	return FALSE;
}


//изменение размера
INT_PTR __fastcall application::onSize(WPARAM, LPARAM lParam) noexcept {
	::controls_resize(this->getHandle(), controls);

	RECT rc;
	if(!::GetClientRect(field, &rc))
		return FALSE;

	cell_cx = rc.right  / COLS;
	cell_cy = rc.bottom / ROWS;

	const int cx = cell_cx * COLS;
	const int cy = cell_cy * ROWS;
	RECT crc{0, 0, cx, cy};
	::AdjustWindowRectEx(&crc, 0, FALSE, WS_EX_CLIENTEDGE);
	::SetWindowPos(field, nullptr, 0, 0, crc.right - crc.left + 1, crc.bottom - crc.top + 1, SWP_NOMOVE | SWP_NOREPOSITION);

	::GetWindowRect(field, &crc);
	::ScreenToClient(this->getHandle(), (LPPOINT)&crc);
	RECT sz{};
	::GetClientRect(field, &sz);
	frame.left   = crc.left;
	frame.top    = crc.top;
	frame.right  = crc.left + sz.right;
	frame.bottom = crc.top  + sz.bottom;

	if((rc.right != background.getWidth()) || (rc.bottom != background.getHeight()))
		background.create(rc.right, rc.bottom);
	else
		return FALSE;

	this->clean_background();
	return FALSE;
}


//нажатие кнопок мыши
INT_PTR __fastcall application::onMouseDown(WPARAM wParam, LPARAM lParam) noexcept {
	if(ilevel == -1){
		::MessageBox(this->getHandle(), L"Вы не создали уровень!", L"Редактор", MB_OK | MB_ICONEXCLAMATION);
		return 0;
	}

	int x = GET_X_LPARAM(lParam);
	int y = GET_Y_LPARAM(lParam);

	if((x > frame.left) && (x <= frame.right) && (y > frame.top) && (y <= frame.bottom)){
		x -= frame.left;
		y -= frame.top;

		x /= cell_cx;
		if(x < 0)
			x = 0;
		else if(x >= COLS)
			x = COLS - 1;

		y /= cell_cy;
		if(y < 0)
			y = 0;
		else if(y >= ROWS)
			y = ROWS - 1;
		this->onFieldDown(wParam, y, x);
	}
	return 0;
}


//изменение размера
INT_PTR __fastcall application::onSizing(WPARAM wParam, LPARAM lParam) noexcept {
	return ::dialog_resize_min(this->getHandle(), wParam, lParam, 640, 480);
}


//событие закрытие диалога
INT_PTR __fastcall application::onClose(WPARAM, LPARAM) noexcept {

	return TRUE;
}


INT_PTR __fastcall application::onMeasureItem(WPARAM wParam, LPARAM lParam) noexcept {
	LPMEASUREITEMSTRUCT mitem = (LPMEASUREITEMSTRUCT)lParam;
	if(wParam == IDC_LIST_OBJECTS){
		mitem->itemHeight = BLOCK_HEIGHT;
		return TRUE;
	}
	return FALSE;
}


INT_PTR __fastcall application::onDrawItem(WPARAM wParam, LPARAM lParam) noexcept {
	LPDRAWITEMSTRUCT ds = (LPDRAWITEMSTRUCT)lParam;
	if(wParam == IDC_LIST_OBJECTS){
		Gdiplus::Graphics cdc(ds->hDC);

		bool sel = false;
		if(ds->itemState & ODS_SELECTED)
			sel = true;

		const int h = ds->rcItem.bottom - ds->rcItem.top;

		static HBRUSH colors[] { (HBRUSH)::GetStockObject(LTGRAY_BRUSH), (HBRUSH)::GetStockObject(WHITE_BRUSH), (HBRUSH)::GetStockObject(BLACK_BRUSH)};
		::FillRect(ds->hDC, &ds->rcItem, colors[(sel) ? 2 : (ds->itemData & 1)]);

		HGDIOBJ    old = ::SelectObject(ds->hDC, font);
		int       mode = ::SetBkMode(ds->hDC, TRANSPARENT);
		COLORREF  col  = 0;
		if(sel)
			col = ::SetTextColor(ds->hDC, RGB(0,0xAA,0xFF));
		else
			col = ::SetTextColor(ds->hDC, RGB(0,0,0));

		int      row = static_cast<int>(ds->itemData / 9);
		const int ty = row * CELL_SIZE;
		const int tx = static_cast<int>(ds->itemData % 9) * CELL_SIZE;

		Gdiplus::Rect dst(ds->rcItem.left, ds->rcItem.top + (h - CELL_SIZE)/2, CELL_SIZE, CELL_SIZE);
		cdc.DrawImage(blocks.get(), dst, tx, ty, CELL_SIZE, CELL_SIZE, Gdiplus::UnitPixel);

		const wchar_t* tpl[]{L"Разбиваемый", L"Неразбиваемый", L"Мой танк", L"Танк враг"};
		if(ds->itemData == 18)
			row = 2;
		else if(ds->itemData > 18)
			row = 3;

		::TextOutW(ds->hDC, dst.GetRight() + 2, ds->rcItem.top + (h - fheight)/2, tpl[row], static_cast<int>(std::wcslen(tpl[row])));

		::SelectObject(ds->hDC, old);
		::SetBkMode(ds->hDC, mode);
		::SetTextColor(ds->hDC, col);
		return TRUE;
	} else if(wParam == IDC_CANVAS){
		this->onDrawCanvas(ds->hDC, &ds->rcItem);
		return TRUE;
	}
	return FALSE;
}


//рисование поля
void __fastcall application::onDrawCanvas(HDC hDC, LPCRECT lprc) noexcept {
	background.draw(hDC, lprc->left, lprc->top);

	if(ilevel == -1)
		return;

	Gdiplus::Graphics cdc(hDC);

	const field_t* p = &levels[ilevel];

	int id, x, y, r;
    for(int i = 0; i < ROWS; ++i){
		y = i * cell_cy;
		r = i * COLS;
		for(int j = 0; j < COLS; ++j){
			id = p->field[r + j];
			x  = j * cell_cx;
			if(id == 0)
				continue;

			--id;
			const int ty = static_cast<int>(id / 9) * CELL_SIZE;
			const int tx = static_cast<int>(id % 9) * CELL_SIZE;

			Gdiplus::Rect dst(x, y, cell_cx, cell_cy);
			cdc.DrawImage(blocks.get(), dst, tx, ty, CELL_SIZE, CELL_SIZE, Gdiplus::UnitPixel);
		}
	}
}


//расстановка объектов игры
void __fastcall application::onFieldDown(WPARAM button, int row, int col) noexcept {
	auto redraw = [this] (int row, int col) noexcept -> void {
		const int x = col * cell_cx;
		const int y = row * cell_cy;
		RECT rc {x, y, x + cell_cx, y + cell_cy};
		InflateRect(&rc, 4, 4);
		InvalidateRect(this->field, &rc, TRUE);
	};

	if(button & MK_LBUTTON){
		int sel = (int)::SendMessageW(tiles, LB_GETCURSEL, 0, 0);
		if(sel == -1){
			::MessageBeep((UINT)-1);
			return;
		}

		const BYTE val = static_cast<BYTE>(sel + 1);
		if(val == TANK_USER){
			BYTE* p = levels[ilevel].field;
			for(int r = 0; r < ROWS; ++r){
				int row = r * COLS;
				for(int c = 0; c < COLS; ++c){
					if(p[row + c] == TANK_USER){
						p[row + c] = 0;
						redraw(r, c);
					}
				}
			}
		}
		levels[ilevel].field[row * COLS + col] = val;
	} else
		levels[ilevel].field[row * COLS + col] = 0;
	redraw(row, col);
}


//открыть уровень
void application::onOpenLevel(int index) noexcept {
	if(index < static_cast<int>(levels.size())){
		ilevel = index;
		this->clean_background();
	}
}


//сохранить уровни
void application::onSaveLevels(void) noexcept {
	if(::SendMessageW(hlevel, CB_GETCOUNT, 0, 0) <= 0){
		::MessageBeep((UINT)-1);
		return;
	}

	if(path[0] == L'\0'){
		const WCHAR ext[] = L"Файл JavaScript\0*.js\0\0";
		if(!::dialog_save(this->getHandle(), path, L"Сохранение уровней", ext)){
			std::memset(path, 0, sizeof(path));
			return;
		}
	}

	try {
		std::string str = "const g_levels = [\r\n";
		for(const auto& v : levels){
			str.append("\t\"",2);
			const BYTE* p = &v.field[0];
			for(auto e = p + (ROWS * COLS); p < e; ++p){
				if(*p <= 9)
					str += static_cast<char>(*p + '0');
				else if(*p < TANK_USER)
					str += static_cast<char>(*p - 10 + 'A');
				else
					str += static_cast<char>(*p - TANK_USER + 'X');
			}
			str.append("\",\r\n",4);
		}
		str.erase(str.begin() + (str.length() - 1));
		str += "];\r\n";

		//сохранение файла
		HANDLE fp = ::CreateFileW(path, GENERIC_WRITE, FILE_SHARE_WRITE, nullptr, CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL, nullptr);
		if(fp == INVALID_HANDLE_VALUE){
			::MessageError(this->getHandle(), ::GetLastError());
			return;
		}

		DWORD n = 0;
		BOOL  r = ::WriteFile(fp, (LPCVOID)str.data(), str.length(), &n, nullptr);
		DWORD e = ::GetLastError();
		::CloseHandle(fp);

		if(!r || (str.length() != n))
			::MessageError(this->getHandle(), e);
	} catch(...){
		::MessageError(this->getHandle(), ERROR_OUTOFMEMORY);
	}
}


//загрузить уровни
void application::onLoadLevels(void) noexcept {
	ilevel = -1;
	levels.clear();
	::SendMessageW(hlevel, CB_RESETCONTENT, 0, 0);
	::InvalidateRect(field, nullptr, TRUE);

	const WCHAR ext[] = L"Файл JavaScript\0*.js\0\0";
	if(!::dialog_open(this->getHandle(), path, L"Открыть уровни", ext))
		return;

	try {
		using file_t = typename std::remove_pointer<HANDLE>::type;
		//сохранение файла
		std::unique_ptr<file_t, decltype(&::CloseHandle)> fp(::CreateFileW(path, GENERIC_READ, FILE_SHARE_READ, nullptr, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL | FILE_FLAG_SEQUENTIAL_SCAN, nullptr), &::CloseHandle);
		if(fp.get() == INVALID_HANDLE_VALUE){
			::MessageError(this->getHandle(), ::GetLastError());
			return;
		}

		DWORD len = ::GetFileSize(fp.get(), nullptr);
		if(!len || (len == INVALID_FILE_SIZE)){
			::MessageError(this->getHandle(), ERROR_BAD_FORMAT);
			return;
		}

		std::unique_ptr<char[]> buf(new char[len + 1]);

		DWORD n = 0;
		BOOL  r = ::ReadFile(fp.get(), (LPVOID)buf.get(), len, &n, nullptr);
		DWORD e = ::GetLastError();
		fp.reset();

		if(!r || (len != n)){
			::MessageError(this->getHandle(), e);
			return;
		}
		buf.get()[len] = '\0';

		using data_t = std::pair<const char*, const char*>;

		auto find = [] (const char*& s, data_t& data) noexcept -> bool {
			while(*s && (*s != '"'))
				++s;

			if(!*s)
				return false;

			data.first = ++s;
			while(*s && (*s != '"'))
				++s;

			if(!*s)
				return false;

			data.second = s++;
			return true;
		};

		const int   m = ROWS * COLS;
		const char* p = buf.get();
		data_t  data;
		wchar_t cb[16];
		int     cnt = 0;

		while(find(p, data)){
			if(m != static_cast<int>(data.second - data.first))
				continue;

			field_t lvl{};
			BYTE*       p = &lvl.field[0];
			const char* w = data.first;
			for(BYTE* e = p + m; p < e; ++p, ++w){
				if((*w >= '0') && (*w <= '9'))
					*p = static_cast<BYTE>(*w - '0');
				else if((*w >= 'A') && (*w < 'X'))
					*p = static_cast<BYTE>(*w - 'A' + 10);
				else if((*w >= 'X') && (*w <= 'Z'))
					*p = static_cast<BYTE>(*w - 'X' + TANK_USER);
			}

			::wsprintfW(cb, L"Уровень - %d", ++cnt);
			::SendMessageW(hlevel, CB_ADDSTRING, 0, (LPARAM)cb);
			levels.push_back(lvl);
		}

		if(!levels.empty()){
			::SendMessageW(hlevel, CB_SETCURSEL, 0, 0);
			this->onOpenLevel(0);
		} else
			::MessageBoxW(this->getHandle(), L"Неправильный формат данных!", L"Редактор", MB_OK | MB_ICONERROR);

	} catch(...){
		::MessageError(this->getHandle(), ERROR_OUTOFMEMORY);
	}
}


//очистка
void application::clean_background(void) noexcept {
	HDC hdc = background.getDC();
	const int w  = background.getWidth();
	const int h  = background.getHeight();

	const int level = (ilevel != -1) ? ilevel : 0;
	const int ox    = (level % 3) * CELL_SIZE;

	for(int i = 0; i <= h; i += CELL_SIZE){
		for(int j = 0; j <= w; j += CELL_SIZE)
			::BitBlt(hdc, j, i, CELL_SIZE, CELL_SIZE, bgcolor.getDC(), ox, 0, SRCCOPY);
	}

	auto line = [] (HDC hdc, int x1, int y1, int x2, int y2) noexcept -> void {
		MoveToEx(hdc, x1, y1, nullptr);
		LineTo(hdc, x2, y2);
	};

	int  rop = ::SetROP2(hdc, R2_NOT);
	auto old = ::SelectObject(hdc, pen);
	for(int i = 0; i <= h; i += cell_cy)
		line(hdc, 0, i, w, i);
	for(int i = 0; i <= w; i += cell_cx)
		line(hdc, i, 0, i, h);
	::SelectObject(hdc, old);
	::SetROP2(hdc, rop);
	::InvalidateRect(field, nullptr, TRUE);
}


static void listbox_create(HWND hwnd, int num) noexcept {
	for(int i = 0; i < num; ++i){
		int index = (int)SendMessageW(hwnd, LB_ADDSTRING, 0, (LPARAM)nullptr);
		if(index != LB_ERR)
			SendMessageW(hwnd, LB_SETITEMDATA, (WPARAM)index, (LPARAM)index);
	}
}
