rule Perion_Stealer_Webhook_And_Image_URLs
{
    meta:
        description = "Perion Stealer - Webhook patterns and image URLs"
        author      = "Grok"
        date        = "2026"
        mal_family  = "PerionStealer"

    strings:
        $url1 = "http://perion.cc/images/perion.png" ascii nocase
        $url2 = "https://discord.com/api/v9/users" ascii nocase
        $url3 = "https://discord.com/api/v8/guilds/" ascii nocase
        $url4 = "https://cdn.discordapp.com/avatars/" ascii nocase
        $webhook = "requests.Webhook" ascii
        $upload = "requests.Upload" ascii

    condition:
        3 of ($url*) or all of ($webhook, $upload)
}
