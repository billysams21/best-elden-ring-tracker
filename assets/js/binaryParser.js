/**
 * Binary Parser for Elden Ring Save Files
 * Extracted and adapted from CyberGiant7's Elden Ring Automatic Checklist
 * Handles both normal and DLC save file formats
 */

class BinaryParser {
  constructor() {
    // Pattern signatures for inventory detection
    this.PATTERN_NORMAL = new Uint8Array([0xB0, 0xAD, 0x01, 0x00, 0x01, 0xFF, 0xFF, 0xFF]);
    this.PATTERN_DLC = new Uint8Array([0xB0, 0xAD, 0x01, 0x00, 0x01]);
    this.FILE_SIGNATURE = new Int8Array([66, 78, 68, 52]); // "BND4"

    this.isDlcFile = false;
    this.fileData = null;
  }

  /**
   * Validate save file signature
   */
  validateFile(fileData) {
    const signature = fileData.slice(0, 4);
    return this.bufferEqual(signature, this.FILE_SIGNATURE);
  }

  /**
   * Compare two buffers for equality
   */
  bufferEqual(buf1, buf2) {
    if (buf1.byteLength !== buf2.byteLength) return false;
    const dv1 = new Int8Array(buf1);
    const dv2 = new Int8Array(buf2);
    for (let i = 0; i < buf1.byteLength; i++) {
      if (dv1[i] !== dv2[i]) return false;
    }
    return true;
  }

  /**
   * Find pattern in buffer
   */
  findPattern(buffer, pattern) {
    for (let i = 0; i < buffer.byteLength; i++) {
      if (buffer[i] === pattern[0] &&
        this.bufferEqual(buffer.subarray(i, i + pattern.byteLength), pattern)) {
        return i;
      }
    }
    return null;
  }

  /**
   * Extract all 10 character slots from save file
   */
  getSlots(fileData) {
    const slots = [
      fileData.subarray(0x00000310, 0x0028030f + 1),
      fileData.subarray(0x00280320, 0x0050031f + 1),
      fileData.subarray(0x00500330, 0x0078032f + 1),
      fileData.subarray(0x00780340, 0x00a0033f + 1),
      fileData.subarray(0x00a00350, 0x00c8034f + 1),
      fileData.subarray(0x00c80360, 0x00f0035f + 1),
      fileData.subarray(0x00f00370, 0x0118036f + 1),
      fileData.subarray(0x01180380, 0x0140037f + 1),
      fileData.subarray(0x01400390, 0x0168038f + 1),
      fileData.subarray(0x016803a0, 0x0190039f + 1)
    ];
    return slots;
  }

  /**
   * Extract character names from save file
   */
  getCharacterNames(fileData) {
    const decoder = new TextDecoder("utf-8");
    const offsets = [
      0x1901d0e, 0x1901f5a, 0x19021a6, 0x19023f2, 0x190263e,
      0x190288a, 0x1902ad6, 0x1902d22, 0x1902f6e, 0x19031ba
    ];

    const names = offsets.map(offset => {
      const nameData = new Int8Array(Array.from(
        new Uint16Array(fileData.slice(offset, offset + 32))
      ));
      return decoder.decode(nameData).replaceAll("\x00", "");
    });

    return names;
  }

  /**
   * Extract inventory from a specific slot
   */
  getInventory(slot) {
    // Try normal pattern first
    let index = this.findPattern(slot, this.PATTERN_NORMAL);

    if (index !== null) {
      index += this.PATTERN_NORMAL.byteLength + 8;
      this.isDlcFile = false;
    } else {
      // Try DLC pattern
      index = this.findPattern(slot, this.PATTERN_DLC);
      if (index !== null) {
        index += this.PATTERN_DLC.byteLength + 3;
        this.isDlcFile = true;
      } else {
        return null;
      }
    }

    // Find end of inventory (50 consecutive zeros)
    const endPattern = new Uint8Array(50).fill(0);
    const endIndex = this.findPattern(slot.subarray(index, slot.byteLength), endPattern);

    if (endIndex === null) return null;

    return slot.subarray(index, index + endIndex + 6);
  }

  /**
   * Split array into chunks
   */
  splitIntoChunks(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Convert little-endian ID to hex string (big-endian)
   */
  convertIdToHex(idBytes) {
    const reversed = idBytes.slice(0, 4).reverse();
    let hexId = "";
    for (let i = 0; i < 4; i++) {
      hexId += this.decimalToHex(reversed[i], 2);
    }
    return hexId.toUpperCase();
  }

  /**
   * Convert decimal to hex with padding
   */
  decimalToHex(decimal, padding = 2) {
    let hex = Number(decimal).toString(16);
    while (hex.length < padding) {
      hex = "0" + hex;
    }
    return hex;
  }

  /**
   * Parse save file and extract inventory IDs
   * @param {ArrayBuffer} fileData - The save file data
   * @param {number} slotIndex - Slot index (0-9)
   * @returns {Object} - { success: boolean, ids: string[], isDlc: boolean, characterName: string }
   */
  parseInventory(fileData, slotIndex) {
    try {
      // Validate file
      if (!this.validateFile(fileData)) {
        return { success: false, error: "Invalid save file format" };
      }

      this.fileData = fileData;
      const savesArray = new Uint8Array(fileData);

      // Get character names
      const characterNames = this.getCharacterNames(fileData);
      const characterName = characterNames[slotIndex];

      // Get slots
      const slots = this.getSlots(savesArray);

      // Get inventory for selected slot
      const inventoryData = this.getInventory(slots[slotIndex]);

      if (!inventoryData) {
        return { success: false, error: "Could not find inventory data in slot" };
      }

      // Convert to array and split into chunks
      const inventory = Array.from(inventoryData);
      const chunkSize = this.isDlcFile ? 8 : 16;
      const chunks = this.splitIntoChunks(inventory, chunkSize);

      // Convert chunks to hex IDs
      const itemIds = chunks.map(chunk => this.convertIdToHex(chunk));

      return {
        success: true,
        ids: itemIds,
        isDlc: this.isDlcFile,
        characterName: characterName,
        totalItems: itemIds.length
      };

    } catch (error) {
      console.error("Error parsing save file:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get character names without parsing inventory
   */
  getSlotNames(fileData) {
    try {
      if (!this.validateFile(fileData)) {
        return { success: false, error: "Invalid save file format" };
      }

      const names = this.getCharacterNames(fileData);
      return { success: true, names: names };

    } catch (error) {
      console.error("Error reading character names:", error);
      return { success: false, error: error.message };
    }
  }
}

// Export for use in other modules
window.BinaryParser = BinaryParser;
