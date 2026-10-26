# MOTOKAP — Katlanır Motosiklet Garajı Web Sitesi

Premium motosikletler için katlanır motor garajı üreticisi resmi web sitesi.

## Proje Yapısı

- **`public/`**: Yayına alınabilir tüm statik site dosyaları:
  - `index.html`: Ana sayfa
  - `site.css`: Mobil ve masaüstü stilleri
  - `content.js`: Model kataloğu, fiyatlar, ölçümler ve analitik kimlikleri
  - `runtime.js`: Galeri, mobil menü, WhatsApp yönlendirmeleri, çerez tercihi ve ölçüm olayları
  - `sales.js`: Model seçim formu ve WhatsApp sipariş hazırlığı
  - `favicon.svg` & `manifest.json`: Web ikonu ve PWA manifesti
  - `robots.txt` & `sitemap.xml`: SEO ve arama motoru haritası
  - `assets/`: WebP görselleri ve marka vektörleri
  - `modeller/`: Model detay sayfaları (Orta Boy, Büyük Boy, XXL, Premium XL, Premium XXL)
  - `rehber/`: Model seçimi, kurulum ve malzeme rehberleri
  - `cerezler/`, `gizlilik/`, `kvkk/`, `siparis-bilgileri/`: Hukuki ve bilgilendirme sayfaları
- **`vercel.json`**: Vercel yayınlama, güvenlik başlıkları ve önbellekleme yapılandırması
- **`.gitignore`**: Gereksiz sistem dosyalarını engelleyici kural seti

## Vercel Yayını

1. Vercel dashboard'unda **Add New Project** diyerek bu depoyu seçin.
2. **Root Directory** alanını \`public\` olarak belirleyin.
3. **Deploy** butonuna basın.
