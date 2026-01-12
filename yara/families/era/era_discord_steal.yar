rule ERA_Stealer_HQ_Discord_Targeting
{
    meta:
        author = "No-Stealer Project"
        description = "Era Stealer high-value Discord friend & guild targeting logic"
        malware_family = "EraStealer"
        confidence = "very high"

    strings:
        /* HQ friends & guilds */
        $hq_friends = "getHQFriends" ascii
        $hq_guilds = "getHQGuilds" ascii
        $relationships = "/users/@me/relationships" ascii
        $guilds_counts = "/users/@me/guilds?with_counts=true" ascii

        /* Rare badge logic */
        $rare_badges = "getRareBadges" ascii
        $public_flags = "public_flags" ascii
        $badge_map = "badgeMap" ascii

        /* Booster detection */
        $boost_lvl = "guild_booster_lvl" ascii
        $boost_level = "getBoostLevel" ascii

    condition:
        (
            $hq_friends or $hq_guilds
        ) and
        2 of ($rare_badges, $public_flags, $boost_lvl, $boost_level)
}
