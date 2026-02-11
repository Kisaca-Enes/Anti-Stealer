rule Stealerium_NET_Full_Core
{
    meta:
        description = "High confidence detection of Stealerium .NET stealer (browser, wallet, keylogger, Telegram/Zulip exfil)"
        author = "Enes"
        date = "2026-02-11"
        family = "Stealerium"
        confidence = "very high"

    strings:
        /* Family / Namespace */
        $fam1 = "Stealerium.Stub" ascii wide
        $fam2 = "Stealerium.Stub.Target.Browsers.Chromium" ascii wide
        $fam3 = "Stealerium.Stub.Modules.Keylogger" ascii wide
        $fam4 = "Stealerium.Stub.Target.System" ascii wide

        /* Telegram / Zulip async exfil */
        $c2_1 = "SendMessageAsync" ascii wide
        $c2_2 = "SendZulipMessageAsync" ascii wide
        $c2_3 = "UploadKeylogsAsync" ascii wide
        $c2_4 = "SendReportAsync" ascii wide
        $c2_5 = "TokenIsValidAsync" ascii wide

        /* Browser & credential theft */
        $br1 = "Login Data" ascii wide
        $br2 = "Local State" ascii wide
        $br3 = "Cookies" ascii wide
        $br4 = "History" ascii wide
        $br5 = "WritePasswords" ascii wide
        $br6 = "WriteCreditCards" ascii wide

        /* Wallet & crypto */
        $wal1 = "CopyWalletFromDirectoryTo" ascii wide
        $wal2 = "KnownWalletsInRegistry" ascii wide
        $wal3 = "GetChromeWallets" ascii wide

        /* Keylogger */
        $key1 = "SetWindowsHookEx" ascii wide
        $key2 = "LowLevelKeyboardProc" ascii wide
        $key3 = "LogKeyPress" ascii wide

        /* Packing / crypto / zip */
        $pk1 = "ICSharpCode.SharpZipLib" ascii wide
        $pk2 = "CreatePasswordProtectedZip" ascii wide
        $pk3 = "BCryptDecrypt" ascii wide
        $pk4 = "BCRYPT_AES_ALGORITHM" ascii wide

        /* Loader / embed */
        $ld1 = "costura.costura.dll.compressed" ascii wide
        $ld2 = "ReadFromEmbeddedResources" ascii wide

        /* .NET */
        $dotnet = "mscorlib" ascii wide
        $b1 = "GetCookiesDbPath" ascii wide
        $b2 = "GetHistoryDbPath" ascii wide
        $b3 = "GetBookmarksDbPath" ascii wide

        $k1 = "SetWindowsHookEx" ascii wide
        $k2 = "GetKeyboardState" ascii wide

        $e1 = "MultipartFormDataContent" ascii wide
        $e2 = "HttpClient" ascii wide
        $e3 = "PostAsync" ascii wide

        $c1 = "BCryptDecrypt" ascii wide
        $c2 = "CryptUnprotectData" ascii wide

    condition:
        uint16(0) == 0x5A4D
        and $dotnet
        and 2 of ($fam*)
        and 3 of ($c2*)
        and 3 of ($br*)
        and 1 of ($key*)
        and 1 of ($wal*)
        and 2 of ($pk*)
        and 1 of ($ld*)
        and 2 of ($b*)
        and 1 of ($k*)
        and 2 of ($e*)
        and 1 of ($c*)
}
