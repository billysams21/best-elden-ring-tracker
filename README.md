# Elden Ring Progress Tracker

A comprehensive progress tracking tool for Elden Ring that analyzes save files and provides detailed location-based item tracking with an intuitive visual interface.

## Features

### Core Functionality
- **Direct Save File Analysis** - Supports `.sl2` (PC/Steam) and `.co2` (PlayStation) save formats
- **Location-Based Tracking** - Discover exactly where to find each collectible item
- **Regional Organization** - Items organized by region and sub-region hierarchy
- **Comprehensive Statistics** - Track completion percentages globally, regionally, and by category
- **Smart Filtering** - Filter by ownership status, category, acquisition method, or search by name
- **Visual Interface** - Clean, responsive dark theme with collapsible regions
- **Wiki Integration** - Direct links to Fextralife Wiki for detailed item information

### Item Categories
- **Weapons** - All armament types including unique and legendary weapons
- **Armor** - Complete armor sets with normal and altered variants
- **Talismans** - All talismans including legendary variants
- **Magic** - Sorceries, incantations, and Crucible aspects
- **Ashes of War** - All weapon skill modifications
- **Spirit Ashes** - Complete collection of summonable spirits
- **Bell Bearings** - Shop unlock items for Twin Maiden Husks
- **Cookbooks** - Crafting recipe collections
- **Crystal Tears** - Wondrous Physick components
- **Key Items** - Memory Stones, Talisman Pouches, and other collectibles

### DLC Support
- Full **Shadow of the Erdtree** integration
- Automatic DLC save format detection
- Separate tracking for Land of Shadow regions

## Getting Started

### Locating Your Save File

**Windows (Steam):**
```
C:\Users\[YourUsername]\AppData\Roaming\EldenRing\[SteamID]\ER0000.sl2
```

**PlayStation:**
1. Export save to USB drive
2. Locate the `.co2` file

### Running the Tracker

**Local File Access (Recommended):**
Simply open `index.html` directly in your web browser. The application works offline.

**Local Server (If Needed):**
If your browser blocks local file access, start a local server:

```bash
# Python 3
python -m http.server 8000

# Node.js
npx http-server -p 8000

# PHP
php -S localhost:8000
```

Navigate to `http://localhost:8000`

### Using the Tracker

1. **Upload Save File** - Click "Choose File" and select your `.sl2` or `.co2` save file
2. **Select Character Slot** - Choose your character from the dropdown (if you have multiple)
3. **Analyze Progress** - Click the calculate button to process your save file
4. **Review Results** - Browse items organized by region:
   - Green cards indicate owned items
   - Red cards indicate missing items
   - Click item names for detailed wiki information
   - Expand regions and sub-regions to view all items
5. **Filter Items** - Use the filter controls to narrow down results:
   - Status: All / Owned / Missing
   - Category: Weapons, Armor, Talismans, etc.
   - Acquisition: Boss drops, chests, merchants, etc.
   - Search: Find items by name

## 📁 Project Structure

```Project Structure

```
best-elden-ring-tracker/
├── index.html                    # Main application interface
├── assets/
│   ├── css/
│   │   └── styles.css            # Responsive dark theme
│   ├── js/
│   │   ├── main.js               # Application orchestration
│   │   ├── binaryParser.js       # Save file binary parsing
│   │   ├── dataLoader.js         # JSON data management
│   │   ├── tracker.js            # Core tracking logic
│   │   ├── ui.js                 # DOM manipulation and rendering
│   │   └── wallpaper.js          # Dynamic background system
│   ├── json/
│   │   ├── data.json             # Base game items (12,560+ items)
│   │   ├── dlcData.json          # Shadow of the Erdtree items
│  Technical Details

### Architecture
- **Modular Design** - Separated concerns: parsing, data loading, business logic, and UI rendering
- **Vanilla JavaScript** - Zero dependencies, runs in any modern browser
- **ES6+ Standards** - Classes, modules, async/await, and promises
- **Responsive Design** - Mobile-friendly interface with adaptive layouts
- **Performance Optimized** - Efficient filtering and rendering for 12,560+ items

### Save File Parsing
The binary parser validates and extracts data from Elden Ring save files:
- Verifies `BND4` file signature
- Supports dual inventory formats:
  - Base game: 16-byte chunks (`0xB0AD010001FFFFFF`)
  - DLC: 8-byte chunks (`0xB0AD010001`)
- Extracts UTF-16 encoded character names
- Handles up to 10 character slots per save file

### Item Categorization
Items are automatically categorized by hexadecimal ID ranges:

```
Weapons:        0x00F42400 - 0x017D7840
Armor:          0x10000000 - 0x14000000
Talismans:      0x20000000 - 0x24000000
Magic:          0x40000000 - 0x48000000
Ashes of War:   0x80000000 - 0x88000000
Spirit Ashes:   0x90000000 - 0x98000000
Bell Bearings:  0x400007F0 - 0x40000850
Cookbooks:      0x40002400 - 0x40002500
Crystal Tears:  0x40000BC0 - 0x40000BF0
Key Items:      0x40000000 - 0x40001000
```

### Acquisition Types
Seven acquisition method categories with visual indicators:
- Boss drops (👑)
- Enemy drops (⚔️)
- Chests (📦)
- Quests (📜)
- Merchants (🛒)
- Invaders (🗡️)
- SData Sources

This project integrates data and functionality from multiple sources:
- **Binary Parsing** - Save file analysis adapted from [Elden-Ring-Automatic-Checklist](https://github.com/CyberGiant7/Elden-Ring-Automatic-Checklist)
- **Location Database** - Comprehensive item locations from [elden-ring-progression-tracker](https://github.com/elden-ring-progression-tracker/elden-ring-progression-tracker.github.io)
- **Visual Assets** - Elden Ring official branding and Mantinia font

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

Requires JavaScript enabled and support for ES6+ features.

## Privacy

All save file processing happens locally in your browser. No data is uploaded or transmitted to external servers.

## License

MIT License - See [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

---

**A tool for the Tarnished, by the Tarnished
- Enable "Include DLC" if you have Shadow of the Erdtree
- Enable "Include Altered Armor" to track armor variants
- Use search to quickly find specific items
- Farmable items (♾️) can be obtained multiple times
- Click wiki links for detailed acquisition guides

---

**Made with ❤️ for the Tarnished community**
