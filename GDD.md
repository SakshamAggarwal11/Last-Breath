# Game Design Document: The Hundredth Fall

## 1. Core Concept
**"The Hundredth Fall"** is a fast-paced, mechanically demanding 3D parkour platformer consisting of exactly 100 levels. The game is designed to be highly addictive, with an exponential difficulty curve that makes it statistically "impossible" for the average player to finish. Every level is structurally and mechanically "10x harder" than the last, scaling through a combination of precision timing, cognitive overload, and complex hazards.

## 2. Visual & Audio Aesthetics
**Failing must be fun, not frustrating.**
*   **Visual Style:** High-contrast, neon-minimalist or "synth-wave Tron." The player and critical path platforms emit bright, distinct colors against a deep, dark void. This ensures instant readability at high speeds.
*   **Animations:** Exaggerated, comedic death animations. Instead of a gruesome ragdoll, the player explodes into neon confetti, shatters like glass with a satisfying *tink*, or instantly rewinds with a VHS glitch effect.
*   **Audio:** High-BPM drum-and-bass or phonk music that dynamically intensifies. Sound effects should be snappy (a satisfying "clack" for wall-runs, a deep "whoosh" for dashes).

## 3. Core Player Mechanics (The Parkour System)
The player controls a highly agile character. Movement must feel perfectly fluid with zero input lag.
*   **Sprint & Momentum:** Speed increases incrementally the longer the player runs forward without hitting a wall or stopping.
*   **Coyote Time & Input Buffer:** Extremely tight, responsive controls. The player can jump slightly *after* leaving a ledge (Coyote Time), and jumps pressed slightly *before* landing will queue and execute immediately upon touchdown (Jump Buffer).
*   **Moveset:**
    *   **Jump & Mid-Air Dash:** Omni-directional dash.
    *   **Wall-Running:** Running along vertical surfaces with gravity heavily reduced.
    *   **Ledge Grabbing:** Automatically hoisting up if hitting the upper edge of a platform.
    *   **Sliding:** Passing under low obstacles without losing momentum.

## 4. The 10x Difficulty Curve Progression
Instead of literal 10x stat multiplication, the difficulty scales through reduced safety margins and increased cognitive load.

### Levels 1-10 (The Illusion of Hope)
*   **Focus:** Basic platforming mechanics.
*   **Elements:** Simple jumps, basic wall-runs, static neon spikes.
*   **Level 1:** A simple jump.
*   **By Level 10:** The player must chain a jump into a wall-run, ending with a mid-air dash to a static platform.

### Levels 11-30 (The Skill Check)
*   **Focus:** Dynamic environments and timing.
*   **Elements:** Platforms begin to move, rotate, and crumble upon contact.
*   **Scaling:** Safe zones (platform sizes) shrink by 10% each level. Timing windows for jumps tighten.

### Levels 31-60 (Cognitive Overload)
*   **Focus:** Tracking and misdirection.
*   **Elements:** Homing hazards (laser grids, seeking orbs). Wind tunnels that aggressively alter momentum. Introduction of "fake" platforms that shatter instantly.
*   **Scaling:** Jump timing windows drop from seconds to milliseconds. The player must plan routes on the fly.

### Levels 61-90 (Psychological Warfare)
*   **Focus:** Sensory and mechanical manipulation.
*   **Elements:** Inverted gravity zones mid-jump. The lights periodically turn off, requiring memory-based execution. Controls briefly reverse in specific colored zones. Obstacles move at hyper-speed.
*   **Scaling:** Margins for error are practically zero. Frame-perfect dashes are heavily required to slip between crushing walls.

### Levels 91-100 (The Impossible Realm)
*   **Focus:** Absolute perfection.
*   **Elements:** Frame-perfect inputs are the *only* way forward. The floor is an ascending void/lava rising at the player's exact maximum speed. Invisible walls force specific tight corridors. Screen glitches and audio distractions actively attempt to throw off rhythm. Zero checkpoints.
*   **Level 100:** A 3-minute, flawless, continuous sequence of pixel-perfect button presses. A masterclass in rhythmic muscle memory.
