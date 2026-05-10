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

## 🛠️ Step-by-Step Setup Guide

Follow these instructions to get the full environment (Game, Backend, and Frontend) running locally.

### 📋 Prerequisites
Ensure you have the following installed:
- **Node.js** (v18 or higher) & **npm**
- **Unity Hub** & **Unity Editor** (2022.3 LTS or higher recommended)
- **Git**

---

### 🎮 1. Unity Game Setup (Core Gameplay)
The scripts in `/Scripts` are designed for a Unity 3D project.

1. **Create/Open Unity Project**: Open your Unity project or create a new 3D project.
2. **Import Scripts**: Copy the `Scripts/` folder into your Unity `Assets/` directory.
3. **Player Setup**:
    - Create a **Capsule** in your scene to represent the player.
    - Add a **Rigidbody** component to the capsule.
    - Attach the `ParkourController.cs` script to the capsule.
    - Set the Rigidbody's **Interpolate** setting to `Interpolate` for smooth movement.
    - In the `ParkourController` inspector, adjust speed, jump force, and dash settings as desired.
4. **Environment Setup**:
    - Ensure your floor and walls have **Colliders**.
    - The `ParkourController` uses raycasts for ground and wall detection. Ensure walls are vertical enough for the side-raycasts to hit.
5. **Difficulty Management**:
    - The `DifficultyManager.cs` is a **static utility class**. You don't need to attach it to a GameObject.
    - Other scripts (like the level generator or player) can call its methods directly: `DifficultyManager.GetCoyoteTime(currentLevel)`.

---

### 💻 2. Backend Setup (Leaderboard API)
The backend manages player scores using an Express server and SQLite.

1. **Navigate to Backend**:
   ```bash
   cd backend
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Run the Server**:
   ```bash
   node server.js
   ```
   - The server will start on `http://localhost:5000`.
   - It will automatically create a `database.sqlite` file and the `leaderboard` table if they don't exist.

---

### 🌐 3. Frontend Setup (Web Dashboard)
The frontend displays the global leaderboard using React and Vite.

1. **Navigate to Frontend**:
   ```bash
   cd frontend
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Configure API Endpoint** (Optional):
   - Ensure the frontend is pointing to the correct backend URL (default is `http://localhost:5000`).
4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   - Open your browser to the URL provided by Vite (usually `http://localhost:5173`).

---

### 🔗 4. Connecting Game to Backend
To send scores from Unity to the Backend:
- Use Unity's `UnityWebRequest` to send a **POST** request to `http://localhost:5000/api/score`.
- JSON Body: `{ "playerName": "YourName", "levelReached": 42 }`.

*For the complete game logic and progression philosophy, refer to the [GDD.md](file:///Users/saksham/Documents/TheHundredthFall/GDD.md) file.*
