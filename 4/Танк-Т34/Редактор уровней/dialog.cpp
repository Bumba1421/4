/*
	 автор(с): Кудуштеев Алексей
	    Среда: Code::Blocks
	Версия ЯП: C++14
*/
#include "headers.h"
static std::unordered_map<ULONG_PTR, base_dialog*> g_dialogs{};


base_dialog::base_dialog(void) noexcept : hwnd(nullptr), hinst(nullptr), events{} {}

base_dialog::~base_dialog(){
	this->close();
}


//запуск модального окна
int base_dialog::show_modal(HINSTANCE _hinst, HWND parent, LPCWSTR res) noexcept {
	hinst = _hinst;
	return ::DialogBoxParamW(hinst, res, parent, reinterpret_cast<DLGPROC>(&base_dialog::dialog_proc), (LPARAM)this);
}


BOOL base_dialog::show(int flag) noexcept {
	BOOL ret = ::ShowWindow(hwnd, flag);
	if(ret)
		ret = ::UpdateWindow(hwnd);
	return ret;
}


BOOL base_dialog::create(HINSTANCE _hinst, HWND parent, LPCWSTR res) noexcept {
	hinst = _hinst;
	hwnd  = ::CreateDialogParamW(hinst, res, parent, reinterpret_cast<DLGPROC>(&base_dialog::dialog_proc), (LPARAM)this);
	return (hwnd != nullptr);
}


BOOL base_dialog::setEnabled(BOOL enabled) noexcept {
	return ::EnableWindow(hwnd, enabled);
}


int base_dialog::message_loop(void) noexcept {
	MSG msg{};
	int ret;
	while((ret = (int)::GetMessageW(&msg, nullptr, 0, 0))){
		if(ret == -1)
			break;
		else if(!::IsDialogMessageW(::GetActiveWindow(), &msg)){
			::TranslateMessage(&msg);
			::DispatchMessageW(&msg);
		}
	}
	return static_cast<int>(msg.wParam);
}


//закрыть диалог
void base_dialog::close(void) noexcept {
	try {
		events.clear();
	} catch(...) {}

	if(hwnd != nullptr)
		DestroyWindow(hwnd);
	hwnd = nullptr;
}


BOOL base_dialog::invalidate(LPCRECT lprc, BOOL berase) noexcept {
	return ::InvalidateRect(hwnd, lprc, berase);
}


//удаление события
bool base_dialog::remove_event(UINT msg) noexcept {
	bool res = true;
	try {
		auto p = events.find(msg);
		if(p != events.end()){
			events.erase(p);
			res = true;
		}
	} catch(...){
		res = false;
	}
	return res;
}


BOOL base_dialog::getCoord(LPPOINT pt, LPSIZE size) noexcept {
	RECT rc;
	BOOL ret = ::GetWindowRect(hwnd, &rc);
	pt->x    = rc.left;
	pt->y    = rc.top;
	size->cx = rc.right  - rc.left;
	size->cy = rc.bottom - rc.top;
	return ret;
}


BOOL base_dialog::getClientSize(LPSIZE size) noexcept {
	RECT rc{};
	BOOL ret = ::GetClientRect(hwnd, &rc);
	size->cx = rc.right  - rc.left;
	size->cy = rc.bottom - rc.top;
	return ret;
}


BOOL base_dialog::getLocation(LPPOINT pt) noexcept {
	RECT rc;
	BOOL ret = ::GetWindowRect(hwnd, &rc);
	pt->x    = rc.left;
	pt->y    = rc.top;
	return ret;
}


BOOL base_dialog::getSize(LPSIZE size) noexcept {
	RECT rc;
	BOOL ret = ::GetWindowRect(hwnd, &rc);
	size->cx = rc.right  - rc.left;
	size->cy = rc.bottom - rc.top;
	return ret;
}


// Потобезопасный
INT_PTR CALLBACK base_dialog::dialog_proc(HWND hDlg, UINT msg, WPARAM wParam, LPARAM lParam) noexcept {
	if(msg == WM_INITDIALOG){

		base_dialog* obj = reinterpret_cast<base_dialog*>(lParam);
		try {
			g_dialogs.insert(std::make_pair((ULONG_PTR)hDlg, obj));
		} catch(...){
			return FALSE;
		}
		obj->hwnd = hDlg;

		auto p = obj->events.find(msg);
		if(p != obj->events.end())
			(obj->*p->second)(wParam, lParam);
		return TRUE;
	} else {

		if(msg == WM_DESTROY){
			auto p = g_dialogs.find((ULONG_PTR)hDlg);
			if(p != g_dialogs.end())
				g_dialogs.erase(p);

			if(g_dialogs.empty())
				PostQuitMessage(0);
			return 0;
		}

		auto it = g_dialogs.find((ULONG_PTR)hDlg);
		if(it != g_dialogs.end()){
			base_dialog* obj = it->second;

			INT_PTR ret = FALSE;
			auto    p   = obj->events.find(msg);
			if(p != obj->events.end())
				ret = (obj->*p->second)(wParam, lParam);

			if(msg == WM_CLOSE){

				if(ret){
					if(it != g_dialogs.end())
						g_dialogs.erase(it);
					obj->close();
				}

				if(ret && g_dialogs.empty())
					PostQuitMessage(0);
				return ret;
			}
			return ret;
		}
	}
	return FALSE;
}
