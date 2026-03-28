const Dictionary = (args) => ({
  funSnakeStart: { de: "Start", en: "Start" },
  funSnakeStop: { de: "Stop", en: "Stop" },
  funSnakePause: { de: "Pause", en: "Pause" },
  scoreboardSize: { de: `Board: ${args[0]}x${args[0]}`, en: `Board: ${args[0]}x${args[0]}` },
  scoreboardSnakeLength: { de: `Laenge: ${args[0]}`, en: `Length: ${args[0]}` },
  scorboardSpeed: { de: `Speed: ${args[0]}, Level: ${args[1]}`, en: `Speed: ${args[0]}, Level: ${args[1]}` },
  scoreboardState_paused: { de: `Pausiert`, en: `Paused` },
  scoreboardState_running: { de: `Running`, en: `Running` },
  scoreboardState_stopped: { de: `Stop`, en: `Stopped` },
});

const Languages = ["de", "en"];

export default Dictionary;
export { Languages };
