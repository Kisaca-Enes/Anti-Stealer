rule Perion_Stealer_Mutex_And_Globals
{
    meta:
        description = "Perion Stealer - Mutex and global variables"
        author      = "..."
        date        = "2026"
        mal_family  = "PerionStealer"
        reference   = "Based on provided source code"

    strings:
        $mutex1 = "PerionSessionMutex" ascii wide nocase
        $mutex2 = "Global\\Perion_{hwid}" ascii wide nocase
        $mutex3 = "PerionStealerMutex" ascii wide nocase
        $global1 = "__antiVMResult" ascii
        $global2 = "__addonsReady" ascii
        $global3 = "PerionTempDir" ascii

    condition:
        2 of ($mutex*) or 2 of ($global*)
}
