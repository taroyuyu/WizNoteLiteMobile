package com.wiznotelitemobile;

import android.app.Application;
import android.content.Context;
import android.content.res.AssetManager;
import android.util.Log;

import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.soloader.SoLoader;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.lang.reflect.InvocationTargetException;
import java.util.List;

import io.liteglue.SQLitePluginPackage;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost =
      new ReactNativeHost(this) {
        @Override
        public boolean getUseDeveloperSupport() {
          return BuildConfig.DEBUG;
        }

        @Override
        protected List<ReactPackage> getPackages() {
          @SuppressWarnings("UnnecessaryLocalVariable")
          List<ReactPackage> packages = new PackageList(this).getPackages();
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // packages.add(new MyReactNativePackage());
            packages.add(new SQLitePluginPackage());
          return packages;
        }

        @Override
        protected String getJSMainModuleName() {
          return "index";
        }
      };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
    initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
    copyFileOrDir("resources");
  }

  private String localAssertsFolder() {
    File filesDir = getFilesDir();
    return new File(filesDir, "assets").getAbsolutePath();
  }
  
  private void copyFileOrDir(String path) {
      AssetManager assetManager = getAssets();
      try {
          String[] assets = assetManager.list(path);
          if (assets == null) {
              return;
          }
          if (assets.length == 0) {
              copyFile(path);
          } else {
              String fullPath = localAssertsFolder() + "/" + path;
              File dir = new File(fullPath);
              if (!dir.exists()) dir.mkdirs();
              for (String asset : assets) {
                  copyFileOrDir(path + "/" + asset);
              }
          }
      } catch (IOException e) {
          e.printStackTrace();
      }
  }

  private void copyFile(String filename) {
      AssetManager assetManager = getAssets();
      InputStream in = null;
      OutputStream out = null;
      try {
          String outputFileName = localAssertsFolder() + "/" + filename;
          if (new File(outputFileName).exists()) return;
          in = assetManager.open(filename);
          out = new FileOutputStream(outputFileName);
          byte[] buffer = new byte[2048];
          int read;
          while ((read = in.read(buffer)) != -1) {
              out.write(buffer, 0, read);
          }
      } catch (IOException e) {
          e.printStackTrace();
      } finally {
          try {
              if (in != null ) in.close();
              if (out != null) out.close();
          } catch (IOException e) {
              e.printStackTrace();
          }
      }
  }
    
  
    /**
   * Loads Flipper in React Native templates. Call this in the onCreate method with something like
   * initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
   *
   * @param context
   * @param reactInstanceManager
   */
  private static void initializeFlipper(
      Context context, ReactInstanceManager reactInstanceManager) {
    if (BuildConfig.DEBUG) {
      try {
        /*
         We use reflection here to pick up the class that initializes Flipper,
        since Flipper library is not available in release mode
        */
        Class<?> aClass = Class.forName("com.wiznotelitemobile.ReactNativeFlipper");
        aClass
            .getMethod("initializeFlipper", Context.class, ReactInstanceManager.class)
            .invoke(null, context, reactInstanceManager);
      } catch (ClassNotFoundException e) {
        e.printStackTrace();
      } catch (NoSuchMethodException e) {
        e.printStackTrace();
      } catch (IllegalAccessException e) {
        e.printStackTrace();
      } catch (InvocationTargetException e) {
        e.printStackTrace();
      }
    }
  }
}
