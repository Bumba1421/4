/*
	 автор(с): Кудуштеев Алексей
	    Среда: Code::Blocks
	Версия ЯП: C++14
*/
#if !defined(_DIALOG_KUDUSHTEEV_H_)
#define _DIALOG_KUDUSHTEEV_H_
#ifdef _MSC_VER
#pragma once
#endif


//базовый класс-диалога
class base_dialog {
	using call_t  = INT_PTR (__fastcall base_dialog::*)(WPARAM, LPARAM) noexcept;
	using event_t = std::unordered_map<UINT, call_t>;
private:
	HWND      hwnd;
	HINSTANCE hinst;
	event_t   events;
public:
	base_dialog(void) noexcept;
	virtual ~base_dialog();

	base_dialog(const base_dialog&) = delete;
	base_dialog(base_dialog&&) = delete;
	base_dialog& operator = (const base_dialog&) = delete;
	base_dialog& operator = (base_dialog&&) = delete;
public:
	int  show_modal(HINSTANCE hinst, HWND parent, LPCWSTR res) noexcept;
	BOOL show(int flag = SW_SHOWDEFAULT) noexcept;
	BOOL create(HINSTANCE hinst, HWND parent, LPCWSTR res) noexcept;
	void close(void) noexcept;
	BOOL setEnabled(BOOL enabled) noexcept;
	BOOL invalidate(LPCRECT lprc = nullptr, BOOL berase = TRUE) noexcept;

	static int message_loop(void) noexcept;

	HWND      getHandle(void) const noexcept { return hwnd; }
	HINSTANCE getModule(void) const noexcept { return hinst; }
	BOOL getCoord(LPPOINT pt, LPSIZE size) noexcept;
	BOOL getSize(LPSIZE size) noexcept;
	BOOL getLocation(LPPOINT lpt) noexcept;
	BOOL getClientSize(LPSIZE size) noexcept;
protected:

	template<typename Fun>
	bool put_event(UINT msg, Fun fun) noexcept {
		try {
			events.insert(std::make_pair(msg, reinterpret_cast<call_t>(fun)));
		} catch(...){
			return false;
		}
		return true;
	}

	bool remove_event(UINT msg) noexcept;
private:
	static INT_PTR CALLBACK dialog_proc(HWND hDlg, UINT msg, WPARAM wParam, LPARAM lParam) noexcept;
};


#endif
