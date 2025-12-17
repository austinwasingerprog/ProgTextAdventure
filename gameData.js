/**
 * Game Data - Dark Survival Progressive Insurance Adventure
 * Defines all rooms, items, and their connections
 * This is where the adventure content is stored
 */

/**
 * Initialize the adventure graph with all rooms
 * @returns {AdventureGraph} - Complete adventure graph
 */
function initializeGame() {
    const graph = new AdventureGraph();

    // Create items first
    const flashlight = new Item(
        'flashlight',
        'Flashlight',
        'A heavy-duty flashlight. Still has some battery left.',
        'tool'
    );

    const keycard = new Item(
        'keycard',
        'Security Keycard',
        'Your security keycard. It should open most doors in the building.',
        'key'
    );

    const firstaid = new Item(
        'medkit',
        'First Aid Kit',
        'A medical kit with bandages and supplies.',
        'consumable'
    ).setUsable((game) => {
        game.modifyHealth(30);
        const index = game.inventory.findIndex(item => item.id === 'medkit');
        game.inventory.splice(index, 1);
        game.addOutput("You use the first aid kit.", "success");
    });

    const energydrink = new Item(
        'energy',
        'Energy Drink',
        'A can of high-caffeine energy drink.',
        'consumable'
    ).setUsable((game) => {
        game.modifyEnergy(40);
        const index = game.inventory.findIndex(item => item.id === 'energy');
        game.inventory.splice(index, 1);
        game.addOutput("You chug the energy drink. You feel more alert!", "success");
    });

    const basement_key = new Item(
        'basement-key',
        'Rusty Basement Key',
        'An old key labeled "ELECTRICAL". Might fit the basement door.',
        'key'
    ).setUsable((game) => {
        if (game.currentRoom.id === 'claims' && !game.gameState.basementUnlocked) {
            game.gameState.basementUnlocked = true;
            
            // Dynamically add the basement exit
            const claimsRoom = game.graph.getRoom('claims');
            if (claimsRoom && !claimsRoom.hasExit('down')) {
                claimsRoom.addExit('down', 'basement');
            }
            
            game.addOutput("✅ You unlock the basement door with the rusty key. You hear it creak open below.", "success");
            game.addOutput("A dark stairway leads DOWN to the basement.", "normal");
        } else if (game.gameState.basementUnlocked) {
            game.addOutput("The basement is already unlocked.", "normal");
        } else {
            game.addOutput("There's nothing to unlock here. Try using this at the basement door in Claims.", "error");
        }
    });

    const fuse = new Item(
        'fuse',
        'Replacement Fuse',
        'A heavy electrical fuse. This could restore power.',
        'tool'
    ).setUsable((game) => {
        if (game.currentRoom.id === 'basement' && !game.gameState.powerRestored) {
            game.gameState.powerRestored = true;
            game.addOutput("⚡ You install the fuse into the breaker panel...", "success");
            game.addOutput("", "normal");
            game.addOutput("CLUNK! The breakers flip on. Lights flicker to life throughout the building!", "success");
            game.addOutput("The contamination vents in the Claims Department activate and clear the air.", "success");
            game.addOutput("The elevator to the roof should now be operational from the lobby!", "success");
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
            
            // Clear dangerous status from basement
            game.currentRoom.isDangerous = false;
            game.currentRoom.dangerMessage = "";
            
            game.updateStats();
        } else if (game.gameState.powerRestored) {
            game.addOutput("The power is already restored.", "normal");
        } else {
            game.addOutput("You need to be at the electrical panel in the basement to use this.", "error");
        }
    });

    // Create all 6 rooms with dark survival theme
    
    // Room 1: Security Office (Start) - Safe zone
    const security = new Room(
        "security",
        "Security Office",
        "Your small security office. Monitors flicker with static. Papers are scattered " +
        "everywhere. The emergency lights cast an eerie red glow. This is the only place " +
        "that feels safe right now."
    );
    security.addItem(flashlight);
    security.addItem(keycard);

    // Room 2: Dark Lobby - Creepy but safe
    const lobby = new Room(
        "lobby",
        "Reception Lobby",
        "The once-bright lobby is now pitch black except for emergency exit signs. " +
        "Shadows dance on the walls. You hear distant sounds - footsteps? Something else? " +
        "The main entrance is locked from the outside. You'll need another way out. " +
        "There's an elevator, but it appears to be without power."
    );
    lobby.addItem(energydrink);

    // Room 3: Claims Department - DANGEROUS (health drain)
    const claims = new Room(
        "claims",
        "Claims Department - Contaminated",
        "A chemical smell fills this room. Papers float through the air from a broken AC unit. " +
        "Your eyes water and your throat burns. Something is VERY wrong here. Don't stay long! " +
        "A heavy metal door marked 'BASEMENT - ELECTRICAL' is locked tight."
    );
    claims.setDangerous("💀 The toxic fumes are hurting you!");
    claims.addItem(firstaid);

    // Room 4: Server Room - Safe but dark
    const servers = new Room(
        "servers",
        "Server Room",
        "Rows of dark server racks hum quietly on backup power. The blue indicator lights " +
        "provide minimal illumination. It's cold in here - very cold. You can see your breath."
    );
    servers.addItem(basement_key);

    // Room 5: Basement - DANGEROUS and has power solution
    const basement = new Room(
        "basement",
        "Basement - Electrical Room",
        "The basement is flooded with ankle-deep water. Exposed wires dangle from the ceiling. " +
        "The main breaker panel is here, but you need the right fuse to restore power. " +
        "Water drips from pipes overhead. Each step sends ripples through the dark water."
    );
    basement.setDangerous("⚡ The water is electrified! You're being shocked!");
    basement.addItem(fuse);

    // Room 6: Roof Access - Escape route
    const roof = new Room(
        "roof",
        "Roof Access",
        "Fresh air! You emerge onto the roof. The city lights twinkle in the distance. " +
        "You can see a fire escape ladder leading down to the street. Freedom is so close!"
    );
    
    // Room 7: Victory! (handled specially in game logic)
    const freedom = new Room(
        "freedom",
        "FREEDOM!",
        "You climb down the fire escape and your feet touch the pavement. The cold night air " +
        "fills your lungs. You made it out alive! The nightmare is over..."
    );

    // Define connections
    security
        .addExit("north", "lobby")
        .addExit("east", "servers");

    lobby
        .addExit("south", "security")
        .addExit("east", "claims");
        // UP exit to roof added dynamically when power is restored

    claims
        .addExit("west", "lobby");
        // DOWN exit to basement added dynamically when unlocked

    servers
        .addExit("west", "security")
        .addExit("north", "claims");

    basement
        .addExit("up", "claims");

    roof
        .addExit("down", "lobby");
        // Escape handled by special command

    // Build graph
    graph
        .addRoom(security)
        .addRoom(lobby)
        .addRoom(claims)
        .addRoom(servers)
        .addRoom(basement)
        .addRoom(roof)
        .addRoom(freedom)
        .setStartRoom("security");

    // Validate the graph
    const validation = graph.validate();
    if (!validation.valid) {
        console.error("Graph validation failed:", validation.errors);
    }
    if (validation.warnings.length > 0) {
        console.warn("Graph warnings:", validation.warnings);
    }

    return graph;
}

// Create the game instance when this file loads
const gameGraph = initializeGame();
