# Avatar Animations

Place Mixamo animation `.glb` files here to use them with the avatar companion.

## How to download from Mixamo

1. Go to [mixamo.com](https://www.mixamo.com) and sign in with an Adobe account
2. Search for these animations:
   - **Idle / Breathing** → `idle.glb`
   - **Walking** → `walk.glb`  
   - **Typing** → `typing.glb`
   - **Sleep / Sitting** → `sleep.glb`
3. For each animation:
   - Select the character **"Y-Bot"** (free, Mixamo-compatible skeleton)
   - Set **Format** to **GLB (.glb)**
   - Set **Skin** to **Without Skin** (just the animation data)
   - Download and rename per the filenames above
4. Place the `.glb` files in this directory

## How it works

The geometric avatar (made of Three.js box primitives) uses procedural animations by default. When you place `.glb` animation files here, they replace the procedural versions automatically.

The loader looks for files at:
- `/animations/idle.glb`
- `/animations/walk.glb`
- `/animations/typing.glb`
- `/animations/sleep.glb`
