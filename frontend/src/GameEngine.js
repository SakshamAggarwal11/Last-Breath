export class GameEngine {
    constructor(canvas, level, onDeath, onWin, onJumpscare) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.onDeath = onDeath;
        this.onWin = onWin;
        this.onJumpscare = onJumpscare;
        
        this.level = level;
        this.isGhostLevel = (level % 10 === 0);
        this.anomalyType = this.isGhostLevel ? Math.floor(level / 10) : 0;
        
        this.isRunning = false;
        this.keys = {};
        
        this.player = {
            x: 0, y: 0, w: 40, h: 40,
            vx: 0, vy: 0,
            speed: (this.anomalyType === 2) ? 15 : (this.isGhostLevel ? 10 : 7), 
            jumpForce: (this.anomalyType === 2) ? -25 : (this.isGhostLevel ? -20 : -17), 
            gravity: (this.anomalyType === 2) ? 1.8 : (this.isGhostLevel ? 1.2 : 0.9),
            gravityMod: 1, // For gravity flip trap
            reversed: false, // For reverse controls trap
            isGrounded: false,
            color: '#ff2a2a'
        };

        this.entities = { platforms: [], spikes: [], goal: null, triggers: [], hazards: [] };
        
        this.camera = { x: 0, y: 0 };
        this.shake = 0;
        
        this.particles = [];
        this.goalPulse = 0;
        this.voidX = -600; // The creeping void
        
        this.seed = this.level * 99999;

        this.bindEvents();
    }

    random() {
        let t = this.seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }

    resize(w, h) {
        this.width = w; this.height = h;
    }

    start() {
        this.generateProceduralLevel();
        this.isRunning = true;
        this.loop();
    }

    destroy() {
        this.isRunning = false;
        window.removeEventListener('keydown', this.keydown);
        window.removeEventListener('keyup', this.keyup);
    }

    bindEvents() {
        this.keydown = (e) => { this.keys[e.code] = true; };
        this.keyup = (e) => { this.keys[e.code] = false; };
        window.addEventListener('keydown', this.keydown);
        window.addEventListener('keyup', this.keyup);
    }

    generateProceduralLevel() {
        this.dead = false;
        this.voidX = -800; // Reset the creeping void
        
        // Reset seed so the level generates the same every time!
        this.seed = this.level * 99999;
        
        this.entities = { platforms: [], spikes: [], goal: null, triggers: [], hazards: [] };
        let cy = this.height / 2;
        
        this.player.x = 200;
        this.player.y = cy - 100;

        // Difficulty scaling multiplier
        let diff = (this.level / 100); 
        let segmentCount = 4 + Math.floor(this.level / 3); // Massively increased segment count
        if (this.isGhostLevel) segmentCount *= 1.5;  

        let lastX = 0;
        
        // Start pad
        this.entities.platforms.push({ x: 0, y: cy + 100, w: 500, h: 500, color: '#222' });
        lastX = 500;

        // Max trap index scales with level (0 to 8)
        let maxTrap = Math.min(8, 4 + Math.floor(this.level / 10));

        let getTrapForSegment = (i) => {
            if (this.level === 1) return 9; // Basic spikes
            if (this.level === 2) return 0; // Falling floor
            if (this.level === 3) return 1; // Invisible ceiling
            if (this.level === 4) return 4; // Sawblades
            if (this.level === 5) return 5; // Reverse Control
            if (this.level === 6) return 6; // Bouncer
            if (this.level === 7) return 8; // Gravity Portal
            if (this.level === 8) return 7; // Phantom floor
            if (this.level === 9) return i % 9; // Mix of all

            // Level 11+ Thematic mixes
            if (this.level > 10 && !this.isGhostLevel) {
                let theme = this.level % 5;
                if (theme === 0) return (this.random() > 0.5) ? 4 : 8; // Saw + Gravity
                if (theme === 1) return (this.random() > 0.5) ? 6 : 1; // Bouncer + Invisible
                if (theme === 2) return (this.random() > 0.5) ? 0 : 7; // Falling + Phantom
                if (theme === 3) return (this.random() > 0.5) ? 5 : 9; // Reverse + Spikes
            }
            return Math.floor(this.random() * (maxTrap + 1)); // Pure Chaos for ghost/default
        };

        // Random Traps generation
        for (let i = 0; i < segmentCount; i++) {
            let trapType = getTrapForSegment(i);
            // Gaps scale up to 250px (near max jump distance) as difficulty increases
            let gap = 100 + (diff * 50) + this.random() * (80 + 20 * diff); 
            
            if (trapType === 0) {
                // Falling floor with safe platform immediately after + warning shake
                let trapFloor = { x: lastX + gap, y: cy + 100, w: 150, h: 500, color: '#222', shakeTimer: 0 };
                this.entities.platforms.push(trapFloor);
                this.entities.triggers.push({
                    x: trapFloor.x, y: trapFloor.y - 40, w: trapFloor.w, h: 50, triggered: false,
                    onEnter: () => {
                        this.onJumpscare();
                        this.shake = 10;
                        trapFloor.shakeTimer = 20; // 20 frames warning to allow time to react
                        trapFloor.color = '#800';
                    }
                });
                lastX = trapFloor.x + trapFloor.w;
                
                let safeFloor = { x: lastX, y: cy + 100, w: 200, h: 500, color: '#222' };
                this.entities.platforms.push(safeFloor);
                lastX = safeFloor.x + safeFloor.w;
            } 
            else if (trapType === 1) {
                // Invisible ceiling block
                let safeFloor = { x: lastX + gap, y: cy + 100, w: 300, h: 500, color: '#222' };
                this.entities.platforms.push(safeFloor);
                this.entities.triggers.push({
                    x: safeFloor.x + 50, y: 0, w: 100, h: cy + 50, triggered: false,
                    onEnter: () => {
                        this.onJumpscare();
                        this.entities.platforms.push({ x: safeFloor.x + 50, y: cy - 20, w: 100, h: 50, color: '#900' });
                        this.shake = 20;
                    }
                });
                lastX = safeFloor.x + safeFloor.w;
            }
            else if (trapType === 2) {
                // Fake spikes that drop (using hazards array to avoid physics glitches)
                let p = { x: lastX + gap, y: cy + 100, w: 400, h: 500, color: '#222' };
                this.entities.platforms.push(p);
                // Real spikes
                for(let s=0; s<3; s++) {
                    this.entities.spikes.push({ x: p.x + 100 + (s*40), y: p.y - 40, w: 40, h: 40 });
                }
                // Fake spikes from ceiling
                let fakeSpike = { x: p.x + 250, y: -100, w: 100, h: 100, dropping: false, isCrusher: true };
                this.entities.triggers.push({
                    x: p.x + 150, y: 0, w: 50, h: this.height, triggered: false,
                    onEnter: () => {
                        this.onJumpscare();
                        fakeSpike.dropping = true;
                    }
                });
                this.entities.hazards.push(fakeSpike);
                lastX = p.x + p.w;
            }
            else if (trapType === 3) {
                // Impossible gap with invisible bridge
                let bigGap = 300 + this.random() * 50; 
                let invisibleBridge = { x: lastX + 100, y: cy + 100, w: 150, h: 500, color: '#222', isHidden: true }; 
                this.entities.platforms.push(invisibleBridge);
                
                this.entities.triggers.push({
                    x: lastX + 50, y: 0, w: 50, h: this.height, triggered: false,
                    onEnter: () => { 
                        invisibleBridge.isHidden = false; 
                        this.onJumpscare(); 
                    } 
                });
                
                let nextP = { x: lastX + bigGap, y: cy + 100, w: 300, h: 500, color: '#222' };
                this.entities.platforms.push(nextP);
                lastX = nextP.x + nextP.w;
            }
            else if (trapType === 4) {
                // Moving Sawblade
                let p = { x: lastX + gap, y: cy + 100, w: 600, h: 500, color: '#222' };
                this.entities.platforms.push(p);
                // Sawblade speed scales heavily with difficulty
                let sawSpeed = 8 + (12 * diff);
                let saw = { x: p.x + 200, y: p.y - 20, r: 20, isSaw: true, minX: p.x + 100, maxX: p.x + 500, vx: sawSpeed, angle: 0 };
                this.entities.hazards.push(saw);
                lastX = p.x + p.w;
            }
            else if (trapType === 5) {
                // Reverse Control Zone
                let p = { x: lastX + gap, y: cy + 100, w: 400, h: 500, color: '#200' };
                this.entities.platforms.push(p);
                this.entities.triggers.push({
                    x: p.x, y: 0, w: p.w, h: this.height, triggered: false,
                    isZone: true,
                    onEnter: () => { this.player.reversed = true; },
                    onExit: () => { this.player.reversed = false; }
                });
                lastX = p.x + p.w;
            }
            else if (trapType === 6) {
                // The Bouncer (Trampoline into ceiling spikes)
                let p = { x: lastX + gap, y: cy + 100, w: 300, h: 500, color: '#222' };
                this.entities.platforms.push(p);
                let trampoline = { x: p.x + 100, y: p.y - 20, w: 100, h: 20, color: '#0a0', isBouncer: true };
                this.entities.platforms.push(trampoline);
                for(let s=0; s<4; s++) {
                    this.entities.spikes.push({ x: p.x + 70 + (s*40), y: cy - 200, w: 40, h: 40, isCeiling: true });
                }
                lastX = p.x + p.w;
            }
            else if (trapType === 7) {
                // Phantom Floor (disappears when jumped from)
                let p = { x: lastX + gap, y: cy + 100, w: 200, h: 500, color: '#444', isPhantom: true };
                this.entities.platforms.push(p);
                lastX = p.x + p.w;
            }
            else if (trapType === 8) {
                // Gravity Flip
                let p = { x: lastX + gap, y: cy + 100, w: 500, h: 500, color: '#222' };
                this.entities.platforms.push(p);
                let portalIn = { x: p.x + 100, y: p.y - 150, w: 20, h: 150, color: '#00f', isPortal: true, flipTo: -1 };
                this.entities.hazards.push(portalIn);
                let ceiling = { x: p.x + 50, y: cy - 250, w: 400, h: 50, color: '#222' };
                this.entities.platforms.push(ceiling);
                let portalOut = { x: p.x + 400, y: cy - 200, w: 20, h: 150, color: '#f00', isPortal: true, flipTo: 1 };
                this.entities.hazards.push(portalOut);
                lastX = p.x + p.w;
            }
            else {
                // Spike field on a platform
                let p = { x: lastX + gap, y: cy + 100, w: 400, h: 500, color: '#222' };
                this.entities.platforms.push(p);
                for(let s=0; s<3; s++) {
                    this.entities.spikes.push({ x: p.x + 100 + (s*40), y: p.y - 40, w: 40, h: 40 });
                }
                lastX = p.x + p.w;
            }
        }

        // Anomaly 3: Wall of Flesh
        if (this.anomalyType === 3) {
            this.entities.hazards.push({
                x: -600, y: 0, w: 600, h: this.height, 
                color: '#900', isWall: true, vx: this.player.speed - 1
            });
        }

        // Final Goal Area Setup
        let endP = { x: lastX + 100, y: cy + 100, w: 1000, h: 500, color: '#222' };
        this.entities.platforms.push(endP);
        
        // Void Orb Goal
        this.entities.goal = { x: endP.x + 200, y: cy, radius: 40 };
        
        // Final Troll: Goal runs away
        if (this.random() > 0.5 || this.isGhostLevel) {
            this.entities.triggers.push({
                x: endP.x, y: 0, w: 50, h: this.height, triggered: false,
                onEnter: () => { 
                    this.onJumpscare();
                    this.entities.goal.running = true; 
                }
            });
            // Spikes in the runner's path
            for(let s=0; s<12; s++) {
                this.entities.spikes.push({ x: endP.x + 400 + (s*40), y: cy + 60, w: 40, h: 40 });
            }
            // Floating platforms over the spikes to make it a parkour chase!
            this.entities.platforms.push({ x: endP.x + 450, y: cy, w: 80, h: 20, color: '#222' });
            this.entities.platforms.push({ x: endP.x + 650, y: cy - 50, w: 80, h: 20, color: '#222' });
        }
    }

    die() {
        if (this.dead) return; // Prevent infinite death loop!
        this.dead = true;
        this.onDeath();
        this.shake = 30;
        this.createParticles(this.player.x + this.player.w/2, this.player.y + this.player.h/2, 60, '#f00');
        
        // Instant Restart after brief flash
        this.player.vx = 0;
        this.player.vy = 0;
        setTimeout(() => this.generateProceduralLevel(), 10);
    }

    loop = () => {
        if (!this.isRunning) return;
        this.update();
        this.draw();
        requestAnimationFrame(this.loop);
    }

    update() {
        // Reversed controls in ghost levels sometimes!
        let leftKey = this.keys['ArrowLeft'] || this.keys['KeyA'];
        let rightKey = this.keys['ArrowRight'] || this.keys['KeyD'];
        
        if (this.isGhostLevel && this.level % 2 !== 0) {
            let temp = leftKey; leftKey = rightKey; rightKey = temp; // Mind blown
        }

        if (leftKey) this.player.vx -= 2.0;
        if (rightKey) this.player.vx += 2.0;
        
        // Friction and limits
        this.player.vx *= 0.8;
        if (this.player.vx > this.player.speed) this.player.vx = this.player.speed;
        if (this.player.vx < -this.player.speed) this.player.vx = -this.player.speed;

        // Gravity
        this.player.vy += this.player.gravity * this.player.gravityMod;

        // Jump
        if (this.keys['Space'] && this.player.isGrounded) {
            this.player.vy = this.player.jumpForce * this.player.gravityMod;
            this.player.isGrounded = false;
            
            // Phantom floor logic (breaks when jumped from)
            if (this.player.currentPlatform && this.player.currentPlatform.isPhantom) {
                this.player.currentPlatform.broken = true;
            }
        }

        this.player.x += this.player.vx;
        this.handleCollisions(true); // Horizontal
        
        this.player.y += this.player.vy;
        this.player.isGrounded = false;
        this.player.currentPlatform = null;
        this.handleCollisions(false); // Vertical

        // Active Traps
        for (let i = this.entities.platforms.length - 1; i >= 0; i--) {
            let p = this.entities.platforms[i];
            if (p.broken) {
                this.entities.platforms.splice(i, 1);
                continue;
            }
            if (p.shakeTimer > 0) {
                p.shakeTimer--;
                if (p.shakeTimer <= 0) p.falling = true;
            }
            if (p.falling) p.y += 20; 
        }

        if (this.player.y > this.height + 200) this.die();

        // Hazards
        if (this.entities.hazards) {
            for (let p of this.entities.hazards) {
                if (p.dropping) {
                    p.y += 30; 
                    if (p.y > this.height) p.dropping = false;
                    
                    if (this.player.x < p.x + p.w && this.player.x + this.player.w > p.x &&
                        this.player.y < p.y + p.h && this.player.y + this.player.h > p.y) {
                        this.die();
                    }
                }
                
                if (p.isSaw) {
                    p.x += p.vx;
                    p.angle += 0.2;
                    if (p.x > p.maxX || p.x < p.minX) p.vx *= -1;
                    
                    // Circular collision
                    let dx = (this.player.x + this.player.w/2) - p.x;
                    let dy = (this.player.y + this.player.h/2) - p.y;
                    if (Math.sqrt(dx*dx + dy*dy) < p.r + 20) {
                        this.die();
                    }
                }
                
                if (p.isPortal) {
                    if (this.player.x < p.x + p.w && this.player.x + this.player.w > p.x &&
                        this.player.y < p.y + p.h && this.player.y + this.player.h > p.y) {
                        this.player.gravityMod = p.flipTo;
                    }
                }
                
                if (p.isWall) {
                    p.x += p.vx;
                    if (this.player.x < p.x + p.w) {
                        this.die();
                    }
                }
            }
        }

        // Triggers
        for (let t of this.entities.triggers) {
            let inZone = (this.player.x < t.x + t.w && this.player.x + this.player.w > t.x &&
                this.player.y < t.y + t.h && this.player.y + this.player.h > t.y);
            
            if (inZone && !t.triggered) {
                t.triggered = true;
                if (t.onEnter) t.onEnter();
            } else if (!inZone && t.triggered && t.isZone) {
                t.triggered = false;
                if (t.onExit) t.onExit();
            }
        }

        // Goal logic
        if (this.entities.goal) {
            let g = this.entities.goal;
            this.goalPulse += 0.1;
            
            if (g.running) {
                g.x += this.player.speed + 1; // Runs slightly faster than player
                if (g.x > this.player.x + 800) g.running = false;
            }

            // Circle collision
            let dx = (this.player.x + this.player.w/2) - g.x;
            let dy = (this.player.y + this.player.h/2) - g.y;
            if (Math.sqrt(dx*dx + dy*dy) < g.radius + this.player.w/2) {
                this.onWin(this.level);
                this.entities.goal = null; // Consume goal
            }
        }

        // Spikes
        for (let s of this.entities.spikes) {
            if (this.player.x + 5 < s.x + s.w && this.player.x + this.player.w - 5 > s.x &&
                this.player.y + 5 < s.y + s.h && this.player.y + this.player.h > s.y + 10) {
                this.die();
            }
        }

        let targetCamX = this.player.x - this.width / 3;
        this.camera.x += (targetCamX - this.camera.x) * 0.1;

        if (this.shake > 0) this.shake *= 0.9;
        if (this.shake < 0.5) this.shake = 0;

        // The Creeping Void (Anti-Idle mechanic)
        // Moves faster on higher levels. Base speed 0.5, scales up to 4.5
        let voidSpeed = 0.5 + (this.level / 100) * 4.0;
        this.voidX += voidSpeed;
        if (this.player.x < this.voidX) {
            this.die();
        }

        this.particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= 0.05; });
        this.particles = this.particles.filter(p => p.life > 0);
    }

    handleCollisions(isX) {
        for (let p of this.entities.platforms) {
            if (this.player.x < p.x + p.w && this.player.x + this.player.w > p.x &&
                this.player.y < p.y + p.h && this.player.y + this.player.h > p.y) {
                
                if (isX) {
                    if (this.player.vx > 0) this.player.x = p.x - this.player.w;
                    else if (this.player.vx < 0) this.player.x = p.x + p.w;
                    this.player.vx = 0;
                } else {
                    if (this.player.vy > 0 && this.player.gravityMod === 1) {
                        this.player.y = p.y - this.player.h;
                        this.player.isGrounded = true;
                        this.player.currentPlatform = p;
                        if (p.isBouncer) this.player.vy = -35; // Boing!
                    } else if (this.player.vy < 0 && this.player.gravityMod === -1) {
                        this.player.y = p.y + p.h;
                        this.player.isGrounded = true;
                        this.player.currentPlatform = p;
                        if (p.isBouncer) this.player.vy = 35; 
                    } else if (this.player.vy < 0 && this.player.gravityMod === 1) {
                        this.player.y = p.y + p.h;
                        this.player.vy = 0;
                    } else if (this.player.vy > 0 && this.player.gravityMod === -1) {
                        this.player.y = p.y - this.player.h;
                        this.player.vy = 0;
                    }
                    this.player.vy = 0;
                }
            }
        }
    }

    createParticles(x, y, count, color) {
        for(let i=0; i<count; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 20,
                vy: (Math.random() - 0.5) * 20,
                life: 1, color
            });
        }
    }

    draw() {
        this.ctx.fillStyle = this.isGhostLevel ? '#fff' : '#050508'; 
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.save();
        if (this.shake > 0) {
            this.ctx.translate((Math.random()-0.5)*this.shake, (Math.random()-0.5)*this.shake);
        }
        
        this.ctx.translate(-this.camera.x, -this.camera.y);

        // Draw Platforms
        for (let p of this.entities.platforms) {
            if (p.isHidden) continue;
            
            this.ctx.fillStyle = this.isGhostLevel ? '#aaa' : p.color;
            this.ctx.fillRect(p.x, p.y, p.w, p.h);
            this.ctx.strokeStyle = this.isGhostLevel ? '#000' : '#111';
            this.ctx.lineWidth = 4;
            this.ctx.strokeRect(p.x, p.y, p.w, p.h);
        }

        // Draw Hazards
        if (this.entities.hazards) {
            for (let p of this.entities.hazards) {
                if (p.isHidden) continue;
                this.ctx.fillStyle = this.isGhostLevel ? '#aaa' : p.color;
                this.ctx.fillRect(p.x, p.y, p.w, p.h);
                this.ctx.strokeStyle = '#f00';
                this.ctx.lineWidth = 4;
                this.ctx.strokeRect(p.x, p.y, p.w, p.h);
                
                if(p.isCrusher) {
                     this.ctx.fillStyle = '#f00';
                     this.ctx.fillRect(p.x, p.y+p.h-10, p.w, 10);
                }
                
                if (p.isSaw) {
                    this.ctx.save();
                    this.ctx.translate(p.x, p.y);
                    this.ctx.rotate(p.angle);
                    this.ctx.fillStyle = '#aaa';
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, p.r, 0, Math.PI * 2);
                    this.ctx.fill();
                    // Saw teeth
                    this.ctx.fillStyle = '#fff';
                    for(let i=0; i<8; i++) {
                        this.ctx.fillRect(p.r - 4, -2, 8, 4);
                        this.ctx.rotate(Math.PI / 4);
                    }
                    this.ctx.restore();
                }
                
                if (p.isPortal) {
                    this.ctx.fillStyle = p.color;
                    this.ctx.fillRect(p.x, p.y, p.w, p.h);
                    this.ctx.strokeStyle = '#fff';
                    this.ctx.strokeRect(p.x, p.y, p.w, p.h);
                }
            }
        }

        // Draw Spikes
        this.ctx.fillStyle = this.isGhostLevel ? '#f00' : '#888';
        for (let s of this.entities.spikes) {
            this.ctx.beginPath();
            if (s.isCeiling) {
                this.ctx.moveTo(s.x, s.y);
                this.ctx.lineTo(s.x + s.w, s.y);
                this.ctx.lineTo(s.x + s.w/2, s.y + s.h);
            } else {
                this.ctx.moveTo(s.x, s.y + s.h);
                this.ctx.lineTo(s.x + s.w/2, s.y);
                this.ctx.lineTo(s.x + s.w, s.y + s.h);
            }
            this.ctx.fill();
        }

        // Draw Void Orb
        if (this.entities.goal) {
            let g = this.entities.goal;
            let pulse = Math.sin(this.goalPulse) * 10;
            
            this.ctx.beginPath();
            this.ctx.arc(g.x, g.y, g.radius + pulse/2, 0, Math.PI*2);
            this.ctx.fillStyle = '#000';
            this.ctx.fill();
            
            this.ctx.shadowBlur = 30 + pulse;
            this.ctx.shadowColor = '#f0f';
            this.ctx.strokeStyle = '#f0f';
            this.ctx.lineWidth = 4;
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
            
            // Inner eye
            this.ctx.fillStyle = '#f00';
            this.ctx.beginPath();
            this.ctx.arc(g.x, g.y, 10, 0, Math.PI*2);
            this.ctx.fill();
        }

        // Draw Player
        this.ctx.fillStyle = this.isGhostLevel ? '#000' : '#ff2a2a';
        this.ctx.shadowBlur = this.isGhostLevel ? 30 : 15;
        this.ctx.shadowColor = '#ff2a2a';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.w, this.player.h);
        
        // Eyes
        this.ctx.fillStyle = this.isGhostLevel ? '#f00' : '#fff';
        this.ctx.shadowBlur = 0;
        let eyeOffset = this.player.vx > 0 ? 5 : (this.player.vx < 0 ? -5 : 0);
        this.ctx.fillRect(this.player.x + 10 + eyeOffset, this.player.y + 10, 6, 6);
        this.ctx.fillRect(this.player.x + 24 + eyeOffset, this.player.y + 10, 6, 6);

        // Draw Particles
        for (let p of this.particles) {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life;
            this.ctx.fillRect(p.x, p.y, 6, 6);
        }
        this.ctx.globalAlpha = 1;

        // Anomaly 1: Pitch Black Spotlight
        if (this.anomalyType === 1) {
            let grad = this.ctx.createRadialGradient(
                this.player.x + this.player.w/2, this.player.y + this.player.h/2, 40,
                this.player.x + this.player.w/2, this.player.y + this.player.h/2, 250
            );
            grad.addColorStop(0, 'rgba(0,0,0,0)');
            grad.addColorStop(0.8, 'rgba(0,0,0,0.95)');
            grad.addColorStop(1, 'rgba(0,0,0,1)');
            
            this.ctx.fillStyle = grad;
            this.ctx.fillRect(this.camera.x, this.camera.y, this.width, this.height);
        }

        // Draw The Creeping Void
        this.ctx.fillStyle = 'rgba(20, 0, 0, 0.9)';
        this.ctx.fillRect(this.camera.x, this.camera.y, this.voidX - this.camera.x, this.height);
        // Void edge gradient
        let voidGrad = this.ctx.createLinearGradient(this.voidX, 0, this.voidX + 50, 0);
        voidGrad.addColorStop(0, 'rgba(20, 0, 0, 0.9)');
        voidGrad.addColorStop(1, 'rgba(20, 0, 0, 0)');
        this.ctx.fillStyle = voidGrad;
        this.ctx.fillRect(this.voidX, this.camera.y, 50, this.height);

        this.ctx.restore();
    }
}
