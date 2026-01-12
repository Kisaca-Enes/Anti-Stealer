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
        $api_v6 = "discord.com/api/v6/users/@me" ascii
        $api_v9 = "discord.com/api/v9/users/@me" ascii
        $api_profile = "/users/" ascii
        $authorization = "Authorization" ascii

        /* Webhook indicators */
        $webhook_embed = "embeds" ascii
        $avatar_url = "avatar_url" ascii
        $username = "username:" ascii

        /* Era specific branding */
        $era_footer = "Era stealer" ascii nocase
        $era_tg = "t.me/era_stealer" ascii

        /* Account enrichment */
        $billing = "Billing" ascii
        $badges = "Badges" ascii
        $nitro = "Nitro" ascii
        $guilds = "Guilds" ascii
        $friends = "Friends" ascii

    condition:
        (
            1 of ($api_v6, $api_v9) and
            $authorization and
            2 of ($billing, $badges, $nitro, $guilds, $friends) and
            $webhook_embed and
            1 of ($era_footer, $era_tg)
        )
}
