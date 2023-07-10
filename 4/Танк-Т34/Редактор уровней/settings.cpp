//Автор(с): Кудуштеев Алексей
#include "headers.h"
static settings::initData g_init_gdiplus;


namespace settings {

initData::initData(void) noexcept : token(0), gdi_ok(FALSE) {
	::CoInitialize(nullptr);
	::InitCommonControls();

	token  = 0;
	gdi_ok = FALSE;

	Gdiplus::GdiplusStartupInput input;
	if(Gdiplus::GdiplusStartup(&token, &input, nullptr) != Gdiplus::Ok)
		return;
	gdi_ok = TRUE;
}


initData::~initData(){
	if(gdi_ok){
		Gdiplus::GdiplusShutdown(token);
		token  = 0;
		gdi_ok = FALSE;
	}
	::CoUninitialize();
}

};


//------------------------------------------------------------------------------------------------------------------------------


// Функция принимает на входе целочисленный числовой код ошибки, показывает описание ошибки - по текущей локали
void MessageError(HWND hwnd, DWORD code) noexcept {
	HLOCAL local = nullptr;
	FormatMessageW(FORMAT_MESSAGE_FROM_SYSTEM | FORMAT_MESSAGE_ALLOCATE_BUFFER, nullptr, code,
	               MAKELANGID(LANG_USER_DEFAULT, SUBLANG_ENGLISH_US), (LPWSTR)&local, 0, nullptr);
	if(local != nullptr){
		LPCWSTR ptr = reinterpret_cast<LPCWSTR>(LocalLock(local));
		if(ptr != nullptr){
			MessageBoxW(hwnd, ptr, L"Ошибка", MB_OK | MB_ICONEXCLAMATION);
			LocalUnlock(local);
		}
		LocalFree(local);
	}
}


//загрузка графических файлов файлов
Gdiplus::Image* image_load_resource(HINSTANCE hinst, UINT id) noexcept {
	HRSRC src = FindResourceW(hinst, MAKEINTRESOURCEW(id), L"PNG");
	if(src == nullptr)
		return nullptr;

	HGLOBAL data = LoadResource(hinst, src);
	if(data == nullptr)
		return nullptr;

	DWORD  size = SizeofResource(hinst, src);
	HGLOBAL dst = GlobalAlloc(GPTR, size);
	if(dst == nullptr)
		return nullptr;

	PBYTE dst1 = (PBYTE)GlobalLock(dst);
	if(dst1 == nullptr){
		GlobalFree(dst);
		return nullptr;
	}

	PBYTE src1 = (PBYTE)LockResource(data);
	if(src1 != nullptr)
		std::memcpy(dst1, src1, size);

	IStream* istr = nullptr;
	if(FAILED(CreateStreamOnHGlobal(dst, FALSE, &istr)))
		return nullptr;

	Gdiplus::Image* img = nullptr;
	try {
		img = Gdiplus::Image::FromStream(istr);
		if((img != nullptr) && (img->GetLastStatus() != Gdiplus::Ok)){
			delete img;
			img = nullptr;
		}
	} catch(...){
		img = nullptr;
	}
	FreeResource(data);
	GlobalFree(dst);
	istr->Release();
	return img;
}


//изменение размера сохраняя пропорции
void new_image_size(LPSIZE lpsz, LPSIZE dlg_size, LPSIZE image_size) noexcept {
	const double rx = static_cast<double>(dlg_size->cx) / static_cast<double>(image_size->cx);
	const double ry = static_cast<double>(dlg_size->cy) / static_cast<double>(image_size->cy);
	const double fm = std::min(rx, ry);

	const double cx = static_cast<double>(image_size->cx) * fm;
	const double cy = static_cast<double>(image_size->cy) * fm;
	lpsz->cx = static_cast<LONG>(cx);
	lpsz->cy = static_cast<LONG>(cy);
}


//диалог выбора пути для сохранение файла
BOOL dialog_save(HWND hwnd, LPWSTR path, LPCWSTR title, LPCWSTR filter, LPCWSTR init_dir, LPUINT index) noexcept {
	OPENFILENAMEW dlg;
	BOOL  ret = FALSE;
	path[0]   = L'\0';

	std::memset(&dlg, 0, sizeof(dlg));
	dlg.lStructSize     = sizeof(dlg);
	dlg.lpstrFilter     = filter;
	dlg.hwndOwner       = hwnd;
	dlg.nFilterIndex    = 1;
	dlg.lpstrFile       = path;
	dlg.nMaxFile        = MAX_PATH;
	dlg.lpstrTitle      = title;
	dlg.lpstrDefExt     = L"*\0";
	dlg.lpstrInitialDir = init_dir;
	dlg.hInstance       = (HINSTANCE)GetWindowLongPtrW(hwnd, GWLP_HINSTANCE);
	dlg.Flags           = OFN_FILEMUSTEXIST | OFN_HIDEREADONLY | OFN_OVERWRITEPROMPT | OFN_PATHMUSTEXIST | OFN_EXPLORER;

	ret = GetSaveFileNameW(&dlg);
	if(!ret){
		if(CommDlgExtendedError() == FNERR_BUFFERTOOSMALL){
			ret = FALSE;
			MessageBoxW(hwnd, L"Слишком длинный путь!!!", L"Ошибка", MB_YESNO | MB_ICONEXCLAMATION);
		}
	} else {
		if(index != nullptr)
			*index = dlg.nFilterIndex;
	}
	return ret;
}


//диалог выбора пути для сохранение файла
BOOL dialog_open(HWND hwnd, LPWSTR path, LPCWSTR title, LPCWSTR filter, LPCWSTR init_dir, LPUINT index) noexcept {
	OPENFILENAMEW dlg;
	BOOL  ret = FALSE;
	path[0]   = L'\0';

	std::memset(&dlg, 0, sizeof(dlg));
	dlg.lStructSize     = sizeof(dlg);
	dlg.lpstrFilter     = filter;
	dlg.hwndOwner       = hwnd;
	dlg.nFilterIndex    = 1;
	dlg.lpstrFile       = path;
	dlg.nMaxFile        = MAX_PATH;
	dlg.lpstrTitle      = title;
	dlg.lpstrDefExt     = L"*\0";
	dlg.lpstrInitialDir = init_dir;
	dlg.hInstance       = (HINSTANCE)GetWindowLongPtrW(hwnd, GWLP_HINSTANCE);
	dlg.Flags           = OFN_FILEMUSTEXIST | OFN_HIDEREADONLY | OFN_OVERWRITEPROMPT | OFN_PATHMUSTEXIST | OFN_EXPLORER;

	ret = GetOpenFileNameW(&dlg);
	if(!ret){
		if(CommDlgExtendedError() == FNERR_BUFFERTOOSMALL){
			ret = FALSE;
			MessageBoxW(hwnd, L"Слишком длинный путь!!!", L"Ошибка", MB_YESNO | MB_ICONEXCLAMATION);
		}
	} else {
		if(index != nullptr)
			*index = dlg.nFilterIndex;
	}
	return ret;
}


//преобразование из пикселей в проценты диалога
int control_pixel_to_procent(int dlg_size, int ctrl_size) noexcept {
	const double procent = static_cast<const double>(dlg_size) / 100.0;
	return static_cast<const int>(static_cast<double>(ctrl_size) / procent);
}

int control_procent_to_pixel(int dlg_size, int ctrl_procent) noexcept {
	const double procent = static_cast<const double>(dlg_size) / 100.0;
	return static_cast<const int>(static_cast<double>(ctrl_procent) * procent);
}


//упаковка контролов
bool controls_pack(HWND hwnd, std::vector<resize_t>& cs, const UINT* ids, const UINT* flags, const std::size_t num) noexcept {
	try {
		cs.clear();
		cs.resize(num);
	} catch(...){
		return false;
	}

	HWND ctrl;
	RECT rc, crc;
	GetClientRect(hwnd, &rc);

	auto p = cs.begin();
	for(std::size_t i = 0; i < num; ++i, ++p){
		p->id   = ids[i];
		p->type = flags[i];
		ctrl    = GetDlgItem(hwnd, ids[i]);

		GetWindowRect(ctrl, &crc);
		crc.right  -= crc.left;
		crc.bottom -= crc.top;

		ScreenToClient(hwnd, (LPPOINT)&crc);

		if(p->type & C_RESIZE_PWIDTH)
			p->offsetX = control_pixel_to_procent(rc.right, crc.right);
		else if(p->type & C_RESIZE_WIDTH)
			p->offsetX = rc.right - crc.right;
		else
			p->offsetX = rc.right - (crc.left + crc.right);

		if(p->type & C_RESIZE_PHEIGHT)
			p->offsetY = control_pixel_to_procent(rc.bottom, crc.bottom);
		else if(p->type & C_RESIZE_HEIGHT)
			p->offsetY = rc.bottom - crc.bottom;
		else
			p->offsetY = rc.bottom - (crc.top  + crc.bottom);
	}
	return true;
}


//обновление координат контролов не стал городить ObServer, паттерн наблюдатель для этого был бы самое-то
void controls_update(HWND hwnd, std::vector<resize_t>& cs) noexcept {
	HWND ctrl;
	RECT rc, crc;
	GetClientRect(hwnd, &rc);

	for(auto& c : cs){
		ctrl = GetDlgItem(hwnd, c.id);

		GetWindowRect(ctrl, &crc);
		crc.right  -= crc.left;
		crc.bottom -= crc.top;

		ScreenToClient(hwnd, (LPPOINT)&crc);

		if(c.type & C_RESIZE_PWIDTH)
			c.offsetX = control_pixel_to_procent(rc.right, crc.right);
		else if(c.type & C_RESIZE_WIDTH)
			c.offsetX = rc.right - crc.right;
		else
			c.offsetX = rc.right - (crc.left + crc.right);

		if(c.type & C_RESIZE_PHEIGHT)
			c.offsetY = control_pixel_to_procent(rc.bottom, crc.bottom);
		else if(c.type & C_RESIZE_HEIGHT)
			c.offsetY = rc.bottom - crc.bottom;
		else
			c.offsetY = rc.bottom - (crc.top  + crc.bottom);
	}
}


//изменение позиции или размера контролов
void controls_resize(HWND hwnd, const std::vector<resize_t>& cs) noexcept {
	HWND ctrl;
	RECT rc, crc;
	std::memset(&rc, 0, sizeof(rc));
	std::memset(&crc, 0, sizeof(crc));
	GetClientRect(hwnd, &rc);

	int x = 0, width  = 0;
	int y = 0, height = 0;
	for(const resize_t& c : cs){
		ctrl = GetDlgItem(hwnd, c.id);
		GetWindowRect(ctrl, &crc);
		crc.right  -= crc.left;
		crc.bottom -= crc.top;
		ScreenToClient(hwnd, (LPPOINT)&crc);

		if(c.type & C_RESIZE_WIDTH){
			width = rc.right - c.offsetX;
			x     = crc.left;
		} else if(c.type & C_RESIZE_OFFSET_X){
			x     = rc.right - crc.right - c.offsetX;
			width = crc.right;
		} else if(c.type & C_RESIZE_PWIDTH){
			x     = crc.left;
			width = control_procent_to_pixel(rc.right, c.offsetX);
		} else {
			x     = crc.left;
			width = crc.right;
		}

		if(c.type & C_RESIZE_HEIGHT){
			height = rc.bottom - c.offsetY;
			y      = crc.top;
		} else if(c.type & C_RESIZE_OFFSET_Y){
			y      = rc.bottom - crc.bottom - c.offsetY;
			height = crc.bottom;
		} else if(c.type & C_RESIZE_PHEIGHT){
			y      = crc.top;
			height = control_procent_to_pixel(rc.bottom, c.offsetY);
		} else {
			y      = crc.top;
			height = crc.bottom;
		}

		if(!((x == crc.left) && (y == crc.top) && (width == crc.right) && (height == crc.bottom))){
			SetWindowPos(ctrl, nullptr, x, y, width, height, SWP_NOZORDER);
			InvalidateRect(ctrl, nullptr, TRUE);
		}
	}
}


//ограничение на размер минимума окна
BOOL dialog_resize_min(HWND hwnd, WPARAM wParam, LPARAM lParam, int width, int height) noexcept {
	const SIZE c_min_size {width, height};
	LPRECT lprc = (LPRECT)lParam;
	const int w = lprc->right  - lprc->left;
	const int h = lprc->bottom - lprc->top;
	BOOL    ret = FALSE;

	switch(wParam){
	case WMSZ_RIGHT:
	case WMSZ_BOTTOM:
	case WMSZ_BOTTOMRIGHT:
		if(w < c_min_size.cx){
			ret = TRUE;
			lprc->right = lprc->left + c_min_size.cx;
		}
jmp_x:
		if(h < c_min_size.cy){
			ret = TRUE;
			lprc->bottom = lprc->top + c_min_size.cy;
		}
		break;
	case WMSZ_TOP:
	case WMSZ_LEFT:
	case WMSZ_TOPLEFT:
		if(w < c_min_size.cx){
			ret = TRUE;
			lprc->left = lprc->right - c_min_size.cx;
		}
jmp_y:
		if(h < c_min_size.cy){
			ret = TRUE;
			lprc->top = lprc->bottom - c_min_size.cy;
		}
		break;
	case WMSZ_TOPRIGHT:
		if(w < c_min_size.cx){
			ret = TRUE;
			lprc->right = lprc->left + c_min_size.cx;
		}
		goto jmp_y;
		break;
	case WMSZ_BOTTOMLEFT:
		if(w < c_min_size.cx){
			ret = TRUE;
			lprc->left = lprc->right - c_min_size.cx;
		}
		goto jmp_x;
		break;
	}
	return ret;
}


//------------------------------------------------------------------------------------------------------------------------------------------


namespace gdi {

graphics::graphics(void) noexcept : mdc(nullptr), hbm(nullptr), bwidth(0), bheight(0), quality(HALFTONE), vert_rot(BMP_ROTATE), horz_rot(BMP_ROTATE) {}

graphics::graphics(graphics&& g) noexcept : mdc(nullptr), hbm(nullptr), bwidth(0), bheight(0), quality(HALFTONE), vert_rot(BMP_ROTATE), horz_rot(BMP_ROTATE) {
	*this = std::move(g);
}

graphics::~graphics(){
	this->dispose();
}


bool graphics::create(int width, int height) noexcept {
	this->release();
	HDC hdc = ::GetDC(nullptr);
	if(mdc == nullptr)
		mdc = ::CreateCompatibleDC(hdc);
	if(hbm != nullptr)
		::DeleteObject(hbm);

	hbm = ::CreateCompatibleBitmap(hdc, width, height);
	if(hbm != nullptr){
		::SelectObject(mdc, hbm);
		bwidth  = width;
		bheight = height;
	}
	::ReleaseDC(nullptr, hdc);
	return (mdc != nullptr) && (hbm != nullptr);
}


void graphics::set(HBITMAP _hbm, const LPSIZE lpsz) noexcept {
	this->release();
	if(mdc == nullptr){
		HDC hdc = ::GetDC(nullptr);
		mdc     = ::CreateCompatibleDC(hdc);
		::ReleaseDC(nullptr, hdc);
	}

	hbm = _hbm;
	::SelectObject(mdc, hbm);
	bwidth  = lpsz->cx;
	bheight = lpsz->cy;
}


bool graphics::load(HINSTANCE hinst, UINT id) noexcept {
	this->release();
	if(mdc == nullptr){
		HDC hdc = ::GetDC(nullptr);
		mdc     = ::CreateCompatibleDC(hdc);
		::ReleaseDC(nullptr, hdc);
	}

	hbm = reinterpret_cast<HBITMAP>(::LoadImageW(hinst, MAKEINTRESOURCEW(id), IMAGE_BITMAP, 0, 0, LR_CREATEDIBSECTION));
	if(hbm == nullptr){
		this->dispose();
		return false;
	}
	::SelectObject(mdc, hbm);

	BITMAP bi{};
	::GetObject(hbm, sizeof(bi), (PVOID)&bi);
	bwidth  = std::abs(bi.bmWidth);
	bheight = std::abs(bi.bmHeight);
	return true;
}


void graphics::clear(HBRUSH bgcolor) noexcept {
	RECT rc{0, 0, bwidth, bheight};
	::FillRect(mdc, &rc, bgcolor);
}


void graphics::setQuality(bool enabled) noexcept {
	quality = (enabled) ? HALFTONE : COLORONCOLOR;
}


void graphics::draw(HDC hdc, int x, int y, DWORD rop) noexcept {
	::BitBlt(hdc, x, y, bwidth, bheight, mdc, 0, 0, rop);
}


void graphics::draw(HDC hdc, int x, int y, int width, int height, DWORD rop) noexcept {
	int sx = 0;
	int sy = 0;
	int sw = bwidth;
	int sh = bheight;

	if(horz_rot == BMP_INVERSE_HORZ){
		sx =  bwidth;
		sw = -bwidth;
	}

	if(vert_rot == BMP_INVERSE_VERT){
		sy =  bheight;
		sh = -bheight;
	}

	if((width <= bwidth) && (height <= bheight))
		::StretchBlt(hdc, x, y, width, height, mdc, sx, sy, sw, sh, rop);
	else {
		int mode = ::SetStretchBltMode(hdc, quality);
		::StretchBlt(hdc, x, y, width, height, mdc, sx, sy, sw, sh, rop);
		::SetStretchBltMode(hdc, mode);
	}
}


void graphics::dispose(void) noexcept {
	if(mdc != nullptr)
		::DeleteDC(mdc);
	mdc = nullptr;
	this->release();
}


void graphics::release(void) noexcept {
	if(hbm != nullptr)
		::DeleteObject(hbm);
	hbm = nullptr;
	vert_rot = horz_rot = BMP_ROTATE;
}


//присвоить
void graphics::setFlip(bmp_rotate type) noexcept {
	if(type == BMP_INVERSE_HORZ){
		if(horz_rot == type)
			horz_rot = BMP_ROTATE;
		else
			horz_rot = type;
	} else if(type == BMP_INVERSE_VERT){
		if(vert_rot == type)
			vert_rot = BMP_ROTATE;
		else
			vert_rot = type;
	}
}


HDC graphics::getDC(void) const noexcept {
	return mdc;
}

HBITMAP graphics::getBitmap(void) const noexcept {
	return hbm;
}

int graphics::getWidth(void) const noexcept {
	return bwidth;
}

int graphics::getHeight(void) const noexcept {
	return bheight;
}

BOOL graphics::isRotate(void) const noexcept {
	return ((vert_rot != BMP_ROTATE) || (horz_rot != BMP_ROTATE));
}


graphics& graphics::operator = (graphics&& g) noexcept {
	if(this != &g){
		this->dispose();
		mdc      = g.mdc;
		hbm      = g.hbm;
		bwidth   = g.bwidth;
		bheight  = g.bheight;
		vert_rot = g.vert_rot;
		horz_rot = g.horz_rot;
		g.mdc    = nullptr;
		g.hbm    = nullptr;
		g.bwidth = g.bheight = 0;
	}
	return *this;
}

};
