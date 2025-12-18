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

    init() {
        this.setupScene();
        this.calculatePositions();
        this.createRoomNodes();
        this.createConnections();
        this.setupLighting();
        this.setupControls();
        this.animate();
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1e1e1e);

        this.camera = new THREE.PerspectiveCamera(
            75,
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(25, 20, 25);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.container.appendChild(this.renderer.domElement);

        window.addEventListener('resize', () => {
            if (document.getElementById('3dTab').classList.contains('hidden')) return;
            
            this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        });
    }

    calculatePositions() {
        const rooms = Array.from(this.graph.rooms.values());
        
        const spacing = 7;
        const verticalSpacing = 8;
        
        // Use shared layout calculator
        this.nodePositions = GraphLayoutCalculator.calculatePositions(this.graph, {
            horizontalSpacing: spacing,
            verticalSpacing: verticalSpacing,
            depthSpacing: spacing
        });

        for (const room of rooms) {
            if (!this.nodePositions.has(room.id)) {
                let x, y, z;
                
                if (room.id === 'roof') {
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
                } else if (room.id === 'boardroom') {
                    const hallPos = this.nodePositions.get('executive-hall');
                    if (hallPos) {
                        x = hallPos.x;
                        y = hallPos.y;
                        z = hallPos.z + spacing;
                    } else {
                        x = spacing * 2;
                        y = 0;
                        z = spacing * 2;
                    }
                } else if (room.id === 'research-lab') {
                    const labHallPos = this.nodePositions.get('lab-hall');
                    if (labHallPos) {
                        x = labHallPos.x + spacing;
                        y = labHallPos.y;
                        z = labHallPos.z;
                    } else {
                        x = spacing * 3;
                        y = 0;
                        z = spacing * 2;
                    }
                } else if (room.id === 'freedom') {
                    const roofPos = this.nodePositions.get('roof');
                    if (roofPos) {
                        x = roofPos.x + spacing * 1.5;
                        y = roofPos.y;
                        z = roofPos.z;
                    } else {
                        x = spacing * 4;
                        y = verticalSpacing;
                        z = 0;
                    }
                } else {
                    const unconnectedIndex = Array.from(this.nodePositions.keys()).length;
                    x = spacing * 6;
                    y = 0;
                    z = (unconnectedIndex % 5) * spacing * 2;
                    console.warn(`Unpositioned room: ${room.id} placed at (${x}, ${y}, ${z})`);
                }
                
                this.nodePositions.set(room.id, { x, y, z, room });
            }
        }

        console.log("=== 3D Room Positions ===");
        for (const [roomId, pos] of this.nodePositions.entries()) {
            console.log(`${roomId}: (${pos.x}, ${pos.y}, ${pos.z}) - Level: ${pos.y > 0 ? 'Upper' : pos.y < 0 ? 'Lower' : 'Ground'}`);
        }
    }

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

    createRoomNodes() {
        const startRoomId = this.graph.getStartRoom().id;

        for (const [roomId, pos] of this.nodePositions.entries()) {
            const room = pos.room;
            
            let color = 0x0066cc;
            if (pos.y > 0) {
                color = 0x9c27b0;
            } else if (pos.y < 0) {
                color = 0xf44336;
            }

            const geometry = new THREE.SphereGeometry(0.5, 32, 32);
            const material = new THREE.MeshPhongMaterial({ 
                color: color,
                emissive: color,
                emissiveIntensity: 0.2,
                shininess: 100
            });
            const sphere = new THREE.Mesh(geometry, material);
            sphere.position.set(pos.x, pos.y, pos.z);
            
            sphere.userData = { roomId, room };
            this.roomMeshes.set(roomId, sphere);
            this.scene.add(sphere);

            this.createLabel(room.id, pos.x, pos.y + 1, pos.z);

            if (roomId === startRoomId) {
                const starGeometry = new THREE.SphereGeometry(0.3, 5, 5);
                const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffd700 });
                const star = new THREE.Mesh(starGeometry, starMaterial);
                star.position.set(pos.x, pos.y + 1.2, pos.z);
                this.scene.add(star);
            }

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

    createConnections() {
        const processed = new Set();

        console.log("=== Creating 3D Connections ===");
        
        for (const [roomId, pos] of this.nodePositions.entries()) {
            const room = pos.room;

            for (const [direction, exit] of Object.entries(room.exits)) {
                const targetId = exit.destination;
                const connectionKey = [roomId, targetId].sort().join('-');
                if (processed.has(connectionKey)) continue;
                processed.add(connectionKey);

                const targetPos = this.nodePositions.get(targetId);
                if (!targetPos) {
                    console.warn(`Missing position for target room: ${targetId}`);
                    continue;
                }

                console.log(`Drawing: ${roomId} --${direction}--> ${targetId}`);

                const isVertical = direction === 'up' || direction === 'down';
                const color = isVertical ? 0xff9900 : 0x0066cc;

                const points = [];
                points.push(new THREE.Vector3(pos.x, pos.y, pos.z));
                points.push(new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z));

                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const material = new THREE.LineBasicMaterial({ 
                    color: color,
                    linewidth: 2,
                    opacity: 0.8,
                    transparent: true
                });
                const line = new THREE.Line(geometry, material);
                this.connectionLines.push(line);
                this.scene.add(line);

                const dir = new THREE.Vector3()
                    .subVectors(
                        new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z),
                        new THREE.Vector3(pos.x, pos.y, pos.z)
                    )
                    .normalize();
                
                const distance = Math.sqrt(
                    Math.pow(targetPos.x - pos.x, 2) +
                    Math.pow(targetPos.y - pos.y, 2) +
                    Math.pow(targetPos.z - pos.z, 2)
                );
                
                const arrowHelper = new THREE.ArrowHelper(
                    dir,
                    new THREE.Vector3(pos.x, pos.y, pos.z),
                    distance,
                    color,
                    0.5,
                    0.3
                );
                this.scene.add(arrowHelper);
            }
        }
        
        this.addConditionalConnections();
    }

    addConditionalConnections() {
        const conditionalPairs = [
            ['lobby', 'roof'],
            ['claims', 'basement'],
            ['executive-hall', 'boardroom'],
            ['lab-hall', 'research-lab']
        ];

        for (const [roomId, targetId] of conditionalPairs) {
            const pos = this.nodePositions.get(roomId);
            const targetPos = this.nodePositions.get(targetId);

            if (!pos || !targetPos) continue;

            const points = [];
            points.push(new THREE.Vector3(pos.x, pos.y, pos.z));
            points.push(new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z));

            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            
            const isVertical = Math.abs(pos.y - targetPos.y) > 0.1;
            const color = isVertical ? 0xff9900 : 0xffff00;
            
            const material = new THREE.LineDashedMaterial({ 
                color: color,
                linewidth: 1,
                dashSize: 0.5,
                gapSize: 0.3,
                opacity: 0.5,
                transparent: true
            });
            
            const line = new THREE.Line(geometry, material);
            line.computeLineDistances();
            this.connectionLines.push(line);
            this.scene.add(line);
        }
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const light1 = new THREE.DirectionalLight(0xffffff, 0.5);
        light1.position.set(10, 10, 10);
        this.scene.add(light1);

        const light2 = new THREE.DirectionalLight(0xffffff, 0.3);
        light2.position.set(-10, -10, -10);
        this.scene.add(light2);

        const gridHelper = new THREE.GridHelper(80, 80, 0x444444, 0x222222);
        this.scene.add(gridHelper);

        const axesHelper = new THREE.AxesHelper(15);
        this.scene.add(axesHelper);
        
        this.addCompass();
    }
    
    addCompass() {
        const compassGroup = new THREE.Group();
        
        const arrowLength = 3;
        const arrowHeadLength = 0.6;
        const arrowHeadWidth = 0.4;
        
        const northArrow = new THREE.ArrowHelper(
            new THREE.Vector3(0, 0, 1),
            new THREE.Vector3(0, 0, 0),
            arrowLength,
            0xff4444,
            arrowHeadLength,
            arrowHeadWidth
        );
        compassGroup.add(northArrow);
        
        const southArrow = new THREE.ArrowHelper(
            new THREE.Vector3(0, 0, -1),
            new THREE.Vector3(0, 0, 0),
            arrowLength * 0.5,
            0x666666,
            arrowHeadLength * 0.5,
            arrowHeadWidth * 0.5
        );
        compassGroup.add(southArrow);
        
        const eastArrow = new THREE.ArrowHelper(
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(0, 0, 0),
            arrowLength,
            0x4444ff,
            arrowHeadLength,
            arrowHeadWidth
        );
        compassGroup.add(eastArrow);
        
        const westArrow = new THREE.ArrowHelper(
            new THREE.Vector3(-1, 0, 0),
            new THREE.Vector3(0, 0, 0),
            arrowLength * 0.5,
            0x666666,
            arrowHeadLength * 0.5,
            arrowHeadWidth * 0.5
        );
        compassGroup.add(westArrow);
        
        compassGroup.position.set(-30, 0.5, -30);
        
        this.scene.add(compassGroup);
        
        this.addCompassLabel('N', -30, 1, -30 + arrowLength + 0.5, 0xff4444);
        this.addCompassLabel('E', -30 + arrowLength + 0.5, 1, -30, 0x4444ff);
    }
    
    addCompassLabel(text, x, y, z, color) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 128;
        canvas.height = 128;
        
        context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
        context.font = 'bold 80px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, 64, 64);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        sprite.position.set(x, y, z);
        sprite.scale.set(1.5, 1.5, 1);
        
        this.scene.add(sprite);
    }

    setupControls() {
        this.target = new THREE.Vector3(0, 0, 0);
        let isRotating = false;
        let isPanning = false;
        let previousMousePosition = { x: 0, y: 0 };

        this.renderer.domElement.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                if (e.shiftKey) {
                    isPanning = true;
                } else {
                    isRotating = true;
                }
            } else if (e.button === 2) {
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
                
                const offset = new THREE.Vector3().subVectors(this.camera.position, this.target);
                const radius = offset.length();
                
                const theta = Math.atan2(offset.x, offset.z);
                const phi = Math.acos(offset.y / radius);

                const newTheta = theta - deltaX * rotationSpeed;
                const newPhi = Math.max(0.1, Math.min(Math.PI - 0.1, phi - deltaY * rotationSpeed));

                offset.x = radius * Math.sin(newPhi) * Math.sin(newTheta);
                offset.y = radius * Math.cos(newPhi);
                offset.z = radius * Math.sin(newPhi) * Math.cos(newTheta);
                
                this.camera.position.copy(this.target).add(offset);
                this.camera.lookAt(this.target);
            } else if (isPanning) {
                const deltaX = e.clientX - previousMousePosition.x;
                const deltaY = e.clientY - previousMousePosition.y;

                const panSpeed = 0.03;
                
                const forward = new THREE.Vector3();
                const right = new THREE.Vector3();
                const up = new THREE.Vector3();
                
                this.camera.getWorldDirection(forward);
                
                right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
                
                up.crossVectors(right, forward).normalize();
                
                const panX = right.clone().multiplyScalar(-deltaX * panSpeed);
                const panY = up.clone().multiplyScalar(deltaY * panSpeed);
                
                this.camera.position.add(panX).add(panY);
                this.target.add(panX).add(panY);
                
                this.camera.lookAt(this.target);
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
            
            const offset = new THREE.Vector3().subVectors(this.camera.position, this.target);
            offset.multiplyScalar(delta);
            this.camera.position.copy(this.target).add(offset);
            
            this.camera.lookAt(this.target);
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.scene.children.forEach(child => {
            if (child instanceof THREE.Mesh && child.geometry instanceof THREE.TorusGeometry) {
                child.rotation.z += 0.01;
            }
        });

        this.renderer.render(this.scene, this.camera);
    }
}
