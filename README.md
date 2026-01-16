# Tab Collector

A Chrome extension that collects open browser tabs and bookmarks, organizing them by domain and exporting as Markdown.

## Features

- **Collect tabs** from current window or all open windows
- **Export bookmarks** from entire library or specific folders
- **Organize by domain** with automatic grouping and sorting
- **Multiple sort options**: alphabetically, by link count, or unsorted
- **Copy to clipboard** for easy sharing and documentation

## Installation

1. Clone or download this repository:
   ```bash
   git clone https://github.com/your-username/chrome-tab-collector.git
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable **Developer mode** using the toggle in the top-right corner

4. Click **Load unpacked**

5. Select the `chrome-tab-collector` folder containing `manifest.json`

6. The Tab Collector icon will appear in your extensions toolbar

## Usage

1. Click the Tab Collector icon in your browser toolbar
2. Select a source:
   - **All Windows** - collect tabs from every open browser window
   - **Current Window** - collect tabs from the active window only
   - **All Bookmarks** - export your entire bookmark library
   - **Bookmark Folder** - export a specific folder (with optional subfolders)
3. Choose a sort method for domains
4. Click **Collect**
5. Click **Copy to Clipboard** to copy the generated Markdown

### Output Format

Links are organized by domain in Markdown format:

```markdown
## github.com
- [Repository Name](https://github.com/user/repo)
- [Another Repo](https://github.com/user/another)

## stackoverflow.com
- [How to do X](https://stackoverflow.com/questions/123)
```

## Permissions

| Permission | Purpose |
|------------|---------|
| `tabs` | Read URLs and titles of open tabs |
| `bookmarks` | Access bookmark folders and entries |

All data processing happens locally. No data is transmitted externally.

## Project Structure

```
chrome-tab-collector/
├── manifest.json    # Extension configuration
├── popup.html       # Popup UI markup
├── popup.js         # Collection and formatting logic
├── popup.css        # Popup styling
└── icons/           # Extension icons
```

## License

MIT
