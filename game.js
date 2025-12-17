/**
 * Main Game Engine - Enhanced with Survival Mechanics
 * Handles game loop, user input, UI updates, and survival systems
 */

class Game {
    constructor(graph) {
        this.graph = graph;
        this.currentRoom = graph.getStartRoom();
        this.outputElement = document.getElementById('output');
        this.inputElement = document.getElementById('commandInput');
        this.commandHistory = [];
        this.historyIndex = -1;
        
        // Player stats
        this.health = 100;
        this.maxHealth = 100;
        this.energy = 100;
        this.maxEnergy = 100;
        this.inventory = [];
        this.maxInventorySize = 10;
        
        // Game state
        this.turns = 0;
        this.isDead = false;
    }

    /**
     * Initialize the game and set up event listeners
     */
    init() {
        this.setupEventListeners();
        this.displayWelcome();
        this.displayRoom(this.currentRoom);
        this.updateStats();
        this.startHealthTick();
    }

    /**
     * Set up event listeners for user input
     */
    setupEventListeners() {
        // Handle command input
        this.inputElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const command = this.inputElement.value.trim();
                if (command && !this.isDead) {
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
     * Start the health tick timer for dangerous rooms
     */
    startHealthTick() {
        setInterval(() => {
            if (!this.isDead && this.currentRoom.isDangerous) {
                this.modifyHealth(-5);
                if (this.health > 0) {
                    this.addOutput(`⚠️ ${this.currentRoom.dangerMessage}`, "danger");
                }
            }
            if (!this.isDead && this.energy < this.maxEnergy) {
                this.energy = Math.min(this.maxEnergy, this.energy + 1);
                this.updateStats();
            }
        }, 3000);
    }

    /**
     * Display the welcome message
     */
    displayWelcome() {
        this.addOutput("═".repeat(70), "normal");
        this.addOutput("� PROGRESSIVE INSURANCE: NIGHT SHIFT �", "room-title");
        this.addOutput("A Dark Survival Text Adventure", "normal");
        this.addOutput("═".repeat(70), "normal");
        this.addOutput("");
        this.addOutput(
            "It's 2 AM. The Progressive headquarters is eerily quiet. You're a night shift " +
            "security guard making your rounds when the power suddenly cuts out. Strange noises " +
            "echo through the halls. You need to survive the night and escape...",
            "normal"
        );
        this.addOutput("");
        this.addOutput("💡 New Commands: take [item], drop [item], inventory, use [item], examine [item]", "exits");
        this.addOutput("📊 Watch your health and energy bars at the top!", "exits");
        this.addOutput("");
    }

    /**
     * Display information about the current room
     */
    displayRoom(room) {
        if (!room) return;
        
        this.turns++;
        room.visited = true;
        
        this.addOutput("");
        this.addOutput(`📍 ${room.title}`, "room-title");
        this.addOutput(room.description, "room-description");
        
        if (room.items.length > 0) {
            this.addOutput(room.getItemsString(), "item-list");
        }
        
        this.addOutput("");
        this.addOutput(room.getExitsString(), "exits");
        
        // Drain energy from moving
        this.modifyEnergy(-2);
    }

    /**
     * Process a user command
     */
    processCommand(command) {
        const cmd = command.toLowerCase().trim();
        const parts = cmd.split(' ');
        const action = parts[0];
        const target = parts.slice(1).join(' ');
        
        this.addOutput(`> ${command}`, "command");

        // Movement
        const directionMap = { 'n': 'north', 's': 'south', 'e': 'east', 'w': 'west' };
        const direction = directionMap[action] || action;
        
        if (['north', 'south', 'east', 'west', 'up', 'down'].includes(direction)) {
            this.movePlayer(direction);
            return;
        }

        // Inventory commands
        if (action === 'take' || action === 'get' || action === 'pickup') {
            this.takeItem(target);
            return;
        }

        if (action === 'drop') {
            this.dropItem(target);
            return;
        }

        if (action === 'use') {
            this.useItem(target);
            return;
        }

        if (action === 'examine' || action === 'inspect' || action === 'x') {
            this.examineItem(target);
            return;
        }

        if (action === 'inventory' || action === 'inv' || action === 'i') {
            this.showInventory();
            return;
        }

        // Standard commands
        switch (action) {
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
            case 'status':
                this.displayDetailedStats();
                break;

            case 'exits':
                this.addOutput(this.currentRoom.getExitsString(), "exits");
                break;

            default:
                this.addOutput(
                    `I don't understand "${command}". Type 'help' for commands.`,
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
            this.addOutput(`You can't go ${direction} from here.`, "error");
        }
    }

    /**
     * Take an item from the current room
     */
    takeItem(itemId) {
        if (!itemId) {
            this.addOutput("Take what?", "error");
            return;
        }

        if (this.inventory.length >= this.maxInventorySize) {
            this.addOutput("Your inventory is full!", "error");
            return;
        }

        const item = this.currentRoom.removeItem(itemId);
        if (item) {
            this.inventory.push(item);
            this.addOutput(`✅ You take the ${item.name}.`, "success");
            this.modifyEnergy(-1);
            this.updateStats();
        } else {
            this.addOutput(`There is no "${itemId}" here.`, "error");
        }
    }

    /**
     * Drop an item in the current room
     */
    dropItem(itemId) {
        if (!itemId) {
            this.addOutput("Drop what?", "error");
            return;
        }

        const index = this.inventory.findIndex(item => item.id === itemId);
        if (index !== -1) {
            const item = this.inventory.splice(index, 1)[0];
            this.currentRoom.addItem(item);
            this.addOutput(`You drop the ${item.name}.`, "normal");
            this.updateStats();
        } else {
            this.addOutput(`You don't have "${itemId}".`, "error");
        }
    }

    /**
     * Use an item from inventory
     */
    useItem(itemId) {
        if (!itemId) {
            this.addOutput("Use what?", "error");
            return;
        }

        const item = this.inventory.find(item => item.id === itemId);
        if (!item) {
            this.addOutput(`You don't have "${itemId}".`, "error");
            return;
        }

        if (!item.canUse) {
            this.addOutput(`You can't use the ${item.name} right now.`, "error");
            return;
        }

        if (item.useEffect) {
            item.useEffect(this);
            this.updateStats();
        }
    }

    /**
     * Examine an item
     */
    examineItem(itemId) {
        if (!itemId) {
            this.addOutput("Examine what?", "error");
            return;
        }

        // Check inventory
        let item = this.inventory.find(item => item.id === itemId);
        
        // Check room
        if (!item) {
            item = this.currentRoom.getItem(itemId);
        }

        if (item) {
            this.addOutput(`🔍 ${item.name}`, "item-name");
            this.addOutput(item.description, "normal");
        } else {
            this.addOutput(`You don't see "${itemId}" anywhere.`, "error");
        }
    }

    /**
     * Show inventory contents
     */
    showInventory() {
        this.addOutput("");
        this.addOutput("🎒 INVENTORY", "room-title");
        
        if (this.inventory.length === 0) {
            this.addOutput("Your inventory is empty.", "normal");
        } else {
            this.inventory.forEach(item => {
                this.addOutput(`  • ${item.name} [${item.id}] - ${item.type}`, "item-list");
            });
        }
        this.addOutput(`\nCarrying: ${this.inventory.length}/${this.maxInventorySize}`, "normal");
        this.addOutput("");
    }

    /**
     * Modify player health
     */
    modifyHealth(amount) {
        this.health = Math.max(0, Math.min(this.maxHealth, this.health + amount));
        this.updateStats();
        
        if (this.health <= 0 && !this.isDead) {
            this.die();
        } else if (amount < 0) {
            this.addOutput(`💔 You take ${-amount} damage! (${this.health}/${this.maxHealth} HP)`, "danger");
        } else if (amount > 0) {
            this.addOutput(`💚 You restore ${amount} health! (${this.health}/${this.maxHealth} HP)`, "success");
        }
    }

    /**
     * Modify player energy
     */
    modifyEnergy(amount) {
        this.energy = Math.max(0, Math.min(this.maxEnergy, this.energy + amount));
        this.updateStats();
        
        if (this.energy <= 0) {
            this.addOutput("⚡ You're exhausted! Rest to recover energy.", "warning");
        }
    }

    /**
     * Player death
     */
    die() {
        this.isDead = true;
        this.addOutput("");
        this.addOutput("═".repeat(70), "normal");
        this.addOutput("💀 GAME OVER 💀", "error");
        this.addOutput("You didn't survive the night shift...", "normal");
        this.addOutput("═".repeat(70), "normal");
        this.addOutput("");
        this.addOutput("Refresh the page to try again.", "normal");
    }

    /**
     * Update the stats display
     */
    updateStats() {
        const healthBar = this.createBar(this.health, this.maxHealth, '❤️', '🖤');
        const energyBar = this.createBar(this.energy, this.maxEnergy, '⚡', '◽');
        
        document.getElementById('healthBar').innerHTML = `${healthBar} ${this.health}/${this.maxHealth}`;
        document.getElementById('energyBar').innerHTML = `${energyBar} ${this.energy}/${this.maxEnergy}`;
        document.getElementById('inventoryCount').textContent = `${this.inventory.length}/${this.maxInventorySize}`;
    }

    /**
     * Create a visual bar
     */
    createBar(current, max, filledChar, emptyChar) {
        const segments = 10;
        const filled = Math.floor((current / max) * segments);
        return filledChar.repeat(filled) + emptyChar.repeat(segments - filled);
    }

    /**
     * Display help information
     */
    displayHelp() {
        this.addOutput("");
        this.addOutput("📋 COMMANDS", "room-title");
        this.addOutput("");
        this.addOutput("Movement: north (n), south (s), east (e), west (w), up, down", "normal");
        this.addOutput("Items: take [item], drop [item], use [item], examine [item]", "normal");
        this.addOutput("Info: inventory (i), look (l), stats, exits, help (h)", "normal");
        this.addOutput("");
    }

    /**
     * Display detailed game statistics
     */
    displayDetailedStats() {
        this.addOutput("");
        this.addOutput("📊 CHARACTER STATUS", "room-title");
        this.addOutput(`Health: ${this.health}/${this.maxHealth}`, "normal");
        this.addOutput(`Energy: ${this.energy}/${this.maxEnergy}`, "normal");
        this.addOutput(`Turns Taken: ${this.turns}`, "normal");
        this.addOutput(`Current Location: ${this.currentRoom.title}`, "normal");
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
        this.outputElement.scrollTop = this.outputElement.scrollHeight;
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game(gameGraph);
    game.init();
});
