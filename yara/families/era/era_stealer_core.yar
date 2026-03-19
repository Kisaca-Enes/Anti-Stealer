rule ERA_Stealer_Discord_Enrichment_Webhook
{
    meta:
        author = "No-Stealer Project"
        description = "Era Stealer Discord account enrichment and webhook exfiltration"
        date = "2026-01-12"
        confidence = "high"
        malware_family = "EraStealer"

    strings:
        /* Discord API usage */
        $api1 = "discord.com/api/v6/users/@me" ascii
        $api2 = "discord.com/api/v9/users/@me" ascii
        $api3 = "/users/" ascii
        $authorization = "Authorization" ascii

        /* Webhook indicators */
        $webhook1 = "embeds" ascii
        $webhook2 = "avatar_url" ascii
        $webhook3 = "username:" ascii

        /* Era specific branding */
        $era1 = "Era stealer" ascii nocase
        $era2 = "t.me/era_stealer" ascii

        /* Account enrichment */
        $acct1 = "Billing" ascii
        $acct2 = "Badges" ascii
        $acct3 = "Nitro" ascii
        $acct4 = "Guilds" ascii
        $acct5 = "Friends" ascii

    condition:
        1 of ($api*) and
        $authorization and
        2 of ($acct*) and
        2 of ($webhook*) and
        1 of ($era*)
}
