// public/js/components-web/qp-memory/qp-memory.styles.js

function getStyles() {
  // const bgUrlMemoryCard = new URL('./images/qp-memory-background.svg', import.meta.url).href;

  return `
      <style>
        :host {
          display: block;
          color: inherit;
          font-family: inherit;
        }

        .qp-scoreboard {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border-bottom: 1px solid #ddd;
          margin: 0 2rem;
          padding: 0.25rem 1rem;
          font-family: monospace;
        }
        .qp-scoreboard-output {
          /* text-align: center; */
        }
        .qp-scoreboard-counter {
          text-align: right;
        }
        .qp-scoreboard-state {
          text-align: left;
        }

        .qp-snake-wrapper {
          display: flex;
          justify-content: center;
          width: 100%;
          padding: 2rem 0;
        }
        
        .qp-snake-board {
          --width: 70vmin;
          --size: 20;
          display: grid;
          grid-template-columns: repeat(var(--size), 1fr);
          grid-template-rows: repeat(var(--size), 1fr);
          gap: 2px;
          padding: 2px;
          width: var(--width);
          height: var(--width);
          border: 1px solid #ddd;
          border-radius: 4px;
        }
          
        .qp-snake-cell {
          background-color: rgba(241, 241, 241, 0.4);
          border-radius: 4px;
        }

        .qp-snake-body {
          background-color: #333;
        }
          
        .qp-snake-head {
          background-color: rgba(176, 42, 55, 1);
        }
        .qp-snake-food {
          background-color: rgba(20, 108, 67, 1);
          border-radius: 50%;
        }

        /* Prevent Events */
        .qp-prevent-events {
          pointer-events: none;
        }

        /* Button Bar and Buttons */
        .qp-memory-button-bar {
          display: flex;
          justify-content: center;
          gap: 1rem;
          
          border-top: 1px solid #ddd;
          margin: 0 2rem 1rem;
          padding: 1rem 1rem 0.5rem;
        }
        .qp-btn {
            width: 100%;
            padding: 0.875rem;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }
        .qp-btn:disabled {
            cursor: default;
        }
        .qp-btn:hover:not(:disabled) {
            transform: translateY(-2px);
        }

        .qp-btn.qp-btn-small {
            width: 30px;
            text-align: center;
            padding: 0.5rem 0;
        }
        .qp-btn.qp-btn-full {
            display: block;
            text-align: center;
        }

        .qp-btn-primary {
          --qp-btn-color: rgba(255, 255, 255, 1);
          --qp-btn-bg: rgba(13, 110, 253, 1);
          --qp-btn-border-color: rgba(13, 110, 253, 1);
          --qp-btn-hover-color: rgba(255, 255, 255, 1);
          --qp-btn-hover-bg: rgba(11, 94, 215, 1);
          --qp-btn-hover-border-color: rgba(10, 88, 202, 1);
          --qp-btn-disabled-color: rgba(255, 255, 255, 0.65);
          --qp-btn-disabled-bg: rgba(13, 110, 253, 0.65);
          --qp-btn-disabled-border-color: rgba(13, 110, 253, 0.65);
        }
        .qp-btn-primary {
          color: var(--qp-btn-color);
          background-color: var(--qp-btn-bg);
          border-color: var(--qp-btn-border-color);
        }
        .qp-btn-primary:hover {
          color: var(--qp-btn-hover-color);
          background-color: var(--qp-btn-hover-bg);
          border-color: var(--qp-btn-hover-border-color);
        }
        .qp-btn-primary:disabled {
          color: var(--qp-btn-disabled-color);
          background-color: var(--qp-btn-disabled-bg);
          border-color: var(--qp-btn-disabled-border-color);
        }
          
        .qp-btn-secondary {
          --qp-btn-color: rgba(255, 255, 255, 1);
          --qp-btn-bg: rgba(108, 117, 125, 1);
          --qp-btn-border-color: rgba(108, 117, 125, 1);
          --qp-btn-hover-color: rgba(255, 255, 255, 1);
          --qp-btn-hover-bg: rgba(92, 99, 106, 1);
          --qp-btn-hover-border-color: rgba(86, 94, 100, 1);
          --qp-btn-disabled-color: rgba(255, 255, 255, 0.65);
          --qp-btn-disabled-bg: rgba(108, 117, 125, 0.65);
          --qp-btn-disabled-border-color: rgba(108, 117, 125, 0.65);
        }
        .qp-btn-secondary {
          color: var(--qp-btn-color);
          background-color: var(--qp-btn-bg);
          border-color: var(--qp-btn-border-color);
        }
        .qp-btn-secondary:hover {
          color: var(--qp-btn-hover-color);
          background-color: var(--qp-btn-hover-bg);
          border-color: var(--qp-btn-hover-border-color);
        }
        .qp-btn-secondary:disabled {
          color: var(--qp-btn-disabled-color);
          background-color: var(--qp-btn-disabled-bg);
          border-color: var(--qp-btn-disabled-border-color);
        }

        .qp-btn-cta,
        .qp-btn-success {
            --qp-btn-color: rgba(255, 255, 255, 1);
            --qp-btn-bg: rgba(25, 135, 84, 1);
            --qp-btn-border-color: rgba(25, 135, 84, 1);
            --qp-btn-hover-color: rgba(255, 255, 255, 1);
            --qp-btn-hover-bg: rgba(21, 115, 71, 1);
            --qp-btn-hover-border-color: rgba(20, 108, 67, 1);
            --qp-btn-disabled-color: rgba(255, 255, 255, 0.65);
            --qp-btn-disabled-bg: rgba(25, 135, 84, 0.65);
            --qp-btn-disabled-border-color: rgba(25, 135, 84, 0.65);
        }
        .qp-btn-cta {
          color: var(--qp-btn-color);
          background-color: var(--qp-btn-bg);
          border-color: var(--qp-btn-border-color);
        }
        .qp-btn-cta:hover {
          color: var(--qp-btn-hover-color);
          background-color: var(--qp-btn-hover-bg);
          border-color: var(--qp-btn-hover-border-color);
        }
        .qp-btn-cta:disabled {
          color: var(--qp-btn-disabled-color);
          background-color: var(--qp-btn-disabled-bg);
          border-color: var(--qp-btn-disabled-border-color);
        }
        .qp-btn-success {
          color: var(--qp-btn-color);
          background-color: var(--qp-btn-bg);
          border-color: var(--qp-btn-border-color);
        }
        .qp-btn-success:hover {
          color: var(--qp-btn-hover-color);
          background-color: var(--qp-btn-hover-bg);
          border-color: var(--qp-btn-hover-border-color);
        }
        .qp-btn-success:disabled {
          color: var(--qp-btn-disabled-color);
          background-color: var(--qp-btn-disabled-bg);
          border-color: var(--qp-btn-disabled-border-color);
        }
          
        .qp-btn-danger {
          --qp-btn-color: rgba(255, 255, 255, 1);
          --qp-btn-bg: rgba(220, 53, 69, 1);
          --qp-btn-border-color: rgba(220, 53, 69, 1);
          --qp-btn-hover-color: rgba(255, 255, 255, 1);
          --qp-btn-hover-bg: rgba(187, 45, 59, 1);
          --qp-btn-hover-border-color: rgba(176, 42, 55, 1);
          --qp-btn-disabled-color: rgba(255, 255, 255, 0.65);
          --qp-btn-disabled-bg: rgba(220, 53, 69, 0.65);
          --qp-btn-disabled-border-color: rgba(220, 53, 69, 0.65);
        }
        .qp-btn-danger {
          color: var(--qp-btn-color);
          background-color: var(--qp-btn-bg);
          border-color: var(--qp-btn-border-color);
        }
        .qp-btn-danger:hover {
          color: var(--qp-btn-hover-color);
          background-color: var(--qp-btn-hover-bg);
          border-color: var(--qp-btn-hover-border-color);
        }
        .qp-btn-danger:disabled {
          color: var(--qp-btn-disabled-color);
          background-color: var(--qp-btn-disabled-bg);
          border-color: var(--qp-btn-disabled-border-color);
        }
        
        .qp-btn-info {
          --qp-btn-color: rgba(0, 0, 0, 1);
          --qp-btn-bg: rgba(255, 193, 7, 1);
          --qp-btn-border-color: rgba(255, 193, 7, 1);
          --qp-btn-hover-color: rgba(0, 0, 0, 1);
          --qp-btn-hover-bg: rgba(255, 202, 44, 1);
          --qp-btn-hover-border-color: rgba(255, 199, 32, 1);
          --qp-btn-disabled-color: rgba(0, 0, 0, 0.65);
          --qp-btn-disabled-bg: rgba(255, 193, 7, 0.65);
          --qp-btn-disabled-border-color: rgba(255, 193, 7, 0.65);
        }
        .qp-btn-info {
          color: var(--qp-btn-color);
          background-color: var(--qp-btn-bg);
          border-color: var(--qp-btn-border-color);
        }
        .qp-btn-info:hover {
          color: var(--qp-btn-hover-color);
          background-color: var(--qp-btn-hover-bg);
          border-color: var(--qp-btn-hover-border-color);
        }
        .qp-btn-info:disabled {
          color: var(--qp-btn-disabled-color);
          background-color: var(--qp-btn-disabled-bg);
          border-color: var(--qp-btn-disabled-border-color);
        }
      </style>
    `;
};

export default getStyles;
