/**
 * <qp-memory> — Cover Memory Game Web Component
 *
 * A memory/matching card game. Image sources are configurable: either fetched
 * from a server API (via the `url` attribute) or loaded from the bundled
 * local image set (qp-memory.images.js) as fallback.
 * Players flip pairs of cards to find matching images.
 *
 * @element qp-memory
 *
 * @attr {number} dimension - Grid size (NxN). Allowed values defined in BOARD_SIZES. Default: 4
 * @attr {string} url       - Optional API endpoint to fetch cover images (e.g. "/media/covers").
 *                            If omitted, the bundled imageList from qp-memory.images.js is used.
 *
 * @prop {string} _width - Board width as CSS value. Adjusted internally based on
 *                         dimension (e.g. "60%" for <=4, "90dvh" for >4). Default: "60%"
 *
 * @example
 *   <!-- With bundled images (zodiac signs, traffic signs, card suits) -->
 *   <qp-memory dimension="4"></qp-memory>
 *
 *   <!-- With server-fetched cover images -->
 *   <qp-memory dimension="6" url="/media/covers"></qp-memory>
 *
 * @description
 *   Lifecycle:
 *     connectedCallback  — Loads images (from API if url is set, otherwise from
 *                          bundled imageList), then starts the game.
 *     disconnectedCallback — Clears timers and removes all event listeners.
 *     attributeChangedCallback — Re-renders when dimension changes.
 *
 *   Game flow:
 *     1. Images are loaded once on connect (API fetch or local imageList).
 *     2. _startGame() picks random images, duplicates & shuffles them (Fisher-Yates),
 *        renders the board, and disables the start button.
 *     3. Players click cards to reveal images. After two clicks the pair is checked:
 *        - Match:   cards stay visible and are marked as matched.
 *        - No match: cards are flipped back after NEXT_ROUND_DELAY ms.
 *     4. _onWin() fires when all pairs are found, shows elapsed time (including
 *        hint penalties: +5 seconds per hint used) and moves, and re-enables
 *        the start button. The solved board remains visible.
 *
 *   UI sections:
 *     - Display bar   — headline (NxN), elapsed time, move counter
 *     - Board         — CSS grid of card elements with random rotation (-5° to +5°)
 *     - Button bar    — Start, Restart, Hint (+5s penalty per use), board size selector
 *
 *   Translations:
 *     All visible text is resolved via _dict() (Dictionary module) with a
 *     built-in _defaultDict() fallback (de/en).
 *
 *   Styles:
 *     Loaded from the external module qp-memory.styles.js via getStyles().
 *     Board width is set through the CSS custom property --boardWidth.
 *
 *   Events (CustomEvent, bubbles, composed):
 *     - "qp-memory.game-start" — fired when a new game starts.
 *         detail: {}
 *     - "qp-memory.game-won"  — fired when all pairs have been found.
 *         detail: { time: number (ms), formattedTime: string ("MM:SS"), moves: number, hints: number }
 *
 * @dependencies
 *   - ./qp-memory.dictionary.js  — i18n translations
 *   - ./qp-memory.styles.js      — scoped styles
 *   - ./qp-memory.images.js      — bundled image set (zodiac, traffic signs, card suits)
 *   - /media/covers (API)        — optional server-side cover image list
 */

import Dictionary, { Languages } from './qp-memory.dictionary.js';
import getStyles from './qp-memory.styles.js';
import { imageList } from './qp-memory.images.js';

class QPMemory extends HTMLElement {
  static PENALTY_SECONDS = 5;
  static NEXT_ROUND_DELAY = 1000;
  static BOARD_SIZES = [2, 4, 6, 8];

  static get observedAttributes() {
    return ["dimension", "url"];
  }

  constructor() {
    super();

    // create shadow root (DOM)
    this.attachShadow({ mode: "open" });

    // attributes
    this._dimension = 4;
    this._url = null;
    this._lang = 'de';

    // nodes
    this._board = null;
    this._counter = null;
    this._output = null;
    this._btnStart = null;
    this._btnRestart = null;
    this._btnHint = null;
    this._selectSize = null;
    
    // timers and properties
    this._time = null;
    this._covers = null;
    this._rnd = [];
    this._round = {
      first: null,
      second: null
    };
    this._moves = 0;
    this._hints = 0;
    this._width = "60%";

    // Methods bound to this (not applicable for event handlers,
    // since this will then point to the event target)
    this._handleCardClick = this._handleCardClick.bind(this);
    this._handleStartClick = this._handleStartClick.bind(this);
    this._handleHintClick = this._handleHintClick.bind(this);
    this._handleSizeChange = this._handleSizeChange.bind(this);

    // Initialize the dictionary function in the constructor,
    // as attributeChangedCallback is called before connectedCallback
    this._initializeDictionary();
  }

  /* START - Lifecycle */
  // Called when the element is inserted into the DOM
  async connectedCallback() {
    this._covers = this._url ? await this._fetchCovers() : imageList;

    if (!this._covers.length) {
      console.error('qp-memory: No images available');
      return;
    }

    this._startGame();
  }

  // Called when the element is removed from the DOM
  disconnectedCallback() {
    this._reset();
  }

  // Called whenever an observed attribute changes
  attributeChangedCallback(name, oldValue, newValue) {
    // No action if the value is the same (Performance optimization)
    if (oldValue === newValue) return;

    switch (name) {
      case "dimension":
        this._dimension = parseInt(newValue, 10) || 4;
        break;
      case "url":
        this._url = newValue;
        break;
    }

    if (this.isConnected && this._covers) {
      this._render();
    }
  }
  /* END - Lifecycle */

  /* START - Tools, Helpers */
  /**
   * Initializes the dictionary function for translations.
   * Called in the constructor because attributeChangedCallback runs before connectedCallback.
   * Uses the imported Dictionary module.
   * Flexible signature like store.dict: dict(key), dict(key, lang), dict(key, arg), dict(key, lang, arg)
   * @private
   */
  _initializeDictionary() {
    // Create dictionary function with flexible signature
    this._dict = (key, ...args) => {
      try {
        // Extract first argument
        let tmp = args.splice(0, 1)[0];
        let lang = this._lang || 'de';

        // Check if tmp is a valid language code
        if (Languages.includes(tmp)) {
          lang = tmp;
        } else if (args.length > 0 || tmp !== undefined) {
          // Not a language code — treat as dictionary argument
          args = [tmp, ...args];
        }

        const dict = Dictionary(args);
        return dict[key]?.[lang] || key;
      } catch (e) {
        // Fall back to default dictionary on error
        return this._defaultDict(key, this._lang || 'de', args);
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
  _defaultDict(key, lang = 'de', args = []) {
    const fallback = {
      funMemoryHeadline: { de: `Cover Memory: ${args[0]}x${args[0]} Karten`, en: `Cover Memory: ${args[0]}x${args[0]} Cards` },
      funMemoryMoves: { de: `Züge: ${args[0]}`, en: `Moves: ${args[0]}` },
      funMemoryTime: { de: `Zeit: ${args[0]}`, en: `Time: ${args[0]}` },
      funMemoryStart: { de: 'Start', en: 'Start' },
      funMemoryHint: { de: 'Tipp', en: 'Hint' },
      funMemoryRestart: { de: 'Neustart', en: 'Restart' },
      funMemoryReset: { de: 'Zurücksetzen', en: 'Reset' },
    };
    
    return fallback[key]?.[lang] || key;
  }

  /**
   * Fetches the covers for the current memory game from the server.
   * @returns {Promise<string[]>} An array of cover filenames if successful, otherwise an empty array.
   * @throws {Error} If the server returns an error or the response is not a JSON object.
   */
  async _fetchCovers() {
    try {
      const response = await fetch(this._url);
      const data = await response.json();
      return data?.success ? data.covers : [];
    } catch (error) {
      console.error('Error fetching covers:', error);
      return [];
    }
  }

  /**
   * Builds a shuffled list of card pairs for the current board.
   * Picks (dimension² / 2) unique random indices from _covers, duplicates them,
   * then shuffles the result using the Fisher-Yates algorithm.
   * @private
   */
  _randomList() {
    const len = (this._dimension * this._dimension) / 2;
    let i = 0;

    while (this._rnd.length < len && i < 1000) {
      const rnd = Math.floor(Math.random() * this._covers.length);

      if (!this._rnd.includes(rnd)) {
        this._rnd.push(rnd);
      }

      i++;
    }

    this._rnd = this._rnd.concat(this._rnd);

    // Fisher-Yates Shuffle
    for (let j = this._rnd.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [this._rnd[j], this._rnd[k]] = [this._rnd[k], this._rnd[j]];
    }
  }

  /**
   * Caches references to shadow DOM nodes and sets the board width CSS variable.
   * @private
   */
  _setNodes() {
    this._board = this.shadowRoot.querySelector(".qp-memory-board");
    this._counter = this.shadowRoot.querySelector(".qp-memory-display-counter");
    this._output = this.shadowRoot.querySelector(".qp-memory-display-output");
    this._btnStart = this.shadowRoot.querySelector('.qp-memory-btn-start');
    this._btnRestart = this.shadowRoot.querySelector('.qp-memory-btn-restart');
    this._btnHint = this.shadowRoot.querySelector('.qp-memory-btn-hint');
    this._selectSize = this.shadowRoot.querySelector('.qp-memory-select-size');
    
    // set board width
    this._board.style.setProperty('--boardWidth', `${this._width}`);
  }
  
  /**
   * Formats a duration in milliseconds as "MM:SS".
   * @private
   * @param {number} ms - duration in milliseconds
   * @returns {string} formatted time string, e.g. "02:35"
   */
  _formatTimestamp(ms) {
    const totalSeconds = Math.floor(ms / 1000); // timestamp in seconds
    const minutes = Math.floor(totalSeconds / 60); // minutes
    const seconds = totalSeconds % 60; // seconds
    
    // Formatting: 2-digit minutes and seconds
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  /* END - Tools, Helpers */

  /* START - Event Controller */
  /**
   * Registers click/change event listeners on card elements, buttons, and the size selector.
   * Aborts silently if the board has not been rendered yet.
   * @private
   */
  _attachEvents() {
    if (!this._board) return;

    const memoryCards = this._board.querySelectorAll('.qp-memory-card');

    Array.from(memoryCards).forEach(card => {
      card.addEventListener('click', this._handleCardClick);
    });

    this._btnStart && this._btnStart.addEventListener('click', this._handleStartClick);
    this._btnRestart && this._btnRestart.addEventListener('click', this._handleStartClick);
    this._btnHint && this._btnHint.addEventListener('click', this._handleHintClick);
    this._selectSize && this._selectSize.addEventListener('change', this._handleSizeChange);
  }
  
  /**
   * Removes all event listeners.
   *
   * This is called in the disconnectedCallback to clean up the component.
   */
  _removeEvents() {
    this._btnStart && this._btnStart.removeEventListener('click', this._handleStartClick);
    this._btnRestart && this._btnRestart.removeEventListener('click', this._handleStartClick);
    this._btnHint && this._btnHint.removeEventListener('click', this._handleHintClick);
    this._selectSize && this._selectSize.removeEventListener('change', this._handleSizeChange);

    if (!this._board) return;

    const memoryCards = this._board.querySelectorAll('.qp-memory-card');

    Array.from(memoryCards).forEach(card => {
      card.removeEventListener('click', this._handleCardClick);
    });
  }
  
  /**
   * Dispatches a CustomEvent that bubbles and crosses the Shadow DOM boundary.
   * @private
   * @param {string} type - event name, e.g. "qp-memory.game-won"
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

  /* START - Event handlers */
  /**
   * Handles click on Start / Restart button. Starts a new game.
   * @private
   */
  _handleStartClick() {
    this._startGame();
  }

  /**
   * Handles change on the board size selector.
   * Updates dimension, adjusts board width, and starts a new game.
   * @private
   * @param {Event} e - change event from the select element
   */
  _handleSizeChange(e) {
    this._dimension = parseInt(e.target.value, 10);
    // adjust width depending on dimension
    this._width = this._dimension > 4 ? "90dvh" : "60%";
    
    this._startGame();
  }

  /**
   * Handles click on a card element.
   * Reveals the card image, disables hint mid-round, increments move counter,
   * and triggers match/unmatch check after the second card is flipped.
   * @private
   * @param {Event} e - click event; expects e.target to have data-cover and data-index
   */
  _handleCardClick(e) {
    const cover = e.target.dataset.cover;
    const index = e.target.dataset.index;
    const roundComplete = this._drawCard(cover, index);

    e.target.style.backgroundImage = this._url
      ? `url("/images/cover/${this._covers[cover]}")`
      : `url("${this._covers[cover]}")`;

    // first card drawn — disable hint until round completes
    if (!roundComplete) {
      this._btnHint.disabled = true;
    }

    // two cards have been flipped
    if (roundComplete) {
      // disable events for card board (enabled after round timeouts)
      this._board.classList.add('qp-prevent-events');
      // increment attempts
      this._moves++;

      this._counter.innerText = this._dict('funMemoryMoves', this._lang, this._moves, this._hints);

      // check if cards match
      if (this._checkCards()) {
        setTimeout(() => this._matchRound(), QPMemory.NEXT_ROUND_DELAY);
      } else {
        setTimeout(() => this._unmatchRound(), QPMemory.NEXT_ROUND_DELAY);
      }
    }
  }
  
  /**
   * Handles click on the Hint button.
   * Highlights a random matching pair temporarily and increments the hint counter
   * (each hint adds PENALTY_SECONDS to the final time).
   * @private
   * @param {Event} e - click event
   */
  _handleHintClick(e) {
    const hintIdx = Math.floor(Math.random() * this._rnd.length);
    const hintCards = this._board.querySelectorAll(`[data-cover="${this._rnd[hintIdx]}"]`);

    // time penalty
    this._hints++;
    
    hintCards.forEach(card => {
      card.classList.add('qp-memory-card-hint');
    });
    
    setTimeout(() => {
      hintCards.forEach(card => {
        card.classList.remove('qp-memory-card-hint');
      });
      
      this._counter.innerText = this._dict('funMemoryMoves', this._lang, this._moves, this._hints);
    }, QPMemory.NEXT_ROUND_DELAY);
  }
  /* END - Event handlers */

  /* START - Game Controller */
  /**
   * Initializes and starts a new game.
   * Resets state, generates a shuffled card list, renders the board,
   * records the start time, and dispatches "qp-memory.game-start".
   * @private
   */
  _startGame() {
    this._rnd = [];
    this._resetRound();
    this._randomList();
    this._render();
    
    this._time = new Date().getTime();
    this._hints = 0;
    
    this._moves = 0;
    this._btnStart.disabled = true;
    this._btnHint.disabled = false;
    
    this._dispatchEvent("qp-memory.game-start");
  }

  /**
   * Resets the current round state (first/second card selection),
   * re-enables pointer events on the board, and re-enables the hint button.
   * @private
   */
  _resetRound() {
    this._round = {
      first: null,
      second: null
    };

    // enable events
    this._board && this._board.classList.remove('qp-prevent-events');
    // re-enable hint button after round
    this._btnHint && (this._btnHint.disabled = false);
  }

  /**
   * Handles a successful match. Marks both cards as matched, removes their
   * click listeners, filters the matched cover from _rnd, resets the round,
   * and triggers _onWin() if no cards remain.
   * @private
   */
  _matchRound() {
    // loop over all found cards with same cover index
    this._board.querySelectorAll(`[data-cover="${this._round.first.cover}"]`).forEach(card => {
      // remove event listener
      card.removeEventListener('click', this._handleCardClick);
      // mark as matched
      card.classList.add('qp-memory-card-matched');
    });

    // filter found cover indices from array
    this._rnd = this._rnd.filter(item => item !== this._round.first.cover);

    // reset round
    this._resetRound();

    if (this._rnd.length === 0) {
      this._onWin();
    }
  }

  /**
   * Handles a failed match. Hides both revealed card images
   * (removes background-image) and resets the round.
   * @private
   */
  _unmatchRound() {
    if (this._round.first) {
      this._board.querySelectorAll(`[data-cover="${this._round.first.cover}"]`).forEach(card => {
        card.style.backgroundImage = '';
      });
    }
    if (this._round.second) {
      this._board.querySelectorAll(`[data-cover="${this._round.second.cover}"]`).forEach(card => {
        card.style.backgroundImage = '';
      });
    }

    this._resetRound();
  }

  /**
   * Called when all pairs have been found.
   * Calculates final time (elapsed + hint penalties), updates the display,
   * re-enables the start button, disables hint, and dispatches "qp-memory.game-won".
   * @private
   * @fires qp-memory.game-won
   */
  _onWin() {
    this._btnStart.disabled = false;
    this._btnHint.disabled = true;
    
    this._time = new Date().getTime() - this._time;
    this._time += this._hints * (QPMemory.PENALTY_SECONDS * 1000);
    this._output.innerText = this._dict('funMemoryTime', this._lang, this._formatTimestamp(this._time));
    
    this._dispatchEvent("qp-memory.game-won", {
      time: this._time,
      formattedTime: this._formatTimestamp(this._time),
      moves: this._moves,
      hints: this._hints
    });
  }

  /**
   * Records a card selection for the current round.
   * Stores the first or second card (preventing the same card from being picked twice).
   * @private
   * @param {string} card - the data-cover value of the clicked card
   * @param {string} index - the data-index value of the clicked card
   * @returns {boolean} true if both cards have been drawn (round complete)
   */
  _drawCard(card, index) {
    let roundComplete = false;

    if (this._round.first === null) {
      this._round.first = {
        cover: Number(card), 
        index: Number(index)
      };
    } else if (this._round.second === null && this._round.first.index !== Number(index)) {
      this._round.second = {
        cover: Number(card), 
        index: Number(index)
      };

      roundComplete = true;
    }

    return roundComplete;
  }

  /**
   * Checks whether the two drawn cards in the current round are a matching pair.
   * @private
   * @returns {boolean} true if both cards share the same cover index
   */
  _checkCards() {
    if (this._round.first && this._round.second) {
      return this._round.first.cover === this._round.second.cover;
    }

    return false;
  }

  /**
   * Tears down the current state by removing all event listeners.
   * Called before re-rendering and on disconnect.
   * @private
   */
  _reset() {
    this._removeEvents();
  }
  /* END - Game Controller */

  /* START - UI Controller Methods */
  /**
   * Returns the scoped <style> block for the component.
   * Delegates to the external getStyles() module, passing the current dimension.
   * @private
   * @returns {string} HTML string containing a <style> element
   */
  _setStyles() {
    return getStyles.call(this, {dimension: this._dimension});
  }

  /**
   * Generates the HTML string for the game board.
   * Creates dimension² card elements inside a CSS grid wrapper,
   * each with a random rotation between -5° and +5°.
   * @private
   * @returns {string} HTML string containing the board wrapper and card divs
   */
  _createBoard() {
    const totalCards = this._dimension * this._dimension;
    let cards = '';

    for (let i = 0; i < totalCards; i++) {
      const rotation = (Math.random() * 10 - 5).toFixed(2);
      cards += `<div class="qp-memory-card" data-index="${i}" data-cover="${this._rnd[i]}" style="transform: rotate(${rotation}deg);"></div>`;
    }

    return `<div class="qp-memory-wrapper">
      <div class="qp-memory-board">
        ${cards}
      </div>
    </div>`;
  }

  /**
   * Renders the full shadow DOM (display bar, styles, board, button bar),
   * caches node references, and attaches event listeners.
   * Called on game start and when observed attributes change.
   * @private
   */
  _render() {
    this._reset();

    this.shadowRoot.innerHTML = `
      <div class="qp-memory-display">
        <div class="qp-memory-display-title">${this._dict('funMemoryHeadline', this._lang, this._dimension)}</div>
        <div class="qp-memory-display-output">---</div>
        <div class="qp-memory-display-counter">${this._dict('funMemoryMoves', this._lang, 0, 0)}</div>
      </div>
      ${this._setStyles()}
      ${this._createBoard()}
      <div class="qp-memory-button-bar">
        <button class="qp-btn qp-btn-primary qp-memory-btn-start">${this._dict('funMemoryStart', this._lang)}</button>
        <button class="qp-btn qp-btn-cta qp-memory-btn-restart">${this._dict('funMemoryRestart', this._lang)}</button>
        <button class="qp-btn qp-btn-secondary qp-memory-btn-hint">${this._dict('funMemoryHint', this._lang)}</button>
        <select class="qp-btn qp-memory-select-size">
          ${QPMemory.BOARD_SIZES
            .filter(size => (size * size) / 2 <= this._covers.length)
            .map(size =>
              `<option value="${size}"${size === this._dimension ? ' selected' : ''}>${size} x ${size}</option>`
            ).join('')}
        </select>
      </div>
    `;

    if (this.isConnected) {
      this._setNodes();
      this._attachEvents();
    }
  }
}
/* END - UI Controller Methods */

// Registration
customElements.define("qp-memory", QPMemory);

export default QPMemory;
