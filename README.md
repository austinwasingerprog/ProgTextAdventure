# Flo's Adventure - Progressive Insurance Text Adventure

A well-architected text adventure game with a Progressive Insurance theme, featuring a clean graph-based room system and powerful debug visualization tools.

## 🎮 Features

- **5 Themed Rooms**: Explore Progressive Insurance headquarters
  - Lobby (starting point)
  - Claims Processing Department
  - Name Your Price Tool Lab
  - Marketing & Advertising Department
  - Executive Conference Room

- **Robust Architecture**:
  - Clean separation of concerns (Room, Graph, Game classes)
  - Easy-to-debug graph structure
  - Static generation with simple data configuration
  - Graph validation to catch broken connections

- **Debug Visualization**:
  - ASCII map view with room connections
  - Interactive HTML Canvas graph with pan and zoom
  - Detailed room information cards
  - Visual connection mapping

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
- **Movement**: `north`, `south`, `east`, `west`, `up`, `down` (or `n`, `s`, `e`, `w`)
- **Items**: `take [item]`, `drop [item]`, `use [item]`, `examine [item]`
- **Info**: `inventory` (or `i`), `look` (or `l`), `stats`, `exits`, `help`
- **Special**: `escape` (when on the roof)

### Puzzle Solution (Spoilers!):
1. 🔦 Take the **flashlight** and **keycard** from Security Office
2. 🔑 Go to Server Room and find the **basement-key**
3. ☣️ Navigate to Claims Department (DANGEROUS - toxic fumes!)
4. 🚪 **USE the basement-key** in Claims to unlock the basement door
5. ⚡ Go DOWN to the basement (DANGEROUS - electrified water!)
6. 🔧 Take the **fuse** from the basement
7. 💡 **USE the fuse** in the basement to restore power (clears toxins!)
8. 🏢 Return to Lobby and go UP (elevator now works!)
9. 🪜 On the Roof, type **ESCAPE** to climb down and WIN!

### Tips:
- ❤️ Dangerous rooms drain health - don't stay too long!
- ⚡ Movement drains energy - use energy drinks to restore
- 🩹 Use medkits to heal in emergencies
- 📊 Watch your health/energy bars at the top

3. Click the "🐛 DEBUG VIEW" button to see the graph visualization

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

## 🎨 Progressive Insurance Theme

The game features:
- Flo the Progressive spokesperson
- Name Your Price Tool
- Claims processing
- Marketing campaigns
- Corporate setting

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

## 📝 License

Free to use and modify for learning purposes!

---

Enjoy exploring Progressive Insurance headquarters with Flo! 🏢✨
