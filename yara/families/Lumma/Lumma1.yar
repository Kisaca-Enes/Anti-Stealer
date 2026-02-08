rule Lumma_Stealer_Packed_Memory
{
    meta:
        author = "enes"
        malware = "Lumma Stealer"
        type = "packed / memory"
        confidence = "high"

    strings:
        // Crypto / encoding tables
        $rc4 = { 00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F }
        $base = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"

        // Screenshot via GDI
        $gdi1 = "CreateDIBSection" wide
        $gdi2 = "BitBlt" wide

        // Clipboard abuse
        $clip1 = "OpenClipboard" wide
        $clip2 = "GetClipboardData" wide

        // COM init (browser theft)
        $com1 = "CoInitialize" wide
        $com2 = "CoCreateInstance" wide

        // PNG in-memory encoding
        $png1 = "IHDR"
        $png2 = "IDAT"
        $png3 = "IEND"

    condition:
        uint16(0) == 0x5A4D and
        2 of ($gdi*) and
        1 of ($clip*) and
        1 of ($com*) and
        2 of ($png*) and
        ($rc4 or $base)
}
