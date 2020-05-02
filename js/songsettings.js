


function AbstractSettings(options) {
    this.storagePrefix = ""; // getValueOrDefault(options, "storagePrefix", "");
    this.dirty = false;
}
AbstractSettings.prototype.getStoragePropertyName = function() {
    return this.storagePrefix + this._constructorName;
};


AbstractSettings.prototype.loadFromLocalStorage = function() {

    try {
        const lsPropName = this.getStoragePropertyName();
        const jsonObj = JSON.parse(localStorage.getItem(lsPropName));

        if (jsonObj) {
            for (const prop in this) {
                const value = jsonObj[prop];
                if (typeof(value) != 'undefined') {
                    this[prop] = value;
                }
            }
        }
    } catch (exc) {
        // Just silently ignore this
        logit("Error when loading from local storage " + this._constructorName);
    }
};

AbstractSettings.prototype.saveToLocalStorage = function() {
    try {
        const toStore = {};
        for (const prop in this) {
            const value = this[prop];
            if (!isFunction(value)) {
                toStore[prop] = value;
            }
        }
        const lsPropName = this.getStoragePropertyName();
        localStorage.setItem(lsPropName, JSON.stringify(toStore));
    } catch (exc) {
        // Silently ignore
        logit("Error when saving to local storage " + this._constructorName);
    }
};


//var dialogs = ["songSettings", "visualizerSettings", "player", "tutorials", "export", "songs", "help", "feedback"];

function RenderStorage() {
    AbstractSettings.call(this);

    this.channelMaps = null;
    this.renderData = null;
    this.sectionTimes = null;
    this.renderDataLength = 1;
    this.songStructureInfo = null;

    this._constructorName = "RenderStorage";
}
RenderStorage.prototype = new AbstractSettings();

function EditorSettings() {
    AbstractSettings.call(this);
    this.songSettingsVisible = false;
    this.visualizerSettingsVisible = false;
    this.playerVisible = false;
    this.tutorialsVisible = true;
    this.exportVisible = false;
    this.songsVisible = false;
    this.helpVisible = false;
    this.feedbackVisible = false;
    this.accountVisible = false;
    this.songInfoVisible = false;

    const xStep = 60;
    const yStep = 60;
    let xSteps = 0;

    const yOffset = 120;

    const playerX = 500;

    this.songSettingsPosition = [playerX, 250 + yOffset];
    this.visualizerSettingsPosition = [xStep * xSteps++, yStep * 2];
    this.playerPosition = [playerX, 80 + yOffset];
    this.tutorialsPosition = [10, 80 + yOffset];
    this.exportPosition = [xStep * xSteps++, yStep * 2];
    this.songsPosition = [xStep * xSteps++, yStep * 3];
    this.helpPosition = [xStep * xSteps++, yStep];
    this.feedbackPosition = [xStep * xSteps++, yStep * 2];
    this.accountPosition = [xStep * xSteps++, yStep * 3];
    this.songInfoPosition = [xStep * xSteps++, yStep * 3];

    this._constructorName = "EditorSettings";
}
EditorSettings.prototype = new AbstractSettings();

function AbstractSettingsPresets() {
    AbstractSettings.call(this);
    this.items = [];
    this._constructorName = "AbstractSettingsPresets";
}
AbstractSettingsPresets.prototype = new AbstractSettings();

AbstractSettingsPresets.prototype.getItemWithName = function(name) {
    const index = this.getItemIndexWithName(name);
    if (index >= 0) {
        return this.items[index];
    }
    return null;
};
AbstractSettingsPresets.prototype.getItemIndexWithName = function(name) {
    for (let i=0; i<this.items.length; i++) {
        const item = this.items[i];
        if (item.name == name) {
            return i;
        }
    }
    return -1;
};


function PresetItem() {
    this.name = "";
    this.data = null;
    this._constructorName = "PresetItem";
}
PresetItem.prototype.setName = function(n) {
    this.name = n;
    return this;
};
PresetItem.prototype.setData = function(n) {
    this.data = n;
    return this;
};


function SongSettingsPresets() {
    AbstractSettingsPresets.call(this);
    this.items.push(new PresetItem().setName("Default").setData(new SongSettings()));
    this._constructorName = "SongSettingsPresets";
}
SongSettingsPresets.prototype = new AbstractSettingsPresets();


function SongStructureSeedSettingsPresets() {
    AbstractSettingsPresets.call(this);
    this.items.push(new PresetItem().setName("Default").setData(new SongStructureSeedSettings()));
    this._constructorName = "SongStructureSeedSettingsPresets";
}
SongStructureSeedSettingsPresets.prototype = new AbstractSettingsPresets();

function SongContentSeedSettingsPresets() {
    AbstractSettingsPresets.call(this);
    this.items.push(new PresetItem().setName("Default").setData(new SongContentSeedSettings()));
    this._constructorName = "SongContentSeedSettingsPresets";
}
SongContentSeedSettingsPresets.prototype = new AbstractSettingsPresets();

function SongIndicesSeedSettingsPresets() {
    AbstractSettingsPresets.call(this);
    this.items.push(new PresetItem().setName("Default").setData(new SongIndicesSeedSettings()));
    this._constructorName = "SongIndicesSeedSettingsPresets";
}
SongIndicesSeedSettingsPresets.prototype = new AbstractSettingsPresets();

function SongParametersPresets() {
    AbstractSettingsPresets.call(this);
    this.items.push(new PresetItem().setName("Default").setData(new SongParameters()));
    this._constructorName = "SongParametersPresets";
}
SongParametersPresets.prototype = new AbstractSettingsPresets();

function SongDomainsPresets() {
    AbstractSettingsPresets.call(this);
    this.items.push(new PresetItem().setName("Default").setData(new SongDomains()));
    this._constructorName = "SongDomainsPresets";
}
SongDomainsPresets.prototype = new AbstractSettingsPresets();

function SongDetailsPresets() {
    AbstractSettingsPresets.call(this);
    this.items.push(new PresetItem().setName("Default").setData(new SongDetails()));
    this._constructorName = "SongDetailsPresets";
}
SongDetailsPresets.prototype = new AbstractSettingsPresets();


function Visualizer3DSettingsPresets() {
    AbstractSettingsPresets.call(this);
    this.items.push(new PresetItem().setName("Default").setData(new Visualizer3DSettings()));
    this._constructorName = "Visualizer3DSettingsPresets";
}
Visualizer3DSettingsPresets.prototype = new AbstractSettingsPresets();


function ThemeSettingsPresets() {
    AbstractSettingsPresets.call(this);
    this.items.push(new PresetItem().setName("Default").setData(new ThemeSettings()));
    this._constructorName = "ThemeSettingsPresets";
}
ThemeSettingsPresets.prototype = new AbstractSettingsPresets();


function MidiExportSettingsPresets() {
    AbstractSettingsPresets.call(this);
    this.items.push(new PresetItem().setName("Default").setData(new MidiExportSettings()));
    this._constructorName = "MidiExportSettingsPresets";
}
MidiExportSettingsPresets.prototype = new AbstractSettingsPresets();

function WavExportSettingsPresets() {
    AbstractSettingsPresets.call(this);
    this.items.push(new PresetItem().setName("Default").setData(new WavExportSettings()));
    this._constructorName = "WavExportSettingsPresets";
}
WavExportSettingsPresets.prototype = new AbstractSettingsPresets();

function WavClientExportSettingsPresets() {
    AbstractSettingsPresets.call(this);
    this.items.push(new PresetItem().setName("Default").setData(new WavClientExportSettings()));
    this._constructorName = "WavClientExportSettingsPresets";
}
WavClientExportSettingsPresets.prototype = new AbstractSettingsPresets();

function Mp3ExportSettingsPresets() {
    AbstractSettingsPresets.call(this);
    this.items.push(new PresetItem().setName("Default").setData(new Mp3ExportSettings()));

    this._constructorName = "Mp3ExportSettingsPresets";
}
Mp3ExportSettingsPresets.prototype = new AbstractSettingsPresets();

function OggExportSettingsPresets() {
    AbstractSettingsPresets.call(this);
    this.items.push(new PresetItem().setName("Default").setData(new OggExportSettings()));
    this._constructorName = "OggExportSettingsPresets";
}
OggExportSettingsPresets.prototype = new AbstractSettingsPresets();

function ItExportSettingsPresets() {
    AbstractSettingsPresets.call(this);
    this.items.push(new PresetItem().setName("Default").setData(new ItExportSettings()));
    this._constructorName = "ItExportSettingsPresets";
}
ItExportSettingsPresets.prototype = new AbstractSettingsPresets();


function MidiExportSettings() {
    AbstractSettings.call(this);
    this.exportVolume = true;
    this.exportEffects = true;
    this.mergeChannels = false;
    this.exportChordsToNewChannel = false;

    this.melodyReverbSends = [1];
    this.melodyChorusSends = [0.3];
    this.bassReverbSends = [0.1];
    this.bassChorusSends = [0.1];
    this.inner1ReverbSends = [0.1];
    this.inner1ChorusSends = [0.1];
    this.inner2ReverbSends = [0.1];
    this.inner2ChorusSends = [0.1];
    this.percussionReverbSend = 0;
    this.percussionChorusSend = 0;

    this.melodyVolumeMultipliers = [1];
    this.inner1VolumeMultipliers = [1];
    this.inner2VolumeMultipliers = [1];
    this.bassVolumeMultipliers = [1];
    this.percussionVolumeMultiplier = 1;

    this._constructorName = "MidiExportSettings";
}
MidiExportSettings.prototype = new AbstractSettings();

function WavExportSettings() {
    MidiExportSettings.call(this);
    this.soundFontType = SoundFontType.STANDARD_LIGHT;
    this.normalizeRenderedResult = false;
    this.compressRenderedResult = false;
    this._constructorName = "WavExportSettings";
}
WavExportSettings.prototype = new MidiExportSettings();

function WavClientExportSettings() {
    MidiExportSettings.call(this);
    this._constructorName = "WavClientExportSettings";
}
WavClientExportSettings.prototype = new MidiExportSettings();

function Mp3ExportSettings() {
    WavExportSettings.call(this);
    this._constructorName = "Mp3ExportSettings";
}
Mp3ExportSettings.prototype = new WavExportSettings();

function OggExportSettings() {
    WavExportSettings.call(this);
    this._constructorName = "OggExportSettings";
}
OggExportSettings.prototype = new WavExportSettings();

function ItExportSettings() {
    AbstractSettings.call(this);
    this._constructorName = "ItExportSettings";
}
ItExportSettings.prototype = new AbstractSettings();


function PlayerSettings() {
    WavExportSettings.call(this);
    this._constructorName = "PlayerSettings";
}
PlayerSettings.prototype = new WavExportSettings();

const PrimitiveWebAudioPlayerInstrumentType = {
    SINE: 0,
    TRIANGLE: 1,
    SAW: 2,
    SQUARE: 3,

    toString: function(t) {
        switch (t) {
            case PrimitiveWebAudioPlayerInstrumentType.SAW:
                return "Saw";
            case PrimitiveWebAudioPlayerInstrumentType.SINE:
                return "Sine";
            case PrimitiveWebAudioPlayerInstrumentType.SQUARE:
                return "Square";
            case PrimitiveWebAudioPlayerInstrumentType.TRIANGLE:
                return "Triangle";
        }
        return "Unknown wa instr type " + t;
    }
};
addPossibleValuesFunction(PrimitiveWebAudioPlayerInstrumentType, PrimitiveWebAudioPlayerInstrumentType.SINE, PrimitiveWebAudioPlayerInstrumentType.SQUARE);


function WebAudioPlayerInstrument() {

    this._constructorName = "WebAudioPlayerInstrument";
}

function PrimitiveWebAudioPlayerInstrument() {
    WebAudioPlayerInstrument.call(this);
    this.type = PrimitiveWebAudioPlayerInstrumentType.SQUARE;
    this._constructorName = "PrimitiveWebAudioPlayerInstrument";
}


function WebAudioPlayerSettings() {
    PlayerSettings.call(this);
    this.soundFontType = SoundFontType.STANDARD_HEAVY; // For percussion
    this.melodyInstruments = [];
    this.inner1Instruments = [];
    this.inner2Instruments = [];
    this.bassInstruments = [];
    this._constructorName = "WebAudioPlayerSettings";
}
WebAudioPlayerSettings.prototype = new PlayerSettings();


function AudioElementPlayerSettings() {
    PlayerSettings.call(this);
    this._constructorName = "AudioElementPlayerSettings";
}
AudioElementPlayerSettings.prototype = new PlayerSettings();


function SoundManager2PlayerSettings() {
    PlayerSettings.call(this);
    this._constructorName = "SoundManager2PlayerSettings";
}
SoundManager2PlayerSettings.prototype = new PlayerSettings();

const JQueryUITheme = {
    BLITZER: 0,
    BLACK_TIE: 1,
    CUPERTINO: 2,
    DARK_HIVE: 3,
    DOT_LUV: 4,
    EGGPLANT: 5,
    EXCITE_BIKE: 6,
    FLICK: 7,
    HOT_SNEAKS: 8,
    HUMANITY: 9,
    LE_FROG: 10,
    MINT_CHOC: 11,
    OVERCAST: 12,
    PEPPER_GRINDER: 13,
    REDMOND: 14,
    SMOOTHNESS: 15,
    SOUTH_STREET: 16,
    START: 17,
    SUNNY: 18,
    SWANKY_PURSE: 19,
    TRONTASTIC: 20,
    UI_DARKNESS: 21,
    UI_LIGHTNESS: 22,
    VADER: 23,


    toUrlString: function(t) {
        switch (t) {
            case JQueryUITheme.BLITZER:
                return "blitzer";
            case JQueryUITheme.BLACK_TIE:
                return "black-tie";
            case JQueryUITheme.CUPERTINO:
                return "cupertino";
            case JQueryUITheme.DARK_HIVE:
                return "dark-hive";
            case JQueryUITheme.DOT_LUV:
                return "dot-luv";
            case JQueryUITheme.EGGPLANT:
                return "eggplant";
            case JQueryUITheme.EXCITE_BIKE:
                return "excite-bike";
            case JQueryUITheme.FLICK:
                return "flick";
            case JQueryUITheme.HOT_SNEAKS:
                return "hot-sneaks";
            case JQueryUITheme.HUMANITY:
                return "humanity";
            case JQueryUITheme.LE_FROG:
                return "le-frog";
            case JQueryUITheme.MINT_CHOC:
                return "mint-choc";
            case JQueryUITheme.OVERCAST:
                return "overcast";
            case JQueryUITheme.PEPPER_GRINDER:
                return "pepper-grinder";
            case JQueryUITheme.REDMOND:
                return "redmond";
            case JQueryUITheme.SMOOTHNESS:
                return "smoothness";
            case JQueryUITheme.SOUTH_STREET:
                return "south-street";
            case JQueryUITheme.START:
                return "start";
            case JQueryUITheme.SUNNY:
                return "sunny";
            case JQueryUITheme.SWANKY_PURSE:
                return "swanky-purse";
            case JQueryUITheme.TRONTASTIC:
                return "trontastic";
            case JQueryUITheme.UI_DARKNESS:
                return "ui-darkness";
            case JQueryUITheme.UI_LIGHTNESS:
                return "ui-lightness";
            case JQueryUITheme.VADER:
                return "vader";
        }
        return "blitzer";
    },

    toString: function(t) {
        switch (t) {
            case JQueryUITheme.BLITZER:
                return "Blitzer";
            case JQueryUITheme.BLACK_TIE:
                return "Black Tie";
            case JQueryUITheme.CUPERTINO:
                return "Cupertino";
            case JQueryUITheme.DARK_HIVE:
                return "Dark hive";
            case JQueryUITheme.DOT_LUV:
                return "Dot luv";
            case JQueryUITheme.EGGPLANT:
                return "Eggplant";
            case JQueryUITheme.EXCITE_BIKE:
                return "Excite bike";
            case JQueryUITheme.FLICK:
                return "Flick";
            case JQueryUITheme.HOT_SNEAKS:
                return "Hot sneaks";
            case JQueryUITheme.HUMANITY:
                return "Humanity";
            case JQueryUITheme.LE_FROG:
                return "Le frog";
            case JQueryUITheme.MINT_CHOC:
                return "Mint choc";
            case JQueryUITheme.OVERCAST:
                return "Overcast";
            case JQueryUITheme.PEPPER_GRINDER:
                return "Pepper grinder";
            case JQueryUITheme.REDMOND:
                return "Redmond";
            case JQueryUITheme.SMOOTHNESS:
                return "Smoothness";
            case JQueryUITheme.SOUTH_STREET:
                return "South street";
            case JQueryUITheme.START:
                return "Start";
            case JQueryUITheme.SUNNY:
                return "Sunny";
            case JQueryUITheme.SWANKY_PURSE:
                return "Swanky purse";
            case JQueryUITheme.TRONTASTIC:
                return "Trontastic";
            case JQueryUITheme.UI_DARKNESS:
                return "UI darkness";
            case JQueryUITheme.UI_LIGHTNESS:
                return "UI lightness";
            case JQueryUITheme.VADER:
                return "Vader";

        }
        return "Unknown theme " + t;
    }
};
addPossibleValuesFunction(JQueryUITheme, JQueryUITheme.BLITZER, JQueryUITheme.VADER);



function ThemeSettings() {
    AbstractSettings.call(this);
    this.theme = JQueryUITheme.SUNNY;
    this.transparentDialogs = false;
    this._constructorName = "ThemeSettings";
}
ThemeSettings.prototype = new AbstractSettings();



const Visualizer3DStopMovementMode = {
    ROTATE: 0,
    PAN: 1,
    PAN_INTERACTIVE_HOVER: 2,
    ROTATE_INTERACTIVE_HOVER: 3,
    ROTATE_PAN_INTERACTIVE_HOVER: 4,
    PAN_INTERACTIVE_DRAG: 5,
    ROTATE_INTERACTIVE_DRAG: 6,
    ROTATE_PAN_INTERACTIVE_DRAG: 7,

    toString: function(t) {
        switch (t) {
            case Visualizer3DStopMovementMode.ROTATE:
                return "Rotate";
            case Visualizer3DStopMovementMode.PAN:
                return "Pan";
            case Visualizer3DStopMovementMode.ROTATE_INTERACTIVE_HOVER:
                return "Rotate Interactive Hover";
            case Visualizer3DStopMovementMode.PAN_INTERACTIVE_HOVER:
                return "Pan Interactive Hover";
            case Visualizer3DStopMovementMode.ROTATE_PAN_INTERACTIVE_HOVER:
                return "Rotate + Pan Interactive Hover";
            case Visualizer3DStopMovementMode.ROTATE_PAN_INTERACTIVE_DRAG:
                return "Rotate + Pan Interactive Drag";
            case Visualizer3DStopMovementMode.ROTATE_INTERACTIVE_DRAG:
                return "Rotate Interactive Drag";
            case Visualizer3DStopMovementMode.PAN_INTERACTIVE_DRAG:
                return "Pan Interactive Drag";
        }
        return "Unknown vis movement mode " + t;
    }
};
addPossibleValuesFunction(Visualizer3DStopMovementMode, Visualizer3DStopMovementMode.ROTATE, Visualizer3DStopMovementMode.ROTATE_PAN_INTERACTIVE_DRAG);


function Visualizer3DSettings() {
    AbstractSettings.call(this);
    this.stopMovementMode = Visualizer3DStopMovementMode.PAN_INTERACTIVE_DRAG;
    this.on = true;
    this.forceContext2D = true;
    this.usePerspective = true;
    this.webGLFps = 30;
    this.context2DFps = 20;
    this.addBloom = true;
    this.addVignette = true;
    this.addSimulatedAA = true;
    this._constructorName = "Visualizer3DSettings";
}
Visualizer3DSettings.prototype = new AbstractSettings();


function SongSettings() {
    AbstractSettings.call(this);
    this.name = "";
    this.seed = "12345";
    this._constructorName = "SongSettings";
}
SongSettings.prototype = new AbstractSettings();


function SongStructureSeedSettings() {
    AbstractSettings.call(this);
    this.tempoSeed = "";
    this.scaleSeed = "";
    this.tsSeed = "";
    this.introSeed = "";
    this.endSeed = "";
    this.renderAmountSeed = "";
    this.modulationSeed = "";
    this.tonicizationSeed = "";
    this.songStructureSeed = "";
    this.glueSeed = "";
    this.phraseGroupSeed = "";
    this.phraseGroupSimilaritySeed = "";
    this.groupSimilaritySeed = "";
    this.groupDifferenceSeed = "";
    this._constructorName = "SongStructureSeedSettings";
}
SongStructureSeedSettings.prototype = new AbstractSettings();



function SongContentSeedSettings() {
    AbstractSettings.call(this);
    this.instrumentTypeSeed = "";
    this.melodyInstrumentSeed = "";
    this.inner1InstrumentSeed = "";
    this.inner2InstrumentSeed = "";
    this.bassInstrumentSeed = "";
    this.melodyMotifSeed = "";
    this.melodyMotifRythmSeed = "";
    this.melodyMotifEmbellishConnectSeed = "";
    this.bassMotifSeed = "";
    this.bassMotifRythmSeed = "";
    this.bassMotifEmbellishConnectSeed = "";
    this.harmonyMotifSeed = "";
    this.harmonyMotifRythmSeed = "";
    this.harmonyMotifEmbellishConnectSeed = "";
    this.percussionInstrumentSeed = "";
    this.percussionFillInstrumentSeed = "";
    this.percussionMotifSeed = "";
    this.percussionMotifRythmSeed = "";
    this.percussionFillMotifSeed = "";
    this.percussionFillMotifRythmSeed = "";
    this.melodyShapeSeed = "";
    this.bassShapeSeed = "";
    this.harmonyRythmSeed = "";
    this.melodyMotifDistributionSeed = "";
    this.inner1MotifDistributionSeed = "";
    this.inner2MotifDistributionSeed = "";
    this.bassMotifDistributionSeed = "";
    this.percussionMotifDistributionSeed = "";
    this.percussionFillMotifDistributionSeed = "";
    this.melodyHarmonyPunctationSeed = "";
    this.innerHarmonyPunctationSeed = "";
    this.harmonySeed = "";
    this.channelDistributionSeed = "";
    this.tempoChangeSeed = "";
    this.effectChangeSeed = "";
    this.suspendSeed = "";
    this._constructorName = "SongContentSeedSettings";
}
SongContentSeedSettings.prototype = new AbstractSettings();

function SongIndicesSeedSettings() {
    AbstractSettings.call(this);

    this.melodyShapeIndicesSeed = "";
    this.bassShapeIndicesSeed = "";
    this.harmonyIndicesSeed = "";
    this.harmonyRythmIndicesSeed = "";
    this.suspendIndicesSeed = "";
    this.melodyChannelDistributionIndicesSeed = "";
    this.inner1ChannelDistributionIndicesSeed = "";
    this.inner2ChannelDistributionIndicesSeed = "";
    this.bassChannelDistributionIndicesSeed = "";
    this.melodyMotifDistributionIndicesSeed = "";
    this.inner1MotifDistributionIndicesSeed = "";
    this.inner2MotifDistributionIndicesSeed = "";
    this.bassMotifDistributionIndicesSeed = "";
    this.percussionMotifDistributionIndicesSeed = "";
    this.percussionFillMotifDistributionIndicesSeed = "";
    this.harmonyExtraIndicesSeed = "";
    this.renderAmountIndicesSeed = "";
    this.tempoIndicesSeed = "";
    this.sequentialTempoChangeIndicesSeed = "";
    this.parallelTempoChangeIndicesSeed = "";
    this.sequentialMelodyEffectChangeIndicesSeed = "";
    this.sequentialInner1EffectChangeIndicesSeed = "";
    this.sequentialInner2EffectChangeIndicesSeed = "";
    this.sequentialBassEffectChangeIndicesSeed = "";
    this.sequentialPercussionEffectChangeIndicesSeed = "";

    this._constructorName = "SongIndicesSeedSettings";
}
SongIndicesSeedSettings.prototype = new AbstractSettings();



// This is a hack to get exactly the same parameters as in GenInfo. All the seeds are ignored :)
function SongParameters() {
    GenInfo.call(this);
    AbstractSettings.call(this);
    this._constructorName = "SongParameters";
}
SongParameters.prototype = new AbstractSettings();


// Another hack to get the domains in GenInfo :)
function SongDomains() {
    GenInfo.call(this);
    AbstractSettings.call(this);
    this._constructorName = "SongDomains";
}
SongDomains.prototype = new AbstractSettings();


// Another hack to get the details in GenInfo :)
function SongDetails() {
    GenInfo.call(this);
    AbstractSettings.call(this);
    this._constructorName = "SongDetails";
}
SongDetails.prototype = new AbstractSettings();


const renderStorage = new RenderStorage();

const editorSettings = new EditorSettings();

const visualizer3DSettings = new Visualizer3DSettings();
const visualizer3DSettingsPresets = new Visualizer3DSettingsPresets();

const themeSettings = new ThemeSettings();
const themeSettingsPresets = new ThemeSettingsPresets();

const webAudioPlayerSettings = new WebAudioPlayerSettings();
const audioElementPlayerSettings = new AudioElementPlayerSettings();
const soundManager2PlayerSettings = new SoundManager2PlayerSettings();

const midiExportSettings = new MidiExportSettings();
const midiExportSettingsPresets = new MidiExportSettingsPresets();
const wavExportSettings = new WavExportSettings();
const wavExportSettingsPresets = new WavExportSettingsPresets();
const wavClientExportSettings = new WavClientExportSettings();
const wavClientExportSettingsPresets = new WavClientExportSettingsPresets();
const mp3ExportSettings = new Mp3ExportSettings();
const mp3ExportSettingsPresets = new Mp3ExportSettingsPresets();
const oggExportSettings = new OggExportSettings();
const oggExportSettingsPresets = new OggExportSettingsPresets();
const itExportSettings = new ItExportSettings();
const itExportSettingsPresets = new ItExportSettingsPresets();

const songSettings = new SongSettings();
const songSettingsPresets = new SongSettingsPresets();
const songStructureSeedSettings = new SongStructureSeedSettings();
const songStructureSeedSettingsPresets = new SongStructureSeedSettingsPresets();
const songContentSeedSettings = new SongContentSeedSettings();
const songContentSeedSettingsPresets = new SongContentSeedSettingsPresets();
const songIndicesSeedSettings = new SongIndicesSeedSettings();
const songIndicesSeedSettingsPresets = new SongIndicesSeedSettingsPresets();
const songParameters = new SongParameters();
const songParametersPresets = new SongParametersPresets();
const songDomains = new SongDomains();
const songDomainsPresets = new SongDomainsPresets();
const songDetails = new SongDetails();
const songDetailsPresets = new SongDetailsPresets();

const allSettings = [
    renderStorage, // Rendered stuff
    themeSettings,
    editorSettings, visualizer3DSettings, webAudioPlayerSettings, soundManager2PlayerSettings, audioElementPlayerSettings, // GUI
    midiExportSettings, wavExportSettings, wavClientExportSettings, mp3ExportSettings, oggExportSettings, itExportSettings, // Export
    midiExportSettingsPresets, wavExportSettingsPresets, wavClientExportSettingsPresets, mp3ExportSettingsPresets, oggExportSettingsPresets, itExportSettingsPresets, // Export presets
    songSettings, // Song
    songSettingsPresets, // Song presets
    songStructureSeedSettings, songContentSeedSettings, songIndicesSeedSettings, // Seeds
    songStructureSeedSettingsPresets, songContentSeedSettingsPresets, songIndicesSeedSettingsPresets, // Seeds presets
    songParameters, songDomains, songDetails, // Domains and params
    songParametersPresets, songDomainsPresets, songDetailsPresets // Domains and params presets
];


const allLoadSaveSongSettings = [
    songSettings,
    songStructureSeedSettings, songContentSeedSettings, songIndicesSeedSettings,
    songParameters, songDomains, songDetails
];


function loadSettingsFromLocalStorage() {
    for (let i=0; i<allSettings.length; i++) {
        const settings = allSettings[i];
        settings.loadFromLocalStorage();
    }
}
function saveSettingsToLocalStorage() {
    for (let i=0; i<allSettings.length; i++) {
        const settings = allSettings[i];
        if (settings.dirty) {
            settings.saveToLocalStorage();
            settings.dirty = false;
        }
    }
}

