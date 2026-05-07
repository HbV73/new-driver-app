# 📱 ساخت اپ اندروید (Recycle Solution)

این راهنمای کامل برای تبدیل پروژه به APK اندروید با استفاده از **Capacitor** است.

> ⚠️ **مهم:** این کارها روی سرور Lovable قابل انجام نیست. باید پروژه رو روی **کامپیوتر خودت** clone کنی.

---

## 🧰 پیش‌نیازها (یکبار نصب)

| ابزار | نسخه | لینک |
|------|------|------|
| **Node.js** | 20+ | https://nodejs.org |
| **Android Studio** | جدیدترین | https://developer.android.com/studio |
| **Java JDK** | 17 | همراه Android Studio نصب میشه |
| **Git** | هر نسخه | https://git-scm.com |

پس از نصب Android Studio:
1. باز کن → `More Actions` → `SDK Manager`
2. تب **SDK Platforms**: حداقل `Android 14 (API 34)` رو نصب کن
3. تب **SDK Tools**: `Android SDK Build-Tools`, `Platform-Tools`, `Emulator` رو تیک بزن
4. متغیر محیطی `ANDROID_HOME` رو ست کن (مثلاً `~/Library/Android/sdk` در مک یا `C:\Users\YOU\AppData\Local\Android\Sdk` در ویندوز)

---

## 🚀 مراحل اولیه (یکبار)

### 1️⃣ Export پروژه به GitHub
از داخل Lovable: دکمه **GitHub → Connect to GitHub → Create Repository**

### 2️⃣ Clone روی کامپیوتر خودت
```bash
git clone https://github.com/YOUR-USERNAME/YOUR-REPO.git
cd YOUR-REPO
npm install
```

### 3️⃣ اضافه کردن پلتفرم اندروید
```bash
npx cap add android
npx cap update android
```

این دستور پوشه‌ی `android/` رو می‌سازه.

### 4️⃣ Build وب‌اپ + sync
```bash
npm run build
npx cap sync android
```

### 5️⃣ تنظیم Permissions در `android/app/src/main/AndroidManifest.xml`

این پرمیشن‌ها رو **داخل تگ `<manifest>` و قبل از `<application>`** اضافه کن:

```xml
<!-- اینترنت و شبکه -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<!-- موقعیت مکانی (GPS — برای ردیابی راننده) -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />

<!-- دوربین (عکس کیلومتر، سوخت، امضا، اسکن دبه) -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera" android:required="true" />

<!-- ذخیره‌سازی -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"
                 android:maxSdkVersion="32" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />

<!-- جلوگیری از خواب — برای ردیابی دائمی GPS -->
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
```

### 6️⃣ تست روی شبیه‌ساز یا گوشی واقعی

**شبیه‌ساز:**
```bash
npx cap run android
```

**گوشی فیزیکی:**
1. در گوشی: `Settings → About Phone` → ۷ بار روی Build Number بزن (Developer Mode فعال میشه)
2. در `Developer Options` → `USB Debugging` رو روشن کن
3. با کابل USB وصل کن، اجازه‌ی debug رو بده
4. `npx cap run android --target=YOUR_DEVICE_ID`

یا از **Android Studio**:
```bash
npx cap open android
```
سپس دکمه‌ی ▶️ Run رو بزن.

---

## 🔄 هر بار که کد رو از Lovable می‌گیری

```bash
git pull
npm install            # اگه پکیج جدید اضافه شده
npm run build
npx cap sync android   # کد وب رو میبره داخل پروژه‌ی native
npx cap run android
```

---

## 🎨 تنظیم آیکون و Splash Screen

1. آیکون و splash اصلی رو در پوشه‌ی `resources/` بذار:
   - `resources/icon.png` (1024×1024)
   - `resources/splash.png` (2732×2732)

2. نصب ابزار:
```bash
npm install -g @capacitor/assets
npx capacitor-assets generate --android
```

---

## 📦 ساخت APK نهایی برای انتشار

### حالت Debug (تست سریع)
```bash
cd android
./gradlew assembleDebug
```
خروجی: `android/app/build/outputs/apk/debug/app-debug.apk`

### حالت Release (برای Google Play)

#### الف) ساخت keystore (یکبار، حفظش کن!)
```bash
keytool -genkey -v -keystore recycle-release-key.keystore \
  -alias recycle -keyalg RSA -keysize 2048 -validity 10000
```

#### ب) فایل `android/key.properties` بساز:
```properties
storePassword=YOUR_PASSWORD
keyPassword=YOUR_PASSWORD
keyAlias=recycle
storeFile=../recycle-release-key.keystore
```

#### ج) در `android/app/build.gradle` این بلاک رو اضافه کن:
```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
        }
    }
}
```

#### د) ساخت APK یا AAB:
```bash
cd android
./gradlew assembleRelease       # APK
./gradlew bundleRelease         # AAB (مورد نیاز Google Play)
```

خروجی AAB: `android/app/build/outputs/bundle/release/app-release.aab`

---

## 🛠️ Hot Reload از Lovable (Development)

فایل `capacitor.config.ts` در پروژه از قبل تنظیم شده تا اپ روی گوشی **مستقیم از Lovable preview** بارگذاری بشه. یعنی هر تغییری که Lovable می‌کنه، توی اپ گوشی هم میاد بدون نیاز به rebuild.

برای **خروجی Production**، این بلاک رو از `capacitor.config.ts` حذف کن:
```ts
server: {
  url: '...',
  cleartext: true,
}
```
سپس:
```bash
npm run build && npx cap sync android
./gradlew bundleRelease
```

---

## 🚦 چک‌لیست انتشار در Google Play

- [ ] حساب Google Play Console ($25 یکبار) — https://play.google.com/console
- [ ] AAB امضا‌شده ساخته شده
- [ ] آیکون 512×512 برای فروشگاه
- [ ] حداقل ۲ اسکرین‌شات (1080×1920)
- [ ] توضیحات کوتاه (80 char) و کامل (4000 char) به آلمانی + انگلیسی
- [ ] Privacy Policy URL (الزامی! چون GPS و دوربین استفاده میشه)
- [ ] Data Safety Form پر شده (اعلام کن چه داده‌ای جمع می‌کنی)
- [ ] Content Rating تکمیل شده
- [ ] `targetSdkVersion = 34` در `android/variables.gradle`

---

## ⚙️ پلاگین‌های نصب‌شده

این پلاگین‌ها از قبل به پروژه اضافه شدن:

| پلاگین | کاربرد در اپ |
|--------|--------------|
| `@capacitor/geolocation` | ردیابی دائمی راننده، geofencing |
| `@capacitor/camera` | عکس کیلومتر، سوخت، صورتحساب |
| `@capacitor/filesystem` | ذخیره عکس‌ها قبل آپلود |
| `@capacitor/network` | تشخیص آنلاین/آفلاین برای offline queue |
| `@capacitor/preferences` | ذخیره ایمن PIN، تنظیمات |
| `@capacitor/status-bar` | رنگ نوار بالای گوشی (سبز برند) |
| `@capacitor/splash-screen` | صفحه شروع |
| `@capacitor/app` | مدیریت دکمه‌ی back |

---

## 🐛 رفع مشکلات رایج

| مشکل | راه‌حل |
|------|--------|
| `SDK location not found` | فایل `android/local.properties` با `sdk.dir=/path/to/sdk` بساز |
| `Could not find tools.jar` | JDK 17 نصب کن، `JAVA_HOME` رو ست کن |
| دوربین کار نمی‌کنه | چک کن permission در `AndroidManifest.xml` هست + در گوشی اجازه داده شده |
| GPS در پس‌زمینه قطع میشه | `ACCESS_BACKGROUND_LOCATION` اضافه شده باشه + در Android 13+ از کاربر "Allow all the time" بگیری |
| اپ سفید میشه | `npx cap sync` رو دوباره بزن، dev tools رو با `chrome://inspect` چک کن |

---

## 📚 منابع

- [مستندات Capacitor](https://capacitorjs.com/docs)
- [راهنمای Lovable Mobile](https://lovable.dev/blogs/TODO)
- [Google Play Console](https://play.google.com/console)

---

> 💡 **نکته:** پس از build اول، تمام تغییرات بعدی فقط با `git pull && npm run build && npx cap sync android` کافیه. نیازی به دوباره `cap add` نیست.
