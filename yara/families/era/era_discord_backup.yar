rule ERA_Stealer_Discord_Backup_Codes
{
    meta:
        author = "No-Stealer Project"
        description = "Era Stealer Discord backup codes harvesting"
        confidence = "critical"

    strings:
        $backup_func = "stealBackupCodes" ascii
        $backup_pattern = "discord_backup_codes" ascii
        $send_codes = "sendBackupCodes" ascii
        $home_dir = "os.homedir()" ascii

    condition:
        $backup_func and
        $backup_pattern
}
