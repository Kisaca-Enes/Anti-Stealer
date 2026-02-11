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
}
