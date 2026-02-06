rule Perion_Stealer_Wallet_Paths_And_Extensions
{
    meta:
        description = "Perion Stealer - Wallet paths and extension IDs"
        author      = "..."
        date        = "2026"
        mal_family  = "PerionStealer"

    strings:
        $wallet1 = "AppData\\Roaming\\atomic\\Local Storage\\leveldb" ascii nocase
        $wallet2 = "AppData\\Roaming\\Ethereum\\keystore" ascii nocase
        $wallet3 = "AppData\\Roaming\\Exodus\\exodus.wallet" ascii nocase
        $ext1 = "\\Local Extension Settings\\fnnegphlobjdpkhecapkijjdkgcjhkib" ascii nocase
        $ext2 = "\\Local Extension Settings\\nkbihfbeogaeaoehlefnkodbefgpgknn" ascii nocase  // Metamask
        $ext3 = "\\Local Extension Settings\\fhbohimaelbohpjbbldcngcnapndodjp" ascii nocase  // Binance
        $ext4 = "\\Local Extension Settings\\bfnaelmomeimhlpmgjnjophhpkkoljpa" ascii nocase  // Phantom

    condition:
        2 of ($wallet*) or 3 of ($ext*)
}
