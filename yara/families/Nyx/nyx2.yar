rule autoyar_exe_1bf3dd9d65a5 {
   meta:
      description = "VrChatmod_Setup.exe - 1bf3dd9d65a5424e50366f3f3a95d870e2ff93252e30a8e5964e785a68676d03"
      author = "ThreatZone"
      reference = "Default reference"
      date = "2026-03-27"
      hash1 = "1bf3dd9d65a5424e50366f3f3a95d870e2ff93252e30a8e5964e785a68676d03"
   strings:
      $s1 = "@J@7%i%d" fullword ascii /* score: '8.00'*/
      $s2 = "&$3 <4&\\" fullword ascii /* score: '9.00'*/ /* hex encoded string '4' */
      $s3 = "\"/2EZwS!." fullword ascii /* score: '8.00'*/
      $s4 = "jgdLlS'&" fullword ascii /* score: '9.00'*/
      $s5 = "QQnU.Crs" fullword ascii /* score: '10.00'*/
      $s6 = "SFcU.qSo$" fullword ascii /* score: '10.00'*/
      $s7 = "TWrJ.NkK" fullword ascii /* score: '10.00'*/
      $s8 = "jLCN.DjB!k" fullword ascii /* score: '10.00'*/
      $s9 = "i(XIKF[1%I%g" fullword ascii /* score: '11.00'*/
      $s10 = "%s%S.dll" fullword wide /* score: '21.00'*/

      //IOC patterns
      $ioc1 = "E8q@3.IO"
   condition:
      uint16(0) == 0x5a4d and filesize < 109288KB and filesize > 89418KB and
      1 of ($ioc*) and
      all of ($s*)
}
