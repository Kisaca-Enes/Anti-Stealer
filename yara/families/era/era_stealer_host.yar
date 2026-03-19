rule ERA_Stealer_Token_Validation_Loop
{
    meta:
        author = "No-Stealer Project"
        description = "Detects Era Stealer Discord token validation via API"
        confidence = "low"
        malware_family = "ERA Stealer"
        scope = "memory,disk"

    strings:
        $func1 = "stealTokens" ascii
        $axios1 = "axios.get" ascii
        $endpoint1 = "/users/@me" ascii
        $auth1 = "authorization: token" ascii

    condition:
        $func1 and
        $axios1 and
        $endpoint1 and
        $auth1
}
