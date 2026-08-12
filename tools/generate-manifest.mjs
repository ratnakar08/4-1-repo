import fs from 'fs';
import path from 'path';
// node tools/generate-manifest.mjs
const materialsDir = path.join(process.cwd(), 'materials');
const manifestPath = path.join(materialsDir, 'manifest.json');

// Get existing notifications if manifest exists
let notifications = [
  "Welcome to the 4-1 Learning Repository!",
  "Mid-term exam schedules have been announced."
];

if (fs.existsSync(manifestPath)) {
  try {
    const existing = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (existing.notifications) {
      notifications = existing.notifications;
    }
  } catch (e) {
    console.error("Failed to parse existing manifest, using default notifications.");
  }
}

const materials = [];

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'manifest.json' || file === '.DS_Store') continue;
    
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else {
      const relPath = path.relative(process.cwd(), fullPath);
      // The category is just the folder name inside "materials"
      const category = path.basename(path.dirname(fullPath));
      
      let type = 'file';
      const ext = path.extname(file).toLowerCase();
      if (ext === '.pdf') type = 'application/pdf';
      else if (ext === '.ppt') type = 'application/vnd.ms-powerpoint';
      else if (ext === '.pptx') type = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      else if (ext === '.doc') type = 'application/msword';
      else if (ext === '.docx') type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      
      const id = encodeURIComponent(relPath.replace(/\//g, '-').replace(/\.[^/.]+$/, ""));
      // Remove extension for display name
      const name = file.replace(/\.[^/.]+$/, "");
      
      materials.push({
        id,
        name,
        category,
        originalName: file,
        type,
        size: stat.size,
        url: `./${relPath.replace(/\\/g, '/')}`,
        // Set addedAt to the file's last modified time
        addedAt: stat.mtime.toISOString(),
        isExam: false
      });
    }
  }
}

walkDir(materialsDir);

const manifest = {
  notifications,
  materials
};

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log(`Generated manifest.json with ${materials.length} files.`);
