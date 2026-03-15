# BudgetBuddy

## Proje Açıklaması
Bu proje, kullanıcıların (özellikle bütçe disiplini kazanmak isteyen öğrencilerin) gelir ve giderlerini yönetmesini sağlayan bir web uygulamasıdır. Kullanıcılar günlük harcamalarını kaydedebilir, kategorize edebilir ve finansal durumlarını takip edebilirler.

## Temel Özellikler
* **Kullanıcı Kayıt ve Girişi:** Kullanıcıların kendilerine özel bütçe alanı oluşturması.
* **Harcama (Görev) Ekleme:** Yeni gelir veya gider kayıtlarının sisteme girilmesi.
* **Harcama Silme:** Hatalı veya eski kayıtların sistemden kaldırılması.
* **Harcama Güncelleme:** Mevcut kayıtların miktarlarını veya kategorilerini düzenleme.

## Kullanılan Teknolojiler
* **HTML:** Sayfa yapısı ve iskeleti.
* **CSS:** Arayüz tasarımı ve kullanıcı deneyimi.
* **JavaScript:** Dinamik içerik yönetimi ve form kontrolleri.
* **PHP:** Sunucu tarafı işlemleri ve veritabanı bağlantısı.
* **MySQL:** Verilerin (Kullanıcılar ve harcamalar) kalıcı olarak saklanması.

## Kurulum
1. Bu depoyu (repository) klonlayın: `git clone [repo-linki]`
2. XAMPP veya WAMP gibi bir yerel sunucu kullanarak Apache ve MySQL'i aktif hale getirin.
3. Proje klasörünü yerel sunucunuzun (htdocs veya www) içine taşıyın.
4. Veritabanı bağlantı ayarlarını `config.php` dosyasında güncelleyin.
5. Tarayıcınızda `localhost/BudgetBuddy` adresiyle projeyi çalıştırın.

## Canlı Link
Henüz yayınlanmadı.





# BudgetBuddy 💰

Kişisel Finans Yönetimi Sistemi — PostgreSQL + Node.js + Vanilla JS

## 📁 Dosya Yapısı

```
budgetbuddy/
├── index.html               → Ana panel
├── package.json
├── .env.example
├── README.md
│
├── assests/
│   ├── css/
│   │   └── style.css        → Tek birleşik stil dosyası
│   ├── js/
│   │   └── main.js          → API istemcisi + tüm sayfa mantığı
│   └── img/                 → Logo, ikonlar
│
├── pages/
│   ├── project.html         → İşlemler (CRUD tablosu)
│   ├── about.html           → Kullanıcı profili
│   ├── contact.html         → Destek & İletişim
│   ├── giris.html           → Giriş formu
│   └── kayit.html           → Kayıt formu
│
├── backend/
│   ├── server.js            → Express uygulama
│   ├── db.js                → PostgreSQL bağlantı havuzu
│   ├── middleware/
│   │   └── auth.js          → JWT doğrulama
│   └── routes/
│       ├── auth.js          → /api/auth/*
│       ├── transactions.js  → /api/transactions/*
│       ├── categories.js    → /api/categories/*
│       ├── budgets.js       → /api/budgets/*
│       └── reports.js       → /api/reports/*
│
└── database/
    ├── schema.sql           → Tablolar, indexler, view'lar, trigger'lar
    ├── seed.sql             → Test verisi
    └── queries.sql          → Referans SQL sorguları
```

## 🗄️ Veritabanı Tabloları

| Tablo | Açıklama |
|---|---|
| `users` | Kullanıcılar (bcrypt şifre) |
| `categories` | Sistem + özel kategoriler |
| `transactions` | Gelir / gider işlemleri |
| `budgets` | Aylık bütçe limitleri |
| `savings_goals` | Tasarruf hedefleri |
| `sessions` | JWT oturum takibi |
| `contact_messages` | Destek mesajları |

## 🚀 Kurulum

```bash
# 1. Bağımlılıkları yükle
npm install

# 2. Ortam değişkenlerini ayarla
cp .env.example .env

# 3. Veritabanı oluştur ve şemayı yükle
createdb budgetbuddy
npm run db:init
npm run db:seed   # isteğe bağlı test verisi

# 4. Sunucuyu başlat
npm run dev
```

`http://localhost:3000` → Uygulama açılır.

## 🔌 API

```
POST /api/auth/kayit        Kayıt
POST /api/auth/giris        Giriş → JWT
GET  /api/auth/ben          Mevcut kullanıcı

GET    /api/transactions    Listele
POST   /api/transactions    Ekle
PUT    /api/transactions/:id Güncelle
DELETE /api/transactions/:id Sil

GET  /api/categories        Kategoriler
GET  /api/reports/ozet      Bakiye özeti
GET  /api/reports/aylik     Aylık grafik verisi
GET  /api/reports/kategoriler Kategori pasta grafik
GET  /api/reports/haftalik  Haftalık bar grafik
```


