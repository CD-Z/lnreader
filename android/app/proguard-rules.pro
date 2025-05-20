# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class expo.** { *; }

# Keep all classes used by SQLite
-keep class expo.modules.sqlite.** { *; }
-keep class org.sqlite.** { *; }

# Keep all React Native bridge classes
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.modules.** { *; }
-keep class com.facebook.react.uimanager.** { *; }

# Keep all classes with native methods
-keepclasseswithmembers class * {
    native <methods>;
}