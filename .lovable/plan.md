

## افزودن ساعات کاری و روزهای تعطیل به فرم ثبت مشتری جدید

### خلاصه
یک مرحله جدید **«ساعات کاری»** بین مرحله «اطلاعات» و «قرارداد» در فرم `NewCustomer.tsx` اضافه می‌شه. این اطلاعات روی برگه چاپی قرارداد و در دیتای ذخیره‌شده مشتری هم میاد تا راننده‌های بعدی هم ببینن.

### اطلاعاتی که از مشتری گرفته می‌شه

**۱. ساعات کاری هفتگی (Opening Hours)**
- برای هر ۷ روز هفته: تیک «باز/بسته» + ساعت شروع + ساعت پایان
- دکمه سریع: «همه روزها مثل دوشنبه» (کپی سریع)
- پیش‌فرض: دوشنبه تا جمعه ۰۸:۰۰–۱۸:۰۰، شنبه/یکشنبه بسته

**۲. بهترین زمان برای جمع‌آوری (Preferred Pickup Window)**
- بازه ساعت ترجیحی (مثلاً ۱۰:۰۰–۱۴:۰۰) — برای الگوریتم planner

**۳. روزهای تعطیل / استثنا**
- چک‌باکس: «تعطیلات رسمی آلمان بسته» (پیش‌فرض روشن)
- فیلد متنی برای روزهای خاص (مثلاً «هر ماه اول بسته»، «در رمضان ساعات تغییر می‌کنه»)

**۴. یادداشت دسترسی (Access Notes)**
- متن کوتاه: «ورودی از پشت ساختمان»، «زنگ بزن به آشپز»، «قبل از باز شدن مغازه نیا»

### تغییرات فنی

```text
src/pages/NewCustomer.tsx
├── STEPS = ['info', 'hours', 'contract', 'containers', 'signature', 'receipt']
├── interface NewCustomerData → افزودن:
│     openingHours: { [day: string]: { open: boolean, from: string, to: string } }
│     preferredPickupFrom: string
│     preferredPickupTo: string
│     closedOnHolidays: boolean
│     accessNotes: string
│     specialClosures: string
└── Step جدید "hours" با UI ساده

src/components/OpeningHoursPicker.tsx (جدید)
└── کامپوننت کوچک: ۷ ردیف روز با toggle و دو time input

برگه چاپی (handlePrintReceipt)
└── بخش جدید "Öffnungszeiten" قبل از مخازن

localStorage 'new_customers'
└── ذخیره با فیلدهای جدید
```

### UI مرحله جدید

```text
┌─ Öffnungszeiten ────────────────┐
│ ☑ Montag    [08:00] – [18:00]   │
│ ☑ Dienstag  [08:00] – [18:00]   │
│ ☑ Mittwoch  [08:00] – [18:00]   │
│ ☑ Donnerstag[08:00] – [18:00]   │
│ ☑ Freitag   [08:00] – [18:00]   │
│ ☐ Samstag                       │
│ ☐ Sonntag                       │
│   [⟳ Alle wie Montag]           │
├─────────────────────────────────┤
│ Beste Abholzeit                 │
│   von [10:00]  bis [14:00]      │
├─────────────────────────────────┤
│ ☑ An deutschen Feiertagen       │
│   geschlossen                   │
│ Sonderzeiten / Schließtage:     │
│ [_______________________]       │
├─────────────────────────────────┤
│ Zugangshinweise                 │
│ [_______________________]       │
└─────────────────────────────────┘
```

### دو زبانه (DE/EN)
همه برچسب‌ها از طریق `t-function` در `LanguageContext` اضافه میشن (کلیدهای `newCust.hours.*`).

### خارج از scope (پیشنهاد بعدی)
- اتصال به Supabase: الان فقط localStorage. اگه بخوای یه جدول `customers` با ستون `opening_hours` jsonb بسازیم، در یه task جدا انجام می‌شه.
- نمایش این ساعات روی صفحه `VisitDetail.tsx` و هشدار «اکنون بسته است» — می‌تونم در همین task یا جدا اضافه کنم.

