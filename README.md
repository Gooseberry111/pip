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

Set `VITE_SITE_URL` to your Netlify address (for example `VITE_SITE_URL=https://your-pip.netlify.app npm run cap:sync`) before building the phone app. The app has no web address of its own, so online features (visiting, backups, chat, the neighbourhood goal) and share links use the website's. The functions accept calls from the app's origins (`netlify/lib/cors.mjs`). For real weather on Android, add the coarse location permission to the Android manifest (`ACCESS_COARSE_LOCATION`); on iOS add a location usage description to `Info.plist`.

## What's inside

**Home.** Pip sits on a little shelf under a sky that follows the real time of day (dawn, day, dusk and a starry night with fireflies). Pip's eyes follow your finger. Tap Pip to say hi, or stroke it back and forth to pet it. Pip falls asleep if left alone for a while. Each day a small gift waits on the shelf.

**Drink times.** Pip wants a drink in the morning (5am to noon), the afternoon (noon to 6pm) and at night (6pm to 5am). The first watering in each drink time is a proper drink: 2 petals and a little growth, and all three in one day is a perfect day (5 more petals and extra growth). A small morning, afternoon and night tracker sits on Home. Awake, a full Pip gets thirsty again after about 7 hours, so each drink time matters; asleep (10pm to 7am) Pip drinks very slowly, so nobody wakes up to a wilted plant. Pip sleeps at night and wakes for a little while if you tap. Rules live in `src/utils/plantLogic.js`.

**The farm.** A second home for Pip, on its own tab (`src/views/FarmView.vue`, rules in `src/stores/farm.js` and `src/utils/farmLogic.js`, all numbers in `src/data/farm.js`).
* *Plots and crops*: 12 crops from wheat (1 minute) to roses (6 hours), each unlocked at a farm level, with its own growing time, harvest size and price. Planting costs a few petals (wheat is free). Water a growing crop once to make it 15% quicker, or use fertiliser to halve the time left. "Harvest everything" picks all that's ready.
* *Trees*: apple, cherry, orange, peach and lemon. Planted once, they fruit again and again.
* *Animals and buildings*: a chicken coop (feed wheat, get eggs), a beehive (honey on its own), a windmill (wheat into flour) and a cow shed (feed corn, get milk).
* *The barn* stores everything (60 spaces to start, upgradable). Sell at the market for petals, or give things to Pip.
* *The kitchen*: 20 recipes, from carrot soup to rose cake, each with a cooking time. Dishes sell for half again their ingredients, fill the best orders and make the best treats for Pip (treats help Pip grow). More stoves in the shop.
* *The order board*: critter neighbours (Bun the bunny, Hazel the hedgehog, Bramble the badger and friends) ask for things and pay well in petals and farm XP. A new order arrives a while after each one is filled.
* *Pip's daily wish*: one thing from the farm Pip would love today, shown on Home and the farm. Granting it gives petals and growth.
* *Farm levels* (XP from harvesting, cooking and orders) unlock crops, trees, buildings, recipes, decorations and more land, with a celebration listing what's new.
* *In 3D*: the farm is a real 3D scene (three.js, `src/components/farm/Farm3D.vue`, models in `src/farm3d/`): a raised island of farmland with a hedge and a gate, meadows, trees and hills around it, soft shadows, a sun and moon that follow the time of day, seasons, and real rain and snow. Drag to look around, pinch or scroll to zoom, and walk all the way round: twist two fingers (or right drag, or Shift drag, on a computer) to turn, and slide two fingers up or down to tilt from a low, side on view to straight down. Buttons in the corner turn left and right, switch between From above, Angled and Low views, and the compass brings you back to the front. Every plot, crop (at each stage), tree, building, pen and decoration is its own model, and lamps, fires, tents and windows light up after dark. Ready bubbles, progress bars and little floating rewards ("+3" over the plot you picked) hang over the right thing; there are no banners at the top of the screen any more. Phones without 3D graphics get the flat farm instead (`FarmMap.vue`).
* *Animals*: hens and a chick in the coop yard, a cow by the shed, sheep in the sheep pen (feed carrots, gather wool), pigs in the pig pen (feed potatoes, they find truffles for the new truffle mash), bees round the hive, and animal friends to place: a bunny hutch, a duck house, a goat corner and a horse paddock. A duck paddles on the lily pond and a dog lives by the kennel. They all wander, graze, peck and hop about.
* *Planting and watering*: pick a seed for one plot and keep it in hand: tap or swipe across any other empty plots to plant them too (paid plot by plot), then tap Done. "Plant all" still fills every empty plot. Tap a growing crop to water it, or "Water all" waters every thirsty crop at once (next to "Harvest all").
* *The dock*: picture buttons for the Barn (with a fill meter), Kitchen (a dot when a dish is ready), Orders, Build, Shop and Friends. The level ring at the top shows XP; "Harvest all" floats up when there's lots to pick.
* *Build mode*: a drawer of everything you can place, by kind (Yours, Plots, Trees, Animals, Decor, Fences, Paths). Pick something and a preview appears on the farm: drag it or tap a spot, then tap the tick (anything not yet owned is bought as you place it). Paths, fences and plots stay ready for the next one, so a row is quick. Drag anything already placed to move it; tap it to turn it round or put it away. Land grows from 8 x 10 tiles to 8 x 18.
* *Seasons and weather*: spring, summer, autumn and winter change the grass and the trees (worked out for your side of the world). Turn on real weather (tap the season under the farm name) and rain, snow, mist and storms where you are show on the farm, from Open-Meteo, which is free and needs no key. When it rains where you are, every thirsty crop gets watered. Only a rough location (about 10 km) is kept, on the phone (`src/services/weather.js`).
* *Collections*: everything grown or gathered fills the Harvest almanac, and every dish the Recipe book (Collection tab).

**Visiting friends.** Turn on "Let friends visit" (the people button on the farm) and your farm gets a 6 character code and a link to share. Friends can visit by code, from their list of neighbours, or through Explore (if you choose to be listed). Visitors can water up to 5 of your growing crops a day, which makes them grow quicker, and earn a petal for each. You'll see a note when friends have helped. Shared farms are stored in Netlify Blobs by `netlify/functions/farm.mjs`; only the layout, crops, farm name and plant name are shared, the owner's key is kept as a hash so nobody else can change a farm, and unkind names are refused. It needs nothing extra to set up beyond deploying to Netlify.

**Backups.** Settings has "Keep a backup": Pip, the farm and the journal (not chats) are saved online every few minutes under a private 12 character code, which only you see. On a new phone, "Restore from a code" brings everything back. Stored in Netlify Blobs by `netlify/functions/backup.mjs` (the code is kept only as a hash); nothing to set up. Starting over never overwrites an old backup.

**Farm tour.** New farmers get a six step tour from Pip: plant wheat, pick it, see the order board, peek in the kitchen and try arranging, with the right things gently highlighted. It moves on by itself as you do each step, can be skipped, and pays 10 petals at the end (`src/components/farm/FarmTour.vue`).

**Playing together.**
* *Gifts*: when visiting a shared farm, send something from your barn (up to three gifts per friend a day). It lands in their barn with a note saying who it's from.
* *Neighbours' leaderboard*: in the friends sheet, see this week's harvests, orders and game stars for you and the neighbours you've visited.
* *Neighbourhood goal*: every filled order, from everyone, counts towards one goal each week (shown on the order board). The goal grows with the number of farmers taking part. When it's reached, everyone collects 30 petals, and the first time, a Golden Watering Can for the farm. Counted by `netlify/functions/community.mjs`.

**Pip's own style and story.**
* *Accessories*: glasses, a bow tie, a ribbon bow, freckles and a cosy scarf from the shop, plus a chef's beret, heart glasses and a flower crown earned through badges. Pip wears them everywhere, friends see them on your farm, and they're in the Collection (`src/components/art/AccessoryArt.vue`).
* *Badges*: 24 milestones across caring, the farm, friends and games (`src/data/badges.js`), each paying petals, some unlocking an accessory. They're awarded the moment they're earned with a little celebration, and live in the Collection's Badges tab and the journal.
* *Personality*: Pip grows a character from what you do together: playful, cuddly, green fingered, curious, calm or friendly (`src/utils/badges.js`). It shows in the Badges tab, and Pip now and then says things that are very them when you tap.

**Comfort and speed.**
* *Calmer motion* (Settings) turns off decorative animation. It also switches on by itself when the phone's own Reduce Motion setting is on.
* *Text size* (Settings): Normal, Large or Larger. Everything is sized in rem, so the whole app grows together, and Home scrolls when it needs to.
* *Works offline*: the service worker (`public/sw.js`) keeps a copy of the app. Pages are fetched fresh when online (so updates arrive straight away) and the saved copy is used offline. Online features (chat AI, backups, visiting) simply wait for a connection.
* *Quick to open*: each game, and the chat, settings and check-in sheets, load only when needed. The rest of the games are fetched quietly in the background once the Play tab is idle.

**The shop.** Spend petals on the farm (plots, land, a bigger barn, stoves, fertiliser), trees and animals, more than 50 farm decorations (7 paths, 6 fences and edges, plus things like a sleepy cat, a fire pit, a fountain, a greenhouse, a treehouse and a rainbow arch; a snowman in winter), and dozens of looks for Pip that are only found here. A different deal every day.

**Dishes.** Every dish has its own drawing (`src/components/farm/DishArt.vue`), so the three pies, the soups and the drinks never look alike, and orders and the kitchen name each item.

**Pip's wardrobe.** The scene you choose shows on Home too, softly lit for the time of day. 23 pots, 14 leaf styles, 15 flowers, 21 decorations and 13 scenes (new: Seaside, Autumn Wood, Snowy Day, Cosy Library, City Rooftop, Greenhouse and Outer Space), from levels, the shop and seed packets.

**Photo mode.** The camera button in Pip's garden takes a picture of Pip in their scene, with their name and how many days you've been together, ready to share or save (`src/utils/photo.js`).

**Phone features** (`src/services/native.js`). In the Capacitor app: the phone's share sheet, status bar colours, the splash screen, the Android back button (it closes the newest sheet first, then goes home), the screen stays on during games, and saves are copied into the phone's own storage so they survive the phone clearing space. In a browser the same things use the web versions where they exist (Web Share, Wake Lock, the app icon badge for things waiting on the farm, persistent storage). Sheets can be dragged down to close.

**Levels.** Home always shows Pip's level and stage (for example "Level 3 · Small Pip") and how close the next level is. Every new level opens a celebration showing what it unlocked, with a "Try it on" button for each item and a peek at what the next level brings.

**Daily check-in.** Once a day Pip asks how you are (Great, Good, Okay, Low, Tough), answers kindly, and lets you jot an optional note. On a low or tough day it gently offers a minute of breathing together. Always skippable, and can be turned off in Settings.

**Pip's journal.** A scrapbook that fills itself: planting day, every level and stage (with a snapshot of how Pip looked), treasures found, bloom boxes, first game clears, day milestones (7, 30, 100, 365) and your check-ins with notes. Open it from the book button on Home.

**Weekly goals.** Three small goals each week (water, stars, game rounds, breathing, saying hi, check-ins, gifts, harvests, cooking, orders, drink times, perfect days, wishes), picked fresh every Monday. Each pays 6 petals; collecting all three opens the bloom box: 25 petals and a rare treasure.

**Did you know?** Two new facts a day (6am and 6pm, local time): around 60 short, accurate facts about plants, nature, water and wellbeing, plus gentle thoughts from Pip (`src/data/facts.js`). A chip appears on Home when one is waiting (the first read of each is worth a petal), read facts collect in the journal's Fact book, and some daily reminders arrive as a fun fact.

**Talk to Pip.** A short, warm chat with your plant, free by default.
* *Pip's own brain* (`src/utils/pipBrain.js`): built in, free, private and offline. It recognises what a message is about (greetings, feelings, stress, facts, jokes, sleep, games and more) and answers with hand-written replies that use Pip's real state.
* *Optional free AI*: add a free Google AI Studio key as `GEMINI_API_KEY` in Netlify and Pip becomes properly conversational through `netlify/functions/chat.mjs` (default model `gemini-3.5-flash`, change with `GEMINI_MODEL`). Google's free tier uses content to improve its products, and has daily limits; `PIP_CHAT_DAILY_LIMIT` (default 30 per phone per day) keeps usage inside them. Whenever the AI can't answer (limit reached, busy, offline), Pip's own brain answers instead.
* A paid Claude key (`ANTHROPIC_API_KEY`, optional `PIP_CHAT_MODEL`) also works if there's no Gemini key.

Pip never claims to be a person or a counsellor. If a message suggests someone may be in danger, the app shows real helplines (`src/utils/safety.js`) whatever the reply says. Chats are saved on the phone.

**Gentle reminders.** An optional daily hello at a time you choose (skipped if you've already visited that day), a nudge timed for when Pip will actually get thirsty, and one when something on the farm is ready to pick. Never between 10pm and 8am, never guilt-based.
* *Installed web app* (iPhone Home Screen, iOS 16.4+, or Chrome on Android): web push. The app shares its reminder settings with Netlify functions in `netlify/functions`, stored in Netlify Blobs, and `push-send` runs every 15 minutes to send what's due. The service worker is `public/sw.js`.
* *Capacitor phone app*: the phone schedules them itself with `@capacitor/local-notifications`.

### Setting up web reminders on Netlify

1. Create a key pair once: `npx web-push generate-vapid-keys`
2. In Netlify, under Site configuration, Environment variables, add:
   * `VAPID_PUBLIC_KEY` (the public key)
   * `VAPID_PRIVATE_KEY` (the private key, keep it secret)
   * `VAPID_SUBJECT` (`mailto:` followed by your email)
3. Redeploy. On iPhone, add Pip to the Home Screen from Safari, open it from there, and turn on Reminders in Settings.
4. To check the setup, open `/api/push/key` on your site: if anything is missing, `problem` says what.

**Care.** Water drains slowly in real time. Pip is healthy, thirsty or wilting, but never dies, and water always brings it back. Growth comes from watering and from time passing while Pip has water. There are 12 levels across 6 stages: Seed, Sprout, Small, Growing, Mature and Flowering. Reaching a new stage opens a special moment.

**Petals.** A soft currency, earned by:
* opening the daily gift
* doing the day's little things (water, say hi, breathe, play). Each pays out once a day, with no streaks and no penalty for skipping
* playing games

**Play.** Games sit in sections on the Play tab: Puzzles, Word games, Arcade, Board games (play Pip or a friend), Party games (2 to 4 players on one phone), and Calm and music. A switch at the top shows All, Just me, or With friends.

*Puzzles*
* *Bloom Burst:* a match 3 on a 7 x 8 board, over 45 levels. Swipe or tap to swap flowers. 4 in a line makes a watering can that sweeps its row or column, an L or T makes a bee that clears around it, and 5 in a line makes a rainbow seed that clears a whole kind. Swap two specials together for a bigger burst. Goals: reach a score, collect certain flowers, or wash away mud (some mud takes two washes). Leftover moves turn into a bloom bonus. Out of moves? 5 more cost 12 petals, once per try. Goals and star scores were tuned with a bot (`src/utils/burstEngine.js` holds the rules).
* *Leaf Words:* two word games. *Picture Words*: four pictures are clues to one word, and never the answer itself (no sun picture for SUN); some are pieces that make the word up, like butter and a fly. Spell it from letter tiles, with plenty of decoys, against a tighter clock (30 hand-made levels of 5 words, 4 to 13 letters, then endless; reveal a letter for 5 petals). *Word Search*: drag across the letters to find hidden words; later levels hide them diagonally and backwards, on grids up to 13 x 13 (35 levels). Puzzles live in `src/data/words.js`.
* *Bug Hotel:* sort the bugs so every tower holds one kind. Bugs only stack on their own kind or in an empty tower. 40 levels up to 7 kinds and 6 rooms high; the toughest leave only one spare tower. Every shuffle is checked by a solver so it can be sorted, and the solver's move count is the par. The 16 biggest floors are solved ahead of time (`HOTEL_FIXED`) so they open instantly. Undo and restart are there, but 3 stars means par or better with no undos.
* *Garden Tiles:* a triple match. Tap tiles with nothing resting on them to drop them in a 7 space tray; three alike disappear, a full tray ends the round. 30 levels up to 9 layers and 16 kinds. Every board is built backwards from a winning order, so it can always be cleared (`src/utils/tilesEngine.js`). Undo twice or Make room once; 3 stars means no help.
* *Seed Sudoku:* sudoku with crops instead of numbers: 4 x 4, then 6 x 6, then 9 x 9 down to 24 starting seeds (30 levels). Every puzzle has exactly one answer (`src/utils/sudokuEngine.js`). Notes mode, three hints, a 1 2 3 switch, and three mistakes allowed.
* *Bloom Puzzle* (40 levels, 3x3 up to 5x5 against the clock, the later ones in the new scenes) and *Seed Memory* (40 levels, up to 32 lookalike cards).

*Arcade*
* *Petal Pop:* a bubble shooter. Drag to aim, bounce off the walls, pop 3 or more of a colour and drop anything left hanging. Shots that pop nothing bring the ceiling closer. 35 levels; stars by shots used, with a tighter target on later levels.
* *Mini Golf:* 30 holes. Pull back anywhere to aim, let go to putt. Walls, water (a stroke and back you go), sand, mushroom bumpers, spinning windmills and sliding gates. Par or under for 3 stars. Every hole was checked by a bot that it can be done in par (`src/utils/golfEngine.js`).
* *Pond Fishing:* the hook swings under the boat; tap to drop it. Minnows, perch, carp, turtles, golden koi and treasure are worth more the harder they are to land; boots waste time and pufferfish take points. 30 levels; targets set from a bot that never misses (`src/utils/fishingEngine.js`).
* *Raindrop Catch*, *Seed Glide* and *Firefly Night*: 40 levels each, getting faster, busier and tighter all the way.

*Board games and party games*
* *Seed Drop:* four in a row on a 7 by 6 wall, best of three. Pip looks up to seven moves ahead on Hard.
* *Flower Flip:* trap lines of the other colour to flip them (reversi). Pip knows the corners are gold.
* *Garden Fences:* dots and boxes for 2 to 4 friends or against Pip, on a small or big board. Close a square to plant your flower and go again; on Hard, Pip hands over the smallest chain it can.
* *Vines and Ladders:* a dice race for 1 to 4 people, and Pip can join as a player. Ladders lift you, vines slide you down, a six rolls again.
* *Garden Tac Toe:* sprouts against blossoms on a classic 3 x 3 or a big 5 x 5 board (four in a row). Play Pip on Easy, Medium or Hard, or a friend on the same phone. Matches are first to 3 round wins, up to 5 rounds. On Hard 3 x 3, Pip plays perfectly, so a draw is the best result.
* *Garden Checkers:* ladybirds against beetles by the classic rules (jumps are compulsory, multi jumps, crowning). Play Pip on three levels, or a friend; the board turns for each player. Rules and Pip's thinking are in `src/utils/checkersEngine.js`.
* *Snail Race:* tap to speed your snail along. Each tap uses stamina, and running out means a short nap. 30 levels against quicker and cleverer computer snails, longer tracks and rivals who sprint at the finish (3 stars: win without a nap), or a party race for 2 to 4 players with a pad each.

*Calm and music*
* *Rain Rhythm:* drops fall down 3 or 4 lanes in time with the music; tap each drop while it falls. Each drop you catch plays a note of the tune. 35 songs from 84 to 173 bpm; the last ones fill in the off beats and need more accuracy. Timing runs on the audio clock; keys D F J K work on a keyboard.
* *Flower Song* and *Breathe Together*, as before.
* *Mystery seed packets:* spend 20 petals and tap the packet open to reveal one of 10 rare treasures that can't be grown.
* *Coming soon:* add previews to `COMING_SOON` in `src/data/games.js` and they show on the Play tab (the section hides when it's empty).

**Endless levels.** Every game with levels keeps its hand-made levels first (now a notch harder than before), then carries on with levels made from their number by [`src/utils/levelGen.js`](src/utils/levelGen.js): level 437 is the same for everyone, with nothing stored. Difficulty climbs in waves: every 5th level is a little peak (marked Hard), every 10th a big one (Expert), and the level after is a breather. The waves rise towards each game's hardest playable settings and stay there. Boards that need checking are checked before you see them: Bug Hotel floors are solved (par comes from the solver), Sudokus have exactly one answer, Tile boards are built from a winning order, and generated golf holes are made from pieces with gaps wider than the ball, with par set from the golf bot. The slow ones (big hotels, hard Sudokus, tall tile stacks) are built in a background worker (`src/workers/build.worker.js`) and remembered, so the screen never freezes. The level map shows 20 levels at a time, in chapters. Picture Words can't be invented by a computer, so after its 30 hand-made levels it deals five long words at a time from the whole bank, with less time. The second half of each level map is tagged Hard and the last few Expert. Levels award 1 to 3 stars and unlock the next level. The how to play card shows the first time you play a game; after that, picking a level goes straight to a short countdown that names the level and its goal. "How to play" on the level map brings the card back. Clearing a level takes a decent try; three stars needs a near perfect run. Level designs and rewards live in [`src/data/games.js`](src/data/games.js).

**Harder all round.** Hand-made levels were tightened in every game (less time, higher targets, fewer moves, faster drops, stricter passes). Tac Toe and Checkers opponents slip up less and look further ahead.

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
    games/      BloomBurst, LeafWords, BugHotel, PetalPop, GardenTacToe, GardenCheckers,
                SnailRace, RainRhythm, RaindropCatch, SeedMemory, FireflyNight, SeedGlide,
                BloomPuzzle, FlowerSong, BreatheWithPip, PacketOpening, plus shared
                GameShell, LevelSelect, LevelIntro, Countdown, GameResults
  data/         stages, items, games, daily things, weekly goals, moods, everything Pip says
  router/       Home / Play / Collection / Garden (hash history for Capacitor)
  services/
    storage/    storage adapter (localStorage now, Firebase later)
    notifications.js  gentle reminders (native app or web push)
    webPush.js  web push subscription for the installed web app
netlify/
  functions/    chat (talk to Pip), farm (shared farms, visits, gifts, leaderboard), backup, community,
                push-key, push-subscribe,
                push-unsubscribe, push-send (every 15 minutes)
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
