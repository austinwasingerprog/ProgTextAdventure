# Flo's Adventure - Progressive Insurance Text Adventure

A text adventure game with a Progressive Insurance theme, featuring a node-based room system and debug visualization tools.

## 🏗️ Architecture

### Core Classes

**Room Class** (`room.js`)
- Represents a single location in the game
- Manages exits/connections to other rooms
- Provides utility methods for navigation
- Includes debug information methods

**AdventureGraph Class** (`graph.js`)
- Manages all rooms and their relationships
- Handles navigation between rooms
- Validates graph structure (checks for broken connections)
- Provides statistics and visualization data
- Generates ASCII maps

**Game Class** (`game.js`)
- Main game loop and UI management
- Command parser
- Input/output handling
- Command history (use arrow keys!)

### File Structure

```
text-adventure/
├── index.html          # Main game page
├── debug.html          # Debug visualization page
├── style.css           # Main game styling
├── debug.css           # Debug page styling
├── room.js             # Room class definition
├── graph.js            # AdventureGraph class
├── gameData.js         # Room definitions and connections
├── game.js             # Main game engine
└── debug.js            # Debug visualization logic
```

## � How to Play

1. Open `index.html` in a web browser
2. **Your Mission**: Survive the night and escape via the roof!

### Commands:
- **Movement**: `north`, `south`, `east`, `west`, `up`, `down` (or `n`, `s`, `e`, `w`, `u`, `d`)
- **Items**: `take [item]`, `drop [item]`, `use [item]`, `examine [item]`
- **Info**: `inventory` (or `i`), `look` (or `l`), `stats`, `exits`, `help`, `tips`
- **Special**: `escape` (when on the roof), `remove fuse` (to de-power building)
- **Debug**: `debug` (opens visualization in new window)

### Puzzle Solution (Spoilers!):

<details>
<summary>Click to reveal complete walkthrough</summary>

#### Main Path:
1. 🔦 **Security Office** (start): Take **flashlight**, **keycard**, and **coffee**
2. 🍕 **Break Room**: Get **basement-key**, **energy drink**, and **first aid**
3. 🧪 **Supply Closet**: Get the **fuse** (critical!)
4. ☣️ **Claims Department** (DANGEROUS - toxic fumes!): Get **first aid**
5. 🚪 In Claims, **USE basement-key** to unlock the basement door
6. ⚡ **Basement**: Go DOWN to explore the basement area
7. 🌊 **Sub-basement**: Get the **elevator-key** (water is safe initially)
8. 💡 **Server Room**: **USE fuse** to restore power (clears Claims & Cafeteria toxins!)
9. ⚠️ **WARNING**: The sub-basement water is now ELECTRIFIED - don't go back!
10. 🏢 **Lobby**: **USE elevator-key** to activate the elevator
11. 🆙 Go UP to the **Roof**
12. 🪜 Type **ESCAPE** to climb down the fire escape and WIN!

#### Secret Path (Optional):
- 🔧 **Garage**: Get **crowbar**
- � **Storage Room**: **USE crowbar** to open the locked cabinet
- 🔍 **EXAMINE cabinet** (or **EXAMINE wall**) to discover the secret tunnel!
- 🚇 **Maintenance Tunnel**: Secret passage to bypass the basement-key requirement
- This tunnel leads directly to the basement area

#### Important Items:
- **Fuse** (Supply Closet) → Restores power in Server Room
- **Basement Key** (Break Room) → Unlocks Claims → Basement door
- **Elevator Key** (Sub-basement) → Activates elevator in Lobby
- **Crowbar** (Garage) → Opens storage cabinet (optional secret path)

#### Power Puzzle:
- ⚡ Power OFF: Claims dangerous, Cafeteria dangerous, Sub-basement SAFE
- ⚡ Power ON: Claims safe, Cafeteria safe, Sub-basement DANGEROUS (electrified water!)
- You can REMOVE the fuse from the Server Room panel to toggle power

#### Dangerous Rooms:
- Claims (toxic fumes) - safe after power restored
- Cafeteria (toxic mold) - safe after power restored  
- Data Center (fire) - use **fire extinguisher** to clear
- Mechanical Room (steam) - use **wrench** to fix
- Research Lab (biohazard) - requires **gas mask** or **hazmat suit**
- Sub-basement (electrified water) - ONLY when power is ON

</details>

### Tips:
- ❤️ Dangerous rooms drain health - don't stay too long!
- ⚡ Movement drains energy - use energy drinks to restore
- 🩹 Use medkits to heal in emergencies
- 📊 Watch your health/energy bars at the top

3. Type **debug** to open the graph visualization (hidden feature!)

## 🐛 Debug Features

The debug view provides two visualization modes:

### ASCII View
- Text-based map of all rooms and connections
- Room details with descriptions
- Connection badges showing directional links
- Statistics overview

### Canvas View
- Interactive graph visualization
- Click and drag to pan
- Scroll to zoom
- Hover over nodes for room names
- Color-coded nodes (gold = start room)
- Directional arrows with labels
- Visual representation of the entire graph structure

## 🔧 Adding New Rooms

To add new rooms, edit `gameData.js`:

```javascript
// 1. Create a new room
const newRoom = new Room(
    "room_id",
    "Room Title",
    "Room description goes here..."
);

// 2. Add exits
newRoom
    .addExit("north", "other_room_id")
    .addExit("south", "another_room_id");

// 3. Add room to graph
graph.addRoom(newRoom);
```

## 🎨 Dark Survival Theme

The game features:
- 23 interconnected rooms in a dark office building
- Survival mechanics (health and energy management)
- Power puzzle system with reversible mechanics
- Secret passages and optional exploration paths
- Multiple dangerous environments requiring strategy
- Item-based puzzle solving
- Multi-level structure (roof, ground, basement, sub-basement)

## 🚀 Technical Highlights

- **Method Chaining**: Room and Graph classes support chaining for cleaner code
- **Graph Validation**: Automatically detects broken connections and unreachable rooms
- **Separation of Data and Logic**: Game data is separate from engine code
- **Debug-Friendly**: Multiple ways to inspect and visualize the game state
- **No Dependencies**: Pure vanilla JavaScript, HTML, and CSS
- **Responsive Design**: Works on different screen sizes

## 📊 Graph Statistics

The system automatically tracks:
- Total room count
- Total connections
- Average exits per room
- Reachable vs unreachable rooms
- Graph validation status

## 🎓 Learning Points

This project demonstrates:
- Object-oriented JavaScript design
- Graph data structures
- Canvas API for visualization
- Event-driven programming
- Clean code architecture
- Separation of concerns
- Data visualization techniques

## 🤝 Contributing

To extend the game:
1. Add new rooms in `gameData.js`
2. Extend Room or Graph classes for new features
3. Add new commands in the Game class
4. Enhance visualizations in `debug.js`

