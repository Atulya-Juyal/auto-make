# Recruiter Site (Vercel Ready)

This folder contains a standalone portfolio landing page you can deploy to Vercel.

## 1) Customize your details

Open `script.js` and update:

- `name`
- `githubUrl`
- `linkedinUrl`
- `resumeUrl`
- `email`
- `skills`
- `featuredProjects`

## 2) Local preview

Use any static server from this folder, for example:

```bash
npx serve .
```

## 3) Deploy to Vercel

### Option A: Vercel dashboard

1. Push this repo to GitHub.
2. Import project in Vercel.
3. In Vercel project settings:
   - **Root Directory**: `recruiter-site`
   - **Framework Preset**: `Other`
   - **Build Command**: leave empty
   - **Output Directory**: leave empty
4. Deploy.

### Option B: Vercel CLI

From `recruiter-site` folder:

```bash
vercel
```

## Files

- `index.html` - page structure
- `styles.css` - visual design
- `script.js` - profile data + rendering
- `vercel.json` - simple Vercel static config
