rule lina_discord_token_wiper
{
    meta:
        author = "No-Stealer Project"
        description = "Detects Discord token wiping after injection"
        confidence = "high"

    strings:
        $l1 = "Local Storage\\leveldb" ascii
        $l2 = ".ldb" ascii
        $l3 = ".log" ascii
        $l4 = "writeFile(ldbFilePath, '', 'utf8')" ascii
        $l5 = "unlink(logFilePath)" ascii

    condition:
        3 of them
}
