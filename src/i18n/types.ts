import type { CatVariant, EffectiveLanguage, Language } from '../types/puzzle';

export type { EffectiveLanguage, Language };

export interface AssistOptionCopy {
  label: string;
  desc: string;
}

export interface TutorialStepCopy {
  title: string;
  desc: string;
  hint: string;
}

export interface TranslationSchema {
  common: {
    gameTitle: string;
    play: string;
    levels: string;
    dailyChallenge: string;
    settings: string;
    howToPlay: string;
    back: string;
    close: string;
    retry: string;
    nextLevel: string;
    backToHome: string;
    share: string;
    equip: string;
    equipped: string;
    completed: string;
    gameCompleted: string;
    cancel: string;
    confirm: string;
    levelN: string;
  };
  home: {
    dailyHardBadge: string;
    streakDays: string;
    levelProgress: string;
    gameCompletedBanner: string;
    resetProgressBtn: string;
    confirmResetTitle: string;
    confirmResetMsg: string;
  };
  levels: {
    title: string;
    totalStars: string;
    backToMenu: string;
    tierBanner: string;
    frontierPlay: string;
    tileBlocked: string;
    tileCurrent: string;
    tileStars: string;
  };
  game: {
    dailyTitle: string;
    controlsLegend: string;
    mistakesZero: string;
    mistakesOne: string;
    mistakesCount: string;
    levelCompleted: string;
    dailyCompleted: string;
    outOfLives: string;
    outOfLivesDesc: string;
    newKittenUnlocked: string;
    copiedToClipboard: string;
    timeLabel: string;
    restartTooltip: string;
    scoreGains: {
      pointsGain: string;
      alreadyCompleted: string;
      recordImprovement: string;
      catPoints: string;
      bonusStars: string;
      newTotal: string;
      finalScore: string;
    };
    confirmRestart: {
      title: string;
      desc: string;
      confirmBtn: string;
      cancelBtn: string;
    };
  };
  postGame: {
    title: string;
    summary: string;
    playLastBtn: string;
    playLastDesc: string;
    resetBtn: string;
    resetDesc: string;
    closeBtn: string;
  };
  settings: {
    title: string;
    tabs: {
      controls: string;
      cats: string;
      graphics: string;
      audio: string;
      assists: string;
    };
    language: {
      sectionTitle: string;
      subtitle: string;
      auto: string;
      spanish: string;
      english: string;
    };
    controls: {
      doubleTapSection: string;
      sliderDesc: string;
      speedFast: string;
      speedNormal: string;
      speedSlow: string;
      testZoneTitle: string;
      testTapPrompt: string;
      doubleTapDetected: string;
      singleTapPrompt: string;
    };
    graphics: {
      sectionTitle: string;
      starsRequired: string;
      unlocked: string;
      selected: string;
    };
    breeds: Record<CatVariant, string>;
    audio: {
      musicVolume: string;
      sfxVolume: string;
      musicTrack: string;
      allTracks: string;
      tracks: {
        auto: string;
        marimba: string;
        velvet: string;
        sunbeam: string;
        bossa: string;
        waltz: string;
        samba: string;
      };
    };
    assists: {
      regionSection: string;
      regionOptions: {
        off: AssistOptionCopy;
        textures: AssistOptionCopy;
        glyphs: AssistOptionCopy;
        numbers: AssistOptionCopy;
      };
      autoCrossSection: string;
      autoCrossOptions: {
        off: AssistOptionCopy;
        all: AssistOptionCopy;
      };
    };
  };
  tutorial: {
    title: string;
    tabs: {
      rules: string;
      strategies: string;
    };
    stepCounter: string;
    successHint: string;
    nextBtn: string;
    finishBtn: string;
    steps: Record<string, TutorialStepCopy>;
  };
  share: {
    header: string;
    streakDaysSingular: string;
    streakDaysPlural: string;
    dialogTitle: string;
  };
}
