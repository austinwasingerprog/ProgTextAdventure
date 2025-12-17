/**
 * Graph Class
 * Manages the entire adventure graph - all rooms and their connections
 * Provides methods for navigation, validation, and debugging
 */
class AdventureGraph {
    constructor() {
        this.rooms = new Map(); // Map of room ID -> Room object
        this.startRoomId = null;
    }

    /**
     * Add a room to the graph
     * @param {Room} room - Room object to add
     * @returns {AdventureGraph} - Returns this for method chaining
     */
    addRoom(room) {
        if (!(room instanceof Room)) {
            throw new Error("Must provide a Room instance");
        }
        this.rooms.set(room.id, room);
        
        // Set first room as start room if not set
        if (this.startRoomId === null) {
            this.startRoomId = room.id;
        }
        
        return this;
    }

    /**
     * Set the starting room for the adventure
     * @param {string} roomId - ID of the starting room
     * @returns {AdventureGraph} - Returns this for method chaining
     */
    setStartRoom(roomId) {
        if (!this.rooms.has(roomId)) {
            throw new Error(`Room ${roomId} does not exist`);
        }
        this.startRoomId = roomId;
        return this;
    }

    /**
     * Get a room by its ID
     * @param {string} roomId - ID of the room to retrieve
     * @returns {Room|null} - The room object or null if not found
     */
    getRoom(roomId) {
        return this.rooms.get(roomId) || null;
    }

    /**
     * Get the starting room
     * @returns {Room|null} - The starting room or null
     */
    getStartRoom() {
        return this.getRoom(this.startRoomId);
    }

    /**
     * Get all rooms in the graph
     * @returns {Room[]} - Array of all rooms
     */
    getAllRooms() {
        return Array.from(this.rooms.values());
    }

    /**
     * Navigate from one room to another using a direction
     * @param {string} currentRoomId - Current room ID
     * @param {string} direction - Direction to move
     * @returns {Room|null} - Destination room or null if invalid
     */
    navigate(currentRoomId, direction) {
        const currentRoom = this.getRoom(currentRoomId);
        if (!currentRoom) {
            return null;
        }

        const destinationId = currentRoom.getExit(direction);
        if (!destinationId) {
            return null;
        }

        return this.getRoom(destinationId);
    }

    /**
     * Validate the graph structure
     * Checks for broken connections and unreachable rooms
     * @returns {object} - Validation results with errors and warnings
     */
    validate() {
        const results = {
            valid: true,
            errors: [],
            warnings: []
        };

        // Check if there are any rooms
        if (this.rooms.size === 0) {
            results.valid = false;
            results.errors.push("Graph has no rooms");
            return results;
        }

        // Check if start room is set
        if (!this.startRoomId) {
            results.valid = false;
            results.errors.push("No start room set");
        }

        // Check for broken connections
        for (const room of this.rooms.values()) {
            for (const [direction, destinationId] of Object.entries(room.exits)) {
                if (!this.rooms.has(destinationId)) {
                    results.valid = false;
                    results.errors.push(
                        `Room ${room.id} has broken exit: ${direction} -> ${destinationId}`
                    );
                }
            }
        }

        // Check for unreachable rooms (simple BFS)
        const reachable = new Set();
        const queue = [this.startRoomId];
        
        while (queue.length > 0) {
            const roomId = queue.shift();
            if (reachable.has(roomId)) continue;
            
            reachable.add(roomId);
            const room = this.getRoom(roomId);
            
            if (room) {
                for (const destId of Object.values(room.exits)) {
                    if (!reachable.has(destId)) {
                        queue.push(destId);
                    }
                }
            }
        }

        // Check for unreachable rooms
        for (const roomId of this.rooms.keys()) {
            if (!reachable.has(roomId)) {
                results.warnings.push(`Room ${roomId} is unreachable from start`);
            }
        }

        return results;
    }

    /**
     * Get graph statistics
     * @returns {object} - Statistics about the graph
     */
    getStats() {
        const rooms = this.getAllRooms();
        let totalExits = 0;
        let maxExits = 0;
        let minExits = Infinity;

        for (const room of rooms) {
            const exitCount = room.getAvailableDirections().length;
            totalExits += exitCount;
            maxExits = Math.max(maxExits, exitCount);
            minExits = Math.min(minExits, exitCount);
        }

        return {
            roomCount: this.rooms.size,
            totalExits: totalExits,
            averageExits: rooms.length > 0 ? (totalExits / rooms.length).toFixed(2) : 0,
            maxExits: rooms.length > 0 ? maxExits : 0,
            minExits: rooms.length > 0 && minExits !== Infinity ? minExits : 0,
            startRoom: this.startRoomId
        };
    }

    /**
     * Generate an ASCII map representation of the graph
     * @returns {string} - ASCII art representation
     */
    generateASCIIMap() {
        const rooms = this.getAllRooms();
        let output = [];
        
        output.push("╔════════════════════════════════════════════════════════════════╗");
        output.push("║                     ADVENTURE GRAPH MAP                        ║");
        output.push("╚════════════════════════════════════════════════════════════════╝");
        output.push("");
        
        // Show stats
        const stats = this.getStats();
        output.push(`Total Rooms: ${stats.roomCount} | Total Connections: ${stats.totalExits}`);
        output.push(`Start Room: ${this.startRoomId}`);
        output.push("");
        
        // Show each room and its connections
        for (const room of rooms) {
            const isStart = room.id === this.startRoomId;
            const marker = isStart ? "★" : "●";
            
            output.push(`${marker} [${room.id}] ${room.title}`);
            
            const directions = room.getAvailableDirections();
            if (directions.length > 0) {
                for (const dir of directions) {
                    const destId = room.getExit(dir);
                    const destRoom = this.getRoom(destId);
                    const destTitle = destRoom ? destRoom.title : "UNKNOWN";
                    output.push(`  └─ ${dir.padEnd(8)} → [${destId}] ${destTitle}`);
                }
            } else {
                output.push(`  └─ No exits`);
            }
            output.push("");
        }
        
        return output.join("\n");
    }

    /**
     * Get graph data for canvas visualization
     * @returns {object} - Object with nodes and edges for drawing
     */
    getGraphData() {
        const nodes = [];
        const edges = [];
        
        for (const room of this.rooms.values()) {
            nodes.push({
                id: room.id,
                title: room.title,
                description: room.description,
                isStart: room.id === this.startRoomId,
                exitCount: room.getAvailableDirections().length
            });
            
            for (const [direction, destinationId] of Object.entries(room.exits)) {
                edges.push({
                    from: room.id,
                    to: destinationId,
                    label: direction
                });
            }
        }
        
        return { nodes, edges };
    }
}
