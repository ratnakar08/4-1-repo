# 4-1 Learning Repository

Static, no-backend website for 4th year 1st semester learning materials.

## Files

- `index.html` - student library and author portal
- `styles.css` - minimal black interface
- `app.js` - browser-side upload, download, filtering, logs, exports
- `materials/manifest.json` - public file catalog for deployed static hosting

## Important no-backend limit

Default author passcode:

```text
author-4-1
```

Before publishing, change the passcode by replacing `AUTHOR_PASSCODE_HASH` in `app.js` with the SHA-256 hash of your new passcode.

Generate a new hash:

```bash
node -e "crypto.subtle.digest('SHA-256', new TextEncoder().encode('your-new-passcode')).then(b=>console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')))"
```

For a live public repository, add files to the project and update `materials/manifest.json`, then redeploy the static site.

## GitHub Pages workflow

This setup works well with GitHub Pages because all public files are committed into the repo.

1. Create a GitHub repository.
2. Push this folder to GitHub.
3. In GitHub, open `Settings` > `Pages`.
4. Set source to your main branch and root folder.
5. Open the Pages URL after GitHub finishes deploying.

When you want to publish a new material, add it to the repo and push:

```bash
node tools/add-material.mjs "/path/to/file.pdf" "Machine Learning" "Unit 1 Notes"
git add materials
git commit -m "Add machine learning unit 1 notes"
git push
```

The script copies the file into the correct subject folder and updates `materials/manifest.json`. After the push, GitHub Pages redeploys and students can see the new file.

Example:

```json
{
  "materials": [
    {
      "id": "ml-unit-1",
      "name": "Unit 1 Notes",
      "category": "Machine Learning",
      "originalName": "unit-1-notes.pdf",
      "type": "application/pdf",
      "size": 245760,
      "url": "./materials/machine-learning/unit-1-notes.pdf"
    }
  ]
}
```

Recommended folder layout:

```text
materials/
  manifest.json
  machine-learning/
    unit-1-notes.pdf
  cloud-computing/
    syllabus.pdf
```

## Run locally

Open `index.html` directly in a browser. For best manifest loading behavior, serve the folder with a static server:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.
