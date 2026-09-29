# AI CREW · Netlify
## Yöntem A: GitHub (en kolayı)
1. Bu klasörü bir GitHub deposuna yükle (`.env` yok, anahtar içermez).
2. Netlify > Add new site > Import from Git > depoyu seç. Build command boş, publish `public` (netlify.toml zaten ayarlı).
3. Site configuration > Environment variables: ANTHROPIC_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY, OPENAI_MODEL, GEMINI_MODEL, ANTHROPIC_MODEL, ACCESS_CODE (ZORUNLU).
4. Deploys > Trigger deploy. Değişkenler deploy'da devreye girer.
## Yöntem B: CLI
npm i -g netlify-cli && netlify login && netlify init && netlify env:set ACCESS_CODE "kodun" (diğerleri de aynı) && netlify deploy --prod
Not: Netlify Drop (sürükle-bırak) fonksiyon çalıştırmaz, kullanma.
