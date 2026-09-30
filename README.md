# AI CREW 3D

Mevcut AI CREW Netlify projesine 3D asset generation katmanı eklenmiş sürüm.

## Environment variables

Mevcut değişkenlere ek olarak:

- `MESHY_API_KEY` — 3D model üretim sağlayıcısı için
- `ACCESS_CODE` — mevcut erişim kodu
- `CREW_GEMINI_KEY`
- `CREW_OPENAI_KEY`
- `CREW_ANTHROPIC_KEY`

Model değişkenleri de kullanılabilir:

- `GEMINI_MODEL`
- `GEMINI_FALLBACK`
- `OPENAI_MODEL`
- `ANTHROPIC_MODEL`

## Endpoints

- `GET /api/turn`
- `POST /api/turn`
- `GET /api/generate-3d`
- `POST /api/generate-3d`
- `GET /api/asset-status?taskId=...`

## 3D akışı

1. Frontend `/api/generate-3d` çağırır.
2. Netlify Function, Meshy'ye text-to-3D task gönderir.
3. Task ID döner.
4. `/api/asset-status` ile durum takip edilir.
5. Tamamlandığında GLB URL döner.

API anahtarları tarayıcıya gönderilmez.

## Deploy

Netlify'da Environment Variables'a `MESHY_API_KEY` ekleyin ve yeniden deploy edin.

`public/index.html` doğrudan test panelidir.

## Not

3D sağlayıcının API sözleşmesi/model isimleri zaman içinde değişebilir. Bu sürüm sağlayıcının mevcut Text-to-3D v2 endpoint biçimini hedefler; API hata verirse function ham provider yanıtını döndürür.
