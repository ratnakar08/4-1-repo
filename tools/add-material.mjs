import { copyFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, extname, join, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const manifestPath = join(root, "materials", "manifest.json");

const [sourceArg, categoryArg, nameArg] = process.argv.slice(2);

if (!sourceArg || !categoryArg || !nameArg) {
  console.error("Usage: node tools/add-material.mjs <file-path> <subject-category> <display-name>");
  process.exit(1);
}

const sourcePath = resolve(sourceArg);
const category = normalizeSpaces(categoryArg);
const name = normalizeSpaces(nameArg);
const subjectFolder = slugify(category);
const originalName = basename(sourcePath);
const targetName = await uniqueFileName(join(root, "materials", subjectFolder), originalName);
const targetPath = join(root, "materials", subjectFolder, targetName);
const fileStat = await stat(sourcePath);

await mkdir(join(root, "materials", subjectFolder), { recursive: true });
await copyFile(sourcePath, targetPath);

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const url = `./${relative(root, targetPath).split(/[\\/]/).join("/")}`;
const id = `${subjectFolder}-${slugify(targetName.replace(extname(targetName), ""))}`;

manifest.materials = manifest.materials || [];
manifest.materials.push({
  id,
  name,
  category,
  originalName: targetName,
  type: mimeType(targetName),
  size: fileStat.size,
  url,
});

manifest.materials.sort((a, b) => {
  const byCategory = a.category.localeCompare(b.category);
  return byCategory || a.name.localeCompare(b.name);
});

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`Added: ${name}`);
console.log(`File: ${relative(root, targetPath)}`);
console.log(`Manifest: ${relative(root, manifestPath)}`);

async function uniqueFileName(folder, fileName) {
  const ext = extname(fileName);
  const base = slugify(fileName.slice(0, -ext.length) || fileName);
  let candidate = `${base}${ext.toLowerCase()}`;
  let index = 2;

  while (await exists(join(folder, candidate))) {
    candidate = `${base}-${index}${ext.toLowerCase()}`;
    index += 1;
  }

  return candidate;
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

function normalizeSpaces(value) {
  return value.trim().replace(/\s+/g, " ");
}

function slugify(value) {
  return normalizeSpaces(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function mimeType(fileName) {
  const ext = extname(fileName).toLowerCase();
  const types = {
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".ppt": "application/vnd.ms-powerpoint",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".txt": "text/plain",
    ".zip": "application/zip",
  };
  return types[ext] || "application/octet-stream";
}
