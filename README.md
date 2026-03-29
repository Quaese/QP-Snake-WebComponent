# `<qp-snake>` — Snake Game

A classic snake game as a Web Component. The snake moves across a grid, eats
food to grow, and speeds up as the level increases. The game ends when the snake
hits the wall or itself, or is won when the snake fills the entire board.

Inspired by [ScriptRaccoon's](https://github.com/ScriptRaccoon/snake-game) snake
game based on a [Live Coding Video](https://www.youtube.com/watch?v=4oNyD3A5Xl4),
which I watched during a training session on my "Küchenrolle" (kitchen roll — a.k.a.
indoor bike).

## Usage

```html
<qp-snake></qp-snake>

<!-- Custom board size and language -->
<qp-snake size="15" width="80vmin" lang="en"></qp-snake>
```

```html
<script type="module" src="/js/components-web/qp-snake/qp-snake.wc.js"></script>
```

## Attributes

**`size`** (number, default: `20`)

- Grid size (NxN).

**`width`** (string, default: `"70vmin"`)

- Board width as CSS value. Must match the pattern `<number>vmin` (e.g. `"80vmin"`).

**`lang`** (string, default: `"de"`)

- Language code for translations (`"de"` or `"en"`).

## Constants

**`SIZE`** — `20`

- Default grid size.

**`INTERVAL_SPEED`** — `500`

- Initial loop interval in ms. Decreases as the level increases (minimum 250 ms).

## Events

All events are `CustomEvent` with `bubbles: true` and `composed: true` (cross Shadow DOM).

**`qp-snake.game-started`**

- Fired when a new game starts.
- `detail: {}`

**`qp-snake.game-stopped`**

- Fired when the game is stopped by the player.
- `detail: {}`

**`qp-snake.game-paused`**

- Fired when the game is paused.
- `detail: {}`

**`qp-snake.game-resumed`**

- Fired when the game is resumed after pause.
- `detail: {}`

**`qp-snake.game-lost`**

- Fired when the snake hits a wall or itself.
- `detail: { level, speed, length }`
  - `level` — current level at time of loss
  - `speed` — current interval speed in ms
  - `length` — snake length in segments

**`qp-snake.game-won`**

- Fired when the snake fills the entire board.
- `detail: {}`

**`qp-snake.game-level-up`**

- Fired when speed increases and the level goes up.
- `detail: { level, speed }`
  - `level` — new level
  - `speed` — new interval speed in ms

```js
document.querySelector('qp-snake').addEventListener('qp-snake.game-lost', (e) => {
  console.log(`Lost at level ${e.detail.level} with ${e.detail.length} segments`);
});
```

## Game Flow

1. The player starts the game via the **Start** button or the **Space** key.
2. The snake moves one step in the current direction each tick (`INTERVAL_SPEED` ms).
3. Eating food grows the snake by one segment.
4. Every `level * 5` segments the speed increases and the level goes up.
5. **Space** pauses/resumes, **Escape** stops, **Arrow keys** change direction.
6. The game is lost when the snake hits a wall or itself, and won when the
   snake fills the entire board.

## UI Sections

- **Scoreboard** — state indicator, board size, snake length, speed/level
- **Board** — CSS grid of cells
- **Button bar** — Start, Pause, Stop
  - **Start** — starts a new game
  - **Pause** — pauses/resumes the running game
  - **Stop** — stops the current game

## Lifecycle

**`connectedCallback`**

- Renders the component (board, scoreboard, buttons).

**`disconnectedCallback`**

- Clears timers and removes all event listeners.

**`attributeChangedCallback`**

- Re-renders when `size`, `width`, or `lang` change.

## Translations

All visible text is resolved via `_dict()` (Dictionary module) with a built-in
`_defaultDict()` fallback (de/en).

## File Structure

```text
qp-snake/
  qp-snake.wc.js            — Web Component (main)
  qp-snake.styles.js         — Scoped styles (loaded via getStyles())
  qp-snake.dictionary.js     — i18n translations
```
