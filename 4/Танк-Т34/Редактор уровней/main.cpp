/*
	 автор(с): Кудуштеев Алексей
	    Среда: Code::Blocks
	Версия ЯП: C++14
*/
#include "headers.h"
#include "resource.h"
#define RUS_LOCALE_1049  LCID(1049)


int APIENTRY WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nShowCmd){
	std::setlocale(LC_CTYPE, "rus");
	if(GetThreadLocale() != RUS_LOCALE_1049)
		SetThreadLocale(RUS_LOCALE_1049);

	auto app = std::make_unique<application>();
	app->create(hInstance, HWND_DESKTOP, MAKEINTRESOURCEW(IDD_DIALOG));
	app->show();
	return base_dialog::message_loop();
}
