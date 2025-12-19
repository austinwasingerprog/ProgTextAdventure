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
        
        // Track last damage/energy messages to show on "look"
        this.lastDamageMessage = null;
        this.lastEnergyWarning = null;
        
        // Konami code for cheats
        this.cheatsUnlocked = false;
        
        // Game state
        this.turns = 0;
        this.isDead = false;
        this.hasWon = false;
        this.tipsEnabled = false;  // Tips are off by default
        this.gameState = {
            basementUnlocked: false,
            powerRestored: false,
            fireExtinguished: false,
            executiveUnlocked: false,
            labUnlocked: false,
            mechanicalFixed: false,
            storageOpened: false,
            elevatorUnlocked: false,
            fuseInstalled: false,
            elevatorAccess: false,  // Requires BOTH power AND elevator key
            hasFullMap: false,  // Set to true when player uses building blueprint
            godMode: false  // Dev cheat for invincibility
        };
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
                if (command && !this.isDead && !this.hasWon) {
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
    }

    /**
     * Start the health tick timer for dangerous rooms
     */
    startHealthTick() {
        setInterval(() => {
            if (this.isDead || this.hasWon) return;
            
            if (this.currentRoom.isDangerous) {
                let damage = 5; // Default damage
                let isProtected = false;
                
                // Check for protection items
                const hasGasMask = this.inventory.some(item => item.id === 'gasmask');
                const hasHazmat = this.inventory.some(item => item.id === 'hazmat-suit');
                
                // Gas mask protects from toxic rooms
                const isToxicRoom = this.currentRoom.id === 'claims' && !this.gameState.powerRestored;
                if (isToxicRoom && hasGasMask) {
                    isProtected = true;
                }
                
                // Hazmat suit protects from research lab
                const isBiohazard = this.currentRoom.id === 'research-lab';
                if (isBiohazard && hasHazmat) {
                    isProtected = true;
                }
                
                // Research lab does EXTREME damage
                if (this.currentRoom.id === 'research-lab') {
                    damage = 15; // Triple damage!
                }
                
                // Sub-basement does MASSIVE damage
                if (this.currentRoom.id === 'sub-basement') {
                    damage = 10; // Double damage!
                }
                
                if (!isProtected) {
                    this.modifyHealth(-damage, true); // true = silent (no message spam)
                    if (this.health > 0) {
                        this.lastDamageMessage = `⚠️ ${this.currentRoom.dangerMessage}`;
                    }
                }
            } else {
                // Clear damage message when not in a dangerous room
                this.lastDamageMessage = null;
            }
            
            // Energy drain in maze-like areas (silent drain, warning shown on entry)
            if (this.currentRoom.id === 'archive' || this.currentRoom.id === 'tunnel') {
                this.modifyEnergy(-2, true); // true = silent
                if (this.energy <= 0) {
                    this.lastEnergyWarning = "You collapse from exhaustion!";
                    this.modifyHealth(-15, true); // Silent damage from exhaustion too
                }
            } else {
                // Clear energy warning when not in a disorienting room
                this.lastEnergyWarning = null;
            }
            
            // Natural energy recovery (slower)
            if (this.energy < this.maxEnergy) {
                this.energy = Math.min(this.maxEnergy, this.energy + 1);
                this.updateStats();
            }
        }, 2000);  // Reduced from 3000ms to 2000ms for faster energy drain
    }

    /**
     * Display the welcome message
     */
    displayWelcome() {
        this.addOutput("═".repeat(70), "normal");
        this.addOutput("🌑 PROGRESSIVE INSURANCE: NIGHT SHIFT 🌑", "room-title");
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
        this.addOutput("💡 Commands: take [item], drop [item], inventory, use [item], examine [item]", "exits");
        this.addOutput("📊 Watch your health and energy bars at the top!", "exits");
        this.addOutput("💡 Type 'help' for full command list", "exits");
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
        
        // Dynamic room descriptions based on game state
        let description = this.getDynamicDescription(room);
        
        this.addOutput(description, "room-description");
        
        if (room.items.length > 0) {
            this.addOutput(room.getItemsString(), "item-list");
        }
        
        this.addOutput("");
        
        // Show exits
        const exitsInfo = this.getExitsString(room);
        this.addOutput(exitsInfo.text, "exits", exitsInfo.useHTML);
        
        // Show special actions available
        this.showAvailableActions(room);
        
        // Set and show danger messages immediately when in a dangerous room
        if (this.currentRoom.isDangerous) {
            this.lastDamageMessage = `⚠️ ${this.currentRoom.dangerMessage}`;
            this.addOutput(this.lastDamageMessage, "danger");
        }
        
        // Show energy warning if exhausted in disorienting spaces
        if ((room.id === 'archive' || room.id === 'tunnel') && this.energy <= 0) {
            this.lastEnergyWarning = "You collapse from exhaustion!";
            this.addOutput(this.lastEnergyWarning, "error");
        }
        
        // Warn about disorienting spaces
        if (room.id === 'archive' || room.id === 'tunnel') {
            this.addOutput("🌀 This space is disorienting - your energy drains faster here!", "danger");
        }
        
        // Drain energy from moving (but not on first turn)
        if (this.turns > 1) {
            this.modifyEnergy(-2);
        }
    }

    /**
     * Get dynamic description based on game state
     */
    getDynamicDescription(room) {
        let description = room.description;
        
        // Update Claims description
        if (room.id === 'claims') {
            if (this.gameState.powerRestored) {
                description = "The Claims Department is now well-ventilated. The toxic fumes have cleared thanks to " +
                    "the restored ventilation system. Papers are still scattered everywhere from the earlier chaos. " +
                    "The basement door stands open, revealing a stairway leading DOWN.";
            } else if (this.gameState.basementUnlocked) {
                description = room.description.replace(
                    "A heavy metal door marked 'BASEMENT - ELECTRICAL' is locked tight.",
                    "The basement door stands open, revealing a dark stairway leading DOWN."
                );
            }
        }
        
        // Update Lobby description
        if (room.id === 'lobby' && this.gameState.powerRestored) {
            if (this.gameState.elevatorAccess) {
                description = "The lobby is now illuminated by overhead lights! The shadows have retreated. " +
                    "Everything looks much less ominous now. The elevator doors stand open - ready to take you UP to the roof.";
            } else {
                description = "The lobby is now illuminated by overhead lights! The shadows have retreated. " +
                    "Everything looks much less ominous now. The elevator hums with power, but the doors remain closed. " +
                    "A card reader next to the elevator blinks red - it needs an access card.";
            }
        }
        
        // Update Data Center description
        if (room.id === 'datacenter' && this.gameState.fireExtinguished) {
            description = "The Data Center is now safe. The fire suppressant foam covers the floor and equipment. " +
                "The servers are damaged but the fire is out. You can breathe easier now.";
        }
        
        // Update Mechanical Room
        if (room.id === 'mechanical' && this.gameState.mechanicalFixed) {
            description = "The Mechanical Room is now safe. The steam valve is shut off and the pressure has normalized. " +
                "The machinery hums quietly. You fixed it!";
        }
        
        // Update Storage
        if (room.id === 'storage' && this.gameState.storageOpened) {
            description = "The storage room is slightly less cluttered now. The locked cabinet stands open, " +
                "its contents revealed. You found some useful gear.";
        }
        
        return description;
    }

    /**
     * Get exits string including unlocked conditional exits
     */
    getExitsString(room) {
        const exitStrings = [];
        let hasLockedExits = false;
        
        // Get all exits
        for (const [direction, exit] of Object.entries(room.exits)) {
            // Skip the secret tunnel exit if not yet revealed
            if (direction === 'down' && room.id === 'storage' && !this.gameState.tunnelRevealed) {
                continue;
            }
            
            // Check if this exit is locked
            const isLocked = exit.locked && (!this.gameState[exit.unlockCondition]);
            
            if (isLocked) {
                // Show locked exits with strikethrough and padlock
                exitStrings.push(`<span style="text-decoration: line-through; opacity: 0.5;">${direction}</span> 🔒`);
                hasLockedExits = true;
            } else {
                // Show unlocked exits normally
                exitStrings.push(direction);
            }
        }
        
        if (exitStrings.length === 0) {
            return { text: "No obvious exits.", useHTML: false };
        }
        
        return { 
            text: `Exits: ${exitStrings.join(', ')}`,
            useHTML: hasLockedExits
        };
    }

    /**
     * Show special actions available in current room
     */
    showAvailableActions(room) {
        if (!this.tipsEnabled) return;  // Don't show tips if disabled
        
        const actions = [];
        
        // Check for usable items in inventory that work here
        if (room.id === 'claims') {
            const hasKey = this.inventory.some(item => item.id === 'basement-key');
            if (hasKey && !this.gameState.basementUnlocked) {
                actions.push("💡 You can USE the basement-key here to unlock the basement door");
            }
            const hasGasMask = this.inventory.some(item => item.id === 'gasmask');
            if (room.isDangerous && hasGasMask && !this.gameState.powerRestored) {
                actions.push("🎭 Your gas mask will protect you from the toxic air here");
            }
        }
        
        if (room.id === 'basement') {
            const hasFuse = this.inventory.some(item => item.id === 'fuse');
            if (hasFuse && !this.gameState.powerRestored) {
                actions.push("💡 You can USE the fuse here to restore power to the building");
            }
        }
        
        if (room.id === 'datacenter') {
            const hasExtinguisher = this.inventory.some(item => item.id === 'extinguisher');
            if (hasExtinguisher && room.isDangerous) {
                actions.push("🧯 You can USE the fire extinguisher here to put out the fire");
            }
        }
        
        if (room.id === 'mechanical') {
            const hasWrench = this.inventory.some(item => item.id === 'wrench');
            if (hasWrench && room.isDangerous) {
                actions.push("🔧 You can USE the wrench here to fix the steam valve");
            }
        }
        
        if (room.id === 'storage') {
            const hasCrowbar = this.inventory.some(item => item.id === 'crowbar');
            if (hasCrowbar && !this.gameState.storageOpened) {
                actions.push("💪 You can USE the crowbar here to pry open the locked cabinet");
            }
        }
        
        if (room.id === 'executive-hall') {
            const hasAccessCard = this.inventory.some(item => item.id === 'access-card');
            if (hasAccessCard && !this.gameState.executiveUnlocked) {
                actions.push("🔓 You can USE the access-card here to unlock the boardroom");
            }
        }
        
        if (room.id === 'lab-hall') {
            const hasLabKey = this.inventory.some(item => item.id === 'lab-key');
            if (hasLabKey && !this.gameState.labUnlocked) {
                actions.push("🔬 You can USE the lab-key here to access the research lab");
            }
        }
        
        if (room.id === 'research-lab') {
            const hasHazmat = this.inventory.some(item => item.id === 'hazmat-suit');
            if (room.isDangerous && hasHazmat) {
                actions.push("🛡️ Your hazmat suit will protect you from the biohazard");
            }
        }
        
        if (room.id === 'archive' || room.id === 'tunnel') {
            actions.push("⚠️ This area drains your energy faster. Don't stay too long!");
        }
        
        if (room.id === 'subbasement') {
            actions.push("☠️ EXTREME DANGER! This area deals massive damage. Get what you need and leave!");
        }
        
        if (room.id === 'roof') {
            actions.push("🪜 Type ESCAPE to climb down the fire escape and complete your mission!");
        }
        
        if (actions.length > 0) {
            this.addOutput("", "normal");
            actions.forEach(action => this.addOutput(action, "success"));
        }
    }

    /**
     * Toggle tips on/off
     */
    toggleTips() {
        this.tipsEnabled = !this.tipsEnabled;
        if (this.tipsEnabled) {
            this.addOutput("✅ Tips enabled! You will now see helpful hints about using items.", "success");
        } else {
            this.addOutput("🔇 Tips disabled. You're on your own!", "normal");
        }
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
        
        // Check for Konami code
        if (cmd === 'up up down down left right left right b a') {
            if (!this.cheatsUnlocked) {
                this.cheatsUnlocked = true;
                this.addOutput("", "normal");
                this.addOutput("🎮 ═════════════════════════════════════════════", "success");
                this.addOutput("    ⚡ KONAMI CODE ACTIVATED! ⚡", "success");
                this.addOutput("       CHEAT CODES UNLOCKED!", "success");
                this.addOutput("    Type 'cheat' for available codes", "success");
                this.addOutput("═════════════════════════════════════════════ 🎮", "success");
                this.addOutput("", "normal");
            } else {
                this.addOutput("Cheats are already unlocked!", "normal");
            }
            return;
        }

        // Movement
        const directionMap = { 'n': 'north', 's': 'south', 'e': 'east', 'w': 'west', 'u': 'up', 'd': 'down' };
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

        // Special game commands
        if (action === 'escape' || action === 'climb' || cmd === 'climb down') {
            this.attemptEscape();
            return;
        }

        if (action === 'remove' && target === 'fuse') {
            this.removeFuse();
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
                const exitsInfo = this.getExitsString(this.currentRoom);
                this.addOutput(exitsInfo.text, "exits", exitsInfo.useHTML);
                break;

            case 'map':
            case 'm':
                this.displayMap();
                break;

            case 'tips':
                this.toggleTips();
                break;

            case 'debug':
                window.open('debug.html', '_blank');
                this.addOutput("Opening debug view in a new window...", "normal");
                break;

            case 'cheat':
                if (this.cheatsUnlocked) {
                    this.processCheatCode(target);
                } else {
                    this.addOutput(
                        `I don't understand "${command}". Type 'help' for commands.`,
                        "error"
                    );
                }
                break;

            default:
                this.addOutput(
                    `I don't understand "${command}". Type 'help' for commands.`,
                    "error"
                );
        }
    }

    /**
     * Process cheat codes (dev commands)
     */
    processCheatCode(code) {
        if (!code) {
            this.addOutput("💻 DEV CHEAT CODES:", "room-title");
            this.addOutput("  cheat fullmap - Unlock building blueprint", "normal");
            this.addOutput("  cheat god - Toggle god mode (invincibility)", "normal");
            this.addOutput("  cheat heal - Full health and energy", "normal");
            this.addOutput("  cheat keys - Get all keys", "normal");
            this.addOutput("  cheat reveal - Mark all rooms as visited", "normal");
            return;
        }

        switch(code.toLowerCase()) {
            case 'fullmap':
                this.gameState.hasFullMap = true;
                this.addOutput("🗺️ DEV: Building blueprint unlocked! Type 'map' to see all rooms.", "success");
                break;

            case 'god':
                this.gameState.godMode = !this.gameState.godMode;
                if (this.gameState.godMode) {
                    this.addOutput("⚡ DEV: God mode ENABLED - you are invincible!", "success");
                } else {
                    this.addOutput("💀 DEV: God mode DISABLED - you can die again.", "normal");
                }
                break;

            case 'heal':
                this.health = this.maxHealth;
                this.energy = this.maxEnergy;
                this.updateStats();
                this.addOutput("💚 DEV: Health and energy fully restored!", "success");
                break;

            case 'keys':
                const keyItems = [
                    { id: 'basement-key', name: 'Basement Key' },
                    { id: 'elevator-key', name: 'Elevator Access Card' },
                    { id: 'access-card', name: 'Executive Access Card' },
                    { id: 'lab-key', name: 'Research Lab Key' }
                ];
                
                let keysAdded = 0;
                for (const key of keyItems) {
                    if (!this.inventory.some(item => item.id === key.id)) {
                        // Create a simple key item (won't have use functionality, but that's ok for cheats)
                        const keyItem = { id: key.id, name: key.name, type: 'key', description: 'Cheat item', canUse: false };
                        this.inventory.push(keyItem);
                        keysAdded++;
                    }
                }
                
                if (keysAdded > 0) {
                    this.addOutput(`🔑 DEV: Added ${keysAdded} key(s) to inventory!`, "success");
                } else {
                    this.addOutput("🔑 DEV: You already have all keys!", "normal");
                }
                this.updateStats();
                break;

            case 'reveal':
                const rooms = this.graph.getAllRooms();
                rooms.forEach(room => room.visited = true);
                this.addOutput("👁️ DEV: All rooms marked as visited!", "success");
                break;

            default:
                this.addOutput(`Unknown cheat code: "${code}". Type 'cheat' for list.`, "error");
        }
    }

    /**
     * Move the player in a direction
     */
    movePlayer(direction) {
        const destinationId = this.currentRoom.getExit(direction, this.gameState);
        
        if (!destinationId) {
            const exit = this.currentRoom.exits[direction.toLowerCase()];
            if (exit && exit.locked) {
                const messages = {
                    'basementUnlocked': "The basement door is locked. You need a key.",
                    'powerRestored': "The elevator has no power. You need to restore electricity first.",
                    'executiveUnlocked': "The boardroom door is locked. You need an executive access card.",
                    'labUnlocked': "The research lab is sealed. You need a lab key."
                };
                this.addOutput(messages[exit.unlockCondition] || "This exit is locked.", "error");
            } else {
                this.addOutput(`You can't go ${direction} from here.`, "error");
            }
            return;
        }
        
        const nextRoom = this.graph.getRoom(destinationId);
        
        if (nextRoom) {
            this.addOutput(`You head ${direction}...`, "normal");
            this.currentRoom = nextRoom;
            this.displayRoom(nextRoom);
        } else {
            this.addOutput(`You can't go ${direction} from here.`, "error");
        }
    }

    /**
     * Attempt to escape via the fire escape
     */
    attemptEscape() {
        if (this.currentRoom.id === 'roof') {
            this.winGame();
        } else {
            this.addOutput("There's no escape route here.", "error");
        }
    }

    /**
     * Win the game!
     */
    winGame() {
        this.hasWon = true;
        this.addOutput("");
        this.addOutput("═".repeat(70), "success");
        this.addOutput("🎉 YOU ESCAPED! 🎉", "success");
        this.addOutput("");
        this.addOutput("You climb down the fire escape and your feet touch the pavement.", "normal");
        this.addOutput("The cold night air fills your lungs. You made it out alive!", "normal");
        this.addOutput("The nightmare is over...", "normal");
        this.addOutput("");
        this.addOutput("═".repeat(70), "success");
        this.addOutput("");
        this.addOutput(`Final Stats: ${this.health}/${this.maxHealth} HP | ${this.turns} turns | ${this.inventory.length} items`, "normal");
        this.addOutput("");
        this.addOutput("🏆 CONGRATULATIONS! 🏆", "success");
        this.addOutput("Refresh the page to play again.", "normal");
        this.addOutput("");
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

        // Special case: elevator key in sub-basement when power is on
        if (this.currentRoom.id === 'sub-basement' && itemId === 'elevator-key' && this.gameState.powerRestored) {
            this.addOutput("⚡ The elevator access card is submerged in electrified water! You can see it clearly,", "error");
            this.addOutput("but touching the water would be instantly fatal. You need to remove the fuse to de-power", "error");
            this.addOutput("the building first. Type 'REMOVE FUSE' in the server room to shut off power.", "error");
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

        // Special case: Examining cabinet in storage room after using crowbar
        if ((itemId === 'cabinet' || itemId === 'wall') && 
            this.currentRoom.id === 'storage' && 
            this.gameState.cabinetMoved && 
            !this.gameState.tunnelRevealed) {
            
            this.gameState.tunnelRevealed = true;
            this.addOutput("🔍 You examine the back of the storage cabinet more closely...", "normal");
            this.addOutput("", "normal");
            this.addOutput("The loose paneling isn't just damaged - it's a false wall!", "success");
            this.addOutput("You push on it and it swings inward, revealing a hidden maintenance hatch.", "success");
            this.addOutput("A narrow passage leads DOWN into what appears to be a secret maintenance tunnel system.", "success");
            this.addOutput("", "normal");
            this.addOutput("🔓 A new path has been revealed! (Type 'look' to see updated exits)", "exits");
            
            // Update room description
            const storageRoom = this.graph.getRoom('storage');
            if (storageRoom) {
                storageRoom.description = "A cluttered storage room filled with old equipment and supplies. Metal shelving units " +
                    "line the walls. The pried-open cabinet now reveals a hidden maintenance hatch in the wall behind it, " +
                    "leading DOWN to a secret tunnel system.";
            }
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
    modifyHealth(amount, silent = false) {
        // God mode prevents damage
        if (this.gameState.godMode && amount < 0) {
            return;
        }
        
        this.health = Math.max(0, Math.min(this.maxHealth, this.health + amount));
        this.updateStats();
        
        // Flash health bar on change
        if (amount !== 0) {
            const healthBar = document.getElementById('healthBar');
            healthBar.parentElement.classList.add(amount < 0 ? 'stat-flash-damage' : 'stat-flash-heal');
            setTimeout(() => {
                healthBar.parentElement.classList.remove('stat-flash-damage', 'stat-flash-heal');
            }, 500);
        }
        
        if (this.health <= 0 && !this.isDead) {
            this.die();
        } else if (!silent) {
            // Only show messages if not silent
            if (amount < 0) {
                this.addOutput(`💔 You take ${-amount} damage! (${this.health}/${this.maxHealth} HP)`, "danger");
            } else if (amount > 0) {
                this.addOutput(`💚 You restore ${amount} health! (${this.health}/${this.maxHealth} HP)`, "success");
            }
        }
    }

    /**
     * Modify player energy
     */
    modifyEnergy(amount, silent = false) {
        this.energy = Math.max(0, Math.min(this.maxEnergy, this.energy + amount));
        this.updateStats();
        
        // Flash energy bar on change
        if (amount !== 0) {
            const energyBar = document.getElementById('energyBar');
            energyBar.parentElement.classList.add(amount < 0 ? 'stat-flash-drain' : 'stat-flash-restore');
            setTimeout(() => {
                energyBar.parentElement.classList.remove('stat-flash-drain', 'stat-flash-restore');
            }, 500);
        }
        
        if (!silent && this.energy <= 0 && amount < 0) {
            this.addOutput("⚡ You're exhausted! Rest to recover energy.", "warning");
        }
    }

    /**
     * Remove fuse from server room to de-power the building
     */
    removeFuse() {
        if (this.currentRoom.id !== 'servers') {
            this.addOutput("There's no fuse to remove here. The breaker panel is in the server room.", "error");
            return;
        }

        if (!this.gameState.fuseInstalled) {
            this.addOutput("There's no fuse installed in the breaker panel.", "normal");
            return;
        }

        // Remove power
        this.gameState.powerRestored = false;
        this.gameState.fuseInstalled = false;
        this.gameState.elevatorAccess = false;  // Elevator needs power
        
        this.addOutput("🔧 You carefully remove the fuse from the breaker panel...", "normal");
        this.addOutput("", "normal");
        this.addOutput("CLUNK! The building goes dark again. Emergency lights flicker on.", "normal");
        this.addOutput("⚠️  The claims area toxic fumes return as the vents shut down!", "error");
        this.addOutput("⚠️  The cafeteria refrigeration shuts down - mold spores fill the air again!", "error");
        this.addOutput("✅ The sub-basement water is no longer electrified - you can safely retrieve items now!", "success");
        this.addOutput("", "normal");

        // Make claims dangerous again
        const claimsRoom = this.graph.getRoom('claims');
        if (claimsRoom) {
            claimsRoom.setDangerous("💀 The toxic fumes are hurting you!");
        }

        // Make cafeteria dangerous again when power is removed
        const cafeteriaRoom = this.graph.getRoom('cafeteria');
        if (cafeteriaRoom) {
            cafeteriaRoom.setDangerous("🦠 Toxic mold spores from spoiled food fill the air! You're choking!");
        }

        // Make sub-basement safe again (water not electrified)
        const subbasementRoom = this.graph.getRoom('sub-basement');
        if (subbasementRoom) {
            subbasementRoom.isDangerous = false;
            subbasementRoom.dangerMessage = "";
        }

        // Add fuse back to inventory
        const fuse = new Item('fuse', 'Replacement Fuse', 'A heavy electrical fuse. This could restore power... but it might also electrify flooded areas.', 'tool');
        
        // Re-attach the usable callback to the fuse
        fuse.setUsable((game) => {
            if (game.currentRoom.id === 'servers' && !game.gameState.powerRestored) {
                game.gameState.powerRestored = true;
                game.gameState.fuseInstalled = true;
                game.addOutput("⚡ You install the fuse into the server room breaker panel...", "success");
                game.addOutput("", "normal");
                game.addOutput("CLUNK! The breakers flip on. Lights flicker to life throughout the building!", "success");
                game.addOutput("The contamination vents in the Claims Department activate and clear the air.", "success");
                game.addOutput("The cafeteria refrigeration system hums to life - the air clears as ventilation starts!", "success");
                game.addOutput("Power is restored, but the lobby elevator still won't budge - it needs an access card.", "normal");
                game.addOutput("", "normal");
                game.addOutput("⚠️  WARNING: You hear a crackling sound from deep below... the sub-basement water is now ELECTRIFIED!", "error");
                game.addOutput("💡 Tip: You can REMOVE the fuse from the panel if you need to de-power the building.", "exits");
                game.addOutput("", "normal");
                
                // Remove the item from inventory after use
                const index = game.inventory.findIndex(item => item.id === 'fuse');
                game.inventory.splice(index, 1);
                
                // Clear dangerous status from claims
                const claimsRoom = game.graph.getRoom('claims');
                if (claimsRoom) {
                    claimsRoom.isDangerous = false;
                    claimsRoom.dangerMessage = "";
                }
                
                // Clear dangerous status from cafeteria when power is restored
                const cafeteriaRoom = game.graph.getRoom('cafeteria');
                if (cafeteriaRoom) {
                    cafeteriaRoom.isDangerous = false;
                    cafeteriaRoom.dangerMessage = "";
                }
                
                // Make sub-basement dangerous when power is restored (electrified water!)
                const subbasementRoom = game.graph.getRoom('sub-basement');
                if (subbasementRoom) {
                    subbasementRoom.isDangerous = true;
                    subbasementRoom.dangerMessage = "⚡ The water is ELECTRIFIED! You're being shocked!";
                }
                
                game.updateStats();
            } else if (game.gameState.powerRestored) {
                game.addOutput("The power is already restored.", "normal");
            } else {
                game.addOutput("You need to be at the server room breaker panel to use this.", "error");
            }
        });
        
        this.inventory.push(fuse);
        this.addOutput("You put the fuse back in your pocket.", "normal");
        
        this.updateStats();
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
     * Get room abbreviation for map display
     */
    getRoomAbbreviation(roomId) {
        const abbreviations = {
            'security': 'SEC',
            'lobby': 'LOB',
            'reception': 'REC',
            'break-room': 'BRK',
            'claims': 'CLM',
            'servers': 'SRV',
            'datacenter': 'DAT',
            'basement': 'BST',
            'sub-basement': 'SUB',
            'itoffice': 'IT',
            'executive-hall': 'EXE',
            'boardroom': 'BRD',
            'supply': 'SUP',
            'mechanical': 'MEC',
            'storage': 'STR',
            'tunnel': 'TUN',
            'archive': 'ARC',
            'lab-hall': 'LHL',
            'research-lab': 'LAB',
            'cafeteria': 'CAF',
            'garage': 'GAR',
            'stairwell': 'STR',
            'roof': 'ROF'
        };
        return abbreviations[roomId] || roomId.substring(0, 3).toUpperCase();
    }

    /**
     * Get the floor number for a room
     */
    getRoomFloor(roomId) {
        const floors = {
            // Sub-basement (Floor -2)
            'sub-basement': -2,
            
            // Basement (Floor -1)
            'basement': -1,
            'servers': -1,
            'datacenter': -1,
            'tunnel': -1,
            
            // Ground Floor (Floor 0)
            'security': 0,
            'lobby': 0,
            'reception': 0,
            'break-room': 0,
            'claims': 0,
            'itoffice': 0,
            'executive-hall': 0,
            'boardroom': 0,
            'supply': 0,
            'mechanical': 0,
            'storage': 0,
            'archive': 0,
            'lab-hall': 0,
            'research-lab': 0,
            'cafeteria': 0,
            'garage': 0,
            'stairwell': 0,
            
            // Roof (Floor 1)
            'roof': 1
        };
        return floors[roomId] !== undefined ? floors[roomId] : 0;
    }

    /**
     * Display fog-of-war map showing visited rooms (or all rooms with full map)
     */
    displayMap() {
        this.addOutput("");
        const hasFullMap = this.gameState.hasFullMap;
        const currentFloor = this.getRoomFloor(this.currentRoom.id);
        
        // Floor names for display
        const floorNames = {
            '-2': 'Sub-Basement',
            '-1': 'Basement',
            '0': 'Ground Floor',
            '1': 'Roof'
        };
        
        const floorName = floorNames[currentFloor.toString()] || `Floor ${currentFloor}`;
        this.addOutput(hasFullMap ? `🗺️  BUILDING BLUEPRINT - ${floorName}` : `🗺️  MAP - ${floorName}`, "room-title");
        this.addOutput("", "normal");
        
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 400;
        canvas.style.display = 'block';
        canvas.style.margin = '10px auto';
        canvas.style.border = '2px solid #4ec9b0';
        canvas.style.backgroundColor = '#1e1e1e';
        canvas.style.cursor = 'grab';
        
        const ctx = canvas.getContext('2d');
        
        // Pan offset state
        let panOffset = { x: 0, y: 0 };
        let isDragging = false;
        let dragStart = { x: 0, y: 0 };
        
        // Get all rooms and filter by current floor
        const allRooms = this.graph.getAllRooms();
        const rooms = allRooms.filter(room => this.getRoomFloor(room.id) === currentFloor);
        const positions = this.calculateRoomPositions(rooms);
        
        // Render function that draws the map with current pan offset
        const renderMap = () => {
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#1e1e1e';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Save context and apply pan offset
            ctx.save();
            ctx.translate(panOffset.x, panOffset.y);
            
            // Draw connections first (behind rooms)
            for (const room of rooms) {
                // Skip unvisited rooms unless we have the full map
                if (!room.visited && !hasFullMap) continue;
                
                const pos = positions.get(room.id);
                if (!pos) continue;
                
                for (const [direction, exit] of Object.entries(room.exits)) {
                    const destRoom = this.graph.getRoom(exit.destination);
                    if (!destRoom) continue;
                    
                    // Skip connections to rooms on different floors
                    if (this.getRoomFloor(destRoom.id) !== currentFloor) continue;
                    
                    // Skip connections to unvisited rooms unless we have full map
                    if (!destRoom.visited && !hasFullMap) continue;
                    
                    const destPos = positions.get(exit.destination);
                    if (!destPos) continue;
                    
                    // Use different style for unvisited rooms
                    if (room.visited && destRoom.visited) {
                        ctx.strokeStyle = '#4ec9b0';
                        ctx.lineWidth = 2;
                        ctx.setLineDash([]);
                    } else {
                        ctx.strokeStyle = '#666666';
                        ctx.lineWidth = 1;
                        ctx.setLineDash([5, 5]);
                    }
                    
                    // Draw connection line
                    ctx.beginPath();
                    ctx.moveTo(pos.x, pos.y);
                    ctx.lineTo(destPos.x, destPos.y);
                    ctx.stroke();
                }
            }
            
            ctx.setLineDash([]); // Reset line dash
            
            // Draw rooms
            const roomSize = 50;
            const halfSize = roomSize / 2;
            
            for (const room of rooms) {
                // Skip unvisited rooms unless we have the full map
                if (!room.visited && !hasFullMap) continue;
                
                const pos = positions.get(room.id);
                if (!pos) continue;
                
                // Draw room square
                if (room.id === this.currentRoom.id) {
                    // Current room - bright highlight
                    ctx.fillStyle = '#00ff00';
                    ctx.strokeStyle = '#ffffff';
                } else if (room.id === this.graph.startRoomId) {
                    // Start room
                    ctx.fillStyle = '#ffd700';
                    ctx.strokeStyle = '#4ec9b0';
                } else if (!room.visited) {
                    // Unvisited room (only visible with full map)
                    ctx.fillStyle = '#1a1a1a';
                    ctx.strokeStyle = '#555555';
                } else {
                    // Visited room
                    ctx.fillStyle = '#2d2d2d';
                    ctx.strokeStyle = '#4ec9b0';
                }
                
                ctx.lineWidth = 2;
                ctx.fillRect(pos.x - halfSize, pos.y - halfSize, roomSize, roomSize);
                ctx.strokeRect(pos.x - halfSize, pos.y - halfSize, roomSize, roomSize);
                
                // Draw room abbreviation
                ctx.fillStyle = room.visited ? '#ffffff' : '#777777';
                ctx.font = 'bold 10px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const abbrev = this.getRoomAbbreviation(room.id);
                ctx.fillText(abbrev, pos.x, pos.y);
                
                // Draw danger icon if room is currently dangerous
                if (room.isDangerous) {
                    ctx.font = '14px Arial';
                    ctx.fillText('⚠️', pos.x + halfSize - 8, pos.y - halfSize + 8);
                }
            }
            
            ctx.restore();
        };
        
        // Add mouse event listeners for panning
        canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            dragStart = { x: e.offsetX - panOffset.x, y: e.offsetY - panOffset.y };
            canvas.style.cursor = 'grabbing';
        });
        
        canvas.addEventListener('mousemove', (e) => {
            if (isDragging) {
                panOffset.x = e.offsetX - dragStart.x;
                panOffset.y = e.offsetY - dragStart.y;
                renderMap();
            }
        });
        
        canvas.addEventListener('mouseup', () => {
            isDragging = false;
            canvas.style.cursor = 'grab';
        });
        
        canvas.addEventListener('mouseleave', () => {
            isDragging = false;
            canvas.style.cursor = 'grab';
        });
        
        // Initial render
        renderMap();
        
        // Add canvas to output
        const outputLine = document.createElement('div');
        outputLine.className = 'output-line normal';
        outputLine.appendChild(canvas);
        this.outputElement.appendChild(outputLine);
        
        // Add legend
        this.addOutput("", "normal");
        if (hasFullMap) {
            this.addOutput("Legend: 🟩 Current | 🟨 Start | ⬛ Visited | ⬜ Unvisited | ⚠️ Dangerous", "normal");
            this.addOutput("Full building layout revealed! Map shows current floor only.", "exits");
        } else {
            this.addOutput("Legend: 🟩 Current Location | 🟨 Start | ⬛ Visited | ⚠️ Dangerous", "normal");
            this.addOutput("Tip: Find the building blueprint to reveal all rooms on this floor!", "exits");
        }
        this.addOutput("💡 Click and drag to pan the map", "exits");
        this.addOutput("", "normal");
        
        this.outputElement.scrollTop = this.outputElement.scrollHeight;
    }

    /**
     * Calculate 2D positions for rooms using BFS layout
     */
    calculateRoomPositions(rooms) {
        const positions = new Map();
        const visited = new Set();
        const queue = [];
        
        // Start from the starting room
        const startRoom = this.graph.getRoom(this.graph.startRoomId);
        if (!startRoom) return positions;
        
        const spacing = 80;
        
        // Initial positioning - use 0,0 as origin (will recenter later)
        positions.set(startRoom.id, { x: 0, y: 0 });
        visited.add(startRoom.id);
        queue.push(startRoom);
        
        // Direction offsets for cardinal directions
        const directionOffsets = {
            'north': { x: 0, y: -1 },
            'south': { x: 0, y: 1 },
            'east': { x: 1, y: 0 },
            'west': { x: -1, y: 0 },
            'up': { x: 0, y: -1.5 },
            'down': { x: 0, y: 1.5 }
        };
        
        while (queue.length > 0) {
            const room = queue.shift();
            const currentPos = positions.get(room.id);
            
            for (const [direction, exit] of Object.entries(room.exits)) {
                const destId = exit.destination;
                
                if (visited.has(destId)) continue;
                
                const offset = directionOffsets[direction];
                if (offset) {
                    positions.set(destId, {
                        x: currentPos.x + (offset.x * spacing),
                        y: currentPos.y + (offset.y * spacing)
                    });
                    
                    visited.add(destId);
                    const destRoom = this.graph.getRoom(destId);
                    if (destRoom) {
                        queue.push(destRoom);
                    }
                }
            }
        }
        
        // Now recenter the map on the current player's room
        const currentRoomPos = positions.get(this.currentRoom.id);
        if (currentRoomPos) {
            const centerX = 300;
            const centerY = 200;
            const offsetX = centerX - currentRoomPos.x;
            const offsetY = centerY - currentRoomPos.y;
            
            // Apply offset to all positions to center on current room
            for (const [roomId, pos] of positions.entries()) {
                positions.set(roomId, {
                    x: pos.x + offsetX,
                    y: pos.y + offsetY
                });
            }
        }
        
        return positions;
    }

    /**
     * Display help information
     */
    displayHelp() {
        this.addOutput("");
        this.addOutput("📋 COMMANDS", "room-title");
        this.addOutput("");
        this.addOutput("Movement: north (n), south (s), east (e), west (w), up (u), down (d)", "normal");
        this.addOutput("Items: take [item], drop [item], use [item], examine [item]", "normal");
        this.addOutput("Info: inventory (i), look (l), stats, exits, map (m), help (h)", "normal");
        this.addOutput("Settings: tips (toggle helpful hints)", "normal");
        this.addOutput("Special: escape (when on roof), remove fuse (in server room)", "normal");
        this.addOutput("");
        this.addOutput("💡 Tip: Power management is key - you can install and remove the fuse as needed.", "exits");
        this.addOutput("💡 Tip: Some areas become dangerous when powered, others when unpowered.", "exits");
        this.addOutput("💡 Tip: Examine items to learn more about them.", "exits");
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
        this.addOutput("🔧 PROGRESS", "room-title");
        this.addOutput(`Basement Unlocked: ${this.gameState.basementUnlocked ? '✅ Yes' : '❌ No'}`, "normal");
        this.addOutput(`Power Restored: ${this.gameState.powerRestored ? '✅ Yes' : '❌ No'}`, "normal");
        this.addOutput(`Fire Extinguished: ${this.gameState.fireExtinguished ? '✅ Yes' : '❌ No'}`, "normal");
        this.addOutput(`Executive Access: ${this.gameState.executiveUnlocked ? '✅ Yes' : '❌ No'}`, "normal");
        this.addOutput("");
    }

    /**
     * Add text to the output area
     */
    addOutput(text, className = "normal", useHTML = false) {
        const line = document.createElement('div');
        line.className = `output-line ${className}`;
        if (useHTML) {
            line.innerHTML = text;
        } else {
            line.textContent = text;
        }
        this.outputElement.appendChild(line);
        this.outputElement.scrollTop = this.outputElement.scrollHeight;
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game(gameGraph);
    game.init();
});
