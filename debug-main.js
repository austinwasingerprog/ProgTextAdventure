class DebugView {
    constructor(graph) {
        this.graph = graph;
        this.debugView2D = null;
        this.debugView3D = null;
    }

    init() {
        this.setupEventListeners();
        this.renderASCIIView();
        this.renderRoomList();
    }

    setupEventListeners() {
        document.getElementById('backBtn').addEventListener('click', () => {
            window.close();
        });

        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            }
        });

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });

        if (tabName === 'ascii') {
            document.getElementById('asciiTab').classList.remove('hidden');
        } else if (tabName === 'canvas') {
            document.getElementById('canvasTab').classList.remove('hidden');
            if (!this.debugView2D) {
                this.debugView2D = new DebugView2D(this.graph);
                this.debugView2D.init();
            } else {
                this.debugView2D.resizeCanvas();
                this.debugView2D.renderCanvas();
            }
        } else if (tabName === '3d') {
            document.getElementById('3dTab').classList.remove('hidden');
            if (!this.debugView3D) {
                this.debugView3D = new DebugView3D(this.graph);
                this.debugView3D.init();
            }
        }
    }

    renderASCIIView() {
        const asciiMap = this.graph.generateASCIIMap();
        document.getElementById('asciiMap').textContent = asciiMap;
    }

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
}

document.addEventListener('DOMContentLoaded', () => {
    const debugView = new DebugView(gameGraph);
    debugView.init();
});
