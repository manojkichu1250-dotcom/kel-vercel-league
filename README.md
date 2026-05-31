# KEL Kanam eFootball League

This is the multi-season, Vercel-ready league site.

## Included

- Season selector from Season 1 to Season 5
- Season 1 seeded with the existing interface teams
- Team name, player name and logo upload/update
- Dynamic league table for any number of uploaded teams
- Gameday fixture generator where every team plays every other team twice, home and away
- Top 4 playoff setup
- Two-leg semifinals with aggregate winner
- Single final page that stays the same for every season
- Vercel Blob backend storage through `/api/kel-data`
- Delete/remove button for every team, including the base Season 1 teams
- Fixtures locked until at least 6 teams are present

## Deploy

1. Upload this folder to GitHub or import it directly into Vercel.
2. Add Vercel Blob storage to the project from the Vercel dashboard.
3. Make sure the project has the `BLOB_READ_WRITE_TOKEN` environment variable. Vercel usually adds it automatically when Blob is connected.
4. Redeploy the project.
5. When opened on the Vercel URL, the data badge changes to `BLOB` after sync.

## Important

Do not use KV for this version. It uses Vercel Blob and needs `@vercel/blob` plus the `BLOB_READ_WRITE_TOKEN` environment variable.

Opening `index.html` directly still works, but data is only saved in that browser until the site is deployed.
