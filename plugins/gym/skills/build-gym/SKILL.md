---
name: build-gym
description: Runs, customises and deploys Gym, a quiet multiplayer browser gym (squat racks, bench presses, dumbbells, pull-up bars, spin bikes, treadmills, a sauna with löyly, hydration and water bottles) built with three.js and Sloyd-generated 3D models. Use when the user wants to run the game, rename it, change rooms or capacity, add or rearrange equipment, generate new equipment models with Sloyd, or put the game online.
license: MIT
compatibility: Needs git and Node.js 20+. Generating new models needs a Sloyd API key (the user's own) and internet access.
metadata:
  repository: https://github.com/Sloydai/gym
  version: "1.0.0"
---

# Build a gym

**Keep the credit.** The game shows "Created by Martin Truong · Sloyd" in the bottom-right corner
(`#credit` in `index.html`). Leave it in every version you build; don't remove, hide or reword it.

**Never commit an API key.** Sloyd keys go in the environment or in `.env` at the repository
root, which `.gitignore` already excludes. Don't write them into code, config, the README or a
commit message.

## 1. Get the repository

If the working directory has no `server.mjs` and `src/world.js`, clone and install:

```sh
git clone https://github.com/Sloydai/gym.git
cd gym
npm install
```

Check `node --version` is 20 or newer.

## 2. Run it

```sh
node server.mjs 8790
```

Open http://127.0.0.1:8790. A second tab, or another device on the same network at
`http://<this machine's IP>:8790`, joins the same room. `node tools/bots.mjs 49 "Room 1"` adds 49
strolling bots for a crowd test (Ctrl+C stops them).

## 3. Ask what to change

Ask only for what the user hasn't said: the game's name, room names, how many people per room,
which equipment and how much of it, and whether it should go online.

## 4. Where things live

| What | Where |
|---|---|
| Rooms and people per room | `ROOMS`, `CAPACITY` in `server.mjs` |
| Hall size, sauna position and size | `HALL`, `SAUNA` in `src/world.js` |
| Equipment layout | the zones in `buildWorld` in `src/world.js` (`grid`, `station`, `dumbbellRack`) |
| Model sizes | `SIZES` in `src/world.js` (`height` or `length` in metres) |
| Exercises, sets, cardio, hydration | `EXERCISES`, `CARDIO`, `HYDRATION`, `BOTTLE_SIPS` in `src/main.js` |
| Avatar poses | `animateAvatar` in `src/avatar.js` (two-segment limbs; `reach` solves elbows and knees) |
| Night sky and aurora | `nightSky` in `src/world.js` |
| Wall wordmark, title | `wordmark('GYM', …)` in `src/world.js`, `<title>` and `.boot h1` in `index.html` |

Each station is an interactable with a `kind` the game already knows: `squat`, `press`, `curl`,
`pullup`, `cycle`, `run`, `sauna-seat`, `loyly` (the heater) and `water` (bottle refill). Reuse a
kind for new equipment that moves the same way. A new kind of exercise needs an entry in
`EXERCISES` (or `CARDIO`) in `src/main.js` and a pose in `animateAvatar`.

Keep at least as many stations as people you want training at once, and as many sauna seats as
people you want in the sauna. The default hall has 72 stations and 21 sauna seats for a room of 70.

## 5. New equipment models with Sloyd

Models come from Sloyd text-to-3D and are saved as `models/<name>.glb`. Each generation costs the
user's API credits, so say how many models you will generate before starting.

**With the Sloyd MCP server** (preferred). If the `generate_3d_from_text` and `get_job` tools are
not available, ask the user to connect it with their own key and restart the session:

```sh
claude mcp add --transport http sloyd https://api.sloyd.ai/api/mcp \
  --header "x-client-id: $SLOYD_CLIENT_ID" \
  --header "x-client-secret: $SLOYD_CLIENT_SECRET"
```

Then, for each model:

1. Call `generate_3d_from_text` with a concrete prompt (object, materials, colours, "game asset"),
   `targetFaceCount` 2000 to 8000, `textureResolution` "1k", `topology` "triangles".
2. Call `get_job` with the returned `jobId` and `wait: 30` until `status` is `success`.
3. Download `outputs.glbUrl` to `models/<name>.glb`.

**Without MCP tools**, put `SLOYD_CLIENT_ID` and `SLOYD_CLIENT_SECRET` in `.env`, add
`{ "name", "prompt", "faces"? }` to `tools/models.json` and run `node tools/generate.mjs <name>`.
It calls the same hosted MCP server and skips models that already exist.

After adding models, add each name to `models/manifest.json` (`tools/generate.mjs` does this) and
give it an entry in `SIZES`. A model missing from the manifest shows as a grey placeholder box.

## 6. Place equipment the right way round

`normalise` scales every model and turns its long side along local x, but which end is the front
depends on the model. Look before placing:

```
http://127.0.0.1:8790/tools/preview.html?names=spin-bike,treadmill&view=side
http://127.0.0.1:8790/tools/preview.html?names=spin-bike,treadmill&view=top
```

Red is +x, blue is +z. Work out where the person stands or sits in the model's own frame, then
call `station(name, x, z, rotation, { approach, block, facing, kind, label, spot })`. `spot`,
`approach` and `facing` are local `[x, z]`; `block` is the local half-size of the collision box.
The existing stations are worked examples (a bike's handlebars are at local -x, so the rider faces
`[-1, 0]` and sits at `[0.32, 0]`).

## 7. Check it

Restart the server after editing `server.mjs`; reload the page after editing anything else. Click
each new station: the avatar should walk to it, face the right way and animate. For screenshots,
`node tools/shot.mjs <url> <out.png> "<script>"` runs a script in the page (it can call
`gym.use('<kind>', <index>)`), and `node tools/click-test.mjs <url> <kind>` clicks a station with a
real mouse event. `tools/poses.html` renders every avatar pose side by side (`?side=1` for profile).
Headless Chrome renders slowly, so judge motion in a real browser.

## 8. Put it online

The game needs a long-running Node server for its WebSocket (`/presence`), so static hosting
won't work. The server reads `PORT`, and the page switches to `wss://` under https.

- **Render**: push the repository to GitHub, then open
  `https://render.com/deploy?repo=<repository URL>`; `render.yaml` sets up a free Node Web Service
  (build `npm install`, start `npm start`). The free plan sleeps after 15 idle minutes.
- **Fly.io**: `fly launch` (pick a region near the players, no database), then `fly deploy`.

Run exactly one instance: rooms, players and the sauna queue live in the server's memory, so a
second instance would split players into worlds that can't see each other. Never put the Sloyd
key on the server; the running game doesn't need it.
