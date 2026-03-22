rule MAL_NodeJS_Obfuscated_Infostealer_Zbabo_LummaLike_HighConfidence_2026
{
    meta:
        author        = "Enes (refined by ChatGPT)"
        description   = "High-confidence Node.js obfuscated infostealer/loader detection (Zbabo/Lumma-like), optimized for low false positives"
        family        = "Node.js Infostealer / Loader / Zbabo-like / Lumma-like"
        date          = "2026-03-22"
        version       = "2.0"
        confidence    = "high"
        false_positive_risk = "low"
        scope         = "JS / Node.js malware hunting and detection"

    strings:
        //
        // ===== Core high-signal package / crypto / loader indicators =====
        //
        $pkg_dpapi        = "@primno/dpapi" ascii fullword
        $pkg_admzip       = "adm-zip" ascii fullword
        $pkg_archiver     = "archiver" ascii fullword
        $pkg_formdata     = "form-data" ascii fullword

        $aes_1            = "createDecipheriv('aes-256-cbc'" ascii
        $aes_2            = "padEnd(32,'0').slice(0,32)" ascii
        $aes_3            = "toString('hex')+':'+e.toString('hex')" ascii

        $eval_1           = "eval(dec2['toString']('utf8'))" ascii
        $eval_2           = "dec2.toString('utf8')" ascii
        $req_poly         = "if(id==='@primno/dpapi'){return _req('@primno/dpapi')}" ascii

        //
        // ===== Obfuscation / generated-class patterns =====
        //
        $cls_fs           = "FileSystemManager_" ascii fullword
        $cls_http         = "HTTPClient_" ascii fullword
        $cls_crypto       = "CryptoManager_" ascii fullword
        $cls_data         = "DataProcessor_" ascii fullword
        $cls_sysmon       = "SystemMonitor_" ascii fullword
        $cls_str          = "StringUtils_" ascii fullword
        $cls_arr          = "ArrayUtils_" ascii fullword
        $cls_cache        = "CacheManager_" ascii fullword
        $cls_event        = "EventEmitter_" ascii fullword

        $suffix_ctor      = /_[a-z0-9]{6,8}\s*\{/ ascii
        $suffix_call      = /_[a-z0-9]{6,8}\s*\(/ ascii

        $obf_switch       = "switch(__p_4866520868)" ascii
        $obf_predict      = "__JS_PREDICT__" ascii nocase

        //
        // ===== Utility / framework structure (supporting only) =====
        //
        $util_1           = "static capitalize(s)" ascii
        $util_2           = "static truncate(s,l,x='...')" ascii
        $util_3           = "static slugify(s)" ascii
        $util_4           = "static randomString(l=16)" ascii
        $util_5           = "static chunk(a,s)" ascii
        $util_6           = "static getCPUUsage()" ascii
        $util_7           = "static getMemoryUsage()" ascii
        $util_8           = "this.cache=new Map()" ascii
        $util_9           = "this.events={}" ascii

        //
        // ===== System fingerprint / runtime environment =====
        //
        $log_init         = "logger.info('System initialized'" ascii
        $log_sys          = /platform.{0,80}arch.{0,80}nodeVersion.{0,80}memory.{0,80}cpu/ ascii

        $env_tmpdir       = "_os.tmpdir()" ascii
        $env_useragent    = "'User-Agent':'Node.js HTTP Client'" ascii
        $env_now          = "Date.now()" ascii

        //
        // ===== Exfil / operator / cluster markers =====
        //
        $exfil_gofile     = "gofile.io/uploadFile" ascii
        $discord_profile  = "https://discord.com/api/v10/users/${id}/profile" ascii
        $browser_datas    = "Browser-Datas" ascii wide
        $cfg_inj_1        = "config_inject_webhook" ascii
        $cfg_inj_2        = "config_inject_dualhook" ascii
        $cfg_inj_3        = "config_injection_url" ascii
        $cfg_remote       = "config_remote_server" ascii

        //
        // ===== Zbabo / TR operator-specific markers (very high signal) =====
        //
        $brand_1          = "zbabo stealer" ascii wide nocase
        $brand_2          = "ümidi zbabo stealer" ascii wide nocase
        $brand_3          = "umidi zbabo stealer" ascii wide nocase

        $tr_1             = "pisliğe iten hayat şartlarıydı" ascii wide
        $tr_2             = "daltonlar benim gardaşım gibidir" ascii wide
        $tr_3             = "kekem belki matbaadır" ascii wide
        $tr_4             = "Discord Token İşlenirken Hata" ascii wide
        $tr_5             = "Token dosyaya yazılırken hata" ascii wide
        $tr_6             = "GetToken genel hata" ascii wide
        $tr_7             = "antivm geçti pc" ascii wide
        $tr_8             = "antivm geçmedi pc" ascii wide

        $step_1           = "step 0 : script started" ascii wide
        $step_2           = "step 1 : fake error" ascii wide
        $step_3           = "step 2 : discord injection" ascii wide
        $step_4           = "step 2.5 : discord tokens" ascii wide
        $step_5           = "step 3 : browsers" ascii wide
        $step_6           = "step 3.5 : backup codes" ascii wide
        $step_7           = "step 4 : upload" ascii wide
        $step_8           = "step 5 : finish (IP:" ascii wide

        $rickroll         = "dQw4w9WgXcQ:" ascii

    condition:
        //
        // ===== Branch 1: Very high-confidence Lumma-like / Node loader =====
        // Requires dpapi + decryption/eval + archive/exfil + obfuscation/class context
        //
        (
            $pkg_dpapi
            and
            (
                $eval_1
                or
                ($eval_2 and 2 of ($aes_*))
                or
                ($req_poly and 1 of ($aes_*))
            )
            and
            1 of ($pkg_admzip, $pkg_archiver, $pkg_formdata, $exfil_gofile)
            and
            (
                (2 of ($cls_*) and 1 of ($suffix_ctor, $suffix_call))
                or
                (1 of ($obf_switch, $obf_predict) and 1 of ($suffix_ctor, $suffix_call))
            )
        )

        or

        //
        // ===== Branch 2: Generic obfuscated Node stealer framework =====
        // Strong utility class cluster + system fingerprint + env/exfil support
        //
        (
            3 of ($cls_*)
            and
            1 of ($suffix_ctor, $suffix_call)
            and
            (
                $log_init
                or
                $log_sys
                or
                2 of ($util_*)
            )
            and
            2 of ($util_*)
            and
            1 of ($env_tmpdir, $env_useragent, $env_now, $exfil_gofile, $discord_profile)
            and
            not 1 of ($brand_*, $tr_*, $step_*)  // keep generic branch cleaner / lower FP
        )

        or

        //
        // ===== Branch 3: Zbabo operator cluster (high-confidence hunt) =====
        // Turkish branding/workflow + malware functionality
        //
        (
            1 of ($brand_*)
            and
            2 of ($tr_*)
            and
            2 of ($step_*)
            and
            2 of ($pkg_dpapi, $exfil_gofile, $discord_profile, $cfg_inj_1, $cfg_inj_2, $cfg_inj_3, $cfg_remote, $browser_datas, $rickroll)
        )
}
