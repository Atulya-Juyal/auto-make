# AutoMake Project Site (Vercel Ready)

This folder contains a standalone website focused only on the **AutoMake project**.

The page is designed for recruiter sharing and links directly to:

- source code repository
- issues/roadmap
- README/docs
- releases

## 1) Update repository links

Open `script.js` and set these values correctly:

- `repoUrl`
- `issuesUrl`
- `readmeUrl`
- `releasesUrl`
- `featureCount`, `packageCount`, `processCount`
- `stack`, `highlights`

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
- `script.js` - AutoMake project content + rendering
- `vercel.json` - simple Vercel static config
