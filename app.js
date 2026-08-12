const MANIFEST_URL = "./materials/manifest.json";

const els = {
  carousel: document.querySelector("#notification-carousel"),
  searchInput: document.querySelector("#search-input"),
  sortFilter: document.querySelector("#sort-filter"),
  examsContainer: document.querySelector("#exams-container"),
  examsList: document.querySelector("#exams-list"),
  foldersContainer: document.querySelector("#folders-container"),
  folderGrid: document.querySelector("#folder-grid"),
  fileView: document.querySelector("#file-view"),
  fileViewTitle: document.querySelector("#file-view-title"),
  backBtn: document.querySelector("#back-btn"),
  fileList: document.querySelector("#file-list"),
  emptyState: document.querySelector("#empty-state"),
  fileTemplate: document.querySelector("#file-template"),
  folderTemplate: document.querySelector("#folder-template")
};

let materials = [];
let notifications = [];
let currentCategory = null;
let carouselIndex = 0;

init();

async function init() {
  const data = await loadManifestData();
  materials = data.materials || [];
  notifications = data.notifications || ["Welcome to the 4-1 Learning Repository!"];
  
  bindEvents();
  startCarousel();
  renderExams();
  renderFolders();
}

function bindEvents() {
  els.searchInput.addEventListener("input", handleSearch);
  els.sortFilter.addEventListener("change", handleSort);
  els.backBtn.addEventListener("click", () => {
    currentCategory = null;
    els.searchInput.value = '';
    showFoldersView();
  });
}

async function loadManifestData() {
  try {
    const response = await fetch(MANIFEST_URL, { cache: "no-store" });
    if (!response.ok) return { materials: [], notifications: [] };
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to load manifest:", error);
    return { materials: [], notifications: [] };
  }
}

// ---------------------------------
// Notification Carousel
// ---------------------------------
function startCarousel() {
  if (notifications.length === 0) return;
  
  els.carousel.innerHTML = "";
  notifications.forEach((note, idx) => {
    const div = document.createElement("div");
    div.className = `notification-item ${idx === 0 ? 'active' : ''}`;
    div.textContent = note;
    els.carousel.appendChild(div);
  });

  if (notifications.length > 1) {
    setInterval(() => {
      const items = els.carousel.querySelectorAll(".notification-item");
      const current = items[carouselIndex];
      
      carouselIndex = (carouselIndex + 1) % items.length;
      const next = items[carouselIndex];

      current.classList.remove("active");
      current.classList.add("exit");
      
      next.classList.remove("exit");
      next.classList.add("active");
    }, 5000);
  }
}

// ---------------------------------
// Exams Section
// ---------------------------------
function renderExams() {
  const examMaterials = materials.filter(m => m.isExam);
  
  if (examMaterials.length === 0) {
    els.examsContainer.classList.add("hidden");
    return;
  }
  
  els.examsContainer.classList.remove("hidden");
  els.examsList.innerHTML = "";
  
  const sortedExams = sortMaterials(examMaterials, "newest");
  sortedExams.forEach(item => {
    els.examsList.appendChild(createFileRow(item));
  });
}

// ---------------------------------
// Folders View
// ---------------------------------
function getCategories() {
  const cats = new Set(materials.map(m => m.category).filter(Boolean));
  return Array.from(cats).sort();
}

function renderFolders() {
  els.folderGrid.innerHTML = "";
  const categories = getCategories();
  
  categories.forEach(category => {
    const itemsInCategory = materials.filter(m => m.category === category);
    
    const node = els.folderTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".folder-name").textContent = category;
    node.querySelector(".folder-count").textContent = `${itemsInCategory.length} ${itemsInCategory.length === 1 ? 'file' : 'files'}`;
    
    node.addEventListener("click", () => {
      currentCategory = category;
      showCategoryFiles(category);
    });
    
    els.folderGrid.appendChild(node);
  });
}

function showFoldersView() {
  els.foldersContainer.classList.remove("hidden");
  els.fileView.classList.add("hidden");
  if (materials.some(m => m.isExam)) {
    els.examsContainer.classList.remove("hidden");
  }
}

// ---------------------------------
// Files View & Searching
// ---------------------------------
function showCategoryFiles(category) {
  els.foldersContainer.classList.add("hidden");
  els.examsContainer.classList.add("hidden"); // Hide exams when browsing a specific folder
  els.fileView.classList.remove("hidden");
  els.fileViewTitle.textContent = category;
  
  renderFileList();
}

function handleSearch() {
  const query = els.searchInput.value.trim().toLowerCase();
  
  if (query) {
    els.foldersContainer.classList.add("hidden");
    els.examsContainer.classList.add("hidden");
    els.fileView.classList.remove("hidden");
    els.fileViewTitle.textContent = "Search Results";
    currentCategory = null; // Exit specific category mode during search
  } else {
    showFoldersView();
    return; // Don't render file list if query is empty and we go back to folders
  }
  
  renderFileList();
}

function handleSort() {
  if (!els.fileView.classList.contains("hidden")) {
    renderFileList();
  }
  renderExams();
}

function renderFileList() {
  const query = els.searchInput.value.trim().toLowerCase();
  let filtered = materials;
  
  if (currentCategory) {
    filtered = filtered.filter(m => m.category === currentCategory);
  }
  
  if (query) {
    filtered = filtered.filter(item => {
      const text = `${item.name} ${item.category} ${item.originalName || ""}`.toLowerCase();
      return text.includes(query);
    });
  }
  
  filtered = sortMaterials(filtered, els.sortFilter.value);
  
  els.fileList.innerHTML = "";
  if (filtered.length > 0) {
    filtered.forEach(item => els.fileList.appendChild(createFileRow(item)));
    els.emptyState.classList.add("hidden");
  } else {
    els.emptyState.classList.remove("hidden");
  }
}

// ---------------------------------
// Utility Functions
// ---------------------------------
function sortMaterials(list, method) {
  return [...list].sort((a, b) => {
    if (method === "name") {
      return a.name.localeCompare(b.name);
    } else if (method === "size") {
      return (b.size || 0) - (a.size || 0);
    } else {
      // newest (default)
      const dateA = a.addedAt ? new Date(a.addedAt).getTime() : 0;
      const dateB = b.addedAt ? new Date(b.addedAt).getTime() : 0;
      return dateB - dateA;
    }
  });
}

function isNew(addedAt) {
  if (!addedAt) return false;
  const addedDate = new Date(addedAt);
  const now = new Date();
  const diffDays = (now - addedDate) / (1000 * 60 * 60 * 24);
  return diffDays <= 7;
}

function getFileIconSvg(type, filename) {
  const ext = (filename || "").split('.').pop().toLowerCase();
  let iconClass = "default";
  
  if (type === "application/pdf" || ext === "pdf") {
    iconClass = "pdf";
  } else if (ext === "doc" || ext === "docx") {
    iconClass = "doc";
  } else if (ext === "ppt" || ext === "pptx") {
    iconClass = "ppt";
  } else if (ext === "zip" || ext === "rar") {
    iconClass = "zip";
  }

  // A generic document icon. We color it using CSS classes.
  return `
    <svg class="${iconClass}" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  `;
}

function createFileRow(item) {
  const node = els.fileTemplate.content.firstElementChild.cloneNode(true);
  
  // Icon
  node.querySelector(".file-icon").innerHTML = getFileIconSvg(item.type, item.originalName || item.name);
  
  // Name
  node.querySelector(".file-name").textContent = item.name;
  
  // New Badge
  if (isNew(item.addedAt)) {
    node.querySelector(".new-badge").classList.remove("hidden");
  }
  
  // Meta
  const dateStr = item.addedAt ? new Date(item.addedAt).toLocaleDateString() : 'Unknown date';
  node.querySelector(".file-meta").textContent = `${item.category} • ${formatBytes(item.size)} • Added ${dateStr}`;
  
  // Action Link
  const link = node.querySelector(".preview-link");
  link.href = item.url;
  
  return node;
}

function formatBytes(bytes = 0) {
  if (!bytes) return "Size unknown";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}
