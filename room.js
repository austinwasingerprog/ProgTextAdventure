/**
 * Room Class - Enhanced with items and dangers
 * Represents a single room/node in the adventure graph
 * Each room has an ID, title, description, and connections to other rooms
 */
class Room {
    /**
     * @param {string} id - Unique identifier for the room
     * @param {string} title - Display title of the room
     * @param {string} description - Description shown when entering the room
     */
    constructor(id, title, description) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.exits = {}; // Direction -> Room ID mapping
        this.items = []; // Items in this room
        this.visited = false;
        this.isDangerous = false; // Drains health over time
        this.dangerMessage = "";
    }

    /**
     * Add an exit from this room to another room
     * @param {string} direction - Direction (north, south, east, west, etc.)
     * @param {string} destinationId - ID of the destination room
     * @returns {Room} - Returns this for method chaining
     */
    addExit(direction, destinationId) {
        this.exits[direction.toLowerCase()] = destinationId;
        return this; // Enable chaining
    }

    /**
     * Add an item to this room
     * @param {Item} item - Item to add
     * @returns {Room} - Returns this for method chaining
     */
    addItem(item) {
        this.items.push(item);
        return this;
    }

    /**
     * Remove an item from this room
     * @param {string} itemId - ID of the item to remove
     * @returns {Item|null} - The removed item or null
     */
    removeItem(itemId) {
        const index = this.items.findIndex(item => item.id === itemId);
        if (index !== -1) {
            return this.items.splice(index, 1)[0];
        }
        return null;
    }

    /**
     * Check if room has an item
     * @param {string} itemId - ID of the item to check
     * @returns {boolean} - True if item exists in room
     */
    hasItem(itemId) {
        return this.items.some(item => item.id === itemId);
    }

    /**
     * Get an item from this room
     * @param {string} itemId - ID of the item to get
     * @returns {Item|null} - The item or null
     */
    getItem(itemId) {
        return this.items.find(item => item.id === itemId);
    }

    /**
     * Make this room dangerous
     * @param {string} message - Message to show when in danger
     * @returns {Room} - Returns this for method chaining
     */
    setDangerous(message) {
        this.isDangerous = true;
        this.dangerMessage = message;
        return this;
    }

    /**
     * Get the destination room ID for a given direction
     * @param {string} direction - Direction to check
     * @returns {string|null} - Destination room ID or null if no exit
     */
    getExit(direction) {
        return this.exits[direction.toLowerCase()] || null;
    }

    /**
     * Get all available exits from this room
     * @returns {string[]} - Array of available directions
     */
    getAvailableDirections() {
        return Object.keys(this.exits);
    }

    /**
     * Check if a direction is valid from this room
     * @param {string} direction - Direction to check
     * @returns {boolean} - True if the direction is valid
     */
    hasExit(direction) {
        return direction.toLowerCase() in this.exits;
    }

    /**
     * Get a formatted string of available exits
     * @returns {string} - Formatted exit string
     */
    getExitsString() {
        const directions = this.getAvailableDirections();
        if (directions.length === 0) {
            return "No obvious exits.";
        }
        return `Exits: ${directions.join(', ')}`;
    }

    /**
     * Get a formatted string of items in the room
     * @returns {string} - Formatted items string
     */
    getItemsString() {
        if (this.items.length === 0) {
            return "";
        }
        const itemNames = this.items.map(item => `${item.name} [${item.id}]`);
        return `\nYou see: ${itemNames.join(', ')}`;
    }

    /**
     * Get room information for debugging
     * @returns {object} - Object with room details
     */
    getDebugInfo() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            exits: { ...this.exits },
            exitCount: Object.keys(this.exits).length,
            itemCount: this.items.length,
            isDangerous: this.isDangerous
        };
    }
}

/**
 * Item Class
 * Represents an item that can be picked up and used
 */
class Item {
    /**
     * @param {string} id - Unique identifier for the item
     * @param {string} name - Display name of the item
     * @param {string} description - Description of the item
     * @param {string} type - Type of item (key, consumable, tool, misc, lore)
     */
    constructor(id, name, description, type = 'misc') {
        this.id = id;
        this.name = name;
        this.description = description;
        this.type = type; // 'key', 'consumable', 'tool', 'misc', 'lore'
        this.canUse = false;
        this.useEffect = null;
    }

    /**
     * Make this item usable with an effect
     * @param {Function} effect - Function to execute when used
     * @returns {Item} - Returns this for method chaining
     */
    setUsable(effect) {
        this.canUse = true;
        this.useEffect = effect;
        return this;
    }
}
