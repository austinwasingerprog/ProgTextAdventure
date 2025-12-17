/**
 * Main Game Engine
 * Handles game loop, user input, and UI updates
 */

class Game {
    constructor(graph) {
        this.graph = graph;
        this.currentRoom = graph.getStartRoom();
        this.outputElement = document.getElementById('output');
        this.inputElement = document.getElementById('commandInput');
        this.commandHistory = [];
        this.historyIndex = -1;
    }

    /**
     * Initialize the game and set up event listeners
     */
    init() {
        this.setupEventListeners();
        this.displayWelcome();
        this.displayRoom(this.currentRoom);
    }

    /**
     * Set up event listeners for user input
     */
    setupEventListeners() {
        // Handle command input
        this.inputElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const command = this.inputElement.value.trim();
                if (command) {
                    this.processCommand(command);
                    this.commandHistory.push(command);
                    this.historyIndex = this.commandHistory.length;
                    this.inputElement.value = '';
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (this.historyIndex > 0) {
                    this.historyIndex--;
                    this.inputElement.value = this.commandHistory[this.historyIndex];
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (this.historyIndex < this.commandHistory.length - 1) {
                    this.historyIndex++;
                    this.inputElement.value = this.commandHistory[this.historyIndex];
                } else {
                    this.historyIndex = this.commandHistory.length;
                    this.inputElement.value = '';
                }
            }
        });

        // Handle debug button
        document.getElementById('debugBtn').addEventListener('click', () => {
            window.open('debug.html', '_blank');
        });
    }

    /**
     * Display the welcome message
     */
    displayWelcome() {
        this.addOutput(
            "=".repeat(70),
            "normal"
        );
        this.addOutput(
            "🏢 Welcome to Flo's Adventure! 🏢",
            "room-title"
        );
        this.addOutput(
            "A Progressive Insurance Text Adventure",
            "normal"
        );
        this.addOutput(
            "=".repeat(70),
            "normal"
        );
        this.addOutput("");
        this.addOutput(
            "You've been invited for a special behind-the-scenes tour of Progressive " +
            "Insurance headquarters! Explore the building, meet the team, and discover " +
            "what makes Progressive special.",
            "normal"
        );
        this.addOutput("");
        this.addOutput(
            "Commands: north, south, east, west, look, help, stats",
            "exits"
        );
        this.addOutput("");
    }

    /**
     * Display information about the current room
     */
    displayRoom(room) {
        if (!room) return;
        
        this.addOutput("");
        this.addOutput(room.title, "room-title");
        this.addOutput(room.description, "room-description");
        this.addOutput("");
        this.addOutput(room.getExitsString(), "exits");
    }

    /**
     * Process a user command
     */
    processCommand(command) {
        const cmd = command.toLowerCase().trim();
        
        // Echo the command
        this.addOutput(`> ${command}`, "normal");

        // Movement commands
        const directions = ['north', 'south', 'east', 'west', 'n', 's', 'e', 'w'];
        let direction = cmd;
        
        // Handle abbreviated directions
        const directionMap = {
            'n': 'north',
            's': 'south',
            'e': 'east',
            'w': 'west'
        };
        
        if (directionMap[cmd]) {
            direction = directionMap[cmd];
        }

        if (directions.includes(cmd)) {
            this.movePlayer(direction);
            return;
        }

        // Special commands
        switch (cmd) {
            case 'look':
            case 'l':
                this.displayRoom(this.currentRoom);
                break;

            case 'help':
            case 'h':
            case '?':
                this.displayHelp();
                break;

            case 'stats':
            case 'statistics':
                this.displayStats();
                break;

            case 'map':
                this.addOutput("Use the debug view to see the map (click the debug button below).", "normal");
                break;

            case 'exits':
                this.addOutput(this.currentRoom.getExitsString(), "exits");
                break;

            case 'where':
            case 'location':
                this.addOutput(`You are in: ${this.currentRoom.title} [${this.currentRoom.id}]`, "normal");
                break;

            default:
                this.addOutput(
                    `I don't understand "${command}". Type 'help' for a list of commands.`,
                    "error"
                );
        }
    }

    /**
     * Move the player in a direction
     */
    movePlayer(direction) {
        const nextRoom = this.graph.navigate(this.currentRoom.id, direction);
        
        if (nextRoom) {
            this.addOutput(`You head ${direction}...`, "normal");
            this.currentRoom = nextRoom;
            this.displayRoom(nextRoom);
        } else {
            this.addOutput(
                `You can't go ${direction} from here.`,
                "error"
            );
        }
    }

    /**
     * Display help information
     */
    displayHelp() {
        this.addOutput("");
        this.addOutput("📋 Available Commands:", "room-title");
        this.addOutput("");
        this.addOutput("Movement:", "normal");
        this.addOutput("  north, south, east, west (or n, s, e, w) - Move in a direction", "normal");
        this.addOutput("");
        this.addOutput("Information:", "normal");
        this.addOutput("  look (l)      - Look around the current room", "normal");
        this.addOutput("  exits         - Show available exits", "normal");
        this.addOutput("  where         - Show current location", "normal");
        this.addOutput("  stats         - Show game statistics", "normal");
        this.addOutput("  help (h, ?)   - Show this help message", "normal");
        this.addOutput("");
        this.addOutput("Debug:", "normal");
        this.addOutput("  Click the debug button to see the room graph visualization", "normal");
        this.addOutput("");
    }

    /**
     * Display game statistics
     */
    displayStats() {
        const stats = this.graph.getStats();
        this.addOutput("");
        this.addOutput("📊 Game Statistics:", "room-title");
        this.addOutput("");
        this.addOutput(`Total Rooms: ${stats.roomCount}`, "normal");
        this.addOutput(`Total Connections: ${stats.totalExits}`, "normal");
        this.addOutput(`Average Exits per Room: ${stats.averageExits}`, "normal");
        this.addOutput(`Current Location: ${this.currentRoom.title} [${this.currentRoom.id}]`, "normal");
        this.addOutput("");
    }

    /**
     * Add text to the output area
     */
    addOutput(text, className = "normal") {
        const line = document.createElement('div');
        line.className = `output-line ${className}`;
        line.textContent = text;
        this.outputElement.appendChild(line);
        
        // Scroll to bottom
        this.outputElement.scrollTop = this.outputElement.scrollHeight;
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game(gameGraph);
    game.init();
});
