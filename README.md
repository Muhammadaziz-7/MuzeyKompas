# Muzey Kompas

## Firebase sozlamalari

Firebase Web SDK sozlamalari `.env.local` faylida saqlanadi. Loyiha ildizidagi `.env.example` namuna hisoblanadi; Vite uchun `VITE_` prefiksli Firebase Web config qiymatlari brauzerga chiqarilishi kutiladi. Bu qiymatlar maxfiy kalit emas — ma’lumotlarni himoyalash Firebase Security Rules orqali bajariladi.

Firebase Console’da quyidagilarni sozlang:

1. **Authentication → Sign-in method** bo‘limida **Anonymous** provayderini yoqing; **Settings → Authorized domains** bo‘limida `localhost` va deploy qilingan domenni qo‘shing.
2. Firestore Database va Storage bucket yarating.
3. **Authentication → Sign-in method** bo‘limida **Email/Password** provayderini ham yoqing. Admin Firebase email/paroli bilan kiradi, lekin admin huquqi faqat Firebase ID tokenidagi `admin: true` custom claim orqali beriladi. Claim’ni Firebase Admin SDK ishlatadigan ishonchli serverdan bering; hech qachon frontendga service-account kaliti yoki claim berish endpointini joylamang. Firebase Console → Authentication → Users’dan admin UID’ni aniqlang.
4. Firebase CLI bilan loyiha ildizidagi qoidalarni deploy qiling:

   ```sh
   firebase deploy --only firestore:rules,storage
   ```

Ishonchli serverdagi Firebase Admin SDK’da admin claim o‘rnatish namunasi: `await getAuth().setCustomUserClaims(uid, { admin: true })`. Keyin foydalanuvchi qayta tizimga kirishi yoki ID tokenini yangilashi kerak. `AuthContext` tokenni majburan yangilab claim’ni tekshiradi; brauzerdagi teacher kodi yoki Firestore `users/{uid}` dagi profil roli admin huquqini bermaydi.

`src/context/AuthContext.jsx` talaba sessiyasi uchun anonim Firebase foydalanuvchisini, admin uchun email/parol sessiyasini ishlatadi. Asosiy o‘quv kolleksiyalarini autentifikatsiyalangan foydalanuvchilar o‘qiy oladi, lekin faqat `admin: true` claim’li hisob yozadi. Talaba o‘z `users/{uid}` hujjatidagi profil va natijalarni, o‘zi yozgan hikoyani hamda kurator taklifini o‘z UID’i doirasida saqlashi mumkin; bu boshqa foydalanuvchilar ma’lumotlarini yoki asosiy kontentni o‘zgartirish huquqini bermaydi. Kurator takliflarini tasdiqlash va o‘chirish ham faqat admin huquqiga ega hisoblarda ochiq.

Avvalgi versiyadagi `localStorage`/IndexedDB ma’lumotlari Firebase’ga avtomatik ko‘chirilmaydi. Ularni ko‘chirishdan oldin eksport nusxasini yarating va ishonchli admin migratsiya vositasidan foydalaning.

## Ishga tushirish

```sh
npm install
npm run dev
```

Production build:

```sh
npm run build
```
