rule Perion_Stealer_Addon_Key_And_Paths
{
    meta:
        description = "Perion Stealer - Addon encryption key and paths"
        author      = "..."
        date        = "2026"
        mal_family  = "PerionStealer"

    strings:
        $key = "kX6BaZFZUgoXIDmahTG2KzFTN3D0Men5H8ZPuGQnGEQ=" ascii
        $addon1 = "addon0.node.enc" ascii
        $addon2 = "addon1.node.enc" ascii
        $addon3 = "addon2.node.enc" ascii
        $addon4 = "dpapi.node.enc" ascii
        $path1 = "perion-temp" ascii
        $path2 = "extensions-temp" ascii
        $path3 = "wallets-temp" ascii

    condition:
        $key or 3 of ($addon*) or 2 of ($path*)
}
