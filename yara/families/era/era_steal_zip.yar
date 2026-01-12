rule ERA_Stealer_Loot_Zip_Collection
{
    meta:
        author = "No-Stealer Project"
        description = "Era Stealer loot folder + zip logic"
        confidence = "low"

    strings:
        $admzip = "AdmZip" ascii
        $add_folder = "addLocalFolder" ascii
        $write_zip = "writeZip" ascii
        $random_path = "randomPath" ascii

    condition:
        2 of ($admzip, $add_folder, $write_zip) and
        $random_path
}
