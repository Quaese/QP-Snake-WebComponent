/**
 * <qp-snake> — Snake Game Web Component
 *
 * @element qp-snake
 *
 * @example
 *   <qp-snake></qp-snake>
 *
 * @description
 *   Lifecycle:
 *     connectedCallback        — Renders the component and starts the game.
 *     disconnectedCallback     — Clears timers and removes all event listeners.
 *     attributeChangedCallback — Re-renders when observed attributes change.
 *
 *   Translations:
 *     All visible text is resolved via _dict() (Dictionary module) with a
 *     built-in _defaultDict() fallback (de/en).
 *
 *   Styles:
 *     Loaded from the external module qp-snake.styles.js via getStyles().
 *
 * @dependencies
 *   - ./qp-snake.dictionary.js  — i18n translations
 *   - ./qp-snake.styles.js      — scoped styles
 */

import Dictionary, { Languages } from './qp-snake.dictionary.js';
import getStyles from './qp-snake.styles.js';


class QPSnake extends HTMLElement {

  static get observedAttributes() {
    return [];
  }

  constructor() {
    super();

    // create shadow root (DOM)
    this.attachShadow({ mode: "open" });

    // attributes
    this._lang = 'de';

    // nodes

    // timers and properties

    // Methods bound to this

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
      // case "example":
      //   this._example = newValue;
      //   break;
    }

    if (this.isConnected) {
      this._render();
    }
  }
  /* END - Lifecycle */

  /* START - Tools, Helpers */

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
        let lang = this._lang || 'de';

        if (Languages.includes(tmp)) {
          lang = tmp;
        } else if (args.length > 0 || tmp !== undefined) {
          args = [tmp, ...args];
        }

        const dict = Dictionary(args);
        return dict[key]?.[lang] || key;
      } catch (e) {
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
      // funSnakeHeadline: { de: 'Snake', en: 'Snake' },
    };

    return fallback[key]?.[lang] || key;
  }

  /**
   * Caches references to shadow DOM nodes.
   * @private
   */
  _setNodes() {
    // this._board = this.shadowRoot.querySelector(".qp-snake-board");
  }
  /* END - Tools, Helpers */

  /* START - Event Controller */

  /**
   * Registers event listeners on interactive elements.
   * @private
   */
  _attachEvents() {
    // this._btnStart && this._btnStart.addEventListener('click', this._handleStartClick);
  }

  /**
   * Removes all event listeners.
   * Called in disconnectedCallback and before re-rendering.
   * @private
   */
  _removeEvents() {
    // this._btnStart && this._btnStart.removeEventListener('click', this._handleStartClick);
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

  /* START - Event handlers */
  /* END - Event handlers */

  /* START - Game Controller */

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
   * Delegates to the external getStyles() module.
   * @private
   * @returns {string} HTML string containing a <style> element
   */
  _setStyles() {
    return getStyles.call(this);
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
      <div class="qp-snake-wrapper">
        <!-- TODO: game UI -->
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
customElements.define("qp-snake", QPSnake);

export default QPSnake;
