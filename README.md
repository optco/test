# theattn.com — Setup Guide

Liquid glass profile pages. Static files, zero backend.

## File Structure

```
theattn/
├── index.html          ← Main app shell (SPA entry point)
├── 404.html            ← GitHub Pages routing shim
├── _redirects          ← Cloudflare Pages routing (if used)
├── cloudflare-worker.js← Cloudflare Worker (if using GitHub Pages)
├── css/
│   └── style.css       ← Full liquid glass design system
├── js/
│   └── app.js          ← Router + profile renderer
└── data/
    └── users.json      ← All user profile data
```

---

## 1. Add Your Users

Edit `data/users.json`. Each user key becomes their URL slug.

```json
{
  "users": {
    "yourname": {
      "handle": "yourname",
      "name": "Your Full Name",
      "title": "What You Do",
      "bio": "A short bio about yourself.",
      "avatar": "https://your-avatar-url.com/photo.jpg",
      "location": "City, Country",
      "stats": [
        { "value": "5", "label": "Years" },
        { "value": "120", "label": "Projects" }
      ],
      "social": [
        {
          "platform": "twitter",
          "label": "@handle",
          "url": "https://twitter.com/handle",
          "icon": "twitter"
        }
      ],
      "links": [
        { "label": "My Website", "url": "https://yoursite.com", "emoji": "🌐" }
      ],
      "tags": ["Design", "Code", "Strategy"]
    }
  }
}
```

**Available social icons:** `twitter`, `instagram`, `linkedin`, `github`, `website`

To add a custom avatar, upload the image anywhere (Cloudflare R2, Imgur, etc.)
and set the `avatar` field to the full URL. Leave it as `""` for initials.

---

## 2. Deploy to GitHub

1. Create a new GitHub repo (e.g. `theattn-site`)
2. Push all these files to the `main` branch
3. Go to **Settings → Pages**
4. Set Source: **Deploy from branch → main → / (root)**
5. Wait ~1 min. Your site will be at `https://USERNAME.github.io/theattn-site`

---

## 3. Connect Your Domain (Afrihost + Cloudflare)

### Step A — Move DNS to Cloudflare (recommended)
1. Add theattn.com to Cloudflare (free plan is fine)
2. Cloudflare will give you two nameservers (e.g. `aria.ns.cloudflare.com`)
3. Log in to Afrihost → update theattn.com nameservers to Cloudflare's

### Step B — Point domain to GitHub Pages
In Cloudflare DNS, add these records (A records for GitHub Pages):

| Type | Name   | Content        | Proxy |
|------|--------|----------------|-------|
| A    | @      | 185.199.108.153| ✅ ON |
| A    | @      | 185.199.109.153| ✅ ON |
| A    | @      | 185.199.110.153| ✅ ON |
| A    | @      | 185.199.111.153| ✅ ON |
| CNAME| www    | USERNAME.github.io | ✅ ON |

### Step C — Set custom domain in GitHub
In your repo → **Settings → Pages → Custom domain** → enter `theattn.com`
GitHub will auto-add a `CNAME` file. Enable "Enforce HTTPS".

---

## 4. SPA Routing — Choose One Option

### Option A: GitHub Pages + 404.html (simplest)
The included `404.html` handles this automatically. When someone visits
`theattn.com/alex`, GitHub serves `404.html`, which redirects to `/`
with the path stored in sessionStorage. The JS router picks it up.
**No extra setup needed.**

### Option B: Cloudflare Pages (cleaner URLs, easier)
Instead of GitHub Pages, deploy directly to Cloudflare Pages:
1. Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git**
2. Select your GitHub repo
3. Build settings: leave blank (static site)
4. The `_redirects` file handles routing automatically ✅

### Option C: Cloudflare Worker (advanced)
Use `cloudflare-worker.js` if you want full control:
1. Cloudflare → **Workers & Pages → Create Worker**
2. Paste the contents of `cloudflare-worker.js`
3. Edit line: `const GITHUB_PAGES_ORIGIN = 'https://YOUR-USERNAME.github.io'`
4. Add a route: `theattn.com/*` → your worker

---

## 5. Adding New Profiles

Just edit `data/users.json` and push to GitHub. That's it.

```
theattn.com/alex   → users.json key: "alex"
theattn.com/nadia  → users.json key: "nadia"
theattn.com/you    → users.json key: "you"
```

Profile URLs are case-insensitive (app.js lowercases them).

---

## Customisation

- **Colors / glass style** → `css/style.css` → `:root` variables
- **Fonts** → change the Google Fonts import in `index.html` and update `--font-display` / `--font-body` in CSS
- **New social icons** → add SVG strings to the `ICONS` object in `js/app.js`
- **New sections** → add fields to `users.json` and render them in `renderProfile()` in `js/app.js`

---

## Performance Tips

- Host avatar images on Cloudflare R2 or Cloudinary for automatic optimisation
- Enable Cloudflare's "Auto Minify" for JS/CSS in Speed settings
- Turn on Cloudflare "Rocket Loader" for faster JS loading
- The fonts use `display=swap` so text shows immediately

---

Built with zero dependencies. No framework, no build step. Just HTML, CSS, and vanilla JS.
