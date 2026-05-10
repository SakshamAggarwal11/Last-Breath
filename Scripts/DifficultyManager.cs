using UnityEngine;

/// <summary>
/// This class handles the mathematical formulation of the "10x harder" difficulty curve
/// across 100 levels. It uses logarithmic decay and exponential growth to scale 
/// mechanics so the game feels intensely difficult but remains mathematically playable.
/// </summary>
public static class DifficultyManager
{
    private const int MAX_LEVEL = 100;

    // --- COYOTE TIME (The safety window for jumping off ledges) ---
    // Starts at a generous 0.2s, drops to near frame-perfect 0.016s (1 frame at 60fps)
    public static float GetCoyoteTime(int currentLevel)
    {
        float maxCoyote = 0.2f;
        float minCoyote = 0.016f;
        float normalizedLevel = (float)currentLevel / MAX_LEVEL;
        
        // Logarithmic decay: drops quickly early on, then tightens agonizingly slow
        return Mathf.Lerp(maxCoyote, minCoyote, EvaluateLogarithmicCurve(normalizedLevel));
    }

    // --- HAZARD SPEED (How fast moving platforms/lasers travel) ---
    // Multiplier for base speed. Maxes out at a brutal 5x base speed.
    public static float GetHazardSpeedMultiplier(int currentLevel)
    {
        float baseMultiplier = 1.0f;
        float maxMultiplier = 5.0f;
        float normalizedLevel = (float)currentLevel / MAX_LEVEL;

        // Exponential growth: starts manageable, spikes insanely around level 70
        return Mathf.Lerp(baseMultiplier, maxMultiplier, EvaluateExponentialCurve(normalizedLevel));
    }

    // --- PLATFORM SIZE (The safe landing zones) ---
    // Percentage size of platforms. Drops from 100% to roughly 20% (barely wider than the player)
    public static float GetPlatformScale(int currentLevel)
    {
        float maxScale = 1.0f;
        float minScale = 0.2f; // Assuming 0.2 is the absolute physical minimum to stand on
        float normalizedLevel = (float)currentLevel / MAX_LEVEL;

        return Mathf.Lerp(maxScale, minScale, EvaluateLogarithmicCurve(normalizedLevel));
    }

    // --- RISING LAVA/VOID SPEED ---
    // Determines how fast the death floor rises.
    // By level 100, it perfectly matches the player's max sprint speed.
    public static float GetRisingVoidSpeed(int currentLevel, float playerMaxSpeed)
    {
        if (currentLevel < 90) 
            return 0f; // Only active in the Impossible Realm

        float normalizedRealm = (float)(currentLevel - 90) / 10f; // 0 to 1 over last 10 levels
        
        float baseSpeed = playerMaxSpeed * 0.85f; // Hard but possible to outrun
        float brutalSpeed = playerMaxSpeed * 0.99f; // Requires absolute perfection

        return Mathf.Lerp(baseSpeed, brutalSpeed, EvaluateExponentialCurve(normalizedRealm));
    }

    // --- Helper Curves ---
    
    // Returns 0 to 1 on an exponential curve (slow start, fast end)
    private static float EvaluateExponentialCurve(float t)
    {
        t = Mathf.Clamp01(t);
        return t * t * t; // Cubic curve for a sharp late-game spike
    }

    // Returns 0 to 1 on a logarithmic/inverse curve (fast start, slow end)
    private static float EvaluateLogarithmicCurve(float t)
    {
        t = Mathf.Clamp01(t);
        return 1f - Mathf.Pow(1f - t, 3f); // Fast decay that bottoms out
    }
}
