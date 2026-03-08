rule MythGrabber_v140_Discord_Injection_Module
{
    meta:
        description      = "Detects MythGrabber v140 Discord desktop injection payload / module (credential + token stealer)"
        author           = "Reconstructed source pattern matching"
        reference        = "MythGrabber stealer - Discord core injection"
        date             = "2025-03 / 2026-03 update"
        malware_family   = "MythGrabber"
        severity         = "HIGH"
        mitre_attack     = "T1555.003, T1055.013, T1119, T1567.002"
        note             = "Targets discord_desktop_core/index.js modification"

    strings:

        // ────────────────────────────────────────────────
        // En güçlü imza: MythGrabber comment + webhook placeholder
        // ────────────────────────────────────────────────
        $myth_comment   = "// MythGrabber Discord Injection" ascii
        $webhook_var    = "_0x_webhook" ascii
        $webhook_place  = "%WEBHOOK%" ascii

        // ────────────────────────────────────────────────
        // Embed başlıkları (en karakteristik Discord exfil imzaları)
        // ────────────────────────────────────────────────
        $embed1 = "🔐 Discord Login Captured" ascii
        $embed2 = "🎫 New Discord Token" ascii
        $embed3 = "🔑 Password Change Detected" ascii

        $color_red    = "color: 0xff0000" ascii
        $color_green  = "color: 0x00ff00" ascii
        $color_yellow = "color: 0xffff00" ascii

        // ────────────────────────────────────────────────
        // Token hırsızlığı webpack chunk tekniği (çok yaygın ama bu versiyonda spesifik)
        // ────────────────────────────────────────────────
        $webpack1 = "webpackChunkdiscord_app.push" ascii
        $webpack2 = "m=[];for(let c in e.c)m.push(e.c[c])" ascii
        $webpack3 = ".exports.default.getToken" ascii
        $last_token = "_lastToken" ascii

        // ────────────────────────────────────────────────
        // Interval ve fetch hook kısımları
        // ────────────────────────────────────────────────
        $interval = "setInterval" ascii fullword
        $fetch_hook = "window.fetch = async" ascii
        $users_me_patch = "/users/@me" ascii
        $method_patch   = "PATCH" ascii

        // ────────────────────────────────────────────────
        // Discord klasör & modül yol imzaları
        // ────────────────────────────────────────────────
        $core_path1 = "discord_desktop_core-1" ascii
        $core_path2 = "discord_desktop_core" ascii
        $core_index = "index.js" ascii fullword
        $app_prefix = "app-" ascii

        // ────────────────────────────────────────────────
        // Dosya işlemleri ve injection kontrolü
        // ────────────────────────────────────────────────
        $find_core     = "findDiscordCore" ascii fullword
        $inject_func   = "injectDiscord" ascii fullword
        $remove_func   = "removeInjection" ascii fullword
        $already_inj   = "MythGrabber" ascii fullword nocase

        // ────────────────────────────────────────────────
        // Form submit dinleme ve credential çalma
        // ────────────────────────────────────────────────
        $form_submit   = "document.addEventListener('submit'" ascii
        $email_input   = "input[name=\"email\"]" ascii
        $pass_input    = "input[name=\"password\"]" ascii

        // ────────────────────────────────────────────────
        // Diğer yardımcı string'ler
        // ────────────────────────────────────────────────
        $tauri_login   = "__TAURI__.login" ascii
        $originalLogin = "originalLogin" ascii
        $originalFetch = "originalFetch" ascii

    condition:

        // En yüksek doğruluk (kritik imza kombinasyonu)
        (
            $myth_comment and 
            1 of ($webhook_var, $webhook_place) and 
            2 of ($embed*)
        )
        or

        // Güçlü injection + token çalma paternleri
        (
            2 of ($webpack*) and 
            $last_token and 
            1 of ($interval, $fetch_hook) and 
            1 of ($embed*)
        )
        or

        // Discord core dosyasına özgü yol + injection fonksiyonları
        (
            2 of ($core_path*, $app_prefix) and
            1 of ($find_core, $inject_func, $remove_func) and
            ($already_inj or $myth_comment)
        )
        or

        // Form credential + embed + fetch hook üçlüsü
        (
            all of ($form_submit, $email_input, $pass_input) and
            1 of ($embed*) and
            $fetch_hook
        )
        or

        // Çok geniş ama hala anlamlı kombinasyon (obfuscated varyantlar için)
        (
            3 of ($embed*, $color_*, $webpack*, $fetch_hook) and
            2 of ($core_path*, $core_index, $app_prefix, $myth_comment)
        )

        // Dosya boyutu kısıtlaması (tipik injection script'leri küçük-orta boy)
        and filesize < 64KB
}
