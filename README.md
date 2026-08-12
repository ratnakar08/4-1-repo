# 4-1 Learning Repository

Static, no-backend website for 4th year 1st semester learning materials.

## Features

- **Minimalistic Dark Theme**: Sleek UI with folder navigation.
- **Notification Carousel**: Dynamically cycle through important announcements.
- **Audience Tools**: Search, Sort, NEW badges, File Type Icons, and File Previews.
- **Upcoming Exams**: Pinned section for important exam materials.

## How to add materials

This setup uses GitHub Pages to serve static files. 

1. Drop your files into their respective folders under `materials/`. For example: `materials/Machine Learning/Notes.pdf`.
2. Run the manifest generator script to automatically update the website database:
   ```bash
   node tools/generate-manifest.mjs
   ```
3. Commit and push the changes:
   ```bash
   git add .
   git commit -m "Added new Machine Learning notes"
   git push origin main
   ```

GitHub Pages will redeploy, and the students will see the new files!

## How to edit notifications

Open `materials/manifest.json` and edit the `notifications` array at the top of the file:
```json
{
  "notifications": [
    "Welcome to the 4-1 Learning Repository!",
    "Mid-term exam schedules have been announced."
  ],
  "materials": [ ... ]
}
```

## How to mark an item as an Exam material

By default, the `tools/generate-manifest.mjs` script sets `"isExam": false` for all files. If you want a file to show up in the pinned **Upcoming Exams** section, simply open `materials/manifest.json`, find the file in the JSON, and change it to `"isExam": true`.

## Run locally

For best loading behavior (to avoid CORS issues with the manifest file), serve the folder with a static server:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080` in your browser.
