/**
 * Room Class
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
     * Get room information for debugging
     * @returns {object} - Object with room details
     */
    getDebugInfo() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            exits: { ...this.exits },
            exitCount: Object.keys(this.exits).length
        };
    }
}
