/*
	 автор(с): Кудуштеев Алексей
	    Среда: Code::Blocks
	Версия ЯП: C++14
*/
#if !defined(_APPLICATION_KUDUSHTEEV_H_)
#define _APPLICATION_KUDUSHTEEV_H_
#ifdef _MSC_VER
#pragma once
#endif
#define ROWS  24
#define COLS  30


typedef struct {
	BYTE field[ROWS * COLS];
} field_t;


class application final : public base_dialog {
private:
	std::unique_ptr<Gdiplus::Image> blocks;
	HWND  tiles;
	HWND  field;
	HWND  hlevel;
	HFONT font;
	int   fheight;
	HPEN  pen;
	int   cell_cx;
	int   cell_cy;
	RECT  frame;
	int   ilevel;
	std::vector<resize_t> controls;
	gdi::graphics         bgcolor;
	gdi::graphics         background;
	std::vector<field_t>  levels;
	WCHAR                 path[MAX_PATH + 1];
public:
	application(void) noexcept;
	virtual ~application();

	application(const application&) = delete;
	application(application&&) = delete;
	application& operator = (const application&) = delete;
	application& operator = (application&&) = delete;
private:
	INT_PTR __fastcall onInitialize(WPARAM, LPARAM) noexcept;
	INT_PTR __fastcall onCommand(WPARAM, LPARAM) noexcept;
	INT_PTR __fastcall onMouseDown(WPARAM, LPARAM) noexcept;
	INT_PTR __fastcall onMeasureItem(WPARAM, LPARAM) noexcept;
	INT_PTR __fastcall onDrawItem(WPARAM, LPARAM) noexcept;
	INT_PTR __fastcall onSize(WPARAM, LPARAM) noexcept;
	INT_PTR __fastcall onSizing(WPARAM, LPARAM) noexcept;
	INT_PTR __fastcall onClose(WPARAM, LPARAM) noexcept;
private:
	void __fastcall onDrawCanvas(HDC hDC, LPCRECT lprc) noexcept;
	void clean_background(void) noexcept;
	void onOpenLevel(int index) noexcept;
	void onSaveLevels(void) noexcept;
	void onLoadLevels(void) noexcept;
	void __fastcall onFieldDown(WPARAM button, int row, int col) noexcept;
};


#endif
