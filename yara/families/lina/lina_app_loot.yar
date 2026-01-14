rule lina_stealer_app_loot
{
    meta:
        author = "No-Stealer Project"
        family = "Lina Stealer"
        description = "Detects Lina Stealer app data collection (Discord, Telegram, WhatsApp)"
        confidence = "medium-high"

    strings:
        $d1 = "discord_backup_codes" ascii
        $t1 = "Telegram Desktop" ascii
        $t2 = "tdata" ascii
        $w1 = "WhatsAppDesktop" ascii
        $e1 = "EpicGamesLauncher" ascii
        $g1 = "Growtopia" ascii

    condition:
        2 of them
}
