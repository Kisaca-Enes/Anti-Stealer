rule Perion_Stealer_Telegram_And_Discord_Emojis
{
    meta:
        description = "Perion Stealer - Telegram patterns and Discord emojis"
        author      = "Grok"
        date        = "2026"
        mal_family  = "PerionStealer"

    strings:
        $tg1 = "t.me/constc2" ascii nocase
        $tg2 = "api.telegram.org" ascii wide nocase
        $emoji1 = "<:perioncc6:1404290679781199942>" ascii
        $emoji2 = "<:perioncc8:1404292558313488515>" ascii
        $emoji3 = "<:perioncc:1404290684789329971>" ascii
        $emoji4 = "<:perioncc1:1404290670096679025>" ascii
        $emoji5 = "<:perioncc3:1404290673959632896>" ascii

    condition:
        any of ($tg*) or 3 of ($emoji*)
}
