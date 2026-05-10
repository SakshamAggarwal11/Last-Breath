# The Hundredth Fall

**"The Hundredth Fall"** is a fast-paced, mechanically demanding 3D parkour platformer consisting of exactly 100 levels. Designed to be highly addictive with an exponential difficulty curve, the game scales through a combination of precision timing, cognitive overload, and complex hazards—making it statistically "impossible" for the average player to finish.

## 🚀 Core Features

- **100 Levels of Escalating Madness**: Every level structurally and mechanically increases in difficulty, evolving from simple jumps to frame-perfect inputs in inverted gravity zones.
- **Fluid Parkour Mechanics**: Experience zero input lag with a tight movement system including sprint momentum, coyote time, jump buffers, mid-air dashes, wall-running, ledge grabs, and sliding.
- **Neon-Minimalist Aesthetics**: A visually striking "synth-wave Tron" style that ensures instant readability at high speeds, paired with a dark void backdrop.
- **Dynamic Audio**: A high-BPM drum-and-bass/phonk soundtrack that dynamically intensifies alongside your progression.
- **Fun Failures**: Gruesome ragdolls are replaced with satisfying death animations like neon confetti explosions, glass shattering, and VHS glitch rewinds.

## 📈 The Difficulty Curve

The game scales difficulty not by literal stat multiplication, but through reduced safety margins and increased cognitive load:

- **Levels 1-10 (The Illusion of Hope)**: Basic platforming, simple jumps, and static hazards.
- **Levels 11-30 (The Skill Check)**: Moving platforms, crumbling floors, shrinking safe zones, and tighter timing windows.
- **Levels 31-60 (Cognitive Overload)**: Homing hazards, wind tunnels, fake platforms, and millisecond jump windows.
- **Levels 61-90 (Psychological Warfare)**: Inverted gravity, sensory deprivation (lights off), reversed controls, and hyper-speed obstacles.
- **Levels 91-100 (The Impossible Realm)**: Frame-perfect requirements, ascending void/lava, invisible walls, and zero checkpoints. Level 100 is a flawless 3-minute sequence of pixel-perfect execution.

## 🏗️ Architecture & Tech Stack

"The Hundredth Fall" is composed of multiple interconnected systems:

- **Game Engine (Core Gameplay)**: Built using C# (`Scripts/ParkourController.cs`, `DifficultyManager.cs`), handling the physics, parkour mechanics, and dynamic difficulty scaling.
- **Backend Service**: A Node.js and Express server (`/backend/server.js`) that manages the global leaderboard using an SQLite database (`database.sqlite`). It exposes RESTful APIs to submit and retrieve player scores.
- **Frontend Dashboard**: A fast, responsive web interface built with React and Vite (`/frontend`). This serves as the public-facing leaderboard and player stat tracking dashboard.

## 📁 Project Structure

```text
TheHundredthFall/
├── Scripts/         # Core C# gameplay scripts (Parkour mechanics, Difficulty management)
├── backend/         # Node.js/Express server for API and SQLite database
├── frontend/        # React + Vite web application for the leaderboard UI
├── GDD.md           # Master Game Design Document with complete mechanics
└── README.md        # Project overview and setup instructions
```

## 🎮 Development & Setup

### Running the Backend (Leaderboard API)
1. Navigate to the `backend/` directory: `cd backend`
2. Install dependencies: `npm install`
3. Start the server: `node server.js` (Runs on `http://localhost:5000`)

### Running the Frontend (Web Dashboard)
1. Navigate to the `frontend/` directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the Vite development server: `npm run dev`

*For more in-depth details on the game's mechanics, level design, and progression philosophy, refer to the `GDD.md` file.*
