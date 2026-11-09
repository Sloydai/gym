# Gym

A quiet multiplayer gym in the browser, under a starry Nordic sky with a little aurora. Walk in, pick a squat rack, a bench press, the dumbbells, a pull-up bar, a spin bike or a treadmill, and train alongside whoever else is in the room. Keep an eye on your hydration and refill your bottle at a water station. When you're done, wrap a towel round your waist, sit in the sauna, and take your turn throwing löyly on the heater.

Built with [three.js](https://threejs.org) and 3D models generated with [Sloyd](https://www.sloyd.ai).

## Play locally

```bash
npm install
node server.mjs 8790
```

Open http://127.0.0.1:8790. Open a second tab, or another device on the same network, to train together.

| Key | Action |
|---|---|
| Click floor / WASD | Walk |
| Drag, scroll | Look around, zoom |
| Click equipment | Walk over and use it |
| Space | One rep (tap or hold on cardio) |
| Q | Drink from your bottle |
| H | Wave |
| E | Get up |

Each room holds up to 70 people: 72 stations on the floor and 21 seats in the sauna.

## Build your own world with Claude Code

Gym is also a template for any multiplayer place: a university, hospital, city square, office, library, café, school, airport, club and more. This repository is a Claude Code plugin marketplace with one skill, `build-world`. It copies the template into your own project, plans the place with you, generates the models through the Sloyd MCP server with your own key, sets up stations, poses and background visitors, and puts it online.

```
/plugin marketplace add Sloydai/gym
/plugin install gym@gym
```

Then ask, for example: "turn this into a university lecture hall with a podium", "make a hospital ward with beds and a waiting room", or "add a row of rowing machines along the windows".

## New models

Models come from the hosted Sloyd MCP server (`https://api.sloyd.ai/api/mcp`). Generating them uses your own Sloyd API key and credits; the game itself never needs a key.

```bash
echo 'SLOYD_CLIENT_ID=...' >> .env
echo 'SLOYD_CLIENT_SECRET=...' >> .env
node tools/generate.mjs <name>   # names and prompts in tools/models.json
```

`.env` is git-ignored. Never commit it.

## Put it online

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Sloydai/gym)

The game needs a long-running Node server for its WebSocket, so use a host such as [Render](https://render.com) (the button above uses `render.yaml`: free Web Service, build `npm install`, start `npm start`) or [Fly.io](https://fly.io) (`fly launch`, `fly deploy`). Run a single instance: rooms and players live in the server's memory.

## Credits

Created by Martin Truong · [Sloyd](https://www.sloyd.ai). MIT licensed, see [LICENSE](LICENSE).
