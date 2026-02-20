rule Myth_Stealer_Turkish_Campaign {
    meta:
        description = "Myth Stealer - Sahte oyun piyasasi uzerinden yayilan Turk yapimi veri calici (stealer)"
        author = "Enes"
        family = "Myth Stealer"
        target_os = "Windows"
        source = "Decompiled Java Payload"
        date = "2024-05-24"
        threat_level = "High"

    strings:
        // Benzersiz Paket Yapilari
        $pkg1 = "kedi/ege/util/nss"
        $pkg2 = "kedi/ege/util/win/lib"
        $pkg3 = "O8j9pimyYO"

        // Dosya icerisinde gecen cok spesifik Turkce sinif ismi
        $turk_class = "artik aglarsan anan aglar verdim cok radikal kararlar lezbiyen kizlar onlari gazlar" 

        // Myth Properties dosyasindaki proje bilgileri
        $myth_prop1 = "myth-private"
        $myth_prop2 = "qw.chudvvick"

        // Calisirken cagirdigi harici bilesen veya komutlar
        $telescxpe = "telescxpe"

        // Veri caldigina dair fonksiyonel isaretler (NSS ve NCrypt)
        $func1 = "PK11SDR_Decrypt"
        $func2 = "NCryptDecrypt"
        $func3 = "NSS_Init"
        $func4 = "SECITEM_FreeItem"

    condition:
        // Herhangi bir paket ismiyle birlikte Turkce sinif isminin veya 
        // Myth spesifik property bilgilerinin gorulmesi durumunda tetiklenir.
        uint16(0) == 0x4b50 or uint16(0) == 0xcafe // JAR (ZIP) veya Java Class baslangici
        and (
            $turk_class or 
            (any of ($pkg*)) or
            (all of ($myth_prop*)) or
            ($telescxpe and 2 of ($func*))
        )
}
