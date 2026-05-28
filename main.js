var LogLevel = {
  DEBUG: 3,
  ERROR: 0,
  INFO: 2,
  TRACE: 4,
  WARN: 1
};
var ContextualLogger = class {
  constructor(logger, component, operation) {
    this.logger = logger;
    this.component = component;
    this.operation = operation;
  }
  debug(message, context) {
    this.logger.debug(message, this.getContext(context));
  }
  error(message, context) {
    this.logger.error(message, this.getContext(context));
  }
  errorFromException(message, error, context) {
    this.logger.errorFromException(message, error, this.getContext(context));
  }
  handleError(message, error, context, shouldThrow = false) {
    this.logger.handleError(message, error, this.getContext(context), shouldThrow);
  }
  info(message, context) {
    this.logger.info(message, this.getContext(context));
  }
  trace(message, context) {
    this.logger.trace(message, this.getContext(context));
  }
  warn(message, context) {
    this.logger.warn(message, this.getContext(context));
  }
  getContext(additionalContext) {
    return {
      component: additionalContext?.component || this.component,
      operation: additionalContext?.operation || this.operation,
      ...additionalContext
    };
  }
};
var Logger = class _Logger {
  static instance;
  logLevel = LogLevel.ERROR;
  constructor(settings) {
    this.updateSettings(settings);
  }
  static getInstance(settings) {
    if (!_Logger.instance) {
      _Logger.instance = new _Logger(settings);
    } else {
      _Logger.instance.updateSettings(settings);
    }
    return _Logger.instance;
  }
  debug(message, context) {
    this.log(LogLevel.DEBUG, message, context);
  }
  error(message, context) {
    this.log(LogLevel.ERROR, message, context);
  }
  errorFromException(message, error, context) {
    this.error(message, { ...context, error });
  }
  forComponent(component) {
    return new ContextualLogger(this, component);
  }
  forOperation(operation) {
    return new ContextualLogger(this, void 0, operation);
  }
  handleError(message, error, context, shouldThrow = false) {
    this.error(message, { ...context, error });
    if (shouldThrow && error) {
      throw error;
    }
  }
  info(message, context) {
    this.log(LogLevel.INFO, message, context);
  }
  trace(message, context) {
    this.log(LogLevel.TRACE, message, context);
  }
  updateSettings(settings) {
    this.logLevel = settings.troubleshooting.debugLogging ? LogLevel.DEBUG : LogLevel.WARN;
  }
  warn(message, context) {
    this.log(LogLevel.WARN, message, context);
  }
  formatMessage(message, context) {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString().split("T")[1];
    const component = context?.component || "NoteReader";
    const operation = context?.operation ? `:${context.operation}` : "";
    let formattedMessage = `[${timestamp}] [${component}${operation}] ${message}`;
    if (context?.metadata && Object.keys(context.metadata).length > 0) {
      formattedMessage += ` | ${JSON.stringify(context.metadata)}`;
    }
    return formattedMessage + "\n";
  }
  log(level, message, context) {
    if (!this.shouldLog(level)) {
      return;
    }
    const formattedMessage = this.formatMessage(message, context);
    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedMessage, context?.error || "");
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.INFO:
        console.log(formattedMessage);
        break;
      case LogLevel.DEBUG:
      case LogLevel.TRACE:
        console.debug(formattedMessage);
        break;
    }
  }
  shouldLog(level) {
    return level <= this.logLevel;
  }
};

// src/settings/SettingsData.ts
var DEFAULT_SETTINGS = {
  filters: {
    asterisks: true,
    backslashEscapes: true,
    codeBlocks: true,
    emojis: true,
    enablePhraseLineFilter: false,
    frontmatter: true,
    headers: true,
    highlights: true,
    ignorePhraseLine: "",
    imageEmbeds: true,
    inlineCode: true,
    tables: false,
    tags: false,
    underscores: true,
    urls: true
  },
  liteMode: false,
  onboarding: {
    hasShownMobileBatteryNotice: false,
    hasShownOnboardingTooltip: false
  },
  reading: {
    alwaysStartFromBeginningOnModify: false,
    enablePositionPersistence: false,
    enableReadFileName: false,
    persistRewind: true,
    repeatReaderCommand: "pause" /* PAUSE */,
    repeatReaderCommandNewNoteVisible: "reload" /* RELOAD */,
    resumeThresholdSeconds: 60
  },
  readingCompletionBehavior: {
    closePlayerOnFinish: true,
    enableChimeOnFinish: true,
    enableStopReading: false,
    stopReadingPhrase: ""
  },
  showRibbonIcon: true,
  stats: {
    generatedAudioFileCount: 0,
    playSampleTextCounter: 0,
    readNoteCount: 0,
    readTotalSeconds: 0,
    restartFromBeginningCount: 0,
    selectCloseCount: 0,
    selectPauseCount: 0,
    selectPlayCount: 0,
    selectReloadCount: 0,
    selectRewindCount: 0,
    viewSettingsCount: 0
  },
  storage: {
    audioFileStorageLocation: "subfolder" /* SUBFOLDER */,
    specifiedFolderPath: "",
    subfolderName: "note-readings"
  },
  troubleshooting: {
    debugLogging: false,
    readActiveNoteOnLoad: false,
    showEstimatedReadingTime: false,
    stallCheckIntervalMs: 2e3,
    stallThresholdSeconds: 5,
    targetBufferAheadSeconds: 90
  },
  tts: {
    pitch: 0,
    provider: "online",
    speed: 1,
    voiceLocal: "Microsoft Zira - English (United States)",
    voiceOnline: "en-US-AvaMultilingualNeural",
    voiceSelectorFilters: null
  },
  wordHighlighting: {
    customThemes: [],
    enableLockedScrolling: true,
    enableWordHighlighting: true,
    highlightThemeId: "classy"
  }
};

var SettingsManager = class _SettingsManager {
  constructor(settings) {
    this.settings = settings;
    this.logger = Logger.getInstance(settings).forComponent(this.constructor.name);
  }
  logger;
  static loadSettings(data) {
    if (!data || typeof data !== "object") {
      return DEFAULT_SETTINGS;
    }
    const rawData = data;
    const settings = {
      ...DEFAULT_SETTINGS,
      ...rawData,
      filters: { ...DEFAULT_SETTINGS.filters, ...rawData.filters },
      onboarding: { ...DEFAULT_SETTINGS.onboarding, ...rawData.onboarding },
      reading: { ...DEFAULT_SETTINGS.reading, ...rawData.reading },
      readingCompletionBehavior: { ...DEFAULT_SETTINGS.readingCompletionBehavior, ...rawData.readingCompletionBehavior },
      stats: { ...DEFAULT_SETTINGS.stats, ...rawData.stats },
      storage: { ...DEFAULT_SETTINGS.storage, ...rawData.storage },
      troubleshooting: { ...DEFAULT_SETTINGS.troubleshooting, ...rawData.troubleshooting },
      tts: { ...DEFAULT_SETTINGS.tts, ...rawData.tts },
      wordHighlighting: { ...DEFAULT_SETTINGS.wordHighlighting, ...rawData.wordHighlighting }
    };
    return _SettingsManager.validateSettings(settings);
  }
  static validateSettings(settings) {
    const validated = { ...settings };
    const defaults = DEFAULT_SETTINGS;
    if (validated.tts.speed < 0.5 || validated.tts.speed > 2) {
      validated.tts.speed = defaults.tts.speed;
    }
    if (validated.tts.pitch < -50 || validated.tts.pitch > 50) {
      validated.tts.pitch = defaults.tts.pitch;
    }
    if (validated.troubleshooting.targetBufferAheadSeconds < 30 || validated.troubleshooting.targetBufferAheadSeconds > 180) {
      validated.troubleshooting.targetBufferAheadSeconds = defaults.troubleshooting.targetBufferAheadSeconds;
    }
    if (typeof validated.reading.persistRewind !== "boolean") {
      validated.reading.persistRewind = defaults.reading.persistRewind;
    }
    if (!validated.tts.voiceLocal || typeof validated.tts.voiceLocal !== "string") {
      validated.tts.voiceLocal = defaults.tts.voiceLocal;
    }
    if (!validated.tts.voiceOnline || typeof validated.tts.voiceOnline !== "string") {
      validated.tts.voiceOnline = defaults.tts.voiceOnline;
    }
    if (!validated.filters.ignorePhraseLine || typeof validated.filters.ignorePhraseLine !== "string") {
      validated.filters.ignorePhraseLine = defaults.filters.ignorePhraseLine;
    }
    if (!validated.readingCompletionBehavior.stopReadingPhrase || typeof validated.readingCompletionBehavior.stopReadingPhrase !== "string") {
      validated.readingCompletionBehavior.stopReadingPhrase = defaults.readingCompletionBehavior.stopReadingPhrase;
    }
    return validated;
  }
  async cleanup() {
  }
  getStatistics() {
    return {
      generatedAudioFileCount: this.settings.stats.generatedAudioFileCount,
      readNoteCount: this.settings.stats.readNoteCount,
      readTotalSeconds: this.settings.stats.readTotalSeconds,
      restartFromBeginningCount: this.settings.stats.restartFromBeginningCount,
      selectCloseCount: this.settings.stats.selectCloseCount,
      selectPauseCount: this.settings.stats.selectPauseCount,
      selectPlayCount: this.settings.stats.selectPlayCount,
      selectReloadCount: this.settings.stats.selectReloadCount,
      selectRewindCount: this.settings.stats.selectRewindCount,
      viewSettingsCount: this.settings.stats.viewSettingsCount
    };
  }
  hasVisibleStatistics() {
    return this.statMeetsThreshold(1);
  }
  incrementStatistic(key, amount = 1) {
    const statKey = key;
    if (statKey in this.settings.stats && typeof this.settings.stats[statKey] === "number") {
      this.settings.stats[statKey] = this.settings.stats[statKey] + amount;
    }
  }
  isExperiencedUser() {
    return this.statMeetsThreshold(100, false);
  }
  resetStatistics() {
    this.settings.stats = {
      generatedAudioFileCount: 0,
      playSampleTextCounter: 0,
      readNoteCount: 0,
      readTotalSeconds: 0,
      restartFromBeginningCount: 0,
      selectCloseCount: 0,
      selectPauseCount: 0,
      selectPlayCount: 0,
      selectReloadCount: 0,
      selectRewindCount: 0,
      viewSettingsCount: 0
    };
  }
  updateSettings(newSettings) {
    const updatedSettings = { ...this.settings, ...newSettings };
    this.settings = _SettingsManager.validateSettings(updatedSettings);
  }
  statMeetsThreshold(threshold, inclusive = true) {
    const stats = this.getStatistics();
    return inclusive ? Object.values(stats).some((stat) => stat >= threshold) : Object.values(stats).some((stat) => stat > threshold);
  }
};

const { Plugin, Notice } = require('obsidian');

module.exports = class NoteReader extends Plugin {
  currentEditorView = null;
  ribbonIconManager;
  services = {
    audioController: void 0,
    audioFileGenerationCoordinator: void 0,
    audioFileGenerator: void 0,
    bufferManager: void 0,
    commandService: void 0,
    eventBus: void 0,
    fileChangeMonitor: void 0,
    highlightService: void 0,
    interactionController: void 0,
    mediaKeyManager: void 0,
    mediaSourceManager: void 0,
    mobileHelper: void 0,
    offlineNotificationService: void 0,
    progressTracker: void 0,
    readerCoordinator: void 0,
    readerUIView: void 0,
    readingPositionService: void 0,
    scrollManager: void 0,
    serviceFactory: void 0,
    settingsManager: void 0,
    statisticsTracker: void 0,
    textProcessor: void 0,
    ttsServiceManager: void 0
  };
  settings;
  logger;
  loggerInstance;
  constructor(app, manifest) {
    super(app, manifest);
  }
  async onload() {
    try {
      const data = await this.loadData();
      this.settings = SettingsManager.loadSettings(data);
      this.addCommand({
        callback: () => {
          window.console.group("=== Current Settings ===");
          const settings = this.settings;
          window.console.log("tts:", JSON.stringify(settings.tts, null, 2));
          window.console.log("filters:", JSON.stringify(settings.filters, null, 2));
          window.console.log("storage:", JSON.stringify(settings.storage, null, 2));
          window.console.log("wordHighlighting:", JSON.stringify(settings.wordHighlighting, null, 2));
          window.console.log("reading:", JSON.stringify(settings.reading, null, 2));
          window.console.log("readingCompletionBehavior:", JSON.stringify(settings.readingCompletionBehavior, null, 2));
          window.console.log("troubleshooting:", JSON.stringify(settings.troubleshooting, null, 2));
          window.console.log("stats:", JSON.stringify(settings.stats, null, 2));
          window.console.log("onboarding:", JSON.stringify(settings.onboarding, null, 2));
          window.console.log("showRibbonIcon:", settings.showRibbonIcon);
          window.console.log("liteMode:", settings.liteMode);
          window.console.groupEnd();
        },
        id: "log-debugging-messages",
        name: "Log messages to console (debug)"
      });
    } catch (error) {
      this.logger.handleError("Failed to load plugin", error, { component: "MainPlugin", operation: "onload" }, true);
    }
  }
  onunload() {
    try {
    } catch (error) {
      this.logger.handleError(
        "Plugin cleanup failed",
        error,
        { component: "MainPlugin", operation: "onunload" },
        false
      );
    }
  }
  removeRibbonIcon(ribbonIcon) {
    ribbonIcon.remove();
  }
  async saveSettings() {
  }
};