# `<qp-memory>` — Cover Memory Game

Inspiriert von einer Idee und Umsetzung durch [ScriptRaccoon](https://github.com/ScriptRaccoon/snake-game) basierend auf einem[Live Coding Video](https://www.youtube.com/watch?v=4oNyD3A5Xl4), dass ich während einer Trainingseinheit auf meiner "Küchenrolle" (= Indoor-Fahrrad) ansah.
A memory/matching card game as a Web Component. Image sources are configurable:
either fetched from a server API (via the `url` attribute) or loaded from the
bundled local image set as fallback. Players flip pairs of cards to find matching images.

## Usage

```html
<!-- With bundled images (zodiac signs, traffic signs, card suits) -->
<qp-memory dimension="4"></qp-memory>

<!-- With server-fetched cover images -->
<qp-memory dimension="6" url="/media/covers"></qp-memory>
```

```html
<script type="module" src="/js/components-web/qp-memory/qp-memory.wc.js"></script>
```

## Attributes

**`dimension`** (number, default: `4`)

- Grid size (NxN). Allowed values: `2`, `4`, `6`, `8` (defined in `BOARD_SIZES`).
- The board size selector automatically filters out sizes that require more
  pairs than available images.

**`url`** (string, optional)

- API endpoint to fetch cover images (e.g. `/media/covers`).
  If omitted, the bundled `imageList` from `qp-memory.images.js` is used.

## Internal Properties

**`_width`** (string, default: `"60%"`)

- Board width as CSS value. Adjusted internally based on dimension (`"60%"` for <=4, `"90dvh"` for >4).

## Constants

**`PENALTY_SECONDS`** — `5`

- Time penalty in seconds added per hint used. Applied to the final elapsed time on win.

**`NEXT_ROUND_DELAY`** — `1000`

- Delay in ms before cards are flipped back (no match) or marked as matched.

## Events

All events are `CustomEvent` with `bubbles: true` and `composed: true` (cross Shadow DOM).

**`qp-memory.game-start`**

- Fired when a new game starts.
- `detail: {}`

**`qp-memory.game-won`**

- Fired when all pairs have been found.
- `detail: { time, formattedTime, moves, hints }`
  - `time` — elapsed time in ms (includes hint penalties)
  - `formattedTime` — formatted as `"MM:SS"`
  - `moves` — number of card pair flips
  - `hints` — number of hints used

```js
document.querySelector('qp-memory').addEventListener('qp-memory.game-won', (e) => {
  console.log(`Won in ${e.detail.formattedTime} with ${e.detail.moves} moves and ${e.detail.hints} hints`);
});
```

## Game Flow

1. Images are loaded once on connect (API fetch or local `imageList`).
   If no images are available, the component logs an error and does not render.
2. `_startGame()` picks random images, duplicates & shuffles them
   ([Fisher-Yates](https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle)),
   renders the board, and disables the start button.
3. Players click cards to reveal images. After two clicks the pair is checked:
   - **Match:** cards stay visible and are marked as matched.
   - **No match:** cards are flipped back after `NEXT_ROUND_DELAY` ms.
4. Players can use the **Hint** button to highlight a matching pair.
   Each hint adds `PENALTY_SECONDS` (5s) to the final time.
   The hint button is disabled while a card is already flipped (mid-round)
   and re-enabled after the round completes.
5. `_onWin()` fires when all pairs are found. The final time is calculated as
   elapsed time + (hints x 5s penalty). The solved board remains visible,
   and the start button is re-enabled for a new game.

## UI Sections

- **Display bar** — headline (NxN), elapsed time, move counter (includes hint count)
- **Board** — CSS grid of card elements with random rotation (-5° to +5°)
- **Button bar** — Start, Restart, Hint (+5s penalty per use), board size selector
  - **Start** — disabled during a running game, re-enabled on win
  - **Restart** — starts a new game at any time
  - **Hint** — highlights a matching pair; disabled mid-round and after win
  - **Size selector** — only shows sizes that have enough images available

## Lifecycle

**`connectedCallback`**

- Loads images (from API if `url` is set, otherwise from bundled `imageList`).
  Aborts if no images are available. Then starts the game.

**`disconnectedCallback`**

- Removes all event listeners.

**`attributeChangedCallback`**

- Re-renders when `dimension` changes.

## Translations

All visible text is resolved via `_dict()` (Dictionary module) with a built-in
`_defaultDict()` fallback (de/en).

## File Structure

```text
qp-memory/
  qp-memory.wc.js            — Web Component (main)
  qp-memory.styles.js        — Scoped styles (loaded via getStyles())
  qp-memory.dictionary.js    — i18n translations
  qp-memory.images.js        — Bundled image set with resolved URLs
  images/qp-memory-background.svg   — Card back background image
  images/                    — Image assets
    pisces.svg ... aquarius.svg       — Zodiac signs (12)
    stop.svg, yield.svg, ...          — Traffic signs (7)
    spades.png ... clubs.png          — Playing card suits (4)
```
