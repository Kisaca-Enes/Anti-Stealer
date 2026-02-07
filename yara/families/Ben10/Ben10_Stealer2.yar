rule STEALER_NodeJS_Wallet_Seed_Extractor
{
    meta:
        author = "SOC / DFIR"
        description = "Detects NodeJS-based wallet, seed phrase and wallet.dat stealer activity"
        malware_type = "Crypto Wallet Stealer"
        capability = "Wallet + Seed Harvesting"
        tlp = "WHITE"
        date = "2026-02-07"

    strings:
        /* === Output Artifacts === */
        $out1 = "Desktop_Wallets" ascii wide
        $out2 = "Cold_Wallets" ascii wide
        $out3 = "WalletDat_Files" ascii wide
        $out4 = "Seed_Phrases" ascii wide
        $out5 = "wallets_summary.txt" ascii wide

        /* === Wallet Targets === */
        $wal1 = "wallet.dat" ascii wide
        $wal2 = "Bitcoin" ascii wide
        $wal3 = "Litecoin" ascii wide
        $wal4 = "Dogecoin" ascii wide
        $wal5 = "DashCore" ascii wide
        $wal6 = "Ethereum" ascii wide
        $wal7 = "Monero" ascii wide

        /* === Seed Phrase Hunting === */
        $seed1 = "mnemonic" ascii wide
        $seed2 = "recovery phrase" ascii wide
        $seed3 = "private key" ascii wide
        $seed4 = "wallet backup" ascii wide
        $seed5 = "crypto backup" ascii wide

        /* === Function-Level Fingerprints === */
        $fn1 = "getAllFilesWallet" ascii
        $fn2 = "extractColdWallets" ascii
        $fn3 = "extractDesktopWallets" ascii
        $fn4 = "findSeedPhrases" ascii
        $fn5 = "copyWalletDatFiles" ascii

    condition:
        (
            /* Strong wallet-stealer identity */
            2 of ($out*)
            and
            2 of ($wal*)
            and
            1 of ($seed*)
        )
        or
        (
            /* Memory / source-level detection */
            2 of ($fn*)
            and
            1 of ($out*)
        )
}
