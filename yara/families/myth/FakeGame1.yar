rule autoyar_exe_d51ca075deaa {
   meta:
      description = "SmpWorldsLauncher.exe - d51ca075deaa0ed3e22b26fea7d8d61350ce9bff60135ba85defc6af926a8b60"
      author = "ThreatZone"
      reference = "Default reference"
      date = "2026-03-05"
      hash1 = "d51ca075deaa0ed3e22b26fea7d8d61350ce9bff60135ba85defc6af926a8b60"
   strings:
      $s1 = "<3\"a0\\0" fullword ascii /* score: '9.00'*/ /* hex encoded string ':' */
      $s2 = "\"%dqvf35* 0" fullword ascii /* score: '8.00'*/
      $s3 = "i^a* -]p?" fullword ascii /* score: '9.00'*/
      $s4 = "HOzR.ygr" fullword ascii /* score: '10.00'*/
      $s5 = "FZgl'y:\\" fullword ascii /* score: '10.00'*/
      $s6 = "aiJC%K%'" fullword ascii /* score: '8.00'*/
      $s7 = "CRYPTBASE" fullword ascii /* score: '8.50'*/
      $s8 = "*\\[5 \\C" fullword ascii /* score: '9.00'*/ /* hex encoded string '\' */
      $s9 = "ZNTNe- R;" fullword ascii /* score: '8.00'*/
      $s10 = "* D-+#|a9" fullword ascii /* score: '9.00'*/

      //IOC patterns
      $ioc1 = "_@F.es\""
   condition:
      uint16(0) == 0x5a4d and filesize < 63914KB and filesize > 52294KB and
      1 of ($ioc*) and
      all of ($s*)
}

