class DebugView2D {
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
        this.hoveredStairs = null;
        this.currentFloor = 0;
        this.floors = new Map();
        this.nodePositions = new Map();
        
        this.floorSelectorConfig = {
            x: 0,
            y: 20,
            buttonWidth: 60,
            buttonHeight: 50,
            buttonSpacing: 10,
            padding: 20
        };
        
        this.resizeCanvas();
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth || 1200;
        this.canvas.height = 800;
        
        this.floorSelectorConfig.x = this.canvas.width - this.floorSelectorConfig.buttonWidth - this.floorSelectorConfig.padding;
    }

    init() {
        this.setupEventListeners();
        this.calculateFloors();
        this.renderCanvas();
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        this.canvas.addEventListener('click', (e) => this.handleClick(e));

        window.addEventListener('resize', () => {
            if (!document.getElementById('canvasTab').classList.contains('hidden')) {
                this.resizeCanvas();
                this.renderCanvas();
            }
        });
    }

    calculateFloors() {
        const gridSize = 200;
        const rooms = this.graph.getAllRooms();
        
        // Use shared layout calculator
        const positions = GraphLayoutCalculator.calculatePositions(this.graph, {
            horizontalSpacing: 1,
            verticalSpacing: 1
        });

        // Calculate floor assignments
        const { roomFloors, floorRooms } = GraphLayoutCalculator.calculateFloors(this.graph, positions);

        rooms.forEach(room => {
            if (!roomFloors.has(room.id)) {
                let floor = 0;
                let gridX = 0;
                let gridY = 0;
                
                if (room.id === 'roof') {
                    floor = 1;
                    const lobbyData = roomFloors.get('lobby');
                    if (lobbyData) {
                        gridX = lobbyData.gridX;
                        gridY = lobbyData.gridY;
                    }
                } else if (room.id === 'basement') {
                    floor = -1;
                    const claimsData = roomFloors.get('claims');
                    if (claimsData) {
                        gridX = claimsData.gridX;
                        gridY = claimsData.gridY;
                    }
                } else if (room.id === 'boardroom') {
                    const hallData = roomFloors.get('executive-hall');
                    if (hallData) {
                        floor = hallData.floor;
                        gridX = hallData.gridX;
                        gridY = hallData.gridY - 1;
                    }
                } else if (room.id === 'research-lab') {
                    const labHallData = roomFloors.get('lab-hall');
                    if (labHallData) {
                        floor = labHallData.floor;
                        gridX = labHallData.gridX + 1;
                        gridY = labHallData.gridY;
                    }
                } else if (room.id === 'freedom') {
                    floor = 1;
                    const roofData = roomFloors.get('roof');
                    if (roofData) {
                        gridX = roofData.gridX + 2;
                        gridY = roofData.gridY;
                    }
                }
                
                roomFloors.set(room.id, { floor, gridX, gridY });
                
                if (!floorRooms.has(floor)) {
                    floorRooms.set(floor, []);
                }
                floorRooms.get(floor).push(room.id);
            }
        });

        for (const [floor, roomIds] of floorRooms.entries()) {
            const positions = new Map();
            
            let minX = Infinity, maxX = -Infinity;
            let minY = Infinity, maxY = -Infinity;
            
            for (const roomId of roomIds) {
                const data = roomFloors.get(roomId);
                minX = Math.min(minX, data.gridX);
                maxX = Math.max(maxX, data.gridX);
                minY = Math.min(minY, data.gridY);
                maxY = Math.max(maxY, data.gridY);
            }
            
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;
            const offsetX = -(minX + maxX) / 2;
            const offsetY = -(minY + maxY) / 2;
            
            for (const roomId of roomIds) {
                const data = roomFloors.get(roomId);
                const room = this.graph.getRoom(roomId);
                
                positions.set(roomId, {
                    x: centerX + (data.gridX + offsetX) * gridSize,
                    y: centerY + (data.gridY + offsetY) * gridSize,
                    room: room
                });
            }
            
            this.floors.set(floor, positions);
        }

        this.roomFloors = roomFloors;
    }

    renderCanvas() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        ctx.clearRect(0, 0, width, height);
        ctx.save();
        ctx.translate(this.offsetX, this.offsetY);
        ctx.scale(this.scale, this.scale);

        this.drawConnections();
        this.drawNodes();

        ctx.restore();
        
        this.drawFloorSelector();
        this.drawFloorLabel();
    }

    drawConnections() {
        const ctx = this.ctx;
        const currentFloorPositions = this.floors.get(this.currentFloor);
        if (!currentFloorPositions) return;

        const drawnConnections = new Set();
        ctx.lineWidth = 3;

        for (const [roomId, pos] of currentFloorPositions.entries()) {
            const room = pos.room;

            for (const [direction, exit] of Object.entries(room.exits)) {
                if (direction === 'up' || direction === 'down') continue;

                const targetId = exit.destination;
                const targetPos = currentFloorPositions.get(targetId);
                if (!targetPos) continue;

                const connectionKey = [roomId, targetId].sort().join('|');
                if (drawnConnections.has(connectionKey)) continue;
                drawnConnections.add(connectionKey);

                const dx = targetPos.x - pos.x;
                const dy = targetPos.y - pos.y;
                const angle = Math.atan2(dy, dx);
                
                const nodeRadius = 50;
                const startX = pos.x + Math.cos(angle) * nodeRadius;
                const startY = pos.y + Math.sin(angle) * nodeRadius;
                const endX = targetPos.x - Math.cos(angle) * nodeRadius;
                const endY = targetPos.y - Math.sin(angle) * nodeRadius;

                ctx.strokeStyle = '#0066cc';
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                ctx.stroke();

                const arrowSize = 12;
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
            }
        }
        
        this.drawConditionalConnections();
    }

    drawConditionalConnections() {
        const ctx = this.ctx;
        const currentFloorPositions = this.floors.get(this.currentFloor);
        if (!currentFloorPositions) return;

        const conditionalPairs = [
            { from: 'lobby', to: 'roof', label: 'up' },
            { from: 'claims', to: 'basement', label: 'down' },
            { from: 'executive-hall', to: 'boardroom', label: 'north' },
            { from: 'lab-hall', to: 'research-lab', label: 'east' }
        ];

        for (const { from, to, label } of conditionalPairs) {
            const fromFloor = this.roomFloors.get(from)?.floor;
            const toFloor = this.roomFloors.get(to)?.floor;
            
            if (fromFloor === this.currentFloor || toFloor === this.currentFloor) {
                const startPos = currentFloorPositions.get(from) || this.floors.get(fromFloor)?.get(from);
                const endPos = currentFloorPositions.get(to) || this.floors.get(toFloor)?.get(to);

                if (!startPos || !endPos) continue;
                
                if (fromFloor !== toFloor) continue;

                ctx.setLineDash([10, 5]);
                ctx.strokeStyle = '#ffff00';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(startPos.x, startPos.y);
                ctx.lineTo(endPos.x, endPos.y);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }
    }

    getStairsBounds(x, y, nodeRadius, isUp) {
        const size = 20;
        const offset = 35;
        
        if (isUp) {
            return {
                x: x + offset - size / 2,
                y: y - offset - size / 2,
                width: size,
                height: size
            };
        } else {
            return {
                x: x - offset - size / 2,
                y: y + offset - size / 2,
                width: size,
                height: size
            };
        }
    }

    drawNodes() {
        const ctx = this.ctx;
        const currentFloorPositions = this.floors.get(this.currentFloor);
        if (!currentFloorPositions) return;

        const nodeRadius = 50;
        const startRoomId = this.graph.getStartRoom().id;

        for (const [roomId, pos] of currentFloorPositions.entries()) {
            const room = pos.room;
            const isStart = roomId === startRoomId;
            const isHovered = this.hoveredNode === roomId;

            ctx.beginPath();
            ctx.arc(pos.x, pos.y, nodeRadius, 0, Math.PI * 2);
            
            if (isStart) {
                ctx.fillStyle = '#ffd700';
            } else if (isHovered) {
                ctx.fillStyle = '#4fc3f7';
            } else {
                ctx.fillStyle = '#0066cc';
            }
            ctx.fill();
            
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.stroke();

            const hasUpExit = room.exits['up'] !== undefined;
            const hasDownExit = room.exits['down'] !== undefined;
            
            if (hasUpExit) {
                const bounds = this.getStairsBounds(pos.x, pos.y, nodeRadius, true);
                const isHoveredStairs = this.hoveredStairs === `${roomId}-up`;
                
                ctx.fillStyle = isHoveredStairs ? '#555555' : '#333333';
                ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
                
                ctx.strokeStyle = isHoveredStairs ? '#ffbb00' : '#ff9900';
                ctx.lineWidth = isHoveredStairs ? 3 : 2;
                ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
                
                ctx.fillStyle = isHoveredStairs ? '#ffbb00' : '#ff9900';
                ctx.beginPath();
                ctx.moveTo(bounds.x + bounds.width / 2, bounds.y + 4);
                ctx.lineTo(bounds.x + 4, bounds.y + bounds.height - 4);
                ctx.lineTo(bounds.x + bounds.width - 4, bounds.y + bounds.height - 4);
                ctx.closePath();
                ctx.fill();
            }
            
            if (hasDownExit) {
                const bounds = this.getStairsBounds(pos.x, pos.y, nodeRadius, false);
                const isHoveredStairs = this.hoveredStairs === `${roomId}-down`;
                
                ctx.fillStyle = isHoveredStairs ? '#555555' : '#333333';
                ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
                
                ctx.strokeStyle = isHoveredStairs ? '#ffbb00' : '#ff9900';
                ctx.lineWidth = isHoveredStairs ? 3 : 2;
                ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
                
                ctx.fillStyle = isHoveredStairs ? '#ffbb00' : '#ff9900';
                ctx.beginPath();
                ctx.moveTo(bounds.x + bounds.width / 2, bounds.y + bounds.height - 4);
                ctx.lineTo(bounds.x + 4, bounds.y + 4);
                ctx.lineTo(bounds.x + bounds.width - 4, bounds.y + 4);
                ctx.closePath();
                ctx.fill();
            }

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(room.id, pos.x, pos.y - 8);

            ctx.font = '11px Arial';
            const exitCount = room.getAvailableDirections().length;
            ctx.fillText(`${exitCount} exit${exitCount !== 1 ? 's' : ''}`, pos.x, pos.y + 10);

            if (isHovered) {
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 14px Arial';
                ctx.fillText(room.title, pos.x, pos.y + nodeRadius + 25);
            }

            if (isStart) {
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 24px Arial';
                ctx.fillText('★', pos.x, pos.y - nodeRadius - 30);
            }
        }
    }

    getFloorButtonBounds(floorIndex) {
        const cfg = this.floorSelectorConfig;
        return {
            x: cfg.x,
            y: cfg.y + floorIndex * (cfg.buttonHeight + cfg.buttonSpacing),
            width: cfg.buttonWidth,
            height: cfg.buttonHeight
        };
    }

    drawFloorSelector() {
        const ctx = this.ctx;
        const floors = Array.from(this.floors.keys()).sort((a, b) => b - a);
        const cfg = this.floorSelectorConfig;
        
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        floors.forEach((floor, index) => {
            const bounds = this.getFloorButtonBounds(index);
            const isActive = floor === this.currentFloor;
            
            ctx.fillStyle = isActive ? '#0066cc' : '#333333';
            ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
            
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            let label = 'Ground';
            if (floor > 0) label = `Floor ${floor}`;
            if (floor < 0) label = `B${Math.abs(floor)}`;
            
            ctx.fillText(label, bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
        });
        
        ctx.restore();
    }

    drawFloorLabel() {
        const ctx = this.ctx;
        
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        let floorName = 'Ground Floor';
        if (this.currentFloor > 0) floorName = `Floor ${this.currentFloor}`;
        if (this.currentFloor < 0) floorName = `Basement ${Math.abs(this.currentFloor)}`;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(20, 20, 200, 50);
        
        ctx.strokeStyle = '#0066cc';
        ctx.lineWidth = 2;
        ctx.strokeRect(20, 20, 200, 50);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(floorName, 30, 45);
        
        ctx.restore();
    }

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const mouseY = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        
        const floors = Array.from(this.floors.keys()).sort((a, b) => b - a);
        
        let clickedFloor = null;
        
        floors.forEach((floor, index) => {
            const bounds = this.getFloorButtonBounds(index);
            
            if (mouseX >= bounds.x && mouseX <= bounds.x + bounds.width &&
                mouseY >= bounds.y && mouseY <= bounds.y + bounds.height) {
                clickedFloor = floor;
            }
        });
        
        if (clickedFloor !== null) {
            this.currentFloor = clickedFloor;
            this.renderCanvas();
            return;
        }
        
        const transformedX = (mouseX - this.offsetX) / this.scale;
        const transformedY = (mouseY - this.offsetY) / this.scale;
        
        const currentFloorPositions = this.floors.get(this.currentFloor);
        if (currentFloorPositions) {
            const nodeRadius = 50;
            
            for (const [roomId, pos] of currentFloorPositions.entries()) {
                const room = pos.room;
                
                if (room.exits['up']) {
                    const bounds = this.getStairsBounds(pos.x, pos.y, nodeRadius, true);
                    if (transformedX >= bounds.x && transformedX <= bounds.x + bounds.width &&
                        transformedY >= bounds.y && transformedY <= bounds.y + bounds.height) {
                        const targetRoomId = room.exits['up'].destination;
                        const targetFloor = this.roomFloors.get(targetRoomId)?.floor;
                        if (targetFloor !== undefined) {
                            this.currentFloor = targetFloor;
                            this.renderCanvas();
                            return;
                        }
                    }
                }
                
                if (room.exits['down']) {
                    const bounds = this.getStairsBounds(pos.x, pos.y, nodeRadius, false);
                    if (transformedX >= bounds.x && transformedX <= bounds.x + bounds.width &&
                        transformedY >= bounds.y && transformedY <= bounds.y + bounds.height) {
                        const targetRoomId = room.exits['down'].destination;
                        const targetFloor = this.roomFloors.get(targetRoomId)?.floor;
                        if (targetFloor !== undefined) {
                            this.currentFloor = targetFloor;
                            this.renderCanvas();
                            return;
                        }
                    }
                }
            }
        }
        
        this.isDragging = true;
        this.dragStartX = mouseX - this.offsetX;
        this.dragStartY = mouseY - this.offsetY;
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const mouseY = (e.clientY - rect.top) * (this.canvas.height / rect.height);

        if (this.isDragging) {
            this.offsetX = mouseX - this.dragStartX;
            this.offsetY = mouseY - this.dragStartY;
            this.renderCanvas();
        } else {
            this.checkHover(mouseX, mouseY);
        }
    }

    handleMouseUp(e) {
        this.isDragging = false;
    }

    handleWheel(e) {
        e.preventDefault();
        
        const zoomSpeed = 0.1;
        const delta = e.deltaY > 0 ? -zoomSpeed : zoomSpeed;
        
        this.scale = Math.max(0.5, Math.min(2, this.scale + delta));
        this.renderCanvas();
    }

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const mouseY = (e.clientY - rect.top) * (this.canvas.height / rect.height);
        
        const floors = Array.from(this.floors.keys()).sort((a, b) => b - a);
        
        floors.forEach((floor, index) => {
            const bounds = this.getFloorButtonBounds(index);
            
            if (mouseX >= bounds.x && mouseX <= bounds.x + bounds.width &&
                mouseY >= bounds.y && mouseY <= bounds.y + bounds.height) {
                this.currentFloor = floor;
                this.renderCanvas();
            }
        });
    }

    checkHover(mouseX, mouseY) {
        const transformedX = (mouseX - this.offsetX) / this.scale;
        const transformedY = (mouseY - this.offsetY) / this.scale;

        let foundHover = false;
        let foundStairsHover = false;
        const currentFloorPositions = this.floors.get(this.currentFloor);
        const nodeRadius = 50;
        
        if (currentFloorPositions) {
            for (const [roomId, pos] of currentFloorPositions.entries()) {
                const room = pos.room;
                
                if (room.exits['up']) {
                    const bounds = this.getStairsBounds(pos.x, pos.y, nodeRadius, true);
                    if (transformedX >= bounds.x && transformedX <= bounds.x + bounds.width &&
                        transformedY >= bounds.y && transformedY <= bounds.y + bounds.height) {
                        if (this.hoveredStairs !== `${roomId}-up`) {
                            this.hoveredStairs = `${roomId}-up`;
                            this.renderCanvas();
                        }
                        foundStairsHover = true;
                        break;
                    }
                }
                
                if (room.exits['down']) {
                    const bounds = this.getStairsBounds(pos.x, pos.y, nodeRadius, false);
                    if (transformedX >= bounds.x && transformedX <= bounds.x + bounds.width &&
                        transformedY >= bounds.y && transformedY <= bounds.y + bounds.height) {
                        if (this.hoveredStairs !== `${roomId}-down`) {
                            this.hoveredStairs = `${roomId}-down`;
                            this.renderCanvas();
                        }
                        foundStairsHover = true;
                        break;
                    }
                }
            }
            
            if (!foundStairsHover) {
                for (const [roomId, pos] of currentFloorPositions.entries()) {
                    const dx = transformedX - pos.x;
                    const dy = transformedY - pos.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance <= 50) {
                        if (this.hoveredNode !== roomId) {
                            this.hoveredNode = roomId;
                            this.renderCanvas();
                        }
                        foundHover = true;
                        break;
                    }
                }
            }
        }

        if (!foundStairsHover && this.hoveredStairs !== null) {
            this.hoveredStairs = null;
            this.renderCanvas();
        }

        if (!foundHover && this.hoveredNode !== null) {
            this.hoveredNode = null;
            this.renderCanvas();
        }
    }
}
