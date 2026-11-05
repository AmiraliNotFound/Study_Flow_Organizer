#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <shellapi.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/**
 * Study Flow Organizer - Native Windows GUI Launcher
 *
 * Compiles with: gcc -mwindows -O2 launcher.c -o Study_Flow_Organizer.exe
 *
 * Provides:
 * 1. 100% native Windows GUI subsystem (no console/cmd window)
 * 2. Automatic detection of dist\Study_Flow_Organizer.exe or node desktop\launcher.js
 * 3. Graceful fallback to app\index.html in browser
 */

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    wchar_t exeDir[MAX_PATH];
    GetModuleFileNameW(NULL, exeDir, MAX_PATH);
    wchar_t *lastSlash = wcsrchr(exeDir, L'\\');
    if (lastSlash) {
        *lastSlash = L'\0';
    }

    // Check for dist\Study_Flow_Organizer.exe
    wchar_t standaloneExe[MAX_PATH];
    _snwprintf(standaloneExe, MAX_PATH, L"%s\\dist\\Study_Flow_Organizer.exe", exeDir);

    STARTUPINFOW si;
    PROCESS_INFORMATION pi;
    ZeroMemory(&si, sizeof(si));
    si.cb = sizeof(si);
    si.dwFlags = STARTF_USESHOWWINDOW;
    si.wShowWindow = SW_HIDE;
    ZeroMemory(&pi, sizeof(pi));

    if (GetFileAttributesW(standaloneExe) != INVALID_FILE_ATTRIBUTES) {
        if (CreateProcessW(standaloneExe, NULL, NULL, NULL, FALSE, CREATE_NO_WINDOW, NULL, exeDir, &si, &pi)) {
            CloseHandle(pi.hThread);
            CloseHandle(pi.hProcess);
            return 0;
        }
    }

    // Fallback: Run node desktop\launcher.js
    wchar_t nodeCmd[MAX_PATH * 2];
    _snwprintf(nodeCmd, MAX_PATH * 2, L"node \"%s\\desktop\\launcher.js\"", exeDir);

    if (CreateProcessW(NULL, nodeCmd, NULL, NULL, FALSE, CREATE_NO_WINDOW, NULL, exeDir, &si, &pi)) {
        CloseHandle(pi.hThread);
        CloseHandle(pi.hProcess);
        return 0;
    }

    // Standalone fallback: Open app\index.html directly
    wchar_t htmlPath[MAX_PATH];
    _snwprintf(htmlPath, MAX_PATH, L"%s\\app\\index.html", exeDir);
    ShellExecuteW(NULL, L"open", htmlPath, NULL, NULL, SW_SHOWNORMAL);

    return 0;
}
