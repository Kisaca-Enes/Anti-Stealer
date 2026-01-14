rule lina_minecraft_stealer
{
    meta:
        author = "No-Stealer Project"
        family = "Lina Stealer"
        description = "Detects Minecraft user data harvesting"
        confidence = "medium-high"

    strings:
        $m1 = ".minecraft\\usercache.json" ascii
        $m2 = "killMinecraft" ascii
        $m3 = "javaw.exe" ascii

    condition:
        2 of them
}
