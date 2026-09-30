# MARKETIQO website

Static frontend (`public/`) + small Node/Express backend (`server.js`) that receives the contact form and emails it to you.

```
marketiqo-site/
  server.js          Express server, /api/contact, security headers, rate limit
  package.json
  .env.example       Copy to .env and fill in
  public/
    index.html       All five pages (Home, About, Services, Blog, Contact)
    css/style.css
    js/main.js       Pages, blog articles, animations, form submit
    js/config.js     API_BASE (only for split hosting)
    robots.txt
```

## Run locally
```
npm install
cp .env.example .env     # add your SMTP app password
npm start                # http://localhost:3000
```
Without SMTP settings the form still works, but inquiries are only saved to `data/inquiries.jsonl`.

## Gmail app password
Google Account > Security > turn on 2-Step Verification > App passwords > create one, and paste it as `SMTP_PASS`. Never commit `.env`.

## Deploy (recommended: Render, one service for site + API)
1. Push this folder to a GitHub repository.
2. Render > New > Web Service > pick the repo.
3. Build command `npm install`, start command `npm start`.
4. Add the environment variables from `.env.example`.
5. Deploy, then add your custom domain under Settings > Custom Domains (HTTPS is automatic).
Railway, Fly.io, or any VPS with Node 18+ work the same way.

Note: on free hosting the disk is temporary, so rely on the email, not `data/inquiries.jsonl`, for real leads.

## Split hosting (frontend on Netlify/Vercel/Cloudflare Pages)
1. Deploy the backend as above.
2. Set `window.API_BASE` in `public/js/config.js` to the backend URL.
3. On the backend set `CORS_ORIGIN` to your frontend domain.
4. Publish the `public/` folder as the static site.

## Before launch
- Replace the sample blog dates ("Sep 2026") and confirm reading times.
- Confirm the Instagram and Twitter links open the right accounts.
- Edit the About timeline text directly in `js/main.js` (it is editable in the browser only for preview).
- Add analytics (Google Analytics/Search Console) if you want traffic reports.
- The site uses `#` links (e.g. `/#blog/what-is-digital-marketing`). Google indexes these as one page, so for strong SEO the next step is real URLs (`/blog/what-is-digital-marketing`) with per-page titles.
