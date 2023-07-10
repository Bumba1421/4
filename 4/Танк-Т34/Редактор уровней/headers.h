/*
	 автор(с): Кудуштеев Алексей
	    Среда: Code::Blocks
	Версия ЯП: C++14
*/
#if !defined(_KUDUSHTEEV_HEADERS_)
#define _KUDUSHTEEV_HEADERS_
#ifdef _MSC_VER
#pragma once
#endif
#ifndef STRICT
#define STRICT
#endif

#ifndef _CRT_SECURE_NO_WARNINGS
#define _CRT_SECURE_NO_WARNINGS  1
#endif

#ifndef UNICODE
#define UNICODE
#endif

#ifndef _UNICODE
#define _UNICODE
#endif

#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif

#if defined(_WIN32_WINNT) && (_WIN32_WINNT < 0x0501)
#undef  _WIN32_WINNT
#define _WIN32_WINNT  0x0501
#elif _WIN32_WINNT
#undef _WIN32_WINNT
#define _WIN32_WINNT  0x0501
#else
#define _WIN32_WINNT  0x0501
#endif

#if defined(WINVER) && (WINVER < 0x0500)
#undef WINVER
#define WINVER 0x0500
#else
#define WINVER 0x0500
#endif

#if defined(_WIN32_IE) && ( _WIN32_IE < 0x0300)
#undef  _WIN32_IE
#define  _WIN32_IE 0x0601
#elif _WIN32_IE
#undef _WIN32_IE
#define _WIN32_IE 0x0601
#else
#define _WIN32_IE 0x0601
#endif

#ifdef __STRICT_ANSI__
#undef __STRICT_ANSI__
#endif

#include <windows.h>
#include <windowsx.h>
#include <ole2.h>
#include <commdlg.h>
#include <commctrl.h>
#include <cderr.h>
#include <string>
#include <cstring>
#include <memory>
#include <unordered_map>
#include <initializer_list>
#include <type_traits>
#include <vector>
#include <forward_list>
#include <cmath>
#include <wchar.h>
#include <stdio.h>
#include <gdiplus.h>

#include "resource.h"
#include "dialog.h"
#include "settings.h"
#include "application.h"
#endif
