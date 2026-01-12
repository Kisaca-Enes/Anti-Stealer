rule ERA_Stealer_Discord_Token_Collector
{
    meta:
        author = "No-Stealer Project"
        description = "Discord token harvesting via LevelDB (Era-like stealers)"
        confidence = "medium"

    strings:
        $leveldb = "Local Storage\\\\leveldb" ascii
        $ldb = ".ldb" ascii
        $log = ".log" ascii

        $regex_mfa = /mfa\.[\w-]{80,90}/
        $regex_token = /[\w-]{24}\.[\w-]{6}\.[\w-]{25,110}/

    condition:
        $leveldb and
        1 of ($ldb, $log) and
        1 of ($regex_mfa, $regex_token)
}
