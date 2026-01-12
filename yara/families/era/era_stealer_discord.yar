rule ERA_Stealer_Host_Fingerprinting
{
    meta:
        author = "No-Stealer Project"
        description = "Era Stealer host and IP profiling logic"
        confidence = "medium"

    strings:
        $ip_api = "ip-api.com/json" ascii
        $hostname = "os.hostname()" ascii
        $totalmem = "os.totalmem()" ascii
        $username_env = "process.env.USERNAME" ascii
        $os_version = "os.version()" ascii

    condition:
        $ip_api and
        2 of ($hostname, $totalmem, $username_env, $os_version)
}
