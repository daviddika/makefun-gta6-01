# Solmar Heat — a gta6-01 entry

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/daviddika/makefun-gta6-01/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/daviddika/makefun-gta6-01/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

An original open-world crime game set in **Solmar Bay**, a sun-soaked coastal
city of your own: no Rockstar names, characters, map, art or music anywhere.
Built with vanilla HTML5 Canvas + JavaScript, zero libraries, zero network
requests. Everything — city, story, art, sound — is drawn and synthesised in
code.

## The story

Leo Marin is out of the county lockup and already in debt. Mama Rosa, who
runs the garage on 6th and keeps every wheelman in Solmar Bay fed, calls in
the favour: **five jobs**. Do them clean, get paid, and walk away free.

1. **Wheels Up** — steal a car and bring it to Rosa's Garage.
2. **The Package** — pick up a crate at the Docks, deliver it to the Marina
   Cafe while harbour police watch.
3. **Alley Justice** — settle things with the three Vultures in the Back Alley.
4. **The Bank Job** — grab the cash at Solmar Bank, then escape to the
   Safehouse with 3 stars on you.
5. **The Big Score** — take down the Yacht Club guards, grab the case, and
   bring it home to Rosa.

## What is in the game

- A 3200 x 2400 drivable city: road grid, buildings, a park, a plaza, a
  beach and the water, five named districts.
- On foot and by car: walk, run, steal any traffic or parked car (E), drive
  with arcade handling, handbrake-free drifting into walls included.
- Traffic cars that drive the grid and turn at intersections, pedestrians
  who stroll the sidewalks and flee from trouble.
- A wanted system (0–5 stars): stars rise on theft, assault and police
  shootings, fall when you keep clean; police cruisers spawn, chase, ram,
  and flash their light bars, with a two-tone siren.
- Combat: pistol (mouse aim, click to shoot), fists (F), bullets, enemy
  thugs and guards with health bars, cash / health / ammo pickups.
- HUD: money, health bar, ammo / car condition, wanted stars, a mission
  objective banner, toasts, a speedometer, and a live minimap of Solmar Bay
  with the player, police and mission marker.
- Start screen, mission briefings, pause, busted / wasted, and a win screen
  when the story is finished; progress saves to localStorage (Q to save,
  auto-save after every mission, Continue on the title screen).
- Synthesised WebAudio sound: engine hum, sirens, gunshots, crashes, cash
  chimes, mission jingles, and a synthwave bass loop. No audio files.

## Controls

| Key | Action |
| --- | --- |
| WASD / arrows | Move on foot, drive the car |
| Mouse | Aim (on foot), click to shoot |
| Shift | Run |
| E | Steal / enter a car, exit a car |
| F | Punch |
| P / Esc | Pause |
| Q | Save now |
| N (title) | New game |
| R (paused) | Quit to title |

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

Or serve `game/` with any static file server. `game/index.html` is the whole
game; it makes no network requests.

## Screenshots

Staged from the real game with `?shot=…&seed=7` (see `shots.json`):

1. `1-cover.png` — title screen over a living street
2. `2-drive.png` — driving through Downtown traffic
3. `3-chase.png` — 3-star police chase
4. `4-mission.png` — mission 2, the delivery run to the Marina Cafe

## Files

- `main.ts` — the entry program: copies `game/` + `screenshots/` to
  `/output` and writes `dossier.json` with `vendor/makefun-game.ts`.
- `game/index.html` — the page; `game/src/` is the game, one job per file:
  `config.js` (tuning), `random.js` (seeded RNG), `audio.js` (synth sound),
  `input.js` (keyboard + mouse), `city.js` (Solmar Bay), `traffic.js`
  (cars + pedestrians), `police.js` (wanted + cruisers), `missions.js`
  (story + five missions), `combat.js` (shooting, enemies, pickups),
  `world.js` (rules, driving, missions, save data), `render.js` (canvas,
  HUD, minimap, screens), `shots.js` (screenshot staging), `main.js`
  (boot, loop, save/load).
- `screenshots/` — four real renders of the game.
- `LICENSE` — MIT.

## License

MIT — see `LICENSE`. Copyright (c) 2026 Mahardika.
