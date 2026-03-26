const Dictionary = (args) => ({
  funMemoryHeadline: {
    de: `Cover Memory: ${args[0]}x${args[0]} Karten`,
    en: `Cover Memory: ${args[0]}x${args[0]} Cards`,
  },
  funMemoryMoves: { de: `Züge: ${args[0]} / Tipps: ${args[1]}`, en: `Moves: ${args[0]} / Hints: ${args[1]}` },
  funMemoryTime: { de: `Zeit: ${args[0]}`, en: `Time: ${args[0]}` },
  funMemoryStart: { de: "Start", en: "Start" },
  funMemoryHint: { de: "Tipp", en: "Hint" },
  funMemoryRestart: { de: "Neustart", en: "Restart" },
  funMemoryReset: { de: "Zurücksetzen", en: "Reset" },
});

const Languages = ["de", "en"];

export default Dictionary;
export { Languages };
