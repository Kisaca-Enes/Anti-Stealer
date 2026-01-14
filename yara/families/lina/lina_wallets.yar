rule lina_stealer_wallet_harvester
{
    meta:
        author = "No-Stealer Project"
        family = "Lina Stealer"
        description = "Detects browser wallet harvesting behavior"
        confidence = "high"

    strings:
        $wallet1 = "walletPaths" ascii
        $wallet2 = "All_Wallets.zip" ascii
        $wallet3 = "browserPaths" ascii
        $wallet4 = "Opera GX Stable" ascii
        $wallet5 = "addLocalFile" ascii

    condition:
        3 of them
}
