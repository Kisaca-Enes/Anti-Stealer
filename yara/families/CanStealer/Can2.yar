rule autoyar_unknown_5dddf76fad19 {
   meta:
      description = "Pinkcraft_Setup.msi - 5dddf76fad199f05a4a3de5048e549116de00f588978b202af65010d57124247"
      author = "ThreatZone"
      reference = "Default reference"
      date = "2026-03-07"
      hash1 = "5dddf76fad199f05a4a3de5048e549116de00f588978b202af65010d57124247"
   strings:
      $s1 = "d3dcompiler_47.dll_f" fullword ascii /* score: '16.00'*/
      $s2 = "yhZT.Gsc" fullword ascii /* score: '10.00'*/
      $s3 = "v9ArUAI:\"" fullword ascii /* score: '10.00'*/
      $s4 = ")5+c7_\\6" fullword ascii /* score: '9.00'*/ /* hex encoded string '\v' */
      $s5 = "#23222222" fullword ascii /* score: '9.00'*/ /* hex encoded string '#"""' */
      $s6 = "vbvfvjvnvr" fullword ascii /* score: '8.00'*/
      $s7 = "\\__?<4F%" fullword ascii /* score: '10.00'*/ /* hex encoded string 'O' */
      $s8 = "ZAlH:\"v" fullword ascii /* score: '10.00'*/
      $s9 = "bpfphpjplp" fullword ascii /* score: '8.00'*/
      $s10 = "gedjifmk" fullword ascii /* score: '8.00'*/

      //IOC patterns
      $ioc1 = "strm), \"1.2.13.1-motley\", (int)sizeof(z_stream)))"
      $ioc2 = "WiX Toolset (4.0.0.5512)"
   condition:
      uint16(0) == 0xcfd0 and filesize < 92893KB and filesize > 76003KB and
      2 of ($ioc*) and
      all of ($s*)
}
