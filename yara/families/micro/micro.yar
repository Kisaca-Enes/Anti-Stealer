rule autoyar_zip_081cbc85d91f {
   meta:
      description = "service.jar - 081cbc85d91f01a6d66ace63bc3b9184507ccdc970bbb4aaa2a0be1548d430dc"
      author = "ThreatZone"
      reference = "Default reference"
      date = "2026-03-15"
      hash1 = "081cbc85d91f01a6d66ace63bc3b9184507ccdc970bbb4aaa2a0be1548d430dc"
   strings:
      $s1 = "com/google/gson/internal/bind/ReflectiveTypeAdapterFactory$RecordAdapter.class" fullword ascii /* score: '8.00'*/
      $s2 = "org/bouncycastle/jcajce/provider/asymmetric/compositesignatures/KeyPairGeneratorSpi$HashMLDSA87_ECDSA_P384_SHA512.class" fullword ascii /* score: '9.00'*/
      $s3 = "com/google/gson/internal/bind/ReflectiveTypeAdapterFactory$1.class" fullword ascii /* score: '8.00'*/
      $s4 = "com/sun/jna/platform/WindowUtils$NativeWindowUtils$TransparentContentPane.class" fullword ascii /* score: '8.00'*/
      $s5 = "com/sun/jna/win32/DLLCallback.class" fullword ascii /* score: '8.00'*/
      $s6 = "org/bouncycastle/pqc/legacy/crypto/ntru/NTRUEncryptionPrivateKeyParameters.class" fullword ascii /* score: '11.00'*/
      $s7 = "org/bouncycastle/pqc/crypto/xmss/XMSSMTPublicKeyParameters$Builder.class" fullword ascii /* score: '11.00'*/
      $s8 = "com/sun/jna/platform/win32/Winevt$EVT_RPC_LOGIN.class" fullword ascii /* score: '14.00'*/
      $s9 = "okhttp3/internal/publicsuffix/publicsuffixes.gz" fullword ascii /* score: '10.00'*/
      $s10 = "com/sun/jna/platform/win32/WinCrypt$CERT_USAGE_MATCH.class" fullword ascii /* score: '8.00'*/

      //IOC patterns
      $ioc1 = "version=3.49.1.0"
      $ioc2 = "3.0.2.1>Pp"
   condition:
      uint16(0) == 0x4b50 and filesize < 31800KB and filesize > 26018KB and
      2 of ($ioc*) and
      all of ($s*)
}
