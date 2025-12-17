/**
 * Debug View Script
 * Handles visualization of the adventure graph in both ASCII and Canvas formats
 */

class DebugView {
    constructor(graph) {
        this.graph = graph;
        this.canvas = document.getElementById('graphCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.hoveredNode = null;
        this.nodePositions = new Map();
    }

    /**
     * Initialize the debug view
     */
    init() {
        this.setupEventListeners();
        this.renderASCIIView();
        this.renderRoomList();
        this.calculateNodePositions();
        this.renderCanvas();
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Back button
        document.getElementById('backBtn').addEventListener('click', () => {
            window.close();
        });

        // Tab switching
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Canvas interactions
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
    }

    /**
     * Switch between tabs
     */
    switchTab(tabName) {
        // Update buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            }
        });

        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });

        if (tabName === 'ascii') {
            document.getElementById('asciiTab').classList.remove('hidden');
        } else if (tabName === 'canvas') {
            document.getElementById('canvasTab').classList.remove('hidden');
            this.renderCanvas();
        } else if (tabName === '3d') {
            document.getElementById('3dTab').classList.remove('hidden');
            if (!window.debugView3D) {
                window.debugView3D = new DebugView3D(this.graph);
                window.debugView3D.init();
            }
        }
    }

    /**
     * Render the ASCII map view
     */
    renderASCIIView() {
        const asciiMap = this.graph.generateASCIIMap();
        document.getElementById('asciiMap').textContent = asciiMap;
    }

    /**
     * Render the room list with details
     */
    renderRoomList() {
        const roomListEl = document.getElementById('roomList');
        const rooms = this.graph.getAllRooms();

        roomListEl.innerHTML = '';

        for (const room of rooms) {
            const card = document.createElement('div');
            card.className = 'room-card';

            const title = document.createElement('h3');
            title.textContent = room.title;
            if (room.id === this.graph.startRoomId) {
                title.textContent += ' ★';
            }

            const id = document.createElement('div');
            id.className = 'room-id';
            id.textContent = `ID: ${room.id}`;

            const desc = document.createElement('div');
            desc.className = 'room-desc';
            desc.textContent = room.description;

            card.appendChild(title);
            card.appendChild(id);
            card.appendChild(desc);

            // Add connections
            const directions = room.getAvailableDirections();
            if (directions.length > 0) {
                const connections = document.createElement('div');
                connections.className = 'connections';

                const connTitle = document.createElement('h4');
                connTitle.textContent = 'Connections:';
                connections.appendChild(connTitle);

                const connList = document.createElement('div');
                connList.className = 'connection-list';

                for (const dir of directions) {
                    const destId = room.getExit(dir);
                    const badge = document.createElement('span');
                    badge.className = 'connection-badge';
                    badge.textContent = `${dir} → ${destId}`;
                    connList.appendChild(badge);
                }

                connections.appendChild(connList);
                card.appendChild(connections);
            }

            roomListEl.appendChild(card);
        }
    }

    /**
     * Calculate positions for nodes in the canvas based on cardinal directions
     * Uses a multi-level system for up/down connections
     */
    calculateNodePositions() {
        const rooms = this.graph.getAllRooms();
        const startRoom = this.graph.getStartRoom();
        const gridSize = 200; // Increased spacing between rooms
        const levelHeight = 350; // Vertical spacing between levels (increased for better separation)
        const nodeRadius = 50;
        
        // Start with the starting room at center
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        const positioned = new Set();
        const positions = new Map();
        const roomLevels = new Map(); // Track which level each room is on
        
        // Position the start room first at level 0
        positions.set(startRoom.id, { x: centerX, y: centerY, radius: nodeRadius, level: 0 });
        roomLevels.set(startRoom.id, 0);
        positioned.add(startRoom.id);
        
        // Queue for BFS traversal: { room, x, y, level }
        const queue = [{ room: startRoom, x: centerX, y: centerY, level: 0 }];
        
        // Map directions to x,y offsets (level changes handled separately)
        const directionOffsets = {
            'north': { x: 0, y: -gridSize, levelChange: 0 },
            'south': { x: 0, y: gridSize, levelChange: 0 },
            'east': { x: gridSize, y: 0, levelChange: 0 },
            'west': { x: -gridSize, y: 0, levelChange: 0 },
            'up': { x: 0, y: 0, levelChange: -1 }, // Same x position, different level
            'down': { x: 0, y: 0, levelChange: 1 }  // Same x position, different level
        };
        
        // BFS to position all connected rooms
        while (queue.length > 0) {
            const { room, x, y, level } = queue.shift();
            
            // Check all exits from this room
            for (const [direction, destinationId] of Object.entries(room.exits)) {
                if (positioned.has(destinationId)) continue;
                
                const offset = directionOffsets[direction] || { x: 0, y: 0, levelChange: 0 };
                
                // Calculate new level
                const newLevel = level + offset.levelChange;
                
                // Calculate base Y position for this level
                const levelY = centerY + (newLevel * levelHeight);
                
                // Calculate new position
                // For up/down, keep same X but move to different level
                // For cardinal directions, offset from current position
                let newX, newY;
                if (offset.levelChange !== 0) {
                    // Vertical movement: keep X close to parent, just shift to new level
                    newX = x;
                    newY = levelY;
                } else {
                    // Cardinal movement: offset from current position
                    newX = x + offset.x;
                    newY = y + offset.y;
                }
                
                const destRoom = this.graph.getRoom(destinationId);
                if (destRoom) {
                    positions.set(destinationId, { x: newX, y: newY, radius: nodeRadius, level: newLevel });
                    roomLevels.set(destinationId, newLevel);
                    positioned.add(destinationId);
                    queue.push({ room: destRoom, x: newX, y: newY, level: newLevel });
                }
            }
        }
        
        // Handle any unconnected rooms (like roof, basement before unlocking)
        // Position them based on their logical connections even if not in exits yet
        rooms.forEach((room, index) => {
            if (!positioned.has(room.id)) {
                let x, y, level;
                
                // Special positioning for known conditional rooms
                if (room.id === 'roof') {
                    // Position roof above lobby, slightly offset to avoid overlap
                    const lobbyPos = positions.get('lobby');
                    if (lobbyPos) {
                        x = lobbyPos.x + gridSize * 0.4; // Offset to the right
                        y = centerY - levelHeight;
                        level = -1;
                    } else {
                        x = centerX;
                        y = centerY - levelHeight;
                        level = -1;
                    }
                } else if (room.id === 'basement') {
                    // Position basement below claims, slightly offset to avoid overlap
                    const claimsPos = positions.get('claims');
                    if (claimsPos) {
                        x = claimsPos.x - gridSize * 0.4; // Offset to the left
                        y = centerY + levelHeight;
                        level = 1;
                    } else {
                        x = centerX + gridSize;
                        y = centerY + levelHeight;
                        level = 1;
                    }
                } else if (room.id === 'freedom') {
                    // Position freedom room off to the side (special win state)
                    x = centerX + gridSize * 3;
                    y = centerY - levelHeight;
                    level = -1;
                } else {
                    // Place other unconnected rooms in a row at the right side
                    x = centerX + gridSize * 3;
                    y = centerY + (index - rooms.length / 2) * gridSize * 0.5;
                    level = 0;
                }
                
                positions.set(room.id, { x, y, radius: nodeRadius, level });
                roomLevels.set(room.id, level);
            }
        });
        
        this.nodePositions = positions;
        this.roomLevels = roomLevels;
    }

    /**
     * Render the canvas visualization
     */
    renderCanvas() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Save context
        ctx.save();
        
        // Apply transformations
        ctx.translate(this.offsetX, this.offsetY);
        ctx.scale(this.scale, this.scale);

        // Draw connections first (so they appear behind nodes)
        this.drawConnections();

        // Draw nodes
        this.drawNodes();

        // Restore context
        ctx.restore();
    }

    /**
     * Draw connections between rooms
     */
    drawConnections() {
        const ctx = this.ctx;
        const graphData = this.graph.getGraphData();

        // Track connections we've already drawn to avoid duplicates
        const drawnConnections = new Set();

        ctx.lineWidth = 3;
        ctx.font = '14px Arial';

        // Helper to get opposite direction
        const oppositeDirection = {
            'north': 'south',
            'south': 'north',
            'east': 'west',
            'west': 'east',
            'up': 'down',
            'down': 'up'
        };

        for (const edge of graphData.edges) {
            const fromPos = this.nodePositions.get(edge.from);
            const toPos = this.nodePositions.get(edge.to);

            if (!fromPos || !toPos) continue;

            // Create a unique key for this connection (bidirectional)
            const connectionKey = [edge.from, edge.to].sort().join('|');
            
            // Skip if we've already drawn this connection
            if (drawnConnections.has(connectionKey)) continue;
            drawnConnections.add(connectionKey);

            // Check if there's a reverse connection
            const reverseEdge = graphData.edges.find(
                e => e.from === edge.to && e.to === edge.from
            );

            // Calculate arrow positions
            const dx = toPos.x - fromPos.x;
            const dy = toPos.y - fromPos.y;
            const angle = Math.atan2(dy, dx);
            
            // Start and end points (offset by node radius)
            const startX = fromPos.x + Math.cos(angle) * fromPos.radius;
            const startY = fromPos.y + Math.sin(angle) * fromPos.radius;
            const endX = toPos.x - Math.cos(angle) * toPos.radius;
            const endY = toPos.y - Math.sin(angle) * toPos.radius;

            // Different colors for up/down connections
            const isVerticalMovement = edge.label === 'up' || edge.label === 'down';
            const connectionColor = isVerticalMovement ? '#ff9900' : '#0066cc';
            const lineStyle = isVerticalMovement ? [10, 5] : []; // Dashed for up/down

            // Draw line
            ctx.strokeStyle = connectionColor;
            ctx.setLineDash(lineStyle);
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            ctx.setLineDash([]); // Reset dash

            // Draw arrow head at end
            const arrowSize = 12;
            ctx.fillStyle = connectionColor;
            ctx.beginPath();
            ctx.moveTo(endX, endY);
            ctx.lineTo(
                endX - arrowSize * Math.cos(angle - Math.PI / 6),
                endY - arrowSize * Math.sin(angle - Math.PI / 6)
            );
            ctx.lineTo(
                endX - arrowSize * Math.cos(angle + Math.PI / 6),
                endY - arrowSize * Math.sin(angle + Math.PI / 6)
            );
            ctx.closePath();
            ctx.fill();

            // Draw arrow head at start (reverse direction) if bidirectional
            if (reverseEdge) {
                ctx.fillStyle = connectionColor;
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(
                    startX + arrowSize * Math.cos(angle - Math.PI / 6),
                    startY + arrowSize * Math.sin(angle - Math.PI / 6)
                );
                ctx.lineTo(
                    startX + arrowSize * Math.cos(angle + Math.PI / 6),
                    startY + arrowSize * Math.sin(angle + Math.PI / 6)
                );
                ctx.closePath();
                ctx.fill();
            }

            // Create label showing both directions
            let label = edge.label;
            if (reverseEdge) {
                const oppositeDir = oppositeDirection[edge.label] || reverseEdge.label;
                label = `${oppositeDir}/${edge.label}`;
            }

            // Draw label with background
            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;
            
            // Measure text to create proper background
            ctx.font = 'bold 12px Arial';
            const textWidth = ctx.measureText(label).width;
            
            ctx.fillStyle = '#1e1e1e';
            ctx.fillRect(midX - textWidth/2 - 5, midY - 10, textWidth + 10, 20);
            
            ctx.fillStyle = isVerticalMovement ? '#ff9900' : '#4fc3f7';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, midX, midY);
        }
    }

    /**
     * Draw room nodes
     */
    drawNodes() {
        const ctx = this.ctx;
        const rooms = this.graph.getAllRooms();

        // Group rooms by level for drawing level indicators
        const levelGroups = new Map();
        for (const room of rooms) {
            const pos = this.nodePositions.get(room.id);
            if (!pos) continue;
            
            if (!levelGroups.has(pos.level)) {
                levelGroups.set(pos.level, []);
            }
            levelGroups.get(pos.level).push({ room, pos });
        }

        // Draw level indicators
        ctx.fillStyle = '#333';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        for (const [level, items] of levelGroups.entries()) {
            if (items.length > 0) {
                const y = items[0].pos.y;
                let levelName = 'Ground Floor';
                if (level > 0) levelName = `Basement ${level}`;
                if (level < 0) levelName = `Floor ${Math.abs(level)}`;
                
                ctx.fillText(levelName, 20, y);
            }
        }

        // Draw nodes
        for (const room of rooms) {
            const pos = this.nodePositions.get(room.id);
            if (!pos) continue;

            const isStart = room.id === this.graph.startRoomId;
            const isHovered = this.hoveredNode === room.id;

            // Color based on level
            let baseColor = '#0066cc';
            if (pos.level < 0) {
                baseColor = '#9c27b0'; // Purple for upper levels
            } else if (pos.level > 0) {
                baseColor = '#f44336'; // Red for basement levels
            }

            // Draw node circle
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, pos.radius, 0, Math.PI * 2);
            
            if (isStart) {
                ctx.fillStyle = '#ffd700'; // Gold for start room
            } else if (isHovered) {
                ctx.fillStyle = '#4fc3f7';
            } else {
                ctx.fillStyle = baseColor;
            }
            ctx.fill();
            
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Draw room ID
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(room.id, pos.x, pos.y - 10);

            // Draw exit count
            ctx.font = '12px Arial';
            const exitCount = room.getAvailableDirections().length;
            ctx.fillText(`${exitCount} exit${exitCount !== 1 ? 's' : ''}`, pos.x, pos.y + 10);

            // Draw title below node if hovered
            if (isHovered) {
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 14px Arial';
                ctx.fillText(room.title, pos.x, pos.y + pos.radius + 20);
            }

            // Draw star for start room
            if (isStart) {
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 20px Arial';
                ctx.fillText('★', pos.x, pos.y - pos.radius - 20);
            }
        }
    }

    /**
     * Handle mouse down on canvas
     */
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.isDragging = true;
        this.dragStartX = e.clientX - rect.left - this.offsetX;
        this.dragStartY = e.clientY - rect.top - this.offsetY;
    }

    /**
     * Handle mouse move on canvas
     */
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (this.isDragging) {
            this.offsetX = mouseX - this.dragStartX;
            this.offsetY = mouseY - this.dragStartY;
            this.renderCanvas();
        } else {
            // Check for hover
            this.checkHover(mouseX, mouseY);
        }
    }

    /**
     * Handle mouse up
     */
    handleMouseUp() {
        this.isDragging = false;
    }

    /**
     * Handle mouse wheel for zoom
     */
    handleWheel(e) {
        e.preventDefault();
        
        const zoomSpeed = 0.1;
        const delta = e.deltaY > 0 ? -zoomSpeed : zoomSpeed;
        
        this.scale = Math.max(0.5, Math.min(2, this.scale + delta));
        this.renderCanvas();
    }

    /**
     * Check if mouse is hovering over a node
     */
    checkHover(mouseX, mouseY) {
        // Transform mouse coordinates
        const transformedX = (mouseX - this.offsetX) / this.scale;
        const transformedY = (mouseY - this.offsetY) / this.scale;

        let foundHover = false;

        for (const [roomId, pos] of this.nodePositions.entries()) {
            const dx = transformedX - pos.x;
            const dy = transformedY - pos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= pos.radius) {
                if (this.hoveredNode !== roomId) {
                    this.hoveredNode = roomId;
                    this.renderCanvas();
                }
                foundHover = true;
                break;
            }
        }

        if (!foundHover && this.hoveredNode !== null) {
            this.hoveredNode = null;
            this.renderCanvas();
        }
    }
}

/**
 * 3D Debug View using Three.js
 * Renders rooms in true 3D space with correct cardinal positioning
 */
class DebugView3D {
    constructor(graph) {
        this.graph = graph;
        this.container = document.getElementById('canvas3d');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.roomMeshes = new Map();
        this.connectionLines = [];
        this.nodePositions = new Map();
    }

    /**
     * Initialize the 3D view
     */
    init() {
        this.setupScene();
        this.calculatePositions();
        this.createRoomNodes();
        this.createConnections();
        this.setupLighting();
        this.setupControls();
        this.animate();
    }

    /**
     * Set up the Three.js scene
     */
    setupScene() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1e1e1e);

        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(15, 15, 15);
        this.camera.lookAt(0, 0, 0);

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.container.appendChild(this.renderer.domElement);

        // Handle window resize
        window.addEventListener('resize', () => {
            if (document.getElementById('3dTab').classList.contains('hidden')) return;
            
            this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        });
    }

    /**
     * Calculate 3D positions for all rooms
     */
    calculatePositions() {
        const rooms = Array.from(this.graph.rooms.values());
        const startRoom = this.graph.getStartRoom();
        const visited = new Set();
        const queue = [{ room: startRoom, x: 0, y: 0, z: 0 }];
        
        const spacing = 5; // Units between rooms
        const verticalSpacing = 6; // Units for vertical levels

        // Direction mappings (X = East-West, Z = North-South, Y = Up-Down)
        const directionOffsets = {
            'north': { x: 0, y: 0, z: -spacing },
            'south': { x: 0, y: 0, z: spacing },
            'east': { x: spacing, y: 0, z: 0 },
            'west': { x: -spacing, y: 0, z: 0 },
            'up': { x: 0, y: verticalSpacing, z: 0 },
            'down': { x: 0, y: -verticalSpacing, z: 0 }
        };

        while (queue.length > 0) {
            const { room, x, y, z } = queue.shift();

            if (visited.has(room.id)) continue;
            visited.add(room.id);

            this.nodePositions.set(room.id, { x, y, z, room });

            // Queue adjacent rooms
            for (const [direction, targetId] of Object.entries(room.exits)) {
                if (!visited.has(targetId)) {
                    const offset = directionOffsets[direction];
                    if (offset) {
                        const targetRoom = this.graph.getRoom(targetId);
                        if (targetRoom) {
                            queue.push({
                                room: targetRoom,
                                x: x + offset.x,
                                y: y + offset.y,
                                z: z + offset.z
                            });
                        }
                    }
                }
            }
        }

        // Handle any unconnected rooms (like roof, basement, freedom before dynamic connections)
        for (const room of rooms) {
            if (!this.nodePositions.has(room.id)) {
                let x, y, z;
                
                // Special positioning for known conditional rooms
                if (room.id === 'roof') {
                    // Position roof directly above lobby (same X,Z)
                    const lobbyPos = this.nodePositions.get('lobby');
                    if (lobbyPos) {
                        x = lobbyPos.x;
                        y = verticalSpacing;
                        z = lobbyPos.z;
                    } else {
                        x = 0;
                        y = verticalSpacing;
                        z = 0;
                    }
                } else if (room.id === 'basement') {
                    // Position basement directly below claims (same X,Z)
                    const claimsPos = this.nodePositions.get('claims');
                    if (claimsPos) {
                        x = claimsPos.x;
                        y = -verticalSpacing;
                        z = claimsPos.z;
                    } else {
                        x = 0;
                        y = -verticalSpacing;
                        z = 0;
                    }
                } else if (room.id === 'freedom') {
                    // Position freedom room next to roof (special win state)
                    const roofPos = this.nodePositions.get('roof');
                    if (roofPos) {
                        x = roofPos.x + spacing;
                        y = roofPos.y;
                        z = roofPos.z;
                    } else {
                        x = spacing * 3;
                        y = verticalSpacing;
                        z = 0;
                    }
                } else {
                    // Place other unconnected rooms off to the side
                    x = spacing * 4;
                    y = 0;
                    z = Math.random() * spacing * 2 - spacing;
                }
                
                this.nodePositions.set(room.id, { x, y, z, room });
            }
        }
    }

    /**
     * Create text label (using sprite-based approach)
     */
    createLabel(text, x, y, z) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        context.fillStyle = '#1e1e1e';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.font = 'Bold 20px Arial';
        context.fillStyle = '#ffffff';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.set(x, y, z);
        sprite.scale.set(3, 0.75, 1);
        
        this.scene.add(sprite);
    }

    /**
     * Create 3D room nodes
     */
    createRoomNodes() {
        const startRoomId = this.graph.getStartRoom().id;

        for (const [roomId, pos] of this.nodePositions.entries()) {
            const room = pos.room;
            
            // Determine color based on level
            let color = 0x0066cc; // Blue for ground floor (y=0)
            if (pos.y > 0) {
                color = 0x9c27b0; // Purple for upper floors
            } else if (pos.y < 0) {
                color = 0xf44336; // Red for basement
            }

            // Create sphere for room
            const geometry = new THREE.SphereGeometry(0.5, 32, 32);
            const material = new THREE.MeshPhongMaterial({ 
                color: color,
                emissive: color,
                emissiveIntensity: 0.2,
                shininess: 100
            });
            const sphere = new THREE.Mesh(geometry, material);
            sphere.position.set(pos.x, pos.y, pos.z);
            
            // Store reference
            sphere.userData = { roomId, room };
            this.roomMeshes.set(roomId, sphere);
            this.scene.add(sphere);

            // Add label using room.id instead of room.name
            this.createLabel(room.id, pos.x, pos.y + 1, pos.z);

            // Add star for starting room
            if (roomId === startRoomId) {
                const starGeometry = new THREE.SphereGeometry(0.3, 5, 5);
                const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffd700 });
                const star = new THREE.Mesh(starGeometry, starMaterial);
                star.position.set(pos.x, pos.y + 1.2, pos.z);
                this.scene.add(star);
            }

            // Add danger indicator
            if (room.isDangerous) {
                const ringGeometry = new THREE.TorusGeometry(0.7, 0.1, 16, 100);
                const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
                const ring = new THREE.Mesh(ringGeometry, ringMaterial);
                ring.position.set(pos.x, pos.y, pos.z);
                ring.rotation.x = Math.PI / 2;
                this.scene.add(ring);
            }
        }
    }

    /**
     * Create connection lines between rooms
     */
    createConnections() {
        const processed = new Set();

        for (const [roomId, pos] of this.nodePositions.entries()) {
            const room = pos.room;

            for (const [direction, targetId] of Object.entries(room.exits)) {
                const connectionKey = [roomId, targetId].sort().join('-');
                if (processed.has(connectionKey)) continue;
                processed.add(connectionKey);

                const targetPos = this.nodePositions.get(targetId);
                if (!targetPos) continue;

                // Determine line color
                const isVertical = direction === 'up' || direction === 'down';
                const color = isVertical ? 0xff9900 : 0x0066cc;

                // Create line
                const points = [];
                points.push(new THREE.Vector3(pos.x, pos.y, pos.z));
                points.push(new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z));

                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const material = new THREE.LineBasicMaterial({ 
                    color: color,
                    linewidth: 2,
                    opacity: 0.6,
                    transparent: true
                });
                const line = new THREE.Line(geometry, material);
                this.connectionLines.push(line);
                this.scene.add(line);

                // Add arrow
                const dir = new THREE.Vector3()
                    .subVectors(
                        new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z),
                        new THREE.Vector3(pos.x, pos.y, pos.z)
                    )
                    .normalize();
                
                const arrowHelper = new THREE.ArrowHelper(
                    dir,
                    new THREE.Vector3(pos.x, pos.y, pos.z),
                    Math.sqrt(
                        Math.pow(targetPos.x - pos.x, 2) +
                        Math.pow(targetPos.y - pos.y, 2) +
                        Math.pow(targetPos.z - pos.z, 2)
                    ),
                    color,
                    0.5,
                    0.3
                );
                this.scene.add(arrowHelper);
            }
        }
    }

    /**
     * Set up lighting
     */
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        // Directional lights
        const light1 = new THREE.DirectionalLight(0xffffff, 0.5);
        light1.position.set(10, 10, 10);
        this.scene.add(light1);

        const light2 = new THREE.DirectionalLight(0xffffff, 0.3);
        light2.position.set(-10, -10, -10);
        this.scene.add(light2);

        // Add a grid helper
        const gridHelper = new THREE.GridHelper(50, 50, 0x444444, 0x222222);
        this.scene.add(gridHelper);

        // Add axis helper
        const axesHelper = new THREE.AxesHelper(10);
        this.scene.add(axesHelper);
    }

    /**
     * Set up camera controls
     */
    setupControls() {
        // Simple orbit controls implementation
        let isRotating = false;
        let isPanning = false;
        let previousMousePosition = { x: 0, y: 0 };

        this.renderer.domElement.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left click
                isRotating = true;
            } else if (e.button === 2) { // Right click
                isPanning = true;
                e.preventDefault();
            }
            previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        this.renderer.domElement.addEventListener('mousemove', (e) => {
            if (isRotating) {
                const deltaX = e.clientX - previousMousePosition.x;
                const deltaY = e.clientY - previousMousePosition.y;

                const rotationSpeed = 0.005;
                
                // Rotate camera around the scene
                const radius = Math.sqrt(
                    this.camera.position.x ** 2 +
                    this.camera.position.y ** 2 +
                    this.camera.position.z ** 2
                );
                
                const theta = Math.atan2(this.camera.position.x, this.camera.position.z);
                const phi = Math.acos(this.camera.position.y / radius);

                const newTheta = theta - deltaX * rotationSpeed;
                const newPhi = Math.max(0.1, Math.min(Math.PI - 0.1, phi - deltaY * rotationSpeed));

                this.camera.position.x = radius * Math.sin(newPhi) * Math.sin(newTheta);
                this.camera.position.y = radius * Math.cos(newPhi);
                this.camera.position.z = radius * Math.sin(newPhi) * Math.cos(newTheta);
                
                this.camera.lookAt(0, 0, 0);
            } else if (isPanning) {
                const deltaX = e.clientX - previousMousePosition.x;
                const deltaY = e.clientY - previousMousePosition.y;

                const panSpeed = 0.02;
                
                const right = new THREE.Vector3();
                const up = new THREE.Vector3(0, 1, 0);
                
                right.crossVectors(this.camera.position, up).normalize();
                
                this.camera.position.x -= right.x * deltaX * panSpeed;
                this.camera.position.z -= right.z * deltaX * panSpeed;
                this.camera.position.y += deltaY * panSpeed;
                
                this.camera.lookAt(0, 0, 0);
            }

            previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        this.renderer.domElement.addEventListener('mouseup', () => {
            isRotating = false;
            isPanning = false;
        });

        this.renderer.domElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        this.renderer.domElement.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomSpeed = 0.1;
            const delta = e.deltaY > 0 ? 1 + zoomSpeed : 1 - zoomSpeed;
            
            this.camera.position.x *= delta;
            this.camera.position.y *= delta;
            this.camera.position.z *= delta;
            
            this.camera.lookAt(0, 0, 0);
        });
    }

    /**
     * Animation loop
     */
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Rotate danger rings
        this.scene.children.forEach(child => {
            if (child instanceof THREE.Mesh && child.geometry instanceof THREE.TorusGeometry) {
                child.rotation.z += 0.01;
            }
        });

        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize debug view when page loads
document.addEventListener('DOMContentLoaded', () => {
    const debugView = new DebugView(gameGraph);
    debugView.init();
});
