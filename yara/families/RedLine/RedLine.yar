rule autoyar_unknown_d30c29d3b0bf {
   meta:
      description = "RisePro_Proxy.exe - d30c29d3b0bfdf833551769b5c30ef0d7796ce79fd04c749c7bf4898c6ffe823"
      author = "ThreatZone"
      reference = "Default reference"
      date = "2026-03-10"
      hash1 = "d30c29d3b0bfdf833551769b5c30ef0d7796ce79fd04c749c7bf4898c6ffe823"
   strings:
      $s1 = "get_encrypted_key" fullword ascii /* score: '17.00'*/
      $s2 = "RM_PROCESS_INFO" fullword ascii /* score: '15.00'*/
      $s3 = "SELSystem.Windows.FormsECT * FRSystem.Windows.FormsOM WinSystem.Windows.Forms32_ProcSystem.Windows.Formsessor" fullword wide /* score: '14.00'*/
      $s4 = "msedge.exe" fullword wide /* score: '22.00'*/
      $s5 = "get_ShowTopBorder" fullword ascii /* score: '9.00'*/
      $s6 = "set_encrypted_key" fullword ascii /* score: '12.00'*/
      $s7 = ".NET Framework 4\"" fullword ascii /* score: '10.00'*/
      $s8 = "GetVirtualDisplaySize" fullword ascii /* score: '9.00'*/
      $s9 = "XRails_LogoBox" fullword ascii /* score: '9.00'*/
      $s10 = "serviceInterface.Extension" fullword wide /* score: '10.00'*/

      //IOC patterns
      $ioc1 = "ZSystem.Object, mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089"
      $ioc2 = "203.86.233.121:1912"
      $ioc3 = "<assemblyIdentity version=\"1.0.0.0\" name=\"MyApplication.app\"/>"
      $ioc4 = "15.0.0.0"
      $ioc5 = "12.9.1.22"
      $ioc6 = "0.0.0.0"
      $ioc7 = "EntityTUwSystem.ServiceModel.SessionMode, System.ServiceModel, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089"
      $ioc8 = "1.1.21.1"
      $ioc9 = "--proxy-server=\"217.65.2.14:3333\""
   condition:
      uint16(0) == 0x5a4d and filesize < 330KB and filesize > 270KB and
      4 of ($ioc*) and
      all of ($s*)
}

