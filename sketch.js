/*
Meditative Camera World (p5.js)
- Scrolls through a world larger than the screen
- Smooth camera easing + gentle drift + soft parallax
- Hidden glyphs the camera "discovers" and you can collect (SPACE)

Controls:
- Move: WASD / Arrow keys
- Collect a glyph: hold SPACE near it
- Optional: click for a small ripple at the mouse (screen-space)

Note: This builds on the same camera translate approach as the Week 5 example. (world coords + translate(-cam))
*/

let player, cam;
const WORLD_W = 3600;
const WORLD_H = 2200;

const VIEW_W = 900;
const VIEW_H = 540;

let stars = [];
let motes = [];
let glyphs = [];
let ripples = [];

let discoveredCount = 0;
let collectedCount = 0;

function setup() {
  createCanvas(VIEW_W, VIEW_H);
  textFont("sans-serif");
  noStroke();

  player = {
    x: WORLD_W * 0.5,
    y: WORLD_H * 0.55,
    r: 12,
    // “emotional pacing”: max speed is low, and accelerates softly
    vX: 0,
    vY: 0,
    max: 2.25,
  };

  cam = { x: 0, y: 0, targetX: 0, targetY: 0 };

  // Background “stars” (parallax far layer)
  for (let i = 0; i < 280; i++) {
    stars.push({
      x: random(WORLD_W),
      y: random(WORLD_H),
      s: random(0.6, 2.2),
      tw: random(TWO_PI),
    });
  }

  // Floating motes (mid layer)
  for (let i = 0; i < 140; i++) {
    motes.push(makeMote());
  }

  // Hidden glyphs: scattered symbols for discovery/collection
  // (They’re not shown on the HUD map; they reveal when camera sees them.)
  const symbols = ["✶", "✷", "✹", "❂", "❀", "✦", "✧", "✩", "✺", "✻"];
  for (let i = 0; i < 26; i++) {
    glyphs.push({
      id: i,
      x: random(120, WORLD_W - 120),
      y: random(120, WORLD_H - 120),
      ch: random(symbols),
      discovered: false,
      collected: false,
      // subtle “alive” animation
      seed: random(1000),
      // how close to collect
      radius: random(28, 44),
      pulse: 0,
    });
  }
}

function draw() {
  const t = millis() * 0.001;

  // --------- 1) UPDATE (WORLD) ---------
  updatePlayer(t);
  updateCamera(t);
  updateMotes(t);
  updateGlyphs(t);
  updateRipples(t);

  // --------- 2) DRAW (WORLD SPACE) ---------
  background(12);

  // Parallax far background (stars)
  drawParallaxStars(t);

  // Main world layer
  push();
  translate(-cam.x, -cam.y);

  drawWorldBase(t);
  drawMotesWorld(t);
  drawGlyphsWorld(t);
  drawPlayerWorld(t);
  drawWorldForegroundHints(t);

  pop();

  // --------- 3) DRAW (SCREEN SPACE / HUD) ---------
  drawVignette(t);
  drawRipplesScreen(t);
  drawHUD(t);
}

/* ----------------------- UPDATE ----------------------- */

function updatePlayer(t) {
  const dx =
    (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) -
    (keyIsDown(LEFT_ARROW) || keyIsDown(65));
  const dy =
    (keyIsDown(DOWN_ARROW) || keyIsDown(83)) -
    (keyIsDown(UP_ARROW) || keyIsDown(87));

  // Normalize so diagonals aren’t faster
  const len = max(1, abs(dx) + abs(dy));

  // “Soft acceleration”: rather than directly setting position
  const desiredVX = (dx / len) * player.max;
  const desiredVY = (dy / len) * player.max;

  // Slow, calming responsiveness
  player.vX = lerp(player.vX, desiredVX, 0.08);
  player.vY = lerp(player.vY, desiredVY, 0.08);

  // Slight drag for floaty feel
  player.vX *= 0.985;
  player.vY *= 0.985;

  player.x += player.vX;
  player.y += player.vY;

  // Keep player inside world bounds
  player.x = constrain(player.x, 30, WORLD_W - 30);
  player.y = constrain(player.y, 30, WORLD_H - 30);
}

function updateCamera(t) {
  // Target: center on player
  cam.targetX = player.x - width / 2;
  cam.targetY = player.y - height / 2;

  // Add subtle “breathing drift” to evoke emotion (very small)
  const driftX = sin(t * 0.55) * 9 + sin(t * 0.13) * 5;
  const driftY = cos(t * 0.48) * 8 + sin(t * 0.17) * 4;

  cam.targetX += driftX;
  cam.targetY += driftY;

  // Clamp camera so you can’t see beyond world edges
  cam.targetX = constrain(cam.targetX, 0, WORLD_W - width);
  cam.targetY = constrain(cam.targetY, 0, WORLD_H - height);

  // Smooth camera easing (meditative pacing)
  cam.x = lerp(cam.x, cam.targetX, 0.06);
  cam.y = lerp(cam.y, cam.targetY, 0.06);
}

function makeMote() {
  return {
    x: random(WORLD_W),
    y: random(WORLD_H),
    r: random(1.5, 4.5),
    a: random(50, 140),
    vx: random(-0.25, 0.25),
    vy: random(-0.22, 0.22),
    ph: random(TWO_PI),
  };
}

function updateMotes(t) {
  for (const m of motes) {
    m.ph += 0.01;
    m.x += m.vx + sin(m.ph) * 0.08;
    m.y += m.vy + cos(m.ph * 0.9) * 0.08;

    // wrap within world
    if (m.x < 0) m.x += WORLD_W;
    if (m.x > WORLD_W) m.x -= WORLD_W;
    if (m.y < 0) m.y += WORLD_H;
    if (m.y > WORLD_H) m.y -= WORLD_H;
  }
}

function updateGlyphs(t) {
  // Determine what the camera can see (viewport in world coords)
  const vx0 = cam.x;
  const vy0 = cam.y;
  const vx1 = cam.x + width;
  const vy1 = cam.y + height;

  for (const g of glyphs) {
    if (g.collected) continue;

    // “Discovery”: once glyph enters viewport, mark discovered
    const inView =
      g.x > vx0 - 40 && g.x < vx1 + 40 && g.y > vy0 - 40 && g.y < vy1 + 40;

    if (inView && !g.discovered) {
      g.discovered = true;
      discoveredCount++;
      g.pulse = 1.0; // highlight moment
    }

    // Gentle pulsing animation
    g.pulse = max(0, g.pulse - 0.03);

    // If near player, allow “collection” by holding SPACE
    const d = dist(player.x, player.y, g.x, g.y);
    const near = d < g.radius;

    if (near && keyIsDown(32)) {
      g.collected = true;
      collectedCount++;
      // add a world ripple where it was collected
      ripples.push({
        x: g.x,
        y: g.y,
        r: 0,
        a: 180,
        world: true,
      });
    }
  }
}

function updateRipples(t) {
  for (let i = ripples.length - 1; i >= 0; i--) {
    const r = ripples[i];
    r.r += 3.1;
    r.a -= 4.2;
    if (r.a <= 0) ripples.splice(i, 1);
  }
}

/* ----------------------- DRAW: BACKGROUND ----------------------- */

function drawParallaxStars(t) {
  // Parallax based on camera movement (far layer moves less)
  const px = cam.x * 0.25;
  const py = cam.y * 0.25;

  noStroke();
  for (const s of stars) {
    const tw = 0.6 + 0.4 * sin(t * 0.9 + s.tw);
    const x = s.x - px;
    const y = s.y - py;

    // Only draw stars that might be on screen (cheap cull)
    if (x < -50 || x > width + 50 || y < -50 || y > height + 50) continue;

    const a = 90 * tw;
    fill(230, 235, 255, a);
    circle(x, y, s.s);
  }

  // Subtle vertical gradient wash (screen space)
  for (let y = 0; y < height; y += 3) {
    const k = y / height;
    const a = lerp(35, 0, k);
    fill(50, 80, 120, a);
    rect(0, y, width, 3);
  }
}

/* ----------------------- DRAW: WORLD ----------------------- */

function drawWorldBase(t) {
  // Soft world “paper” base
  noStroke();
  fill(18, 26, 38);
  rect(0, 0, WORLD_W, WORLD_H);

  // Very faint “paths” (evokes wandering)
  stroke(40, 70, 95, 28);
  strokeWeight(2);

  for (let i = 0; i < 14; i++) {
    const x0 = (i * 260 + 120) % WORLD_W;
    const y0 = (i * 140 + 180) % WORLD_H;
    beginShape();
    for (let k = 0; k < 10; k++) {
      const x = x0 + k * 160 + sin(t * 0.2 + i + k) * 30;
      const y = y0 + sin(k * 0.9 + i) * 120 + cos(t * 0.18 + k) * 22;
      vertex(constrain(x, 0, WORLD_W), constrain(y, 0, WORLD_H));
    }
    endShape();
  }

  // Soft “islands” / shapes (still and quiet)
  noStroke();
  for (let i = 0; i < 26; i++) {
    const x = (i * 310 + 200) % WORLD_W;
    const y = (i * 190 + 260) % WORLD_H;
    const r = 80 + (i % 5) * 18;
    fill(25, 40, 55, 55);
    circle(x, y, r);
    fill(22, 36, 50, 40);
    circle(x + 22, y - 14, r * 0.72);
  }
}

function drawMotesWorld(t) {
  noStroke();
  for (const m of motes) {
    fill(210, 240, 255, m.a);
    circle(m.x, m.y, m.r);
  }
}

function drawGlyphsWorld(t) {
  textAlign(CENTER, CENTER);
  textSize(22);

  for (const g of glyphs) {
    if (g.collected) continue;

    const wob = 6 * sin(millis() * 0.001 * 0.9 + g.seed);
    const yy = g.y + wob;

    // If not discovered yet, keep it extremely subtle
    if (!g.discovered) {
      fill(200, 230, 255, 10);
      textSize(18);
      text(g.ch, g.x, yy);
      continue;
    }

    // Discovered: become clearer, gently pulsing
    const pulseA = 110 + 90 * sin(millis() * 0.001 * 1.2 + g.seed);
    const highlight = g.pulse * 160;

    // Outer glow ring
    noFill();
    stroke(200, 230, 255, 20 + highlight);
    strokeWeight(2);
    circle(g.x, g.y, g.radius * 2.1 + 10 * sin(millis() * 0.002 + g.seed));
    noStroke();

    // Symbol
    fill(220, 245, 255, pulseA + highlight);
    textSize(24);
    text(g.ch, g.x, yy);

    // If near, show a “soft hint” circle
    const d = dist(player.x, player.y, g.x, g.y);
    if (d < g.radius) {
      noFill();
      stroke(240, 250, 255, 110);
      strokeWeight(2);
      circle(g.x, g.y, g.radius * 2.2);
      noStroke();
    }
  }

  textAlign(LEFT, BASELINE);
}

function drawPlayerWorld(t) {
  // Player “lantern” feeling: inner bright + outer glow
  const v = createVector(player.vX, player.vY).mag();
  const breathe = 0.6 + 0.4 * sin(millis() * 0.001 * 1.1);
  const glow = 26 + breathe * 10 + v * 6;

  // Outer glow
  noStroke();
  fill(170, 220, 255, 30);
  circle(player.x, player.y, glow * 2.6);

  // Inner glow
  fill(200, 240, 255, 60);
  circle(player.x, player.y, glow * 1.7);

  // Core
  fill(235, 250, 255, 200);
  circle(player.x, player.y, player.r * 2);

  // Tiny direction “tail”
  const tailX = player.x - player.vX * 8;
  const tailY = player.y - player.vY * 8;
  fill(235, 250, 255, 110);
  circle(tailX, tailY, player.r * 1.2);
}

function drawWorldForegroundHints(t) {
  // Minimal “frame” corners in world (subtle anchors)
  noFill();
  stroke(255, 255, 255, 10);
  strokeWeight(2);

  // A few faint rectangles (like quiet monuments)
  for (let i = 0; i < 10; i++) {
    const x = (i * 520 + 380) % WORLD_W;
    const y = (i * 340 + 420) % WORLD_H;
    rect(x, y, 140, 90, 16);
  }

  noStroke();
}

/* ----------------------- SCREEN SPACE ----------------------- */

function drawVignette(t) {
  // Soft vignette to focus attention (emotion / calm)
  noStroke();
  for (let i = 0; i < 14; i++) {
    const a = map(i, 0, 13, 0, 70);
    fill(0, 0, 0, a);
    rect(-i * 2, -i * 2, width + i * 4, height + i * 4, 18);
  }

  // A slight “breathing” dimming
  const breathe = 0.5 + 0.5 * sin(t * 0.9);
  fill(0, 0, 0, 18 * breathe);
  rect(0, 0, width, height);
}

function drawHUD(t) {
  // HUD background strip
  noStroke();
  fill(0, 0, 0, 90);
  rect(12, 12, 360, 78, 14);

  fill(235);
  textSize(14);
  textAlign(LEFT, TOP);
  text("Meditative Camera Walk", 24, 20);

  fill(210);
  textSize(12);
  text("Move: WASD / Arrows", 24, 40);
  text("Collect near a symbol: hold SPACE", 24, 56);

  fill(210);
  text(
    "Discovered: " +
      discoveredCount +
      "/" +
      glyphs.length +
      "   Collected: " +
      collectedCount +
      "/" +
      glyphs.length,
    24,
    72,
  );

  // Tiny “compass” dot showing player vs world center (not revealing glyphs)
  const miniX = 12 + 360 + 14;
  const miniY = 12;
  fill(0, 0, 0, 90);
  rect(miniX, miniY, 120, 78, 14);

  // Mini-map shows only player position, for calm navigation
  const px = map(player.x, 0, WORLD_W, miniX + 14, miniX + 106);
  const py = map(player.y, 0, WORLD_H, miniY + 14, miniY + 64);

  stroke(255, 255, 255, 40);
  noFill();
  rect(miniX + 14, miniY + 14, 92, 50, 10);
  noStroke();

  fill(235, 250, 255, 200);
  circle(px, py, 8);
}

function drawRipplesScreen(t) {
  // Draw only ripples that are screen-space (mouse clicks)
  noFill();
  strokeWeight(2);

  for (const r of ripples) {
    if (r.world) continue;
    stroke(235, 250, 255, r.a);
    circle(r.x, r.y, r.r);
  }

  noStroke();
}

function updateRipples(t) {
  // Extend to handle both world and screen ripples
  for (let i = ripples.length - 1; i >= 0; i--) {
    const r = ripples[i];
    r.r += r.world ? 3.6 : 3.1;
    r.a -= r.world ? 4.8 : 4.2;
    if (r.a <= 0) ripples.splice(i, 1);
  }
}

/* ----------------------- INTERACTION ----------------------- */

function mousePressed() {
  // Gentle screen ripple (doesn't affect world)
  ripples.push({ x: mouseX, y: mouseY, r: 0, a: 170, world: false });
}
