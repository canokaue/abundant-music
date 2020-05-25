const SongStructureType = {
    BUILD: 0,
    VERSE_CHORUS: 1,
    VERSE_CHORUS_BRIDGE: 2
};

const SongPartType = {
    VERSE_1: 0,
    VERSE_2: 1,
    CHORUS_1: 2,
    CHORUS_2: 3,
    BRIDGE_1: 4,
    BRIDGE_2: 5,
    MISC_1: 6,
    MISC_2: 7,

    getIndex: function(type) {
        switch (type) {
            case SongPartType.VERSE_1:
            case SongPartType.BRIDGE_1:
            case SongPartType.CHORUS_1:
            case SongPartType.MISC_1:
                return 0;
            case SongPartType.VERSE_2:
            case SongPartType.BRIDGE_2:
            case SongPartType.CHORUS_2:
            case SongPartType.MISC_2:
                return 1;
        }
        return 0;
    },

    isVerse: function(type) {
        switch (type) {
            case SongPartType.VERSE_1:
            case SongPartType.VERSE_2:
                return true;
        }
        return false;
    },
    isChorus: function(type) {
        switch (type) {
            case SongPartType.CHORUS_1:
            case SongPartType.CHORUS_2:
                return true;
        }
        return false;
    },
    isBridge: function(type) {
        switch (type) {
            case SongPartType.BRIDGE_1:
            case SongPartType.BRIDGE_2:
                return true;
        }
        return false;
    },

    toIndicatorString: function(type) {
        switch (type) {
            case SongPartType.BRIDGE_1:
                return "bridge1";
            case SongPartType.BRIDGE_2:
                return "bridge2";
            case SongPartType.CHORUS_1:
                return "chorus1";
            case SongPartType.CHORUS_2:
                return "chorus2";
            case SongPartType.VERSE_1:
                return "verse1";
            case SongPartType.VERSE_2:
                return "verse2";
            case SongPartType.MISC_1:
                return "misc1";
            case SongPartType.MISC_2:
                return "misc2";
        }
        return "verse1";
    },

    toString: function(type) {
        switch (type) {
            case SongPartType.BRIDGE_1:
                return "Bridge 1";
            case SongPartType.BRIDGE_2:
                return "Bridge 2";
            case SongPartType.CHORUS_1:
                return "Chorus 1";
            case SongPartType.CHORUS_2:
                return "Chorus 2";
            case SongPartType.VERSE_1:
                return "Verse 1";
            case SongPartType.VERSE_2:
                return "Verse 2";
            case SongPartType.MISC_1:
                return "Misc 1";
            case SongPartType.MISC_2:
                return "Misc 2";
        }
        return "Unknown song part type " + type;
    }
};
addPossibleValuesFunction(SongPartType, SongPartType.VERSE_1, SongPartType.MISC_2);


//veryWeak: [0.02],
//    weak: [0.15],
//    medium: [0.4],
//    strong: [0.7],
//    veryStrong: [1.0]

const SongPartStrength = {
    DEFAULT: 0,
    VERY_WEAK: 1,
    WEAK: 2,
    MEDIUM: 3,
    STRONG: 4,
    VERY_STRONG: 5,

    toString: function(type) {
        switch (type) {
            case SongPartStrength.DEFAULT:
                return "Default";
            case SongPartStrength.MEDIUM:
                return "Medium";
            case SongPartStrength.STRONG:
                return "Strong";
            case SongPartStrength.VERY_STRONG:
                return "Very Strong";
            case SongPartStrength.VERY_WEAK:
                return "Very Weak";
            case SongPartStrength.WEAK:
                return "Weak";
        }
        return "Medium";
    },

    toIndicatorString: function(type) {
        switch (type) {
            case SongPartStrength.DEFAULT:
                return "";
            case SongPartStrength.MEDIUM:
                return "medium";
            case SongPartStrength.STRONG:
                return "strong";
            case SongPartStrength.VERY_STRONG:
                return "veryStrong";
            case SongPartStrength.VERY_WEAK:
                return "veryWeak";
            case SongPartStrength.WEAK:
                return "weak";
        }
        return "";
    }
};
addPossibleValuesFunction(SongPartStrength, SongPartStrength.DEFAULT, SongPartStrength.VERY_STRONG);

class AbstractSongPartStructureInfo {
    constructor() {
        this.partType = SongPartType.VERSE_1;
        this.harmonyRythmCountOverrides = [];
        this.harmonyTotalLengthOverrides = [];
        this.overridePhraseGroupType = false;
        this.phraseGroupType = SimpleModuleGeneratorPhraseGroupType.ANTECEDENT_CONSEQUENT_SHORTEN;
        this.overrideMajorModulationTarget = false;
        this.majorModulationTarget = DynamicHarmonyModulationTarget.DOMINANT;
        this.overrideMinorModulationTarget = false;
        this.minorModulationTarget = DynamicHarmonyModulationTarget.DOMINANT;
        this.overrideScaleBaseNote = false;
        this.scaleBaseNote = 60;
        this.overrideScaleType = false;
        this.scaleType = ScaleType.MAJOR;
        // For custom harmony
        this.harmonyElementIndices = [];
        // For custom melody and bass curves
        this.customMelodyCurveIndices = [];
        this.customBassCurveIndices = [];
        // For custom render elements
        this.extraMelodyRenderElementIndices = [];
        this.extraInner1RenderElementIndices = [];
        this.extraInner2RenderElementIndices = [];
        this.extraBassRenderElementIndices = [];
        this.extraPercussionRenderElementIndices = [];
        // Forcing indices
        this.melodyShapeIndexOverride = [];
        this.bassShapeIndexOverride = [];
        this.harmonyIndexOverride = [];
        this.harmonyRythmIndexOverride = [];
        this.suspendIndexOverride = [];
        this.melodyChannelDistributionIndexOverride = [];
        this.inner1ChannelDistributionIndexOverride = [];
        this.inner2ChannelDistributionIndexOverride = [];
        this.bassChannelDistributionIndexOverride = [];
        this.melodyMotifDistributionIndexOverride = [];
        this.inner1MotifDistributionIndexOverride = [];
        this.inner2MotifDistributionIndexOverride = [];
        this.bassMotifDistributionIndexOverride = [];
        this.percussionMotifDistributionIndexOverride = [];
        this.percussionFillMotifDistributionIndexOverride = [];
        this.harmonyExtraIndexOverride = [];
        this.renderAmountIndexOverride = [];
        this.tempoIndexOverride = [];
        this.sequentialTempoChangeIndexOverride = [];
        this.parallelTempoChangeIndexOverride = [];
        this.sequentialMelodyEffectChangeIndexOverride = [];
        this.sequentialInner1EffectChangeIndexOverride = [];
        this.sequentialInner2EffectChangeIndexOverride = [];
        this.sequentialBassEffectChangeIndexOverride = [];
        this.sequentialPercussionEffectChangeIndexOverride = [];
    }
}

class SongPartStructureInfo extends AbstractSongPartStructureInfo {
    constructor(options) {
        super()
        this.strength = getValueOrDefault(options, "strength", SongPartStrength.DEFAULT);
        this.prefixProbsOverride = getValueOrDefault(options, "prefixProbsOverride", []);
        this.postfixProbsOverride = getValueOrDefault(options, "postfixProbsOverride", []);
        this.majorGroupModulationTarget = getValueOrDefault(options, "majorGroupModulationTarget", -1);
        this.minorGroupModulationTarget = getValueOrDefault(options, "minorGroupModulationTarget", -1);
        this.melodyRenderAmountOverride = [];
        this.inner1RenderAmountOverride = [];
        this.inner2RenderAmountOverride = [];
        this.bassRenderAmountOverride = [];
        this.percussionRenderAmountOverride = [];
        this.prefixInfoOverrides = [];
        this.postfixInfoOverrides = [];
        this._constructorName = "SongPartStructureInfo";
    }
}
