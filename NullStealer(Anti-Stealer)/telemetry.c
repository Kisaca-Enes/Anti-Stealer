/*
 * telemetry.c  -  Anti-Stealer Pro  |  ETW Process Telemetry Collector
 *
 * Kullanim : telemetry.exe <PID>
 * Cikti    : %APPDATA%\Anti-Stealer\Telemetry\<PID>_YYYYMMDD_HHMMSS.json
 *
 * MinGW cross-compile (Fedora/Linux):
 *   x86_64-w64-mingw32-gcc -O2 -municode \
 *       -D_WIN32_WINNT=0x0A00 -DWINVER=0x0A00 \
 *       -o telemetry.exe telemetry.c \
 *       -ltdh -ladvapi32 -lws2_32 -liphlpapi \
 *       -lole32 -loleaut32 -lntdll -lkernel32 \
 *       -luuid -lshlwapi -static-libgcc
 *
 * MSVC:
 *   cl /O2 /W3 /nologo /Fe:telemetry.exe telemetry.c
 *      tdh.lib advapi32.lib ws2_32.lib iphlpapi.lib
 *      ntdll.lib ole32.lib oleaut32.lib wbemuuid.lib kernel32.lib
 */

/* pragma comment sadece MSVC'de calısır */
#if defined(_MSC_VER)
#pragma comment(lib, "tdh.lib")
#pragma comment(lib, "advapi32.lib")
#pragma comment(lib, "ws2_32.lib")
#pragma comment(lib, "iphlpapi.lib")
#pragma comment(lib, "ole32.lib")
#pragma comment(lib, "oleaut32.lib")
#pragma comment(lib, "wbemuuid.lib")
#pragma comment(lib, "ntdll.lib")
#endif

/* UNICODE — komut satırından gelirse yeniden tanimlama uyarisi cikar */
#ifndef UNICODE
#define UNICODE
#endif
#ifndef _UNICODE
#define _UNICODE
#endif

#define WIN32_LEAN_AND_MEAN
#ifndef _WIN32_WINNT
#define _WIN32_WINNT 0x0A00
#endif
#ifndef WINVER
#define WINVER 0x0A00
#endif

/* Winsock2 mutlaka windows.h'tan once gelmeli */
#include <winsock2.h>
#include <ws2tcpip.h>
#include <windows.h>
#include <tlhelp32.h>
#include <iphlpapi.h>
#include <evntrace.h>
#include <evntcons.h>
#include <tdh.h>
#include <objbase.h>
#include <wbemidl.h>
#include <oleauto.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* ---------------------------------------------------------------
 * wbemuuid.lib MinGW'de genellikle eksik gelir.
 * CLSID_WbemLocator ve IID_IWbemLocator burada elle tanımlanıyor.
 * DEFINE_GUID yerine const kullanıyoruz — duplicate symbol olmaz.
 * --------------------------------------------------------------- */
#ifndef _WBEMUUID_DEFINED
#define _WBEMUUID_DEFINED

const CLSID CLSID_WbemLocator = {
    0x4590F811, 0x1D3A, 0x11D0,
    {0x89, 0x1F, 0x00, 0xAA, 0x00, 0x4B, 0x2E, 0x24}
};

const IID IID_IWbemLocator = {
    0xDC12A687, 0x737F, 0x11CF,
    {0x88, 0x4D, 0x00, 0xAA, 0x00, 0x4B, 0x2E, 0x24}
};

#endif /* _WBEMUUID_DEFINED */

/* ---------------------------------------------------------------
 * MinGW'de eksik olabilen tipler
 * --------------------------------------------------------------- */

/* UNICODE_STRING — ntdef.h/winternl.h'ta olmalı ama bazı
 *   MinGW sürümlerinde eksik gelir, burada güvenli şekilde tanımlanıyor */
#ifndef _UNICODE_STRING_DEFINED
#define _UNICODE_STRING_DEFINED
typedef struct _UNICODE_STRING {
    USHORT Length;
    USHORT MaximumLength;
    PWSTR  Buffer;
} UNICODE_STRING, *PUNICODE_STRING;
#endif

/* Ntdll fonksiyon imzaları — GetProcAddress ile dinamik çağırılır */
typedef LONG (WINAPI *FN_NtQuerySystemInformation)(
    ULONG  Class, PVOID Buf, ULONG Len, PULONG RetLen);

typedef LONG (WINAPI *FN_NtQueryInformationThread)(
    HANDLE Thread, ULONG Class,
    PVOID Buf, ULONG Len, PULONG RetLen);

/* TdhGetProperty — tdh.dll'den dinamik çağırılır
 *   (bazı MinGW sürümlerinde tdh.h tam gelmiyor) */
typedef struct _PROP_DATA_DESC {
    ULONGLONG PropertyName;
    ULONG     ArrayIndex;
    ULONG     Reserved;
} PROP_DATA_DESC;

typedef ULONG (WINAPI *FN_TdhGetProperty)(
    PEVENT_RECORD pEvent,
    ULONG         TdhContextCount,
    PVOID         pTdhContext,
    ULONG         PropertyDataCount,
    PROP_DATA_DESC *pPropertyData,
    ULONG         BufferSize,
    PBYTE         pBuffer);

/* ── Sabitler ─────────────────────────────────────────────────── */
#define MAX_STRINGS  2048
#define MAX_STR_LEN  512
#define ETW_SESSION  L"AntiStealerTelemetry_v3"
#define SAMPLE_MS    3000

/* ── ETW Provider GUID'leri ───────────────────────────────────── */
static const GUID PROV_KernelFile = {
    0xEDD08927,0x9CC4,0x4E65,
    {0xB9,0x70,0xC2,0x56,0x0F,0xB5,0xA2,0x89}};

    static const GUID PROV_KernelRegistry = {
        0x70EB4F03,0xC1DE,0x4F73,
        {0xA0,0x51,0x33,0xD1,0x3D,0x54,0x13,0xBD}};

        static const GUID PROV_KernelProcess = {
            0x22FB2CD6,0x0E7B,0x422B,
            {0xA0,0xC7,0x2F,0xAD,0x1F,0xD0,0xE7,0x16}};

            static const GUID PROV_TCPIP = {
                0x2F07E2EE,0x15DB,0x40F1,
                {0x90,0xEF,0x9D,0x7B,0xA2,0x82,0x18,0x8A}};

                /* ── Global state ─────────────────────────────────────────────── */
                typedef struct {
                    DWORD  targetPid;
                    WCHAR  outPath[MAX_PATH];

                    WCHAR  processName[MAX_STR_LEN];
                    WCHAR  cmdline    [MAX_STR_LEN];
                    WCHAR  threadName [MAX_STR_LEN];

                    WCHAR  writtenFiles  [MAX_STRINGS][MAX_STR_LEN];
                    int    writtenFilesCount;

                    WCHAR  registryWrites[MAX_STRINGS][MAX_STR_LEN];
                    int    registryWritesCount;

                    WCHAR  apiCalls      [MAX_STRINGS][MAX_STR_LEN];
                    int    apiCallsCount;

                    WCHAR  networkConns  [MAX_STRINGS][MAX_STR_LEN];
                    int    networkCount;

                    WCHAR  openFiles     [MAX_STRINGS][MAX_STR_LEN];
                    int    openFilesCount;

                    TRACEHANDLE      hSession;
                    BOOL             etwRunning;
                    CRITICAL_SECTION cs;

                    /* Dinamik fonksiyon pointer'ları */
                    FN_TdhGetProperty            pfTdhGetProperty;
                    FN_NtQuerySystemInformation  pfNtQSI;
                    FN_NtQueryInformationThread  pfNtQIT;
                } TelemetryState;

                static TelemetryState g;

                /* ── Yardımcılar ─────────────────────────────────────────────── */
                static void AddUnique(WCHAR arr[][MAX_STR_LEN], int *count,
                                      const WCHAR *val)
                {
                    if (!val || !val[0]) return;
                    EnterCriticalSection(&g.cs);
                    if (*count >= MAX_STRINGS) { LeaveCriticalSection(&g.cs); return; }
                    for (int i = 0; i < *count; i++) {
                        if (_wcsicmp(arr[i], val) == 0) {
                            LeaveCriticalSection(&g.cs); return;
                        }
                    }
                    wcsncpy(arr[*count], val, MAX_STR_LEN - 1);
                    arr[*count][MAX_STR_LEN - 1] = L'\0';
                    (*count)++;
                    LeaveCriticalSection(&g.cs);
                }

                static void EscapeJson(const WCHAR *in, WCHAR *out, int outLen)
                {
                    int j = 0;
                    for (int i = 0; in[i] && j < outLen - 3; i++) {
                        switch (in[i]) {
                            case L'"':  out[j++]=L'\\'; out[j++]=L'"';  break;
                            case L'\\': out[j++]=L'\\'; out[j++]=L'\\'; break;
                            case L'\n': out[j++]=L'\\'; out[j++]=L'n';  break;
                            case L'\r': out[j++]=L'\\'; out[j++]=L'r';  break;
                            case L'\t': out[j++]=L'\\'; out[j++]=L't';  break;
                            default:    out[j++]=in[i]; break;
                        }
                    }
                    out[j] = L'\0';
                }

                /* ── ETW: olaydan özellik oku ────────────────────────────────── */
                static BOOL GetEvtProp(PEVENT_RECORD ev, LPCWSTR name,
                                       WCHAR *out, DWORD outCch)
                {
                    if (!g.pfTdhGetProperty) return FALSE;

                    PROP_DATA_DESC pdd;
                    pdd.PropertyName = (ULONGLONG)(ULONG_PTR)name;
                    pdd.ArrayIndex   = ULONG_MAX;
                    pdd.Reserved     = 0;

                    BYTE buf[1024] = {0};
                    ULONG r = g.pfTdhGetProperty(ev, 0, NULL, 1, &pdd,
                                                 sizeof(buf), buf);
                    if (r != ERROR_SUCCESS) return FALSE;
                    wcsncpy(out, (WCHAR *)buf, outCch - 1);
                    out[outCch - 1] = L'\0';
                    return TRUE;
                }

                /* ── ETW Callback ────────────────────────────────────────────── */
                static VOID WINAPI ETWCallback(PEVENT_RECORD ev)
                {
                    if (!ev) return;
                    if ((DWORD)ev->EventHeader.ProcessId != g.targetPid) return;

                    WCHAR buf[MAX_STR_LEN] = {0};
                    const GUID *pg = &ev->EventHeader.ProviderId;
                    USHORT op  = ev->EventHeader.EventDescriptor.Opcode;
                    USHORT eid = ev->EventHeader.EventDescriptor.Id;

                    /* WrittenFiles */
                    if (IsEqualGUID(pg, &PROV_KernelFile)) {
                        if (op==72||op==73||eid==14||eid==15) {
                            if (GetEvtProp(ev,L"FileName",buf,MAX_STR_LEN) ||
                                GetEvtProp(ev,L"OpenPath",buf,MAX_STR_LEN))
                                AddUnique(g.writtenFiles, &g.writtenFilesCount, buf);
                        }
                    }
                    /* RegistryWrites */
                    else if (IsEqualGUID(pg, &PROV_KernelRegistry)) {
                        if (op==1||op==2||op==4||op==10||op==11||eid==1||eid==5) {
                            if (GetEvtProp(ev,L"RelativeName",buf,MAX_STR_LEN) ||
                                GetEvtProp(ev,L"KeyName",     buf,MAX_STR_LEN))
                                AddUnique(g.registryWrites, &g.registryWritesCount, buf);
                        }
                    }
                    /* APICalls */
                    else if (IsEqualGUID(pg, &PROV_KernelProcess)) {
                        const WCHAR *api = NULL;
                        switch (eid) {
                            case  1: api=L"ProcessCreate";      break;
                            case  3: api=L"ThreadCreate";       break;
                            case  5: api=L"ImageLoad";          break;
                            case 10: api=L"VirtualAlloc";       break;
                            case 12: api=L"VirtualAllocEx";     break;
                            case 13: api=L"WriteProcessMemory"; break;
                            case 14: api=L"CreateRemoteThread"; break;
                            case 15: api=L"OpenProcess";        break;
                            case 17: api=L"SetThreadContext";   break;
                            case 18: api=L"SuspendThread";      break;
                            case 19: api=L"QueueUserAPC";       break;
                            case 20: api=L"LoadLibrary";        break;
                            case 21: api=L"GetProcAddress";     break;
                            case 30: api=L"CreateProcess";      break;
                        }
                        if (api) AddUnique(g.apiCalls, &g.apiCallsCount, api);
                    }
                    /* Network */
                    else if (IsEqualGUID(pg, &PROV_TCPIP)) {
                        WCHAR addr[64]={0}, port[16]={0};
                        if (GetEvtProp(ev,L"daddr",addr,64) &&
                            GetEvtProp(ev,L"dport",port,16)) {
                            swprintf(buf, MAX_STR_LEN, L"%s:%s", addr, port);
                        AddUnique(g.networkConns, &g.networkCount, buf);
                            }
                    }
                }

                /* ── ETW Session başlat ──────────────────────────────────────── */
                static BOOL StartETWSession(void)
                {
                    /* Eski session varsa sil */
                    {
                        ULONG sz = sizeof(EVENT_TRACE_PROPERTIES)+512;
                        EVENT_TRACE_PROPERTIES *p = (EVENT_TRACE_PROPERTIES*)calloc(1,sz);
                        if (p) {
                            p->Wnode.BufferSize = sz;
                            p->LoggerNameOffset = sizeof(EVENT_TRACE_PROPERTIES);
                            ControlTrace(0, ETW_SESSION, p, EVENT_TRACE_CONTROL_STOP);
                            free(p);
                        }
                    }

                    ULONG sz = sizeof(EVENT_TRACE_PROPERTIES)+512;
                    EVENT_TRACE_PROPERTIES *props = (EVENT_TRACE_PROPERTIES*)calloc(1,sz);
                    if (!props) return FALSE;

                    props->Wnode.BufferSize    = sz;
                    props->Wnode.Flags         = WNODE_FLAG_TRACED_GUID;
                    props->Wnode.ClientContext = 1;
                    CoCreateGuid(&props->Wnode.Guid);
                    props->LogFileMode      = EVENT_TRACE_REAL_TIME_MODE;
                    props->BufferSize       = 64;
                    props->MinimumBuffers   = 4;
                    props->MaximumBuffers   = 16;
                    props->LoggerNameOffset = sizeof(EVENT_TRACE_PROPERTIES);

                    ULONG r = StartTrace(&g.hSession, ETW_SESSION, props);
                    free(props);
                    if (r != ERROR_SUCCESS && r != ERROR_ALREADY_EXISTS) {
                        wprintf(L"[ETW] StartTrace hata: %lu\n", r);
                        return FALSE;
                    }

                    const GUID *provs[] = {
                        &PROV_KernelFile, &PROV_KernelRegistry,
                        &PROV_KernelProcess, &PROV_TCPIP
                    };
                    for (int i = 0; i < 4; i++) {
                        ENABLE_TRACE_PARAMETERS etp;
                        memset(&etp, 0, sizeof(etp));
                        etp.Version = ENABLE_TRACE_PARAMETERS_VERSION_2;
                        EnableTraceEx2(g.hSession, provs[i],
                                       EVENT_CONTROL_CODE_ENABLE_PROVIDER,
                                       TRACE_LEVEL_VERBOSE,
                                       0xFFFFFFFFFFFFFFFFULL, 0, 0, &etp);
                    }
                    return TRUE;
                }

                /* ── ETW Consumer Thread ─────────────────────────────────────── */
                static DWORD WINAPI ETWConsumerThread(LPVOID p)
                {
                    (void)p;
                    EVENT_TRACE_LOGFILEW lf;
                    memset(&lf, 0, sizeof(lf));
                    lf.LoggerName          = (LPWSTR)ETW_SESSION;
                    lf.ProcessTraceMode    = PROCESS_TRACE_MODE_REAL_TIME |
                    PROCESS_TRACE_MODE_EVENT_RECORD;
                    lf.EventRecordCallback = ETWCallback;

                    TRACEHANDLE h = OpenTraceW(&lf);
                    if (h == (TRACEHANDLE)INVALID_HANDLE_VALUE) {
                        wprintf(L"[ETW] OpenTrace hata: %lu\n", GetLastError());
                        return 1;
                    }
                    ProcessTrace(&h, 1, NULL, NULL);
                    CloseTrace(h);
                    return 0;
                }

                /* ── ETW Session durdur ──────────────────────────────────────── */
                static void StopETWSession(void)
                {
                    if (!g.hSession) return;
                    ULONG sz = sizeof(EVENT_TRACE_PROPERTIES)+512;
                    EVENT_TRACE_PROPERTIES *p = (EVENT_TRACE_PROPERTIES*)calloc(1,sz);
                    if (!p) return;
                    p->Wnode.BufferSize = sz;
                    p->LoggerNameOffset = sizeof(EVENT_TRACE_PROPERTIES);
                    ControlTrace(g.hSession, ETW_SESSION, p, EVENT_TRACE_CONTROL_STOP);
                    free(p);
                }

                /* ── WMI: CommandLine + ProcessName ──────────────────────────── */
                static void GetCommandLineWMI(DWORD pid)
                {
                    if (FAILED(CoInitializeEx(0, COINIT_MULTITHREADED))) return;

                    IWbemLocator  *pLoc = NULL;
                    IWbemServices *pSvc = NULL;
                    IEnumWbemClassObject *pEnum = NULL;
                    IWbemClassObject     *pObj  = NULL;

                    if (FAILED(CoCreateInstance(&CLSID_WbemLocator, NULL,
                        CLSCTX_INPROC_SERVER, &IID_IWbemLocator,
                        (void**)&pLoc))) goto done;

                    {
                        BSTR bPath = SysAllocString(L"ROOT\\CIMV2");
                        HRESULT hr = pLoc->lpVtbl->ConnectServer(
                            pLoc,bPath,NULL,NULL,NULL,0,NULL,NULL,&pSvc);
                        SysFreeString(bPath);
                        if (FAILED(hr)) goto done;
                    }

                    CoSetProxyBlanket((IUnknown*)pSvc,
                                      RPC_C_AUTHN_WINNT,RPC_C_AUTHZ_NONE,NULL,
                                      RPC_C_AUTHN_LEVEL_CALL,RPC_C_IMP_LEVEL_IMPERSONATE,
                                      NULL,EOAC_NONE);

                    {
                        WCHAR q[256];
                        swprintf(q,256,
                                 L"SELECT CommandLine,Name FROM Win32_Process "
                                 L"WHERE ProcessId=%lu", pid);
                        BSTR bQ  = SysAllocString(q);
                        BSTR bWQ = SysAllocString(L"WQL");
                        HRESULT hr = pSvc->lpVtbl->ExecQuery(pSvc,bWQ,bQ,
                                                             WBEM_FLAG_FORWARD_ONLY|WBEM_FLAG_RETURN_IMMEDIATELY,
                                                             NULL,&pEnum);
                        SysFreeString(bQ); SysFreeString(bWQ);
                        if (FAILED(hr)) goto done;
                    }

                    {
                        ULONG ret=0;
                        if (pEnum->lpVtbl->Next(pEnum,WBEM_INFINITE,1,
                            &pObj,&ret)==WBEM_S_NO_ERROR)
                        {
                            VARIANT v; VariantInit(&v);
                            if (SUCCEEDED(pObj->lpVtbl->Get(pObj,L"CommandLine",0,&v,0,0))
                                && v.vt==VT_BSTR && v.bstrVal)
                                wcsncpy(g.cmdline, v.bstrVal, MAX_STR_LEN-1);
                            VariantClear(&v);

                            if (SUCCEEDED(pObj->lpVtbl->Get(pObj,L"Name",0,&v,0,0))
                                && v.vt==VT_BSTR && v.bstrVal)
                                wcsncpy(g.processName, v.bstrVal, MAX_STR_LEN-1);
                            VariantClear(&v);
                            pObj->lpVtbl->Release(pObj);
                        }
                        if (pEnum) pEnum->lpVtbl->Release(pEnum);
                    }

                    done:
                    if (pSvc) pSvc->lpVtbl->Release(pSvc);
                    if (pLoc) pLoc->lpVtbl->Release(pLoc);
                    CoUninitialize();
                }

                /* ── Anlık TCP bağlantıları ──────────────────────────────────── */
                static void GetNetworkConnections(DWORD pid)
                {
                    /* IPv4 */
                    DWORD sz=0;
                    GetExtendedTcpTable(NULL,&sz,FALSE,AF_INET,
                                        TCP_TABLE_OWNER_PID_ALL,0);
                    MIB_TCPTABLE_OWNER_PID *t4 =
                    (MIB_TCPTABLE_OWNER_PID*)malloc(sz);
                    if (t4) {
                        if (GetExtendedTcpTable(t4,&sz,FALSE,AF_INET,
                            TCP_TABLE_OWNER_PID_ALL,0)==NO_ERROR) {
                            for (DWORD i=0; i<t4->dwNumEntries; i++) {
                                if ((DWORD)t4->table[i].dwOwningPid != pid) continue;
                                struct in_addr ra;
                                ra.S_un.S_addr = t4->table[i].dwRemoteAddr;
                                WCHAR ip[64]={0};
                                InetNtopW(AF_INET,&ra,ip,64);
                                if (!wcscmp(ip,L"0.0.0.0")||!wcscmp(ip,L"127.0.0.1"))
                                    continue;
                                USHORT port = ntohs((USHORT)t4->table[i].dwRemotePort);
                                WCHAR e[MAX_STR_LEN];
                                swprintf(e,MAX_STR_LEN,L"%s:%u",ip,port);
                                AddUnique(g.networkConns,&g.networkCount,e);
                            }
                            }
                            free(t4);
                    }

                    /* IPv6 */
                    DWORD sz6=0;
                    GetExtendedTcpTable(NULL,&sz6,FALSE,AF_INET6,
                                        TCP_TABLE_OWNER_PID_ALL,0);
                    MIB_TCP6TABLE_OWNER_PID *t6 =
                    (MIB_TCP6TABLE_OWNER_PID*)malloc(sz6);
                    if (t6) {
                        if (GetExtendedTcpTable(t6,&sz6,FALSE,AF_INET6,
                            TCP_TABLE_OWNER_PID_ALL,0)==NO_ERROR) {
                            for (DWORD i=0; i<t6->dwNumEntries; i++) {
                                if ((DWORD)t6->table[i].dwOwningPid != pid) continue;
                                WCHAR ip6[64]={0};
                                InetNtopW(AF_INET6,
                                          &t6->table[i].ucRemoteAddr,ip6,64);
                                USHORT port = ntohs((USHORT)t6->table[i].dwRemotePort);
                                WCHAR e[MAX_STR_LEN];
                                swprintf(e,MAX_STR_LEN,L"[%s]:%u",ip6,port);
                                AddUnique(g.networkConns,&g.networkCount,e);
                            }
                            }
                            free(t6);
                    }
                }

                /* ── Açık dosya handle'ları ──────────────────────────────────── */
                #pragma pack(push,1)
                typedef struct {
                    ULONG       ProcessId;
                    UCHAR       ObjectTypeNumber;
                    UCHAR       Flags;
                    USHORT      Handle;
                    PVOID       Object;
                    ACCESS_MASK GrantedAccess;
                } SYS_HANDLE;
                typedef struct {
                    ULONG      Count;
                    SYS_HANDLE Handles[1];
                } SYS_HANDLE_INFO;
                #pragma pack(pop)

                static void GetOpenFileHandles(DWORD pid)
                {
                    if (!g.pfNtQSI) return;

                    ULONG sz=1<<20; PVOID buf=NULL; LONG st;
                    do {
                        free(buf); buf=malloc(sz);
                        if (!buf) return;
                        st = g.pfNtQSI(16, buf, sz, &sz);
                        sz *= 2;
                    } while (st == (LONG)0xC0000004L);

                    if (st != 0) { free(buf); return; }

                    SYS_HANDLE_INFO *info = (SYS_HANDLE_INFO*)buf;
                    HANDLE hProc = OpenProcess(PROCESS_DUP_HANDLE,FALSE,pid);
                    if (!hProc) { free(buf); return; }

                    for (ULONG i=0;
                         i<info->Count && g.openFilesCount<MAX_STRINGS; i++)
                         {
                             if ((DWORD)info->Handles[i].ProcessId != pid) continue;
                             if (info->Handles[i].ObjectTypeNumber != 28)  continue;

                             HANDLE hDup=NULL;
                             if (!DuplicateHandle(hProc,
                                 (HANDLE)(ULONG_PTR)info->Handles[i].Handle,
                                                  GetCurrentProcess(),&hDup,0,FALSE,
                                                  DUPLICATE_SAME_ACCESS)) continue;

                                                  WCHAR name[MAX_STR_LEN]={0};
                                                  DWORD n=GetFinalPathNameByHandleW(
                                                      hDup,name,MAX_STR_LEN,FILE_NAME_NORMALIZED);
                                                  CloseHandle(hDup);

                                                  if (n>0 && n<MAX_STR_LEN) {
                                                      WCHAR *p=name;
                                                      if (wcsncmp(p,L"\\\\?\\",4)==0) p+=4;
                                                      AddUnique(g.openFiles,&g.openFilesCount,p);
                                                  }
                         }
                         CloseHandle(hProc);
                         free(buf);
                }

                /* ── Thread adı ──────────────────────────────────────────────── */
                static void GetMainThreadName(DWORD pid)
                {
                    HANDLE hSnap = CreateToolhelp32Snapshot(TH32CS_SNAPTHREAD,0);
                    if (hSnap==INVALID_HANDLE_VALUE) return;

                    THREADENTRY32 te; te.dwSize=sizeof(te);
                    DWORD firstTid=0;

                    if (Thread32First(hSnap,&te)) {
                        do {
                            if (te.th32OwnerProcessID==pid) {
                                firstTid=te.th32ThreadID; break;
                            }
                        } while (Thread32Next(hSnap,&te));
                    }
                    CloseHandle(hSnap);
                    if (!firstTid) return;

                    HANDLE hThr=OpenThread(THREAD_QUERY_INFORMATION,FALSE,firstTid);
                    if (!hThr) return;

                    if (g.pfNtQIT) {
                        typedef struct { UNICODE_STRING Name; } THREAD_NAME_INFO;
                        BYTE tbuf[512]={0}; ULONG retLen=0;
                        if (g.pfNtQIT(hThr,38,tbuf,sizeof(tbuf),&retLen)==0) {
                            THREAD_NAME_INFO *ti=(THREAD_NAME_INFO*)tbuf;
                            if (ti->Name.Buffer && ti->Name.Length>0) {
                                ULONG chars = ti->Name.Length/sizeof(WCHAR);
                                if (chars>=MAX_STR_LEN) chars=MAX_STR_LEN-1;
                                wcsncpy(g.threadName, ti->Name.Buffer, chars);
                                g.threadName[chars]=L'\0';
                            }
                        }
                    }
                    CloseHandle(hThr);
                }

                /* ── SeDebugPrivilege ────────────────────────────────────────── */
                static BOOL EnableDebugPrivilege(void)
                {
                    HANDLE hTok;
                    if (!OpenProcessToken(GetCurrentProcess(),
                        TOKEN_ADJUST_PRIVILEGES|TOKEN_QUERY,&hTok))
                        return FALSE;
                    LUID luid;
                    if (!LookupPrivilegeValueW(NULL,SE_DEBUG_NAME,&luid)) {
                        CloseHandle(hTok); return FALSE;
                    }
                    TOKEN_PRIVILEGES tp;
                    tp.PrivilegeCount=1;
                    tp.Privileges[0].Luid=luid;
                    tp.Privileges[0].Attributes=SE_PRIVILEGE_ENABLED;
                    BOOL ok=AdjustTokenPrivileges(hTok,FALSE,&tp,0,NULL,NULL);
                    CloseHandle(hTok);
                    return ok && (GetLastError()==ERROR_SUCCESS);
                }

                /* ── Çıktı yolu ──────────────────────────────────────────────── */
                static void PrepareOutputPath(DWORD pid)
                {
                    WCHAR dir[MAX_PATH]={0};
                    ExpandEnvironmentStringsW(
                        L"%APPDATA%\\Anti-Stealer\\Telemetry",dir,MAX_PATH);
                    CreateDirectoryW(dir,NULL);

                    SYSTEMTIME st; GetLocalTime(&st);
                    swprintf(g.outPath,MAX_PATH,
                             L"%s\\%lu_%04d%02d%02d_%02d%02d%02d.json",
                             dir,pid,
                             st.wYear,st.wMonth,st.wDay,
                             st.wHour,st.wMinute,st.wSecond);
                }

                /* ── JSON yaz ────────────────────────────────────────────────── */
                static void WriteJSON(void)
                {
                    FILE *fp=NULL;
                    _wfopen_s(&fp, g.outPath, L"w");
                    if (!fp) {
                        wprintf(L"[ERR] Dosya acilamadi: %s\n", g.outPath);
                        return;
                    }

                    WCHAR esc[MAX_STR_LEN];

                    fwprintf(fp, L"{\n");
                    fwprintf(fp, L"  \"pid\": %lu,\n", g.targetPid);

                    EscapeJson(g.processName, esc, MAX_STR_LEN);
                    fwprintf(fp, L"  \"processname\": \"%s\",\n", esc);

                    EscapeJson(g.cmdline, esc, MAX_STR_LEN);
                    fwprintf(fp, L"  \"commandlines\": [\"%s\"],\n", esc);

                    EscapeJson(g.threadName, esc, MAX_STR_LEN);
                    fwprintf(fp, L"  \"threadname\": \"%s\",\n", esc);

                    /* writtenfiles */
                    fwprintf(fp, L"  \"writtenfiles\": [");
                    for (int i=0; i<g.writtenFilesCount; i++) {
                        EscapeJson(g.writtenFiles[i],esc,MAX_STR_LEN);
                        fwprintf(fp, L"%s\"%s\"", i?L",":L"", esc);
                    }
                    fwprintf(fp, L"],\n");

                    /* registry */
                    fwprintf(fp, L"  \"registry\": [");
                    for (int i=0; i<g.registryWritesCount; i++) {
                        EscapeJson(g.registryWrites[i],esc,MAX_STR_LEN);
                        fwprintf(fp, L"%s\"%s\"", i?L",":L"", esc);
                    }
                    fwprintf(fp, L"],\n");

                    /* apicalls */
                    fwprintf(fp, L"  \"apicalls\": [");
                    for (int i=0; i<g.apiCallsCount; i++) {
                        EscapeJson(g.apiCalls[i],esc,MAX_STR_LEN);
                        fwprintf(fp, L"%s\"%s\"", i?L",":L"", esc);
                    }
                    fwprintf(fp, L"],\n");

                    /* network: {host, port, packagecontent} */
                    fwprintf(fp, L"  \"network\": [");
                    for (int i=0; i<g.networkCount; i++) {
                        WCHAR tmp[MAX_STR_LEN];
                        wcsncpy(tmp, g.networkConns[i], MAX_STR_LEN-1);
                        tmp[MAX_STR_LEN-1]=L'\0';

                        WCHAR host[128]={0};
                        USHORT port=0;

                        if (tmp[0]==L'[') {              /* IPv6 [addr]:port */
                            WCHAR *cl=wcschr(tmp,L']');
                            if (cl) {
                                *cl=L'\0';
                                wcsncpy(host, tmp+1, 127);
                                port=(USHORT)_wtoi(cl+2);
                            }
                        } else {                         /* IPv4 addr:port */
                            WCHAR *cl=wcsrchr(tmp,L':');
                            if (cl) {
                                *cl=L'\0';
                                wcsncpy(host, tmp, 127);
                                port=(USHORT)_wtoi(cl+1);
                            } else {
                                wcsncpy(host, tmp, 127);
                            }
                        }
                        EscapeJson(host,esc,MAX_STR_LEN);
                        fwprintf(fp,
                                 L"%s{\"host\":\"%s\",\"port\":%u,\"packagecontent\":\"\"}",
                                 i?L",":L"", esc, port);
                    }
                    fwprintf(fp, L"],\n");

                    /* openfiles */
                    fwprintf(fp, L"  \"openfiles\": [");
                    for (int i=0; i<g.openFilesCount; i++) {
                        EscapeJson(g.openFiles[i],esc,MAX_STR_LEN);
                        fwprintf(fp, L"%s\"%s\"", i?L",":L"", esc);
                    }
                    fwprintf(fp, L"]\n}\n");
                    fclose(fp);

                    wprintf(L"[OK] %s\n", g.outPath);
                }

                /* ════════════════════════════════════════════════════════════════
                 *  wmain
                 * ════════════════════════════════════════════════════════════════ */
                int wmain(int argc, wchar_t *argv[])
                {
                    if (argc < 2) {
                        fwprintf(stderr, L"Kullanim: telemetry.exe <PID>\n");
                        return 1;
                    }

                    memset(&g, 0, sizeof(g));
                    g.targetPid = (DWORD)_wtoi(argv[1]);
                    if (g.targetPid == 0) {
                        fwprintf(stderr, L"[ERR] Gecersiz PID: %s\n", argv[1]);
                        return 1;
                    }

                    HANDLE hChk = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION,
                                              FALSE, g.targetPid);
                    if (!hChk) {
                        fwprintf(stderr, L"[ERR] PID %lu acilamadi (%lu)\n",
                                 g.targetPid, GetLastError());
                        return 1;
                    }
                    CloseHandle(hChk);

                    InitializeCriticalSection(&g.cs);

                    /* Dinamik fonksiyon yükle */
                    HMODULE hNtdll = GetModuleHandleW(L"ntdll.dll");
                    HMODULE hTdh   = LoadLibraryW(L"tdh.dll");

                    if (hNtdll) {
                        g.pfNtQSI = (FN_NtQuerySystemInformation)(FARPROC)
                        GetProcAddress(hNtdll,"NtQuerySystemInformation");
                        g.pfNtQIT = (FN_NtQueryInformationThread)(FARPROC)
                        GetProcAddress(hNtdll,"NtQueryInformationThread");
                    }
                    if (hTdh) {
                        g.pfTdhGetProperty = (FN_TdhGetProperty)(FARPROC)
                        GetProcAddress(hTdh,"TdhGetProperty");
                    }

                    wprintf(L"[*] Anti-Stealer Telemetry | PID: %lu\n", g.targetPid);
                    wprintf(L"    NtQSI: %s  NtQIT: %s  TdhGetProperty: %s\n",
                            g.pfNtQSI ? L"OK":L"YOK",
                            g.pfNtQIT ? L"OK":L"YOK",
                            g.pfTdhGetProperty ? L"OK":L"YOK");

                    if (EnableDebugPrivilege())
                        wprintf(L"[+] SeDebugPrivilege OK\n");
                    else
                        wprintf(L"[!] SeDebugPrivilege yok\n");

                    PrepareOutputPath(g.targetPid);

                    wprintf(L"[*] WMI CommandLine...\n");
                    GetCommandLineWMI(g.targetPid);

                    wprintf(L"[*] TCP baglantilari...\n");
                    GetNetworkConnections(g.targetPid);

                    wprintf(L"[*] Acik handle'lar...\n");
                    GetOpenFileHandles(g.targetPid);

                    wprintf(L"[*] Thread adi...\n");
                    GetMainThreadName(g.targetPid);

                    wprintf(L"[*] ETW session baslatiliyor...\n");
                    if (StartETWSession()) {
                        g.etwRunning = TRUE;
                        wprintf(L"[+] ETW aktif — %d ms izleniyor...\n", SAMPLE_MS);

                        HANDLE hCons = CreateThread(NULL,0,ETWConsumerThread,NULL,0,NULL);
                        Sleep(SAMPLE_MS);
                        StopETWSession();
                        if (hCons) {
                            WaitForSingleObject(hCons, 3000);
                            CloseHandle(hCons);
                        }
                    } else {
                        wprintf(L"[!] ETW basladilamadi (Administrator yetkisi gerekli)\n");
                    }

                    GetNetworkConnections(g.targetPid); /* final snapshot */

                    wprintf(L"[*] JSON kaydediliyor...\n");
                    WriteJSON();

                    wprintf(L"\n  Ozet:\n"
                    L"  Process     : %s (PID %lu)\n"
                    L"  WrittenFiles: %d\n"
                    L"  Registry    : %d\n"
                    L"  APICalls    : %d\n"
                    L"  Network     : %d\n"
                    L"  OpenFiles   : %d\n",
                    g.processName, g.targetPid,
                    g.writtenFilesCount, g.registryWritesCount,
                    g.apiCallsCount, g.networkCount, g.openFilesCount);

                    DeleteCriticalSection(&g.cs);
                    if (hTdh) FreeLibrary(hTdh);
                    return 0;
                }
