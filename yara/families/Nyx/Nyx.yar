rule MAL_NyxStealer_Discord_Injector_STRICT
{
    meta:
        author = "Enes"
        date = "2026-03-27"
        family = "NyxStealer"
        variant = "Discord/Electron JavaScript Injector"
        sha256 = "1bf3dd9d65a5424e50366f3f3a95d870e2ff93252e30a8e5964e785a68676d03"
        tlp = "clear"
        confidence = "high"
        description = "NyxStealer Discord/Electron injector sample. Tespit, direkt family marker, Telegram branding, config artifact'leri, token theft, remote-auth interception ve backup code collection string'lerine dayanir."

    strings:
        /* ===== DIRECT FAMILY / BRANDING ===== */
        $fam1 = "NyxStealer" ascii wide nocase
        $fam2 = "@nyxstealer | t.me/nyxste4ler" ascii nocase
        $fam3 = "ctx.username = \"NyxStealer\"" ascii
        $fam4 = "copy_8C70F144-386A-4CA9-B26A-E97A2A024890.gif" ascii

        /* ===== NYX CONFIG / BUILDER ARTIFACTS ===== */
        $cfg1 = "%API_URL_PLACEHOLDER%" ascii
        $cfg2 = "force_persist_startup" ascii
        $cfg3 = "auto_user_profile_edit" ascii
        $cfg4 = "auto_email_update" ascii
        $cfg5 = "disable_qr_code" ascii
        $cfg6 = "block_view_sessions" ascii
        $cfg7 = "block_passkey_login" ascii

        /* ===== DISCORD TOKEN THEFT / INJECTION ===== */
        $inj1 = "webpackChunkdiscord_app.push([[''], {}, (req) => {" ascii
        $inj2 = "typeof mod.getToken === 'function'" ascii
        $inj3 = "typeof mod.default.getToken === 'function'" ascii
        $inj4 = "window.__token_fetched" ascii
        $inj5 = "token.includes('.') && token.length > 50" ascii
        $inj6 = "ls.MultiAccountStore = null" ascii
        $inj7 = "BrowserWindow.getAllWindows()" ascii
        $inj8 = "webContents.executeJavaScript(script, true)" ascii

        /* ===== 2FA / BACKUP CODE COLLECTION ===== */
        $bc1 = "backup_codes: () => execScript(`(() => {" ascii
        $bc2 = "text.includes('-') && text.length === 9" ascii
        $bc3 = "const cleanCode = text.replace('-', '')" ascii
        $bc4 = "/^[a-z0-9]{8}$/.test(cleanCode)" ascii
        $bc5 = "return [...new Set(codes)]" ascii

        /* ===== REMOTE AUTH / SESSION ABUSE ===== */
        $ra1 = "*://*/api/*/remote-auth/login*" ascii
        $ra2 = "*://*/api/*/remote-auth/finish*" ascii
        $ra3 = "wss://remote-auth-gateway.discord.gg/*" ascii
        $ra4 = "https://discord.com/api/v*/auth/sessions" ascii
        $ra5 = "*://*/api/*/mfa/webauthn/credentials*" ascii

    condition:
        (
            /* Direkt Nyx markeri + davranış */
            1 of ($fam1,$fam2,$fam3) and
            3 of ($cfg*) and
            4 of ($inj*) and
            2 of ($ra*)
        )
        or
        (
            /* Branding + config + backup code theft */
            2 of ($fam*) and
            3 of ($cfg*) and
            2 of ($bc*) and
            2 of ($ra*)
        )
}
