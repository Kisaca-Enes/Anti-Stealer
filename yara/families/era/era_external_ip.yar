rule ERA_Stealer_External_IP_Resolution
{
    meta:
        author = "No-Stealer Project"
        description = "Era Stealer external IP resolution"
        confidence = "low"

    strings:
        $external_ip = "myexternalip.com/raw" ascii
        $get_ip = "getIp()" ascii

    condition:
        $external_ip and $get_ip
}
