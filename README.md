# Pip

A little plant to care for, one day at a time.

Pip is a tiny virtual plant companion. You plant a seed, give it a name, water it, and watch it grow into a flowering plant. Along the way there are small daily rituals, gentle games, and treasures to collect.

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build in dist/
```

### Mobile (Capacitor)

```bash
npx cap add android   # or: npx cap add ios
npm run cap:sync      # build and copy web assets into the native projects
npx cap open android
```

## What's inside

**Home.** Pip sits on a little shelf under a sky that follows the real time of day (dawn, day, dusk and a starry night with fireflies). Pip's eyes follow your finger. Tap Pip to say hi, or stroke it back and forth to pet it. Pip falls asleep if left alone for a while. Each day a small gift waits on the shelf.

**Levels.** Home always shows Pip's level and stage (for example "Level 3 · Small Pip") and how close the next level is. Every new level opens a celebration showing what it unlocked, with a "Try it on" button for each item and a peek at what the next level brings.

**Daily check-in.** Once a day Pip asks how you are (Great, Good, Okay, Low, Tough), answers kindly, and lets you jot an optional note. On a low or tough day it gently offers a minute of breathing together. Always skippable, and can be turned off in Settings.

**Pip's journal.** A scrapbook that fills itself: planting day, every level and stage (with a snapshot of how Pip looked), treasures found, bloom boxes, first game clears, day milestones (7, 30, 100, 365) and your check-ins with notes. Open it from the book button on Home.

**Weekly goals.** Three small goals each week (water, stars, game rounds, breathing, saying hi, check-ins, gifts), picked fresh every Monday. Each pays 6 petals; collecting all three opens the bloom box: 25 petals and a rare treasure.

**Gentle reminders.** An optional daily hello at a time you choose (skipped if you've already visited that day), plus a one-off nudge timed for when Pip will actually get thirsty. Never between 10pm and 8am, never guilt-based.
* *Installed web app* (iPhone Home Screen, iOS 16.4+, or Chrome on Android): web push. The app shares its reminder settings with Netlify functions in `netlify/functions`, stored in Netlify Blobs, and `push-send` runs every 15 minutes to send what's due. The service worker is `public/sw.js`.
* *Capacitor phone app*: the phone schedules them itself with `@capacitor/local-notifications`.

### Setting up web reminders on Netlify

1. Create a key pair once: `npx web-push generate-vapid-keys`
2. In Netlify, under Site configuration, Environment variables, add:
   * `VAPID_PUBLIC_KEY` (the public key)
   * `VAPID_PRIVATE_KEY` (the private key, keep it secret)
   * `VAPID_SUBJECT` (`mailto:` followed by your email)
3. Redeploy. On iPhone, add Pip to the Home Screen from Safari, open it from there, and turn on Reminders in Settings.

**Care.** Water drains slowly in real time. Pip is healthy, thirsty or wilting, but never dies, and water always brings it back. Growth comes from watering and from time passing while Pip has water. There are 12 levels across 6 stages: Seed, Sprout, Small, Growing, Mature and Flowering. Reaching a new stage opens a special moment.

**Petals.** A soft currency, earned by:
* opening the daily gift
* doing the day's little things (water, say hi, breathe, play). Each pays out once a day, with no streaks and no penalty for skipping
* playing games

**Play.**
* *Raindrop Catch:* slide Pip's pot to catch the rain across 10 levels with goals (catch, score, golden drops, combos). Grumpy mud drops cost one of three hearts, and later levels rain harder, faster and muddier. The rain you catch waters Pip.
* *Seed Glide:* hold to float a dandelion seed through gaps between branches, collecting dewdrops. 8 levels; later ones sway the branches and add gusts of wind.
* *Seed Memory:* 9 levels from 8 to 28 cards with tight timers. Later levels deal cards that look alike. Hints light up a pair (3 petals, 2 per round).
* *Bloom Puzzle:* slide the tiles back into a picture before time runs out, from 3x3 up to 5x5 across 6 levels. Peek at the finished picture for 3 petals (2 per round).
* *Firefly Night:* tap fireflies before they fade and leave the moths alone, across 8 levels that get faster and busier.
* *Flower Song:* Pip plays a tune on four flowers; repeat it as it grows one note longer and a little faster each round.
* *Breathe Together:* one calm minute of slow breathing with Pip.
* *Mystery seed packets:* spend 20 petals and tap the packet open to reveal one of 10 rare treasures that can't be grown.
* *Coming soon:* Snail Race, Rain Rhythm, Bug Hotel and Petal Pop are shown as previews (listed in `COMING_SOON` in `src/data/games.js`).

Levels award 1 to 3 stars and unlock the next level. Clearing a level takes a decent try; three stars needs a near perfect run: no hearts lost (or few mistakes) and at least 30% of the time left (see `starRating` in `src/data/games.js`). Level designs and rewards live in [`src/data/games.js`](src/data/games.js).

**Sound and music.** Every tap makes a soft sound (an element can choose another sound with `data-sound="name"`, or none with `data-sound="none"`). Sounds and music are built from small synthesised instruments in [`src/utils/synth.js`](src/utils/synth.js) (kalimba, marimba, bells, electric piano, soft bass, bubbles, a wooden tok) with a gentle room reverb, all in one key so effects harmonise with the music. Background music is arranged live in [`src/utils/music.js`](src/utils/music.js): a quiet lullaby at home and its own track in each game. Music can be muted from the music button on Home, in every game, or in Settings, where sound effects and haptics can also be switched off.

**Collection and Garden.** 37 items across pots, leaves, flowers, decorations and scenes. Most unlock as Pip grows, and the rare ones come from seed packets. Decorations appear on the home shelf and in the garden, and each one reacts when tapped.

## Trying things out

In development, the browser console has helpers:

```js
__pip.passTime(12)  // let 12 hours pass
__pip.grow(100)     // add growth points
__pip.petals(50)    // add petals (handy for hints and seed packets)
__pip.reset()       // start again from a seed
```

## Project structure

```
src/
  animations/   useTween: eases Pip's growth and droop smoothly
  components/   Pip, PipStatus, WaterButton, GrowthProgress, HomeStage, GiftBox,
                GrowthMoment, UnlockReveal, CollectionItem, Garden, BottomNavigation…
    art/        SVG pieces: pots, leaves, flowers, decorations, scenes
    games/      RaindropCatch, SeedMemory, FireflyNight, FlowerSong, BreatheWithPip,
                PacketOpening, plus shared GameShell, LevelSelect, LevelIntro, GameResults
  data/         stages, items, games, daily things, weekly goals, moods, everything Pip says
  router/       Home / Play / Collection / Garden (hash history for Capacitor)
  services/
    storage/    storage adapter (localStorage now, Firebase later)
    notifications.js  gentle reminders (native app or web push)
    webPush.js  web push subscription for the installed web app
netlify/
  functions/    push-key, push-subscribe, push-unsubscribe, push-send (every 15 minutes)
  lib/push.mjs  shared helpers, including the "what's due?" rules
  stores/       pip.js: the Pinia store (state, time catch up, petals, unlocks)
  utils/        plantLogic.js (pure rules), audio.js, synth.js, sound.js, music.js, haptics.js, timeOfDay.js, shapes.js
  views/        HomeView, PlayView, CollectionView, GardenView, JournalView
```

All growth and water tuning lives in [`src/utils/plantLogic.js`](src/utils/plantLogic.js). Prices and rewards live in [`src/data/items.js`](src/data/items.js) and [`src/data/daily.js`](src/data/daily.js).

### Adding Firebase later

The store only talks to `getStorage()` in `src/services/storage/index.js`, which returns an object with `load()`, `save(data)` and `clear()`. To sync to the cloud, write a `firebaseAdapter.js` with the same three methods (for example, one Firestore document per user). Then call `setStorage(firebaseAdapter)` after sign in. The saved data is a plain object with a `version` field for future migrations.

Gentle reminder copy for future notifications is in `REMINDER_MESSAGES` in `src/data/messages.js`.

## Notes

Pip and everything around it is drawn as live SVG rather than Lottie or Rive. Pip's look changes continuously with its state (drooping, growing between stages, swapping pots and leaves), so the drawing is driven directly by data and eased with `useTween`, with CSS keyframes for idle life. Sounds and music are synthesised with the Web Audio API, so there are no audio files. Haptics use Capacitor's native plugin in the app and the vibration API on the web. All motion respects `prefers-reduced-motion`.
