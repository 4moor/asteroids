# Simulation

- Coordinates are logical pixels; velocities are pixels/second and dt is seconds.
- Preserve createGame and stepGame contracts documented in docs/game-core.md.
- Keep updates deterministic for the same seed, inputs and time steps.
- Add focused tests for changed collision, scoring, life or wave behavior.
- Include boundary cases on the toroidal field and repeated hits.
- Keep rendering, keyboard events and test UI adapters outside this directory.
