#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <shellapi.h>
#include <winsock2.h>
#include <ws2tcpip.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#pragma comment(lib, "ws2_32.lib")

/**
 * Study Flow Organizer - Pure Windows GUI Standalone Launcher
 * 
 * Features:
 * 1. 100% native Windows GUI subsystem (IMAGE_SUBSYSTEM_WINDOWS_GUI)
 * 2. ZERO terminal or command prompt windows
 * 3. Background server spawned silently with CREATE_NO_WINDOW | DETACHED_PROCESS
 * 4. Resolves full path to node.exe via SearchPathW / Program Files
 * 5. Embedded application icon (.ico)
 * 6. Launches Edge/Chrome in dedicated app mode (--app=http://127.0.0.1:3456)
 */

static int isPortOpen(int port) {
    WSADATA wsaData;
    if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) return 0;

    SOCKET s = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (s == INVALID_SOCKET) {
        WSACleanup();
        return 0;
    }

    struct sockaddr_in addr;
    addr.sin_family = AF_INET;
    addr.sin_port = htons((unsigned short)port);
    addr.sin_addr.s_addr = inet_addr("127.0.0.1");

    int connected = (connect(s, (struct sockaddr *)&addr, sizeof(addr)) == 0);
    closesocket(s);
    WSACleanup();
    return connected;
}

static void findNode(wchar_t *outPath, size_t maxLen) {
    if (SearchPathW(NULL, L"node.exe", NULL, maxLen, outPath, NULL) > 0) {
        return;
    }
    const wchar_t *envProg = _wgetenv(L"ProgramFiles");
    if (envProg) {
        _snwprintf(outPath, maxLen, L"%s\\nodejs\\node.exe", envProg);
        if (GetFileAttributesW(outPath) != INVALID_FILE_ATTRIBUTES) return;
    }
    const wchar_t *envProgX86 = _wgetenv(L"ProgramFiles(x86)");
    if (envProgX86) {
        _snwprintf(outPath, maxLen, L"%s\\nodejs\\node.exe", envProgX86);
        if (GetFileAttributesW(outPath) != INVALID_FILE_ATTRIBUTES) return;
    }
    wcsncpy(outPath, L"node.exe", maxLen);
}

static void findBrowser(wchar_t *outPath, size_t maxLen) {
    const wchar_t *envProg = _wgetenv(L"ProgramFiles");
    const wchar_t *envProgX86 = _wgetenv(L"ProgramFiles(x86)");
    const wchar_t *envLocal = _wgetenv(L"LOCALAPPDATA");

    wchar_t candidates[7][MAX_PATH];
    int count = 0;

    if (envProgX86) {
        _snwprintf(candidates[count++], MAX_PATH, L"%s\\Microsoft\\Edge\\Application\\msedge.exe", envProgX86);
        _snwprintf(candidates[count++], MAX_PATH, L"%s\\Google\\Chrome\\Application\\chrome.exe", envProgX86);
    }
    if (envProg) {
        _snwprintf(candidates[count++], MAX_PATH, L"%s\\Microsoft\\Edge\\Application\\msedge.exe", envProg);
        _snwprintf(candidates[count++], MAX_PATH, L"%s\\Google\\Chrome\\Application\\chrome.exe", envProg);
    }
    if (envLocal) {
        _snwprintf(candidates[count++], MAX_PATH, L"%s\\Microsoft\\Edge\\Application\\msedge.exe", envLocal);
        _snwprintf(candidates[count++], MAX_PATH, L"%s\\Google\\Chrome\\Application\\chrome.exe", envLocal);
    }

    for (int i = 0; i < count; i++) {
        if (GetFileAttributesW(candidates[i]) != INVALID_FILE_ATTRIBUTES) {
            wcsncpy(outPath, candidates[i], maxLen);
            return;
        }
    }
    outPath[0] = L'\0';
}

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    // 1. Get folder where this executable is located
    wchar_t exeDir[MAX_PATH];
    GetModuleFileNameW(NULL, exeDir, MAX_PATH);
    wchar_t *lastSlash = wcsrchr(exeDir, L'\\');
    if (lastSlash) *lastSlash = L'\0';

    // 2. Start server in background if not already running on port 3456
    if (!isPortOpen(3456)) {
        wchar_t nodePath[MAX_PATH];
        findNode(nodePath, MAX_PATH);

        wchar_t nodeCmd[MAX_PATH * 3];
        _snwprintf(nodeCmd, MAX_PATH * 3, L"\"%s\" \"%s\\server\\server.js\"", nodePath, exeDir);

        STARTUPINFOW siNode;
        PROCESS_INFORMATION piNode;
        ZeroMemory(&siNode, sizeof(siNode));
        siNode.cb = sizeof(siNode);
        siNode.dwFlags = STARTF_USESHOWWINDOW;
        siNode.wShowWindow = SW_HIDE;
        ZeroMemory(&piNode, sizeof(piNode));

        // 0x08000000 = CREATE_NO_WINDOW
        if (CreateProcessW(NULL, nodeCmd, NULL, NULL, FALSE, 0x08000000 | DETACHED_PROCESS, NULL, exeDir, &siNode, &piNode)) {
            CloseHandle(piNode.hThread);
            CloseHandle(piNode.hProcess);

            // Poll port 3456 for up to 3 seconds until server is ready
            for (int i = 0; i < 30; i++) {
                Sleep(100);
                if (isPortOpen(3456)) break;
            }
        }
    }

    // 3. Locate Edge or Chrome to run in dedicated standalone app mode
    wchar_t browserPath[MAX_PATH];
    findBrowser(browserPath, MAX_PATH);

    const wchar_t *appData = _wgetenv(L"APPDATA");
    wchar_t profileDir[MAX_PATH];
    if (appData) {
        _snwprintf(profileDir, MAX_PATH, L"%s\\StudyFlowOrganizer\\desktop_profile", appData);
        CreateDirectoryW(profileDir, NULL);
    } else {
        _snwprintf(profileDir, MAX_PATH, L"%s\\desktop_profile", exeDir);
    }

    if (browserPath[0] != L'\0') {
        // Launch as a dedicated standalone desktop window
        wchar_t browserCmd[MAX_PATH * 3];
        _snwprintf(browserCmd, MAX_PATH * 3,
            L"\"%s\" --app=http://127.0.0.1:3456 --user-data-dir=\"%s\" --window-size=1360,860 --app-id=study_flow_organizer --no-first-run --no-default-browser-check",
            browserPath, profileDir);

        STARTUPINFOW siBrowser;
        PROCESS_INFORMATION piBrowser;
        ZeroMemory(&siBrowser, sizeof(siBrowser));
        siBrowser.cb = sizeof(siBrowser);
        ZeroMemory(&piBrowser, sizeof(piBrowser));

        if (CreateProcessW(NULL, browserCmd, NULL, NULL, FALSE, 0, NULL, exeDir, &siBrowser, &piBrowser)) {
            CloseHandle(piBrowser.hThread);
            CloseHandle(piBrowser.hProcess);
        }
    } else {
        // Fallback: Open in default browser
        ShellExecuteW(NULL, L"open", L"http://127.0.0.1:3456", NULL, NULL, SW_SHOWNORMAL);
    }

    return 0;
}
