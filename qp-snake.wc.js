/**
 * <qp-snake> — Snake Game Web Component
 *
 * A classic snake game. The snake moves across a grid, eats food to grow,
 * and speeds up as the level increases. The game ends when the snake hits
 * the wall or itself, or is won when the snake fills the entire board.
 *
 * @element qp-snake
 *
 * @attr {number} size  - Grid size (NxN). Default: 20
 * @attr {string} width - Board width as CSS value (e.g. "70vmin"). Default: "70vmin"
 * @attr {string} lang  - Language code for translations ("de" or "en"). Default: "de"
 *
 * @example
 *   <qp-snake></qp-snake>
 *
 *   <!-- Custom board size and language -->
 *   <qp-snake size="15" width="80vmin" lang="en"></qp-snake>
 *
 * @description
 *   Lifecycle:
 *     connectedCallback        — Renders the component.
 *     disconnectedCallback     — Clears timers and removes all event listeners.
 *     attributeChangedCallback — Re-renders when observed attributes change.
 *
 *   Game flow:
 *     1. Player starts the game via Start button or Space key.
 *     2. The snake moves in the current direction each tick (INTERVAL_SPEED ms).
 *     3. Eating food grows the snake by one segment.
 *     4. Every (level * 5) segments the speed increases and the level goes up.
 *     5. Space pauses/resumes, Escape stops, Arrow keys change direction.
 *     6. Game is lost on wall or self collision, won when the board is full.
 *
 *   UI sections:
 *     - Scoreboard  — state indicator, board size, snake length, speed/level
 *     - Board       — CSS grid of cells
 *     - Button bar  — Start, Pause, Stop
 *
 *   Translations:
 *     All visible text is resolved via _dict() (Dictionary module) with a
 *     built-in _defaultDict() fallback (de/en).
 *
 *   Styles:
 *     Loaded from the external module qp-snake.styles.js via getStyles().
 *
 *   Events (CustomEvent, bubbles, composed):
 *     - "qp-snake.game-started"  — fired when a new game starts.
 *         detail: {}
 *     - "qp-snake.game-stopped"  — fired when the game is stopped by the player.
 *         detail: {}
 *     - "qp-snake.game-paused"   — fired when the game is paused.
 *         detail: {}
 *     - "qp-snake.game-resumed"  — fired when the game is resumed after pause.
 *         detail: {}
 *     - "qp-snake.game-lost"     — fired when the snake hits a wall or itself.
 *         detail: { level: number, speed: number, length: number }
 *     - "qp-snake.game-won"      — fired when the snake fills the entire board.
 *         detail: {}
 *     - "qp-snake.game-level-up" — fired when speed increases and level goes up.
 *         detail: { level: number, speed: number }
 *
 * @dependencies
 *   - ./qp-snake.dictionary.js  — i18n translations
 *   - ./qp-snake.styles.js      — scoped styles
 */

import Dictionary, { Languages } from "./qp-snake.dictionary.js";
import getStyles from "./qp-snake.styles.js";

class QPSnake extends HTMLElement {
  static SIZE = 20;
  static INTERVAL_SPEED = 500;
  static DIRECTIONS = ["up", "right", "down", "left"];
  static KEYS = {
    13: "Enter",
    27: "Escape",
    32: "Space",
    37: "ArrowLeft",
    38: "ArrowUp",
    39: "ArrowRight",
    40: "ArrowDown",
  };

  /**
   * Creates an array of sequential integers from 0 to size - 1.
   * @param {number} size - length of the array
   * @returns {number[]}
   */
  static range(size) {
    return Array.from({ length: size }, (_, i) => i);
  }

  static get observedAttributes() {
    return ["size", "width", "lang"];
  }

  constructor() {
    super();

    // create shadow root (DOM)
    this.attachShadow({ mode: "open" });

    // attributes
    this._lang = "de";
    this._size = QPSnake.SIZE;
    this._width = "70vmin";

    // nodes
    this._board = null;
    this._counter = null;
    this._output = null;
    this._stateNode = null;
    this._btnStop = null;
    this._btnStart = null;
    this._btnPause = null;

    // timers and properties
    this._hLoopTimer = null;
    this._snake = [];
    this._food = null;
    this._speed = QPSnake.INTERVAL_SPEED;
    this._level = 1;
    this._direction = "down";
    this._state = "stopped";

    // Methods bound to this
    this._handleStopClick = this._handleStopClick.bind(this);
    this._handleStartClick = this._handleStartClick.bind(this);
    this._handlePauseClick = this._handlePauseClick.bind(this);
    this._handleKeyDown = this._handleKeyDown.bind(this);

    // Initialize the dictionary function in the constructor,
    // as attributeChangedCallback is called before connectedCallback
    this._initializeDictionary();
  }

  /* START - Lifecycle */

  /**
   * Called when the element is inserted into the DOM.
   */
  connectedCallback() {
    this._render();
  }

  /**
   * Called when the element is removed from the DOM.
   * Clears timers and removes all event listeners.
   */
  disconnectedCallback() {
    this._reset();
  }

  /**
   * Called whenever an observed attribute changes.
   * @param {string} name - attribute name
   * @param {string|null} oldValue - previous value
   * @param {string|null} newValue - new value
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    switch (name) {
      case "size":
        this._size = Number(newValue) || this._size;
        this._resetGame();
        break;
      case "width":
        this._width = /^\d+vmin$/.test(newValue) ? newValue : this._width;
        break;
      case "lang":
        this._lang = newValue;
        this._initializeDictionary();
        break;
    }

    if (this.isConnected && this._board) {
      this._render();
    }
  }

  /**
   * Tears down the current state by removing all event listeners.
   * Called before re-rendering and on disconnect.
   * @private
   */
  _reset() {
    this._removeEvents();
  }
  /* END - Lifecycle */

  /* START - Dictionary */

  /**
   * Initializes the dictionary function for translations.
   * Called in the constructor because attributeChangedCallback runs before connectedCallback.
   * Uses the imported Dictionary module.
   * Flexible signature: dict(key), dict(key, lang), dict(key, arg), dict(key, lang, arg)
   * @private
   */
  _initializeDictionary() {
    this._dict = (key, ...args) => {
      try {
        let tmp = args.splice(0, 1)[0];
        let lang = this._lang || "de";

        if (Languages.includes(tmp)) {
          lang = tmp;
        } else if (args.length > 0 || tmp !== undefined) {
          args = [tmp, ...args];
        }

        const dict = Dictionary(args);
        return dict[key]?.[lang] || key;
      } catch (e) {
        return this._defaultDict(key, this._lang || "de", args);
      }
    };
  }

  /**
   * Fallback dictionary for translations.
   * Used when the Dictionary module throws an error.
   * @private
   * @param {string} key - translation key
   * @param {string} [lang='de'] - language code
   * @param {Array} [args=[]] - dynamic values for template literals
   * @returns {string} translated text, or the key as fallback
   */
  _defaultDict(key, lang = "de", args = []) {
    const fallback = {
      funSnakeStart: { de: "Start", en: "Start" },
      funSnakePause: { de: "Pause", en: "Pause" },
      funSnakeStop: { de: "Stop", en: "Stop" },
      scoreboardSize: {
        de: `Spielfeld: ${args[0]}x${args[0]}`,
        en: `Board: ${args[0]}x${args[0]}`,
      },
      scoreboardSnakeLength: { de: `Laenge: ${args[0]}`, en: `Length: ${args[0]}` },
      scoreboardSpeed: {
        de: `Speed: ${args[0]}, Level: ${args[1]}`,
        en: `Speed: ${args[0]}, Level: ${args[1]}`,
      },
      scoreboardState_paused: { de: `Pausiert`, en: `Paused` },
      scoreboardState_running: { de: `Running`, en: `Running` },
      scoreboardState_stopped: { de: `Stop`, en: `Stopped` },
    };

    return fallback[key]?.[lang] || key;
  }
  /* END - Dictionary */

  /* START - Event Controller */

  /**
   * Registers event listeners on interactive elements.
   * @private
   */
  _attachEvents() {
    this._btnStop && this._btnStop.addEventListener("click", this._handleStopClick);
    this._btnStart && this._btnStart.addEventListener("click", this._handleStartClick);
    this._btnPause && this._btnPause.addEventListener("click", this._handlePauseClick);

    window.addEventListener("keydown", this._handleKeyDown);
  }

  /**
   * Removes all event listeners.
   * Called in disconnectedCallback and before re-rendering.
   * @private
   */
  _removeEvents() {
    this._btnStop && this._btnStop.removeEventListener("click", this._handleStopClick);
    this._btnStart && this._btnStart.removeEventListener("click", this._handleStartClick);
    this._btnPause && this._btnPause.removeEventListener("click", this._handlePauseClick);

    window.removeEventListener("keydown", this._handleKeyDown);
  }

  /**
   * Dispatches a CustomEvent that bubbles and crosses the Shadow DOM boundary.
   * @private
   * @param {string} type - event name, e.g. "qp-snake.game-won"
   * @param {Object} [payload={}] - data exposed via event.detail
   */
  _dispatchEvent(type, payload = {}) {
    this.dispatchEvent(
      new CustomEvent(type, {
        bubbles: true,
        composed: true,
        detail: payload,
      }),
    );
  }
  /* END - Event Controller */

  /* START - Event Handlers */

  /** @private */
  _handleStopClick() {
    this._stopGame();
  }

  /** @private */
  _handleStartClick() {
    this._startGame();
  }

  /**
   * Toggles between paused and running state.
   * @private
   */
  _handlePauseClick() {
    if (this._state === "paused") {
      this._resumeGame();
    } else {
      this._pauseGame();
    }
  }

  /**
   * Handles keyboard input for direction changes and game control.
   * Arrow keys change direction, Space starts/pauses/resumes, Escape stops.
   * @private
   * @param {KeyboardEvent} e
   */
  _handleKeyDown(e) {
    QPSnake.KEYS[e.keyCode] && e.preventDefault();

    switch (QPSnake.KEYS[e.keyCode]) {
      case "ArrowLeft":
        if (this._direction !== "right") this._direction = "left";
        break;
      case "ArrowRight":
        if (this._direction !== "left") this._direction = "right";
        break;
      case "ArrowUp":
        if (this._direction !== "down") this._direction = "up";
        break;
      case "ArrowDown":
        if (this._direction !== "up") this._direction = "down";
        break;
      case "Space":
        if (this._state === "stopped") {
          this._startGame();
        } else if (this._state === "paused") {
          this._resumeGame();
        } else {
          this._pauseGame();
        }
        break;
      case "Escape":
        this._stopGame();
        break;
    }
  }
  /* END - Event Handlers */

  /* START - Game Controller */

  /**
   * Returns a random [x, y] position within the board.
   * @private
   * @returns {number[]} coordinate tuple [x, y]
   */
  _randomPosition() {
    return [Math.floor(Math.random() * this._size), Math.floor(Math.random() * this._size)];
  }

  /**
   * Initializes the snake with a single segment at a random position
   * and a random direction.
   * @private
   */
  _initSnake() {
    const [x, y] = this._randomPosition();

    // initialize snake (Array = Snake von hinten nach vorne, dh. [0] = letztes Element, [1] = Kopf)
    this._snake = [[x, y]];

    this._direction = QPSnake.DIRECTIONS[Math.floor(Math.random() * QPSnake.DIRECTIONS.length)];
  }

  /**
   * Starts a new game. Resets state, renders snake and food,
   * starts the loop, and dispatches "qp-snake.game-started".
   * @private
   */
  _startGame() {
    this._resetGame();
    this._renderSnake();
    this._renderFood();
    this._hLoopTimer = setInterval(() => this._renderLoop(), this._speed);

    this._state = "running";
    this._setStates();
    this._counter.textContent = this._dict(
      "scoreboardSpeed",
      this._lang,
      this._speed,
      this._level,
    );
    this._dispatchEvent("qp-snake.game-started");
  }

  /**
   * Stops the current game and dispatches "qp-snake.game-stopped".
   * @private
   */
  _stopGame() {
    this._clearLoop();
    this._dispatchEvent("qp-snake.game-stopped");
  }

  /**
   * Pauses the running game. Stops the loop timer and dispatches "qp-snake.game-paused".
   * @private
   */
  _pauseGame() {
    this._hLoopTimer && clearInterval(this._hLoopTimer);
    this._hLoopTimer = null;
    this._state = "paused";
    this._setStates();
    this._dispatchEvent("qp-snake.game-paused");
  }

  /**
   * Resumes a paused game. Restarts the loop timer and dispatches "qp-snake.game-resumed".
   * @private
   */
  _resumeGame() {
    this._hLoopTimer = setInterval(() => this._renderLoop(), this._speed);
    this._state = "running";
    this._setStates();
    this._dispatchEvent("qp-snake.game-resumed");
  }

  /**
   * Resets all game state to initial values.
   * Stops the loop, removes snake and food from the board,
   * and clears all game-related properties.
   * @private
   */
  _resetGame() {
    this._stopGame();
    this._removeSnake();
    this._removeFood();
    this._initSnake();
    this._speed = QPSnake.INTERVAL_SPEED;
    this._level = 1;
  }

  /**
   * Ends the game as a loss. Stops the loop and dispatches "qp-snake.game-lost".
   * @private
   */
  _lostGame() {
    this._clearLoop();
    this._dispatchEvent("qp-snake.game-lost", {
      level: this._level,
      speed: this._speed,
      length: this._snake.length,
    });
  }

  /**
   * Ends the game as a win. Stops the loop and dispatches "qp-snake.game-won".
   * @private
   */
  _wonGame() {
    this._clearLoop();
    this._dispatchEvent("qp-snake.game-won");
  }

  /**
   * Restarts the game loop with the current speed (e.g. after a level-up).
   * @private
   */
  _restartLoop() {
    this._hLoopTimer && clearInterval(this._hLoopTimer);
    this._hLoopTimer = setInterval(() => this._renderLoop(), this._speed);
  }

  /**
   * Stops the game loop timer and resets the state to "stopped".
   * Used internally by _lostGame(), _wonGame(), and _stopGame().
   * @private
   */
  _clearLoop() {
    this._hLoopTimer && clearInterval(this._hLoopTimer);
    this._hLoopTimer = null;
    this._state = "stopped";
    this._setStates();
  }

  /**
   * Calculates the next head position based on the current direction.
   * Checks for collisions and boundary violations (triggers _lostGame()),
   * handles food consumption (grows snake) or normal movement.
   * @private
   */
  _updateSnake() {
    // coordinates of head
    const [x, y] = this._snake.at(-1);
    // tail without last segment
    const tail = this._snake.slice(1);

    let head;

    switch (this._direction) {
      case "right":
        head = [x + 1, y];
        break;
      case "left":
        head = [x - 1, y];
        break;
      case "up":
        head = [x, y - 1];
        break;
      case "down":
        head = [x, y + 1];
        break;
    }

    // check if head hits a segment of the snake
    if (this._hasCollision(head)) {
      this._lostGame();
      return;
    }

    // is snake inside game board
    if (this._isHeadValid(head)) {
      if (this._hasEqualPosition(this._food, head)) {
        this._removeFood();
        this._renderFood();

        // grow snake
        this._snake = [...this._snake, head];
      } else {
        // move snake
        this._snake = [...tail, head];
      }
    } else {
      this._lostGame();
      return;
    }
  }

  /**
   * Checks whether the snake has reached a level-up threshold.
   * If so, increases speed and level, updates the scoreboard,
   * dispatches "qp-snake.game-level-up", and restarts the loop.
   * @private
   */
  _checkLevelUp() {
    if (this._snake.length % (this._level * 5) === 0 && this._speed >= 250) {
      this._speed -= 25;
      this._level += 1;

      this._dispatchEvent("qp-snake.game-level-up", {
        level: this._level,
        speed: this._speed,
      });
      this._counter.textContent = this._dict(
        "scoreboardSpeed",
        this._lang,
        this._speed,
        this._level,
      );
      this._restartLoop();
    }
  }
  /* END - Game Controller */

  /* START - Game Logic (Helpers) */

  /**
   * Checks whether a position is within the board boundaries.
   * @private
   * @param {number[]} head - coordinate tuple [x, y]
   * @returns {boolean}
   */
  _isHeadValid(head) {
    const [x, y] = head;

    return x >= 0 && x < this._size && y >= 0 && y < this._size;
  }

  /**
   * Checks whether a position overlaps with any segment of the snake.
   * @private
   * @param {number[]} position - coordinate tuple [x, y]
   * @returns {boolean}
   */
  _hasCollision(position) {
    return this._snake.some((segment) => segment[0] === position[0] && segment[1] === position[1]);
  }

  /**
   * Compares two coordinate tuples for equality.
   * @private
   * @param {number[]} position1 - first coordinate [x, y]
   * @param {number[]} position2 - second coordinate [x, y]
   * @returns {boolean}
   */
  _hasEqualPosition(position1, position2) {
    return position1[0] === position2[0] && position1[1] === position2[1];
  }
  /* END - Game Logic (Helpers) */

  /* START - UI / Rendering */

  /**
   * Returns the scoped <style> block for the component.
   * Delegates to the external getStyles() module.
   * @private
   * @returns {string} HTML string containing a <style> element
   */
  _setStyles() {
    return getStyles.call(this);
  }

  /**
   * Generates the HTML string for all board cells as a flat grid.
   * @private
   * @returns {string} HTML string of cell div elements
   */
  _setCells() {
    const cells = `${QPSnake.range(this._size)
      .map(
        (y) =>
          `${QPSnake.range(this._size)
            .map(
              (x) => `
            <div class="qp-snake-cell" data-id="${x + "," + y}" data-x="${x}" data-y="${y}"></div>
          `,
            )
            .join("")}`,
      )
      .join("")}`;

    return cells;
  }

  /**
   * Returns the DOM element for a given board coordinate.
   * @private
   * @param {number[]} position - coordinate tuple [x, y]
   * @returns {HTMLElement|null}
   */
  _getCell([x, y]) {
    return this._board ? this._board.querySelector(`[data-id="${x},${y}"]`) : null;
  }

  /**
   * Caches references to shadow DOM nodes.
   * @private
   */
  _setNodes() {
    this._board = this.shadowRoot.querySelector(".qp-snake-board");
    this._btnStop = this.shadowRoot.querySelector(".qp-snake-btn-stop");
    this._btnStart = this.shadowRoot.querySelector(".qp-snake-btn-start");
    this._btnPause = this.shadowRoot.querySelector(".qp-snake-btn-pause");

    this._counter = this.shadowRoot.querySelector(".qp-scoreboard-counter");
    this._stateNode = this.shadowRoot.querySelector(".qp-scoreboard-state");
    this._output = this.shadowRoot.querySelector(".qp-scoreboard-output");
  }

  /**
   * Updates the scoreboard state indicator to reflect the current game state.
   * @private
   */
  _setStates() {
    if (this._stateNode)
      this._stateNode.innerHTML = this._dict(`scoreboardState_${this._state}`, this._lang);
  }

  /**
   * Renders the full shadow DOM, caches node references, and attaches event listeners.
   * Called on connect and when observed attributes change.
   * @private
   */
  _render() {
    this._reset();

    this.shadowRoot.innerHTML = `
      ${this._setStyles()}
      ${this._createScoreboard()}
      ${this._createBoard()}
      ${this._createButtonBar()}
    `;

    if (this.isConnected) {
      this._setNodes();
      this._attachEvents();
    }
  }

  /**
   * Creates the scoreboard HTML with state, title, output, and counter.
   * @private
   * @returns {string} HTML string
   */
  _createScoreboard() {
    return `
      <div class="qp-scoreboard">
        <div class="qp-scoreboard-state">---</div>
        <div class="qp-scoreboard-title">${this._dict("scoreboardSize", this._lang, this._size)}</div>
        <div class="qp-scoreboard-output">---</div>
        <div class="qp-scoreboard-counter">${this._dict("scoreboardSpeed", this._lang, this._speed, this._level)}</div>
      </div>`;
  }

  /**
   * Creates the game board HTML with the CSS grid of cells.
   * @private
   * @returns {string} HTML string
   */
  _createBoard() {
    return `
      <div class="qp-snake-wrapper">
        <div class="qp-snake-board" style="--width: ${this._width}; --size: ${this._size};">${this._setCells()}</div>
      </div>`;
  }

  /**
   * Creates the button bar HTML with Start, Pause, and Stop buttons.
   * @private
   * @returns {string} HTML string
   */
  _createButtonBar() {
    return `
      <div class="qp-memory-button-bar">
        <button class="qp-btn qp-btn-primary qp-snake-btn-start">${this._dict("funSnakeStart", this._lang)}</button>
        <button class="qp-btn qp-btn-cta qp-snake-btn-pause">${this._dict("funSnakePause", this._lang)}</button>
        <button class="qp-btn qp-btn-secondary qp-snake-btn-stop">${this._dict("funSnakeStop", this._lang)}</button>
      </div>`;
  }

  /**
   * Single game tick: removes old snake, updates position,
   * re-renders snake, updates scoreboard, and checks for level-up.
   * @private
   */
  _renderLoop() {
    this._removeSnake();
    this._updateSnake();
    this._renderSnake();
    this._updateScoreboard();
    this._checkLevelUp();
  }

  /**
   * Removes all snake CSS classes from the board cells.
   * @private
   */
  _removeSnake() {
    for (const segment of this._snake) {
      this._getCell(segment)?.classList.remove("qp-snake-body", "qp-snake-head");
    }
  }

  /**
   * Renders the snake on the board by adding CSS classes to the corresponding cells.
   * The last segment receives the additional "qp-snake-head" class.
   * @private
   */
  _renderSnake() {
    for (const [x, y] of this._snake) {
      this._getCell([x, y]).classList.add("qp-snake-body");
    }

    const [x, y] = this._snake.at(-1);
    this._getCell([x, y]).classList.add("qp-snake-head");
  }

  /**
   * Places food at a random position that does not collide with the snake.
   * Triggers _wonGame() if the snake fills the entire board.
   * @private
   */
  _renderFood() {
    if (this._snake.length >= this._size * this._size) {
      this._wonGame();
      return;
    }

    this._food && this._removeFood();

    this._food = this._randomPosition();

    while (this._hasCollision(this._food)) {
      this._food = this._randomPosition();
    }

    this._getCell(this._food).classList.add("qp-snake-food");
  }

  /**
   * Removes the current food element from the board.
   * @private
   */
  _removeFood() {
    this._food && this._getCell(this._food).classList.remove("qp-snake-food");

    this._food = null;
  }

  /**
   * Updates the scoreboard output with the current snake length.
   * @private
   */
  _updateScoreboard() {
    this._output.textContent = this._dict("scoreboardSnakeLength", this._lang, this._snake.length);
  }
  /* END - UI / Rendering */
}

// Registration
customElements.define("qp-snake", QPSnake);

export default QPSnake;
