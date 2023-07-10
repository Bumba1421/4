//Автор(с): Кудуштеев Алексей
#if !defined(_SETTINGS_KUDUSHTEEV_H_)
#define _SETTINGS_KUDUSHTEEV_H_
#ifdef _MSC_VER
#pragma once
#endif
#define C_RESIZE_HEIGHT   1
#define C_RESIZE_OFFSET_Y 2
#define C_RESIZE_PHEIGHT  16

#define C_RESIZE_WIDTH    4
#define C_RESIZE_OFFSET_X 8
#define C_RESIZE_PWIDTH   32


typedef struct {
	UINT id;
	UINT type;
	int  offsetX;
	int  offsetY;
} resize_t;


extern int  control_pixel_to_procent(int dlg_size, int ctrl_size) noexcept;
extern int  control_procent_to_pixel(int dlg_size, int ctrl_procent) noexcept;
extern bool controls_pack(HWND hwnd, std::vector<resize_t>& cs, const UINT* ids, const UINT* flags, const std::size_t num) noexcept;
extern void controls_resize(HWND hwnd, const std::vector<resize_t>& cs) noexcept;
extern void controls_update(HWND hwnd, std::vector<resize_t>& cs) noexcept;
extern BOOL dialog_resize_min(HWND hwnd, WPARAM wParam, LPARAM lParam, int width, int height) noexcept;


namespace settings {

//инициализация Gdiplus, создание отдельной кучи-HEAP
class initData final {
private:
	ULONG_PTR token;
	BOOL      gdi_ok;
public:
	initData(void) noexcept;
	~initData();

	initData(const initData&) = delete;
	initData(initData&&) = delete;
	initData& operator = (const initData&) = delete;
	initData& operator = (initData&&) = delete;
};

};


namespace gdi {

//HBRUSH, HPEN, HFONT
template<typename Gdi>
class gobject final {
private:
	Gdi gdi;
public:
	gobject(void) noexcept : gdi(nullptr){}

	gobject(gobject&& obj) noexcept : gdi(nullptr) {
		*this = std::move(obj);
	}

	~gobject(){
		this->dispose();
	}

	gobject& operator = (gobject&& obj) noexcept {
		if(this != &obj){
			this->dispose();
			gdi     = obj.gdi;
			obj.gdi = nullptr;
		}
		return *this;
	}

	gobject(const gobject&) = delete;
	gobject& operator = (const gobject&) = delete;
public:
	void set(Gdi _gdi) noexcept {
		gdi = _gdi;
	}

	Gdi get(void) noexcept {
		return gdi;
	}

	void dispose(void) noexcept {
		if(gdi != nullptr)
			::DeleteObject(gdi);
		gdi = nullptr;
	}
};


//-----------------------------------------------------------------------------------------------------------------------------------------


enum bmp_rotate : WORD {
	BMP_ROTATE = 0, BMP_INVERSE_HORZ = 2, BMP_INVERSE_VERT = 3
};


//буфер-графический контекст
class graphics final {
private:
	HDC        mdc;
	HBITMAP    hbm;
	int        bwidth;
	int        bheight;
	int        quality;
	bmp_rotate vert_rot;
	bmp_rotate horz_rot;
public:
	graphics(void) noexcept;
	graphics(graphics&&) noexcept;
	~graphics();

	graphics& operator = (graphics&&) noexcept;
	graphics(const graphics&) = delete;
	graphics& operator = (const graphics&) = delete;
public:
	bool create(int width, int height) noexcept;
	void set(HBITMAP hbm, const LPSIZE lpsz) noexcept;
	bool load(HINSTANCE hinst, UINT id) noexcept;
	void setQuality(bool enabled) noexcept;
	void draw(HDC hdc, int x, int y, DWORD rop = SRCCOPY) noexcept;
	void draw(HDC hdc, int x, int y, int width, int height, DWORD rop = SRCCOPY) noexcept;
	void setFlip(bmp_rotate type) noexcept;
	BOOL isRotate(void) const noexcept;
	void reset(void) noexcept;
	void clear(HBRUSH bgcolor) noexcept;
	void dispose(void) noexcept;
	void release(void) noexcept;
	HDC getDC(void) const noexcept;
	HBITMAP getBitmap(void) const noexcept;
	int getWidth(void) const noexcept;
	int getHeight(void) const noexcept;
};

};


//---------------------------------------------------------------------------------------------------------------------------


extern WCHAR* int_to_str(WCHAR* buf, DWORDLONG num) noexcept;
extern void new_image_size(LPSIZE lpsz, LPSIZE dlg_size, LPSIZE image_size) noexcept;
extern BOOL dialog_save(HWND hwnd, LPWSTR path, LPCWSTR title, LPCWSTR filter, LPCWSTR init_dir = nullptr, LPUINT index = nullptr) noexcept;
extern BOOL dialog_open(HWND hwnd, LPWSTR path, LPCWSTR title, LPCWSTR filter, LPCWSTR init_dir = nullptr, LPUINT index = nullptr) noexcept;
extern void MessageError(HWND hwnd, DWORD code) noexcept;
extern Gdiplus::Image* image_load_resource(HINSTANCE hinst, UINT id) noexcept;

#endif
