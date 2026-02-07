rule Vidar_Stealer_Dump
{
    meta:
        description = "Detects Vidar stealer samples from memory or dump"
        author = "Enes"
        date = "2026-02-07"
        malware_family = "Vidar"

    strings:
        // String markers from dump
        $s1 = "UAWAVAUATVWSH"
        $s2 = "AWAVAUATVWUSH"
        $s3 = "AVVWSH"
        $s4 = "UVWSPH"
        $s5 = "DEADBEEF"
        $s6 = "0008E2000008E200"
        
        // File system / environment markers
        $path1 = "%APPDATA%"
        $path2 = "%LOCALAPPDATA%"
        $path3 = "%TEMP%"
        $path4 = "%USERPROFILE%"
        
        // Repeated API imports typical of Vidar
        $api1 = "CreateFileA"
        $api2 = "ReadFile"
        $api3 = "WriteFile"
        $api4 = "CopyFileW"
        $api5 = "OpenProcess"
        $api6 = "TerminateProcess"
        $api7 = "IsDebuggerPresent"
        $api8 = "CheckRemoteDebuggerPresent"
    
    condition:
        // At least 3 string markers AND 2 API imports
        (3 of ($s*)) and (2 of ($api*))
        or
        // Or critical magic hex present
        $s5 or $s6
}
