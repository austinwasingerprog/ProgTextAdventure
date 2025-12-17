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
     * Calculate positions for nodes in the canvas
     */
    calculateNodePositions() {
        const rooms = this.graph.getAllRooms();
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = 250;

        // Arrange rooms in a circle for better visibility
        rooms.forEach((room, index) => {
            const angle = (index / rooms.length) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            this.nodePositions.set(room.id, { x, y, radius: 50 });
        });
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

        ctx.lineWidth = 3;
        ctx.font = '14px Arial';

        for (const edge of graphData.edges) {
            const fromPos = this.nodePositions.get(edge.from);
            const toPos = this.nodePositions.get(edge.to);

            if (!fromPos || !toPos) continue;

            // Calculate arrow positions
            const dx = toPos.x - fromPos.x;
            const dy = toPos.y - fromPos.y;
            const angle = Math.atan2(dy, dx);
            
            // Start and end points (offset by node radius)
            const startX = fromPos.x + Math.cos(angle) * fromPos.radius;
            const startY = fromPos.y + Math.sin(angle) * fromPos.radius;
            const endX = toPos.x - Math.cos(angle) * toPos.radius;
            const endY = toPos.y - Math.sin(angle) * toPos.radius;

            // Draw line
            ctx.strokeStyle = '#0066cc';
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();

            // Draw arrow head
            const arrowSize = 15;
            ctx.fillStyle = '#0066cc';
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

            // Draw label
            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;
            
            ctx.fillStyle = '#1e1e1e';
            ctx.fillRect(midX - 25, midY - 10, 50, 20);
            
            ctx.fillStyle = '#4fc3f7';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(edge.label, midX, midY);
        }
    }

    /**
     * Draw room nodes
     */
    drawNodes() {
        const ctx = this.ctx;
        const rooms = this.graph.getAllRooms();

        for (const room of rooms) {
            const pos = this.nodePositions.get(room.id);
            if (!pos) continue;

            const isStart = room.id === this.graph.startRoomId;
            const isHovered = this.hoveredNode === room.id;

            // Draw node circle
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, pos.radius, 0, Math.PI * 2);
            
            if (isStart) {
                ctx.fillStyle = '#ffd700'; // Gold for start room
            } else if (isHovered) {
                ctx.fillStyle = '#4fc3f7';
            } else {
                ctx.fillStyle = '#0066cc';
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

// Initialize debug view when page loads
document.addEventListener('DOMContentLoaded', () => {
    const debugView = new DebugView(gameGraph);
    debugView.init();
});
