using UnityEngine;

[RequireComponent(typeof(Rigidbody))]
public class ParkourController : MonoBehaviour
{
    [Header("Movement Settings")]
    public float baseSpeed = 10f;
    public float maxSpeed = 25f;
    public float acceleration = 5f;
    public float jumpForce = 12f;

    [Header("Parkour Settings")]
    public float wallRunGravity = 2f;
    public float wallRunJumpForce = 15f;
    public float dashForce = 30f;
    public float dashCooldown = 1f;

    [Header("Feel & Polish (The 'Juice')")]
    public float coyoteTime = 0.15f;
    public float jumpBufferTime = 0.15f;
    
    // State Tracking
    private Rigidbody rb;
    private float currentSpeed;
    private float coyoteTimer;
    private float jumpBufferTimer;
    private float dashTimer;
    
    private bool isGrounded;
    private bool isWallRunning;
    private Vector3 wallNormal;

    void Start()
    {
        rb = GetComponent<Rigidbody>();
        rb.interpolation = RigidbodyInterpolation.Interpolate; // For smooth movement
        currentSpeed = baseSpeed;
    }

    void Update()
    {
        HandleTimers();
        HandleInput();
        CheckEnvironment();
    }

    void FixedUpdate()
    {
        ApplyMovement();
    }

    private void HandleTimers()
    {
        // Decrease timers
        if (coyoteTimer > 0) coyoteTimer -= Time.deltaTime;
        if (jumpBufferTimer > 0) jumpBufferTimer -= Time.deltaTime;
        if (dashTimer > 0) dashTimer -= Time.deltaTime;
    }

    private void HandleInput()
    {
        // Jump Buffering
        if (Input.GetButtonDown("Jump"))
        {
            jumpBufferTimer = jumpBufferTime;
        }

        // Execute Jump if buffered and within coyote time / grounded / wall running
        if (jumpBufferTimer > 0)
        {
            if (isGrounded || coyoteTimer > 0)
            {
                PerformJump(Vector3.up * jumpForce);
            }
            else if (isWallRunning)
            {
                Vector3 wallJumpDir = (Vector3.up + wallNormal).normalized;
                PerformJump(wallJumpDir * wallRunJumpForce);
            }
        }

        // Dash Input
        if (Input.GetKeyDown(KeyCode.LeftShift) && dashTimer <= 0)
        {
            PerformDash();
        }
    }

    private void CheckEnvironment()
    {
        // Raycast down for grounding
        bool wasGrounded = isGrounded;
        isGrounded = Physics.Raycast(transform.position, Vector3.down, 1.1f);

        // Coyote Time Logic
        if (wasGrounded && !isGrounded)
        {
            coyoteTimer = coyoteTime; // Just walked off an edge
        }
        else if (isGrounded)
        {
            coyoteTimer = coyoteTime; // Refresh while grounded
        }

        // Wall run detection
        RaycastHit rightHit, leftHit;
        bool wallRight = Physics.Raycast(transform.position, transform.right, out rightHit, 1f);
        bool wallLeft = Physics.Raycast(transform.position, -transform.right, out leftHit, 1f);

        isWallRunning = !isGrounded && (wallRight || wallLeft);
        if (isWallRunning)
        {
            wallNormal = wallRight ? rightHit.normal : leftHit.normal;
        }
    }

    private void ApplyMovement()
    {
        // Basic input direction
        float h = Input.GetAxisRaw("Horizontal");
        float v = Input.GetAxisRaw("Vertical");
        Vector3 moveDir = (transform.forward * v + transform.right * h).normalized;

        // Momentum building
        if (moveDir.magnitude > 0 && !isWallRunning)
        {
            currentSpeed = Mathf.MoveTowards(currentSpeed, maxSpeed, acceleration * Time.fixedDeltaTime);
        }
        else if (moveDir.magnitude == 0)
        {
            currentSpeed = baseSpeed;
        }

        if (isWallRunning)
        {
            // Wall run logic: reduced gravity, lock to wall direction
            rb.velocity = new Vector3(rb.velocity.x, -wallRunGravity, rb.velocity.z);
            Vector3 wallForward = Vector3.Cross(wallNormal, Vector3.up);
            // Ensure we run forward along the wall
            if ((transform.forward - wallForward).magnitude > (transform.forward - -wallForward).magnitude)
            {
                wallForward = -wallForward;
            }
            rb.AddForce(wallForward * currentSpeed, ForceMode.Acceleration);
        }
        else
        {
            // Normal Ground / Air movement
            Vector3 targetVelocity = moveDir * currentSpeed;
            targetVelocity.y = rb.velocity.y; // Keep vertical velocity
            rb.velocity = Vector3.Lerp(rb.velocity, targetVelocity, 10f * Time.fixedDeltaTime);
        }
    }

    private void PerformJump(Vector3 jumpVelocity)
    {
        // Reset vertical velocity for crisp jumps
        rb.velocity = new Vector3(rb.velocity.x, 0, rb.velocity.z); 
        rb.AddForce(jumpVelocity, ForceMode.Impulse);
        
        jumpBufferTimer = 0;
        coyoteTimer = 0;
    }

    private void PerformDash()
    {
        dashTimer = dashCooldown;
        rb.velocity = Vector3.zero; // Reset momentum for the dash
        rb.AddForce(transform.forward * dashForce, ForceMode.Impulse);
        // Tip: In a real implementation, you'd disable gravity for ~0.2s here for a true straight dash.
    }
}
