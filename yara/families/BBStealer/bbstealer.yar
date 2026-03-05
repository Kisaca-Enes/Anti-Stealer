rule BbyStealer_Discord_Token_Stealer {
    meta:
        description = "Detects variants of the 'Bby Stealer' Discord token stealer malware, which injects into Discord's Electron app to exfiltrate credentials, tokens, and payment info to attacker-controlled servers. Targets JavaScript injection scripts with characteristic patterns, strings, and behaviors."
        author = "Grok AI (based on deobfuscated sample analysis)"
        date = "2026-03-05"
        threat_level = "high"
        malware_family = "BbyStealer"
        reference = "Deobfuscated sample: Intercepts Discord API, forces logout, exfiltrates to https://bby.rip/c1d"
        hash_sample = "N/A (deobfuscated script)"
        yara_version = "4.0+"

    strings:
        // Core malicious strings
        $dir_marker = "bbystealer" ascii nocase  // Directory created for persistence/first-run check
        $exfil_url = "https://bby.rip/c1d" ascii nocase  // Attacker C2 endpoint for data exfiltration
        $logout_func = "function LogOut()" ascii  // Logout forcing function
        $token_extract = "getToken" ascii  // Token extraction pattern in injected JS
        $csp_bypass = "content-security-policy" ascii  // CSP bypass in headers
        $api_intercept_login = "auth/login" ascii  // Intercepted login endpoint
        $api_intercept_users = "users/@me" ascii  // Intercepted user profile endpoint
        $api_intercept_tokens = "api.stripe.com/v*/tokens" ascii  // Intercepted payment token endpoint
        $payload_type_login = "type: 'login'" ascii  // Payload type for login steals
        $payload_type_password = "type: 'changedpassword'" ascii  // Payload type for password changes
        $payload_type_email = "type: 'changedemail'" ascii  // Payload type for email changes
        $payload_type_cc = "type: 'creditcard'" ascii  // Payload type for credit card steals

        // Electron/Discord specific patterns
        $electron_require = "require('electron')" ascii
        $browser_window = "BrowserWindow" ascii
        $session_webrequest = "session.defaultSession.webRequest" ascii
        $execute_js = "executeJavaScript" ascii
        $webpack_inject = "window.webpackJsonp" ascii  // Webpack injection for Discord internals
        $core_export = "module.exports = require('./core.asar')" ascii  // Injection into Discord core module

        // Data exfiltration patterns
        $xhr_post = "xhr.open('POST'" ascii
        $xhr_headers = "setRequestHeader('Content-Type', 'application/json')" ascii
        $payload_username = "username: `${user.username}#${user.discriminator}`" ascii
        $payload_token = "token," ascii
        $payload_password = "password," ascii
        $payload_email = "email," ascii
        $payload_cc_num = "cc_num:" ascii
        $payload_cvc = "cvc," ascii

    condition:
        // Require core indicators for high confidence
        ($dir_marker or $exfil_url) and
        // At least 3 API interception patterns
        3 of ($api_intercept_*) and
        // At least 2 payload types
        2 of ($payload_type_*) and
        // Electron/Discord injection indicators
        ($electron_require or $browser_window or $session_webrequest or $execute_js or $webpack_inject or $core_export) and
        // Exfiltration mechanics
        ($xhr_post or $xhr_headers) and
        // At least 3 data fields in payloads
        3 of ($payload_*)
}
