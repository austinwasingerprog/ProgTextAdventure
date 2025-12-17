/**
 * Game Data - Progressive Insurance Adventure
 * Defines all rooms and their connections
 * This is where the adventure content is stored
 */

/**
 * Initialize the adventure graph with all rooms
 * @returns {AdventureGraph} - Complete adventure graph
 */
function initializeGame() {
    const graph = new AdventureGraph();

    // Create all 5 rooms with Progressive Insurance theme
    
    // Room 1: Lobby - The starting point
    const lobby = new Room(
        "lobby",
        "Progressive Insurance Lobby",
        "You stand in the bright, modern lobby of Progressive Insurance headquarters. " +
        "The iconic white and blue colors surround you. A large portrait of Flo, the " +
        "cheerful Progressive spokesperson, hangs on the wall with her signature smile. " +
        "There's a reception desk ahead, and hallways lead in different directions."
    );

    // Room 2: Claims Department - North from lobby
    const claimsDept = new Room(
        "claims",
        "Claims Processing Department",
        "You enter a busy office filled with adjusters reviewing accident reports and " +
        "processing claims. Desks are covered with paperwork, coffee cups, and photos " +
        "of vehicles in various states of distress. A banner reads 'We'll Get You Back " +
        "on the Road!' You can hear the clicking of keyboards and occasional phone " +
        "conversations about deductibles and coverage."
    );

    // Room 3: Name Your Price Tool Room - East from lobby
    const nameYourPrice = new Room(
        "pricing",
        "Name Your Price Tool Lab",
        "This high-tech room houses Progressive's famous 'Name Your Price' tool. Large " +
        "screens display real-time insurance quotes adjusting based on coverage options. " +
        "A whiteboard shows various discount combinations: Safe Driver, Multi-Policy, " +
        "Snapshot®. The walls are decorated with giant price tags and calculator graphics. " +
        "Innovation meets affordability here!"
    );

    // Room 4: Marketing Department - South from lobby
    const marketing = new Room(
        "marketing",
        "Marketing & Advertising Department",
        "Welcome to the creative hub where Flo's commercials are born! Storyboards line " +
        "the walls showing various Progressive ad campaigns. Props from commercials are " +
        "scattered around: Flo's signature white apron, the 'Becoming Your Parents' " +
        "props, and even a miniature version of the Progressive store. You can feel the " +
        "creative energy in the air."
    );

    // Room 5: Conference Room - West from lobby, also accessible from claims
    const conference = new Room(
        "conference",
        "Executive Conference Room",
        "An impressive corner conference room with floor-to-ceiling windows overlooking " +
        "the city. A large mahogany table dominates the center, surrounded by ergonomic " +
        "chairs. On the wall, a presentation displays Progressive's growth charts and " +
        "customer satisfaction ratings. A plaque reads 'Saving Drivers Money Since 1937.' " +
        "Coffee and pastries sit on a side table."
    );

    // Define all the connections between rooms
    
    // Lobby connections (center hub)
    lobby
        .addExit("north", "claims")
        .addExit("east", "pricing")
        .addExit("south", "marketing")
        .addExit("west", "conference");

    // Claims Department connections
    claimsDept
        .addExit("south", "lobby")
        .addExit("west", "conference");

    // Name Your Price Tool Lab connections
    nameYourPrice
        .addExit("west", "lobby")
        .addExit("south", "marketing");

    // Marketing Department connections
    marketing
        .addExit("north", "lobby")
        .addExit("east", "pricing");

    // Conference Room connections
    conference
        .addExit("east", "lobby")
        .addExit("north", "claims");

    // Add all rooms to the graph
    graph
        .addRoom(lobby)
        .addRoom(claimsDept)
        .addRoom(nameYourPrice)
        .addRoom(marketing)
        .addRoom(conference)
        .setStartRoom("lobby");

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
