rule Stealerium_DotNet_Full_Stealer
{
    meta:
        description = "Detects Stealerium .NET stealer based on browser, wallet, keylogger and exfiltration artifacts"
        author = "Enes"
        date = "2026-02-11"
        family = "Stealerium"
        confidence = "very_high"

    strings:
        /* Stealerium namespace / identity */
        $id1 = "Stealerium.Stub" ascii wide
        $id2 = "Stealerium.Stub.Modules" ascii wide
        $id3 = "Stealerium.Stub.Target.Browsers.Chromium" ascii wide
        $id4 = "Stealerium.Stub.Target.Browsers.Firefox" ascii wide

        /* Telegram / Zulip / Gofile exfil */
        $ex1 = "Stealerium.Stub.Telegram" ascii wide
        $ex2 = "SendReportAsync" ascii wide
        $ex3 = "UploadKeylogsAsync" ascii wide
        $ex4 = "GofileFileService" ascii wide
        $ex5 = "ZulipAPIKey" ascii wide

        /* Browser data theft */
        $br1 = "Login Data" ascii wide
        $br2 = "Local State" ascii wide
        $br3 = "Cookies" ascii wide
        $br4 = "History" ascii wide
        $br5 = "ChromeWalletsDirectories" ascii wide
        $br6 = "EdgeWalletsDirectories" ascii wide

        /* Wallet & crypto */
        $cr1 = "KnownWalletDirectories" ascii wide
        $cr2 = "walletRegistry" ascii wide
        $cr3 = "CopyWalletFromDirectoryTo" ascii wide
        $cr4 = "CopyWalletFromRegistryTo" ascii wide

        /* Keylogger */
        $kl1 = "SetWindowsHookEx" ascii wide
        $kl2 = "CallNextHookEx" ascii wide
        $kl3 = "LogKeyPress" ascii wide
        $kl4 = "GetKeyboardState" ascii wide

        /* Screenshot / webcam */
        $sc1 = "CopyFromScreen" ascii wide
        $sc2 = "GetDesktopScreenshot" ascii wide
        $sc3 = "GetWebcamScreenshot" ascii wide

        /* Compression + staging */
        $zp1 = "ICSharpCode.SharpZipLib.Zip" ascii wide
        $zp2 = "CreatePasswordProtectedZip" ascii wide
        $zp3 = "AddDirectoryToZip" ascii wide

        /* Anti-analysis */
        $aa1 = "VirtualBox" ascii wide
        $aa2 = "SandBox" ascii wide
        $aa3 = "AntiAnalysis" ascii wide
        $aa4 = "SleepMax" ascii wide

        /* .NET marker */
        $dn = "mscorlib" ascii wide

    condition:
        uint16(0) == 0x5A4D
        and $dn
        and 2 of ($id*)
        and 2 of ($ex*)
        and 3 of ($br*)
        and 1 of ($cr*)
        and 1 of ($kl*)
}
