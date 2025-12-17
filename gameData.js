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
    );

    const fuse = new Item(
        'fuse',
        'Replacement Fuse',
        'A heavy electrical fuse. This could restore power.',
        'tool'
    );

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
        "The main entrance is locked from the outside. You'll need another way out."
    );
    lobby.addItem(energydrink);

    // Room 3: Claims Department - DANGEROUS (health drain)
    const claims = new Room(
        "claims",
        "Claims Department - Contaminated",
        "A chemical smell fills this room. Papers float through the air from a broken AC unit. " +
        "Your eyes water and your throat burns. Something is VERY wrong here. Don't stay long!"
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
        "You can see a fire escape leading down to the street. Freedom is so close..."
    );

    // Define connections
    security
        .addExit("north", "lobby")
        .addExit("east", "servers");

    lobby
        .addExit("south", "security")
        .addExit("east", "claims")
        .addExit("up", "roof"); // Can only use after restoring power

    claims
        .addExit("west", "lobby")
        .addExit("down", "basement");

    servers
        .addExit("west", "security")
        .addExit("north", "claims");

    basement
        .addExit("up", "claims");

    roof
        .addExit("down", "lobby");

    // Build graph
    graph
        .addRoom(security)
        .addRoom(lobby)
        .addRoom(claims)
        .addRoom(servers)
        .addRoom(basement)
        .addRoom(roof)
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
