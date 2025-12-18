// Shared graph layout algorithm for 2D and 3D visualizations
class GraphLayoutCalculator {
    /**
     * Calculate positions for all rooms using BFS traversal
     * @param {AdventureGraph} graph - The game graph
     * @param {Object} config - Configuration object
     * @param {number} config.horizontalSpacing - Spacing for east/west
     * @param {number} config.verticalSpacing - Spacing for up/down (3D) or north/south (2D)
     * @param {number} config.depthSpacing - Spacing for north/south (3D only, optional)
     * @returns {Map} Map of roomId to position object
     */
    static calculatePositions(graph, config) {
        const rooms = graph.getAllRooms();
        const startRoom = graph.getStartRoom();
        const visited = new Set();
        const queue = [{ 
            room: startRoom, 
            x: 0, 
            y: 0, 
            z: config.depthSpacing !== undefined ? 0 : undefined 
        }];
        
        const is3D = config.depthSpacing !== undefined;
        const positions = new Map();

        // Define direction offsets based on 2D or 3D mode
        const directionOffsets = is3D ? {
            'north': { x: 0, y: 0, z: -config.depthSpacing },
            'south': { x: 0, y: 0, z: config.depthSpacing },
            'east': { x: config.horizontalSpacing, y: 0, z: 0 },
            'west': { x: -config.horizontalSpacing, y: 0, z: 0 },
            'up': { x: 0, y: config.verticalSpacing, z: 0 },
            'down': { x: 0, y: -config.verticalSpacing, z: 0 }
        } : {
            'north': { x: 0, y: -config.verticalSpacing },
            'south': { x: 0, y: config.verticalSpacing },
            'east': { x: config.horizontalSpacing, y: 0 },
            'west': { x: -config.horizontalSpacing, y: 0 },
            'up': { x: 0, y: 0 },
            'down': { x: 0, y: 0 }
        };

        // First pass: basic BFS positioning
        while (queue.length > 0) {
            const current = queue.shift();
            const { room } = current;

            if (visited.has(room.id)) continue;
            visited.add(room.id);

            const position = { 
                x: current.x, 
                y: current.y, 
                room 
            };
            if (is3D) {
                position.z = current.z;
            }
            positions.set(room.id, position);

            for (const [direction, exit] of Object.entries(room.exits)) {
                const targetId = exit.destination;
                if (!visited.has(targetId)) {
                    const offset = directionOffsets[direction];
                    if (offset) {
                        const targetRoom = graph.getRoom(targetId);
                        if (targetRoom) {
                            const nextPos = {
                                room: targetRoom,
                                x: current.x + offset.x,
                                y: current.y + offset.y
                            };
                            if (is3D) {
                                nextPos.z = current.z + offset.z;
                            }
                            queue.push(nextPos);
                        }
                    }
                }
            }
        }

        // Second pass: adjust positions to align with cardinal connections
        for (const room of rooms) {
            const roomPos = positions.get(room.id);
            if (!roomPos) continue;

            for (const [direction, exit] of Object.entries(room.exits)) {
                if (direction === 'up' || direction === 'down') continue;
                
                const targetId = exit.destination;
                const targetPos = positions.get(targetId);
                if (!targetPos) continue;

                if (is3D) {
                    // 3D alignment: north/south align on X, east/west align on Z
                    if (direction === 'north' || direction === 'south') {
                        if (targetPos.x !== roomPos.x) {
                            targetPos.x = roomPos.x;
                        }
                    } else if (direction === 'east' || direction === 'west') {
                        if (targetPos.z !== roomPos.z) {
                            targetPos.z = roomPos.z;
                        }
                    }
                } else {
                    // 2D alignment: north/south align on X, east/west align on Y
                    if (direction === 'north' || direction === 'south') {
                        if (targetPos.x !== roomPos.x) {
                            targetPos.x = roomPos.x;
                        }
                    } else if (direction === 'east' || direction === 'west') {
                        if (targetPos.y !== roomPos.y) {
                            targetPos.y = roomPos.y;
                        }
                    }
                }
            }
        }

        return positions;
    }

    /**
     * Calculate floor assignments for 2D visualization
     * @param {AdventureGraph} graph - The game graph
     * @param {Map} positions - Position map from calculatePositions
     * @returns {Object} Object with roomFloors Map and floorRooms Map
     */
    static calculateFloors(graph, positions) {
        const startRoom = graph.getStartRoom();
        const visited = new Set();
        const queue = [{ room: startRoom, floor: 0 }];
        const roomFloors = new Map();
        const floorRooms = new Map();

        while (queue.length > 0) {
            const { room, floor } = queue.shift();
            
            if (visited.has(room.id)) continue;
            visited.add(room.id);

            const pos = positions.get(room.id);
            if (pos) {
                roomFloors.set(room.id, { floor, gridX: pos.x, gridY: pos.y });
                
                if (!floorRooms.has(floor)) {
                    floorRooms.set(floor, []);
                }
                floorRooms.get(floor).push(room.id);
            }

            for (const [direction, exit] of Object.entries(room.exits)) {
                const targetId = exit.destination;
                if (!visited.has(targetId)) {
                    const targetRoom = graph.getRoom(targetId);
                    if (targetRoom) {
                        let floorChange = 0;
                        if (direction === 'up') floorChange = 1;
                        if (direction === 'down') floorChange = -1;
                        
                        queue.push({
                            room: targetRoom,
                            floor: floor + floorChange
                        });
                    }
                }
            }
        }

        return { roomFloors, floorRooms };
    }
}
