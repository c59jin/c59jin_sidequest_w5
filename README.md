## Project Title

GBDA302 Week 5 Drifting Light: A Meditative Camera Journey

---

## Authors

Catarina Jin - c59jin - 21077832

---

## Description

Drifting Light is a reflective exploration experience rather than a traditional goal-driven game.
The player controls a small glowing presence moving through a world that is significantly larger than the screen. Instead of fast action, the project focuses on slow movement, camera pacing, and spatial discovery to create an emotional, contemplative atmosphere.

The camera follows the player using smooth easing and subtle drifting motion, encouraging a sense of breathing or floating rather than mechanical tracking. This design emphasizes calm observation and environmental awareness.

Hidden throughout the environment are small symbolic objects (“glyphs”). These are not immediately visible as objectives; instead, they are gradually revealed as the camera encounters them. Players may pause near a glyph to collect it, reinforcing a theme of mindful attention and discovery rather than urgency.

---

## Setup and Interaction Instructions

How to Run:

Open the project folder in Visual Studio Code.

Use Live Server or open index.html in a browser.

It will load automatically.

Controls

Move: W A S D or Arrow Keys

Collect a discovered symbol: Hold SPACE while near it

Create a ripple (optional interaction): Mouse click

Goal

There is no win/lose state.
Players explore and discover symbols at their own pace.

---

## Iteration Notes

a. Post-Playtest: Changes Made

1. Reduced Movement Speed
   Playtesters reported the original motion felt too game-like.
   We slowed acceleration and added drag to create a calmer pace aligned with the reflective theme.

2. Added Camera Easing Instead of Direct Follow
   Early versions snapped the camera to the player.
   We implemented interpolation (lerp-based smoothing) to create a floating, cinematic feel and reduce motion stress.

3. Made Discoveries Gradual Rather Than Fully Visible
   Players initially saw all symbols immediately, which encouraged “collecting behavior.”
   We changed glyph visibility so they emerge only when entering the camera’s view, shifting focus to curiosity instead of completionism.

---

b. Post-Showcase: Planned Improvements

1. Add Ambient Sound Design
   Soft environmental audio and reactive tones when discovering symbols would deepen emotional engagement and accessibility.

2. Introduce Biome Variation Across the Large World
   Future versions will include subtle regional differences (color palettes, particle motion, density) to support long-form exploration without breaking the meditative tone.

---

## Assets

The code was written by me but used GenAI to write the comments.

---

## References

L. Manovich, The Language of New Media.
Cambridge, MA, USA: MIT Press, 2001.
(Conceptual reference for spatial navigation and cinematic digital environments.)

---
