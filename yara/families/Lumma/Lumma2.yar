rule Lumma_Stealer_C2_Memory_HighConfidence
{
    meta:
        author = "enes"
        malware = "Lumma Stealer"
        family = "LummaC2"
        build_date = "2025-04-18"
        confidence = "very high"
        source = "memory dump + FLOSS"
        reference = "Telegram @lummamarketplace_bot"

    strings:
        // --- Hard attribution ---
        $build = "- LummaC2 Build:" wide ascii
        $tg1 = "@lummanowork" ascii
        $tg2 = "@lummamarketplace_bot" ascii

        // --- C2 ---
        $c2 = "quilltayle.live/gksi" wide

        // --- Browser theft ---
        $b1 = "\\Local State" wide ascii
        $b2 = "logins.json" ascii
        $b3 = "cookies.sqlite" ascii
        $b4 = "key4.db" ascii

        // --- Screenshot ---
        $png1 = "IHDR"
        $png2 = "IDAT"
        $png3 = "IEND"

        // --- Clipboard ---
        $clip1 = "OpenClipboard" wide
        $clip2 = "GetClipboardData" wide

        // --- Decoder tables ---
        $tbl1 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        $tbl2 = { 00 01 02 03 04 05 06 07 08 09 }

        // --- Decoded marker ---
        $mark = "LUMMAC2" ascii wide

    condition:
        uint16(0) == 0x5A4D and
        (
            $mark or
            ( $build and $c2 ) or
            ( 2 of ($b*) and 2 of ($png*) and 1 of ($clip*) )
        )
}
