# قرارداد ارسال سرنخ (Lead Payload)

فرم «درخواست دمو» در `index.html` (`#leadForm`) پس از اعتبارسنجی سمت کلاینت، شیئی با
شکل زیر می‌سازد و به آداپتور `submitLead` می‌دهد.

## نقطه اتصال

در `assets/js/script.js` تابع `submitLead(payload)` تنها نقطه‌ی اتصال به backend است.
پیاده‌سازی پیش‌فرض صرفاً پس از ۴۰۰ میلی‌ثانیه resolve می‌شود و چیزی ارسال نمی‌کند.

برای اتصال واقعی، فقط بدنه‌ی همان تابع را جایگزین کنید:

```js
const submitLead = async (payload) => {
  const response = await fetch("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`lead failed: ${response.status}`);
};
```

## شکل داده

```json
{
  "fullName": "سارا محمدی",
  "organization": "شهرداری منطقه ۶",
  "role": "مدیر فناوری اطلاعات",
  "mobile": "09123456789",
  "email": "dev@nabzshahr.ir",
  "phone": "02112345678",
  "message": "برای پایلوت شبیه‌سازی ترافیک تماس بگیرید.",
  "consent": true,
  "submittedAt": "2026-11-23T12:00:00.000Z"
}
```

| فیلد | نوع | الزامی | توضیح |
|---|---|---|---|
| `fullName` | string | بله | حداقل ۳ کاراکتر |
| `organization` | string | بله | حداقل ۲ کاراکتر |
| `role` | string | خیر | سِمَت سازمانی |
| `mobile` | string | بله | همیشه به شکل استاندارد `09XXXXXXXXX` |
| `email` | string | خیر | اگر پر شود، معتبر بودن بررسی می‌شود |
| `phone` | string | خیر | تلفن ثابت با پیش‌شماره؛ `09…` پذیرفته نمی‌شود |
| `message` | string | خیر | حداکثر ۱۰۰۰ کاراکتر |
| `consent` | boolean | بله | همیشه `true`؛ بدون آن ارسال انجام نمی‌شود |
| `submittedAt` | string | بله | ISO 8601، زمان کلاینت |

## قواعد

- ارقام فارسی و عربی و جداکننده‌ها (`+98`، `۰۰۹۸`، فاصله، خط تیره) پیش از ارسال
  نرمال‌سازی می‌شوند.
- فیلد تله‌ی `companyWebsite` هرگز در payload نمی‌آید.
- مقادیر فرم در `localStorage` یا `sessionStorage` ذخیره **نمی‌شوند**.
- در صورت خطای شبکه، پیام فارسی با راه تماس جایگزین نمایش داده می‌شود و دکمه دوباره
  فعال می‌شود.
