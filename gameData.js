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

    const gasmask = new Item(
        'gasmask',
        'Gas Mask',
        'A protective gas mask. This could protect you from toxic environments.',
        'tool'
    );

    const painkiller = new Item(
        'painkillers',
        'Pain Killers',
        'A bottle of strong painkillers. For emergencies.',
        'consumable'
    ).setUsable((game) => {
        game.modifyHealth(20);
        const index = game.inventory.findIndex(item => item.id === 'painkillers');
        game.inventory.splice(index, 1);
        game.addOutput("You swallow some painkillers. The pain subsides a bit.", "success");
    });

    const coffee = new Item(
        'coffee',
        'Cold Coffee',
        'A half-full cup of cold coffee from your desk. Better than nothing.',
        'consumable'
    ).setUsable((game) => {
        game.modifyEnergy(20);
        const index = game.inventory.findIndex(item => item.id === 'coffee');
        game.inventory.splice(index, 1);
        game.addOutput("You gulp down the cold coffee. Disgusting, but effective.", "success");
    });

    const batteries = new Item(
        'batteries',
        'Fresh Batteries',
        'A pack of AA batteries. Your flashlight could use these.',
        'tool'
    );

    const extinguisher = new Item(
        'extinguisher',
        'Fire Extinguisher',
        'A red fire extinguisher. Might be useful against fire... or something else.',
        'tool'
    ).setUsable((game) => {
        if (game.currentRoom.id === 'datacenter' && game.currentRoom.isDangerous) {
            game.addOutput("💨 You spray the fire extinguisher at the flames!", "success");
            game.addOutput("The fire suppressant fills the room. The server fire is out!", "success");
            game.currentRoom.isDangerous = false;
            game.currentRoom.dangerMessage = "";
            game.gameState.fireExtinguished = true;
            
            const index = game.inventory.findIndex(item => item.id === 'extinguisher');
            game.inventory.splice(index, 1);
        } else {
            game.addOutput("There's nothing to extinguish here.", "error");
        }
    });

    const accesscard = new Item(
        'access-card',
        'Executive Access Card',
        'A high-level access card. Opens restricted areas.',
        'key'
    ).setUsable((game) => {
        if (game.currentRoom.id === 'executive-hall' && !game.gameState.executiveUnlocked) {
            game.gameState.executiveUnlocked = true;
            game.addOutput("🔓 The executive access card unlocks the boardroom. The heavy door slides open.", "success");
        } else if (game.gameState.executiveUnlocked) {
            game.addOutput("The boardroom is already unlocked.", "normal");
        } else {
            game.addOutput("There's nothing to unlock here. Try using this at the executive hallway.", "error");
        }
    });

    const hazmat = new Item(
        'hazmat-suit',
        'Hazmat Suit',
        'A full-body hazmat suit. Maximum protection from hazardous environments.',
        'tool'
    );

    const wrench = new Item(
        'wrench',
        'Pipe Wrench',
        'A heavy pipe wrench. Could be used to fix pipes... or as a weapon.',
        'tool'
    ).setUsable((game) => {
        if (game.currentRoom.id === 'mechanical' && game.currentRoom.isDangerous) {
            game.addOutput("🔧 You use the wrench to shut off the damaged steam valve!", "success");
            game.addOutput("The hissing stops. The mechanical room is now safe.", "success");
            game.currentRoom.isDangerous = false;
            game.currentRoom.dangerMessage = "";
            game.gameState.mechanicalFixed = true;
            
            const index = game.inventory.findIndex(item => item.id === 'wrench');
            game.inventory.splice(index, 1);
        } else {
            game.addOutput("There's nothing to fix here.", "error");
        }
    });

    const sedative = new Item(
        'sedative',
        'Sedative Injection',
        'A medical sedative. Calms you down but drains energy.',
        'consumable'
    ).setUsable((game) => {
        game.modifyHealth(15);
        game.modifyEnergy(-30);
        const index = game.inventory.findIndex(item => item.id === 'sedative');
        game.inventory.splice(index, 1);
        game.addOutput("You inject the sedative. Your pain eases but you feel drowsy.", "success");
    });

    const adrenaline = new Item(
        'adrenaline',
        'Adrenaline Shot',
        'Emergency adrenaline. Massive energy boost but damages health.',
        'consumable'
    ).setUsable((game) => {
        game.modifyEnergy(60);
        game.modifyHealth(-10);
        const index = game.inventory.findIndex(item => item.id === 'adrenaline');
        game.inventory.splice(index, 1);
        game.addOutput("You inject the adrenaline! Your heart races. You feel unstoppable!", "success");
    });

    const labkey = new Item(
        'lab-key',
        'Research Lab Key',
        'A keycard for the research lab. What were they researching here?',
        'key'
    ).setUsable((game) => {
        if (game.currentRoom.id === 'lab-hall' && !game.gameState.labUnlocked) {
            game.gameState.labUnlocked = true;
            game.addOutput("🔬 The lab key opens the research lab. Warning lights flash inside.", "success");
        } else if (game.gameState.labUnlocked) {
            game.addOutput("The research lab is already open.", "normal");
        } else {
            game.addOutput("There's nothing to unlock here. Try this at the lab hallway.", "error");
        }
    });

    const roofkey = new Item(
        'roof-key',
        'Roof Access Key',
        'A key for roof access. Your ticket to freedom... maybe.',
        'key'
    );

    const document = new Item(
        'documents',
        'Classified Documents',
        'Heavily redacted documents about "Project Midnight". What is this?',
        'lore'
    );

    const crowbar = new Item(
        'crowbar',
        'Crowbar',
        'A sturdy crowbar. Good for prying things open.',
        'tool'
    ).setUsable((game) => {
        if (game.currentRoom.id === 'storage' && !game.gameState.storageOpened) {
            game.gameState.storageOpened = true;
            game.addOutput("💪 You pry open the locked storage cabinet!", "success");
            game.addOutput("Inside you find... something useful.", "success");
            const storageRoom = game.graph.getRoom('storage');
            if (storageRoom) {
                storageRoom.addItem(hazmat);
                storageRoom.addItem(adrenaline);
            }
        } else {
            game.addOutput("There's nothing to pry open here.", "error");
        }
    });

    // Create all rooms with dark survival theme
    
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
    security.addItem(coffee);

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
    servers.addItem(batteries);

    // Room 5B: Data Center - DANGEROUS (fire/smoke)
    const datacenter = new Room(
        "datacenter",
        "Data Center - ON FIRE",
        "Smoke billows from a bank of overheated servers! Small flames lick at the equipment. " +
        "The sprinkler system failed. The heat is intense and smoke fills your lungs. " +
        "You need to put this out or get out fast!"
    );
    datacenter.setDangerous("🔥 The smoke and heat are damaging you!");
    datacenter.addItem(painkiller);

    // Room 6: Break Room - Safe, has items
    const breakroom = new Room(
        "breakroom",
        "Employee Break Room",
        "The break room is eerily quiet. Chairs are overturned. Someone left in a hurry. " +
        "The vending machine glass is cracked. A microwave door hangs open. " +
        "There's an unsettling stillness here."
    );
    breakroom.addItem(energydrink);
    breakroom.addItem(firstaid);

    // Room 7: Supply Closet - Safe, important items
    const supply = new Room(
        "supply",
        "Supply Closet",
        "A cramped supply closet filled with cleaning products, paper supplies, and safety equipment. " +
        "The chemical smell is strong but not dangerous. Emergency supplies line the shelves."
    );
    supply.addItem(gasmask);
    supply.addItem(extinguisher);

    // Room 8: Executive Office - Locked initially
    const executive = new Room(
        "executive",
        "Executive Office",
        "An opulent corner office with leather furniture and mahogany desk. " +
        "Floor-to-ceiling windows overlook the city. A wall safe stands open - empty except for documents. " +
        "Whoever was here left in a panic."
    );
    executive.addItem(accesscard);

    // Room 9: Storage Archive - Dark maze-like area
    const archive = new Room(
        "archive",
        "Storage Archive",
        "Rows of filing cabinets and storage boxes create a maze. The emergency lighting barely " +
        "penetrates the gloom. Papers are strewn everywhere. You hear strange echoes. " +
        "Energy drains faster in this disorienting space."
    );

    // Room 10: Mechanical Room - Dangerous, loud
    const mechanical = new Room(
        "mechanical",
        "Mechanical Room",
        "The building's HVAC and machinery room. Pipes rattle and hiss. Something is wrong with " +
        "the pressure system - steam vents periodically. The noise is deafening. " +
        "Stay too long and the heat exhaustion will get you."
    );
    mechanical.setDangerous("💨 Steam vents scald you! The heat is unbearable!");
    mechanical.addItem(wrench);

    // Room 11: Storage Room - Safe, puzzle room
    const storage = new Room(
        "storage",
        "Storage Room",
        "A cluttered storage room filled with old equipment and supplies. Metal shelving units " +
        "line the walls. A locked cabinet in the corner looks promising. You'll need something to pry it open."
    );
    storage.addItem(painkiller);

    // Room 12: Executive Hallway - Safe
    const executiveHall = new Room(
        "executive-hall",
        "Executive Hallway",
        "A luxurious hallway with dark wood paneling and expensive artwork. The doors are locked " +
        "except for one office. A biometric scanner guards the boardroom entrance to the north - " +
        "you'll need the right access card."
    );

    // Room 13: Boardroom - Safe, important items (locked initially)
    const boardroom = new Room(
        "boardroom",
        "Executive Boardroom",
        "An enormous conference room with a massive table. Floor-to-ceiling windows show the dark city. " +
        "Someone left in a hurry - papers are scattered, chairs overturned. A safe stands open."
    );
    boardroom.addItem(document);
    boardroom.addItem(roofkey);
    boardroom.addItem(adrenaline);

    // Room 14: IT Office - Safe, tech items
    const itoffice = new Room(
        "it-office",
        "IT Department",
        "Cubicles filled with computer equipment. Multiple monitors glow dimly on battery backup. " +
        "The IT staff left tools and equipment everywhere. You might find something useful."
    );
    itoffice.addItem(batteries);
    itoffice.addItem(energydrink);

    // Room 15: Lab Hallway - Safe but eerie
    const labHall = new Room(
        "lab-hall",
        "Research Lab Hallway",
        "A sterile white hallway. Warning signs are posted everywhere: 'BIOHAZARD', 'AUTHORIZED PERSONNEL ONLY'. " +
        "The research lab door is sealed. You need the right key to access it."
    );
    labHall.addItem(labkey);

    // Room 16: Research Lab - DANGEROUS (toxic/biohazard) (locked initially)
    const researchLab = new Room(
        "research-lab",
        "Research Lab - BIOHAZARD",
        "WARNING! Chemical spills everywhere. Broken containment units. Whatever they were researching " +
        "has been released. The air is thick with an unidentifiable mist. Extremely dangerous!"
    );
    researchLab.setDangerous("☣️ Toxic chemicals are burning your skin and lungs!");
    researchLab.addItem(hazmat);
    researchLab.addItem(sedative);

    // Room 17: Cafeteria - Safe, lots of consumables
    const cafeteria = new Room(
        "cafeteria",
        "Employee Cafeteria",
        "A large cafeteria with dozens of tables. The kitchen door is ajar. Food is still on some tables - " +
        "whatever happened, it happened fast. The vending machines are accessible."
    );
    cafeteria.addItem(energydrink);
    cafeteria.addItem(coffee);
    cafeteria.addItem(firstaid);

    // Room 18: Parking Garage - Dark and creepy
    const garage = new Room(
        "garage",
        "Underground Parking Garage",
        "A dark concrete parking garage. Most of the cars are gone. The few that remain are abandoned. " +
        "Fluorescent lights flicker overhead. Oil stains and tire marks everywhere. The exit ramp is blocked."
    );
    garage.addItem(crowbar);

    // Room 19: Maintenance Tunnel - Energy drain area
    const tunnel = new Room(
        "tunnel",
        "Maintenance Tunnel",
        "A claustrophobic maintenance tunnel running under the building. Pipes and cables line the walls. " +
        "Water drips constantly. It's disorienting down here - you can barely tell which way is which. " +
        "Your energy drains faster in this oppressive space."
    );
    tunnel.addItem(batteries);

    // Room 20: Sub-basement - VERY DANGEROUS
    const subbasement = new Room(
        "sub-basement",
        "Sub-Basement - Flooded",
        "The sub-basement is severely flooded. Water is waist-deep and rising. Old machinery looms " +
        "in the darkness. Something doesn't feel right down here. The water is ice cold and electrified. " +
        "Get what you need and GET OUT!"
    );
    subbasement.setDangerous("⚡❄️ The electrified ice-cold water is deadly!");
    subbasement.addItem(accesscard);

    // Basement - DANGEROUS and has power solution
    const basement = new Room(
        "basement",
        "Basement - Electrical Room",
        "The basement is flooded with ankle-deep water. Exposed wires dangle from the ceiling. " +
        "The main breaker panel is here, but you need the right fuse to restore power. " +
        "Water drips from pipes overhead. Each step sends ripples through the dark water."
    );
    basement.setDangerous("⚡ The water is electrified! You're being shocked!");
    basement.addItem(fuse);

    // Roof Access - Escape route
    const roof = new Room(
        "roof",
        "Roof Access",
        "Fresh air! You emerge onto the roof. The city lights twinkle in the distance. " +
        "You can see a fire escape ladder leading down to the street. Freedom is so close!"
    );
    
    // Victory! (handled specially in game logic)
    const freedom = new Room(
        "freedom",
        "FREEDOM!",
        "You climb down the fire escape and your feet touch the pavement. The cold night air " +
        "fills your lungs. You made it out alive! The nightmare is over..."
    );

    // Define connections - Creating a complex multi-level structure
    security
        .addExit("north", "lobby")
        .addExit("east", "servers")
        .addExit("south", "archive")
        .addExit("west", "storage");

    lobby
        .addExit("south", "security")
        .addExit("east", "claims")
        .addExit("west", "breakroom")
        .addExit("north", "cafeteria")
        .addExit("up", "roof", true, "powerRestored");

    claims
        .addExit("west", "lobby")
        .addExit("south", "servers")
        .addExit("east", "it-office")
        .addExit("north", "executive-hall")
        .addExit("down", "basement", true, "basementUnlocked");

    servers
        .addExit("west", "security")
        .addExit("north", "claims")
        .addExit("east", "datacenter");

    datacenter
        .addExit("west", "servers")
        .addExit("south", "mechanical");

    breakroom
        .addExit("east", "lobby")
        .addExit("north", "supply");

    supply
        .addExit("south", "breakroom");

    executive
        .addExit("west", "executive-hall");

    executiveHall
        .addExit("east", "executive")
        .addExit("south", "claims")
        .addExit("north", "boardroom", true, "executiveUnlocked");

    boardroom
        .addExit("south", "executive-hall");

    itoffice
        .addExit("west", "claims")
        .addExit("east", "lab-hall");

    labHall
        .addExit("west", "it-office")
        .addExit("east", "research-lab", true, "labUnlocked");

    researchLab
        .addExit("west", "lab-hall");

    cafeteria
        .addExit("south", "lobby")
        .addExit("north", "garage");

    garage
        .addExit("south", "cafeteria")
        .addExit("down", "tunnel");

    storage
        .addExit("east", "security");

    archive
        .addExit("north", "security")
        .addExit("east", "mechanical");

    mechanical
        .addExit("west", "archive")
        .addExit("north", "datacenter");

    tunnel
        .addExit("up", "garage")
        .addExit("down", "sub-basement");

    subbasement
        .addExit("up", "tunnel");

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
        .addRoom(datacenter)
        .addRoom(breakroom)
        .addRoom(supply)
        .addRoom(executive)
        .addRoom(executiveHall)
        .addRoom(boardroom)
        .addRoom(itoffice)
        .addRoom(labHall)
        .addRoom(researchLab)
        .addRoom(cafeteria)
        .addRoom(garage)
        .addRoom(storage)
        .addRoom(archive)
        .addRoom(mechanical)
        .addRoom(tunnel)
        .addRoom(subbasement)
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
