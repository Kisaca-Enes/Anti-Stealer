rule ERA_Stealer_Token_Validation_Loop
{
    meta:
        author = "No-Stealer Project"
        description = "Era Stealer Discord token validation via API"
        confidence = "low"

    strings:
        $steal_func = "stealTokens" ascii
        $auth_header = "authorization: token" ascii
        $axios_get = "axios.get" ascii
        $users_me = "/users/@me" ascii

    condition:
        $steal_func and
        $axios_get and
        $users_me
}
