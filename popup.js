// DOM Elements
const sourceRadios = document.querySelectorAll('input[name="source"]');
const folderSelect = document.getElementById('folder-select');
const subfolderOption = document.getElementById('subfolder-option');
const includeSubfolders = document.getElementById('include-subfolders');
const sortOrder = document.getElementById('sort-order');
const collectBtn = document.getElementById('collect-btn');
const results = document.getElementById('results');
const status = document.getElementById('status');
const output = document.getElementById('output');
const copyBtn = document.getElementById('copy-btn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadBookmarkFolders();
  setupEventListeners();
});

function setupEventListeners() {
  // Source selection changes
  sourceRadios.forEach(radio => {
    radio.addEventListener('change', handleSourceChange);
  });

  // Collect button
  collectBtn.addEventListener('click', handleCollect);

  // Copy button
  copyBtn.addEventListener('click', handleCopy);
}

function handleSourceChange(e) {
  const source = e.target.value;

  // Enable/disable folder select
  folderSelect.disabled = source !== 'bookmark-folder';

  // Show/hide subfolder option for bookmark sources
  if (source === 'all-bookmarks' || source === 'bookmark-folder') {
    subfolderOption.classList.remove('hidden');
  } else {
    subfolderOption.classList.add('hidden');
  }
}

// Load bookmark folders into dropdown
async function loadBookmarkFolders() {
  const tree = await chrome.bookmarks.getTree();
  const folders = [];

  function findFolders(nodes, path = '') {
    for (const node of nodes) {
      if (node.children) {
        const folderPath = path ? `${path} / ${node.title}` : node.title;
        if (node.title) {
          folders.push({ id: node.id, title: folderPath || 'Root' });
        }
        findFolders(node.children, folderPath);
      }
    }
  }

  findFolders(tree);

  // Populate dropdown
  folders.forEach(folder => {
    const option = document.createElement('option');
    option.value = folder.id;
    option.textContent = folder.title;
    folderSelect.appendChild(option);
  });
}

// Collection functions
async function getAllTabs() {
  const tabs = await chrome.tabs.query({});
  return tabs.map(tab => ({
    title: tab.title || tab.url,
    url: tab.url
  })).filter(t => t.url && !t.url.startsWith('chrome://'));
}

async function getCurrentWindowTabs() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  return tabs.map(tab => ({
    title: tab.title || tab.url,
    url: tab.url
  })).filter(t => t.url && !t.url.startsWith('chrome://'));
}

async function getAllBookmarks(includeSubfoldersFlag) {
  const tree = await chrome.bookmarks.getTree();
  return extractBookmarks(tree, includeSubfoldersFlag);
}

async function getBookmarkFolder(folderId, includeSubfoldersFlag) {
  const nodes = await chrome.bookmarks.getSubTree(folderId);
  return extractBookmarks(nodes, includeSubfoldersFlag);
}

function extractBookmarks(nodes, recursive = true) {
  const bookmarks = [];

  function traverse(nodeList, isRoot = true) {
    for (const node of nodeList) {
      if (node.url) {
        // It's a bookmark
        bookmarks.push({
          title: node.title || node.url,
          url: node.url
        });
      } else if (node.children && (recursive || isRoot)) {
        // It's a folder
        traverse(node.children, false);
      }
    }
  }

  traverse(nodes);
  return bookmarks;
}

// Processing functions
function organizeByDomain(items, sortType) {
  const byDomain = {};

  for (const item of items) {
    try {
      const url = new URL(item.url);
      const domain = url.hostname.replace(/^www\./, '');

      if (!byDomain[domain]) {
        byDomain[domain] = [];
      }
      byDomain[domain].push(item);
    } catch (e) {
      // Skip invalid URLs
    }
  }

  // Sort items within each domain by title
  for (const domain in byDomain) {
    byDomain[domain].sort((a, b) => a.title.localeCompare(b.title));
  }

  // Get domain keys and sort them
  let domains = Object.keys(byDomain);

  if (sortType === 'alphabetical') {
    domains.sort((a, b) => a.localeCompare(b));
  } else if (sortType === 'count') {
    domains.sort((a, b) => byDomain[b].length - byDomain[a].length);
  }
  // 'none' keeps original order

  return { byDomain, domains };
}

function generateMarkdown(organized) {
  const { byDomain, domains } = organized;
  let markdown = '';

  for (const domain of domains) {
    markdown += `## ${domain}\n`;
    for (const item of byDomain[domain]) {
      // Escape special markdown characters in title
      const title = item.title.replace(/[[\]]/g, '\\$&');
      markdown += `- [${title}](${item.url})\n`;
    }
    markdown += '\n';
  }

  return markdown.trim();
}

// Event handlers
async function handleCollect() {
  const source = document.querySelector('input[name="source"]:checked').value;
  const includeSubfoldersFlag = includeSubfolders.checked;
  const sortType = sortOrder.value;

  let items = [];

  try {
    switch (source) {
      case 'all-windows':
        items = await getAllTabs();
        break;
      case 'current-window':
        items = await getCurrentWindowTabs();
        break;
      case 'all-bookmarks':
        items = await getAllBookmarks(includeSubfoldersFlag);
        break;
      case 'bookmark-folder':
        const folderId = folderSelect.value;
        if (!folderId) {
          alert('Please select a bookmark folder');
          return;
        }
        items = await getBookmarkFolder(folderId, includeSubfoldersFlag);
        break;
    }

    const organized = organizeByDomain(items, sortType);
    const markdown = generateMarkdown(organized);

    // Update UI
    const totalLinks = items.length;
    const totalDomains = organized.domains.length;
    status.textContent = `${totalLinks} link${totalLinks !== 1 ? 's' : ''} collected from ${totalDomains} domain${totalDomains !== 1 ? 's' : ''}`;
    output.value = markdown;
    results.classList.remove('hidden');

  } catch (error) {
    console.error('Collection error:', error);
    status.textContent = 'Error collecting links';
    output.value = '';
    results.classList.remove('hidden');
  }
}

async function handleCopy() {
  try {
    await navigator.clipboard.writeText(output.value);
    copyBtn.textContent = 'Copied!';
    copyBtn.classList.add('copied');

    setTimeout(() => {
      copyBtn.textContent = 'Copy to Clipboard';
      copyBtn.classList.remove('copied');
    }, 2000);
  } catch (error) {
    console.error('Copy error:', error);
    // Fallback: select the text
    output.select();
    document.execCommand('copy');
  }
}
