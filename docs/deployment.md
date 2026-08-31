# Deployment

Push to `main` to run `.github/workflows/deploy.yml`. The workflow installs Node 24, runs quality checks, uploads `dist`, and deploys with GitHub Pages. Vite derives `BASE_PATH` from `GITHUB_REPOSITORY`; a local root build uses `/`. Set `SITE_URL` to the canonical public origin when publishing and update the Pages custom domain if applicable.

In repository Settings → Pages, set **Source** to **GitHub Actions**. Do not select “Deploy from a branch” with the repository root: that serves the authoring `index.html` and raw `/src/main.tsx`, which browsers cannot execute. The workflow artifact is the only supported production entry and contains compiled `/assets/index-*.js` plus resolved repository-relative paths. The source HTML intentionally keeps relative fallback links so a static preview never requests `%BASE_URL%` literally.

The generated `sitemap.xml` includes only public landing language pages. `/app/` is disallowed in `robots.txt` and receives its own static `noindex,nofollow` entry file. Confirm Pages is configured to use GitHub Actions, then test `/`, `/en/`, and `/app/?mode=companion` on the deployed subpath.
