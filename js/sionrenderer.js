

class NoteOnOff {
    constructor() {
        this.on = null;
        this.off = null;
        this.wholeNoteLength = 1;
        this.isRest = false;
        this.percussionNote = 0;
    }
}

class SionInstrument {
    constructor() {
        this.id = "";
        this.isPercussion = false;
        this.percussionNote = ""; // Named note
        this.percussionPlayNote = 24;
        this.index = 0; // used for some, auto
        this._constructorName = "SionInstrument";
    }
    getMMLSpec() {
        return "";
    }
    getMMLSelect() {
        return "%0";
    }
}

class SionPresetInstrument extends SionInstrument {
    constructor() {
        super()
        this.category = SionPresetCategory.DEFAULT;
        this.defaultInstrument = SionPresetVoiceDEFAULT._SINE_WAVE;
        this.bassInstrument = SionPresetVoiceVALSOUND_BASS._ANALOG_BASS_2_FBSYNTH;
        this.bellInstrument = SionPresetVoiceVALSOUND_BELL._CALM_BELL;
        this.brassInstrument = SionPresetVoiceVALSOUND_BRASS._BRASS_STRINGS;
        this.guitarInstrument = SionPresetVoiceVALSOUND_GUITAR._GUITAR_VELOLOW;
        this.leadInstrument = SionPresetVoiceVALSOUND_LEAD._ACO_CODE;
        this.percussionInstrument = SionPresetVoiceVALSOUND_PERCUS._BASS_DRUM_2;
        this.pianoInstrument = SionPresetVoiceVALSOUND_PIANO._ACO_PIANO2_ATTACK;
        this.seInstrument = SionPresetVoiceVALSOUND_SE._S_E_DETUNE_IS_NEEDED_O2C;
        this.specialInstrument = SionPresetVoiceVALSOUND_SPECIAL._DIGITAL_1;
        this.strPadInstrument = SionPresetVoiceVALSOUND_STRPAD._ACCORDION1;
        this.windInstrument = SionPresetVoiceVALSOUND_WIND._CLARINET_1;
        this.worldInstrument = SionPresetVoiceVALSOUND_WORLD._BANJO_HARPCI;
        this.midiInstrument = SionPresetVoiceMIDI._GRANDPNO;
        this.midiDrumInstrument = SionPresetVoiceMIDI_DRUM._SEQ_CLICK_H;
        this._constructorName = "SionPresetInstrument";
    }
    getMMLSpec() {
        switch (this.category) {
            case SionPresetCategory.DEFAULT:
                return SionPresetVoiceDEFAULT.getMML(this.defaultInstrument, this.index);
            case SionPresetCategory.MIDI:
                return SionPresetVoiceMIDI.getMML(this.midiInstrument, this.index);
            case SionPresetCategory.MIDI_DRUM:
                return SionPresetVoiceMIDI_DRUM.getMML(this.midiDrumInstrument, this.index);
            case SionPresetCategory.VALSOUND_BASS:
                return SionPresetVoiceVALSOUND_BASS.getMML(this.bassInstrument, this.index);
            case SionPresetCategory.VALSOUND_BELL:
                return SionPresetVoiceVALSOUND_BELL.getMML(this.bellInstrument, this.index);
            case SionPresetCategory.VALSOUND_BRASS:
                return SionPresetVoiceVALSOUND_BRASS.getMML(this.brassInstrument, this.index);
            case SionPresetCategory.VALSOUND_GUITAR:
                return SionPresetVoiceVALSOUND_GUITAR.getMML(this.guitarInstrument, this.index);
            case SionPresetCategory.VALSOUND_LEAD:
                return SionPresetVoiceVALSOUND_LEAD.getMML(this.leadInstrument, this.index);
            case SionPresetCategory.VALSOUND_PERCUS:
                return SionPresetVoiceVALSOUND_PERCUS.getMML(this.percussionInstrument, this.index);
            case SionPresetCategory.VALSOUND_PIANO:
                return SionPresetVoiceVALSOUND_PIANO.getMML(this.pianoInstrument, this.index);
            case SionPresetCategory.VALSOUND_SE:
                return SionPresetVoiceVALSOUND_SE.getMML(this.seInstrument, this.index);
            case SionPresetCategory.VALSOUND_SPECIAL:
                return SionPresetVoiceVALSOUND_SPECIAL.getMML(this.specialInstrument, this.index);
            case SionPresetCategory.VALSOUND_STRPAD:
                return SionPresetVoiceVALSOUND_STRPAD.getMML(this.strPadInstrument, this.index);
            case SionPresetCategory.VALSOUND_WIND:
                return SionPresetVoiceVALSOUND_WIND.getMML(this.windInstrument, this.index);
            case SionPresetCategory.VALSOUND_WORLD:
                return SionPresetVoiceVALSOUND_WORLD.getMML(this.worldInstrument, this.index);
        }
        return "";
    }
    getMMLSelect() {
        return "%6@" + this.index;
    }
}

class SionPmsInstrument extends SionInstrument {
    constructor() {
        super()
        this.attackRate = 48;
        this.decayRate = 48;
        this.pluckEnergy = 0;
        this.pluckNoiseNote = 0;
        this.noisePluckType = 20;
        this._constructorName = "SionPmsInstrument";
    }
    getMMLSelect() {
        return "%11@0," + this.attackRate + "," + this.decayRate + "," + this.pluckEnergy + "," +
            this.pluckNoiseNote + "," + this.noisePluckType + "s32";
    }
}

const SionNesToneColor = {
    SQUARE_DUTY_0: 0,
    SQUARE_DUTY_12_5: 1,
    SQUARE_DUTY_25: 2,
    SQUARE_DUTY_37_5: 3,
    SQUARE_DUTY_50: 4,
    SQUARE_DUTY_62_5: 5,
    SQUARE_DUTY_75: 6,
    SQUARE_DUTY_87_5: 7,
    TRIANGLE: 8,
    PULSE_NOISE: 9,
    NOISE_93BIT: 10,

    toString: function(type) {
        switch (type) {
            case SionNesToneColor.SQUARE_DUTY_0:
                return "Square duty 0%";
            case SionNesToneColor.SQUARE_DUTY_12_5:
                return "Square duty 12.5%";
            case SionNesToneColor.SQUARE_DUTY_25:
                return "Square duty 25%";
            case SionNesToneColor.SQUARE_DUTY_37_5:
                return "Square duty 37.5%";
            case SionNesToneColor.SQUARE_DUTY_50:
                return "Square duty 50%";
            case SionNesToneColor.SQUARE_DUTY_62_5:
                return "Square duty 62.5%";
            case SionNesToneColor.SQUARE_DUTY_75:
                return "Square duty 75%";
            case SionNesToneColor.SQUARE_DUTY_87_5:
                return "Square duty 87.5%";
            case SionNesToneColor.NOISE_93BIT:
                return "93 Bit noise";
            case SionNesToneColor.PULSE_NOISE:
                return "Pulse noise";
            case SionNesToneColor.TRIANGLE:
                return "Triangle";
        }
        return "Unknown NES tone color " + type;
    }
};
addPossibleValuesFunction(SionNesToneColor, SionNesToneColor.SQUARE_DUTY_0, SionNesToneColor.NOISE_93BIT);



class SionNesInstrument extends SionInstrument {
    constructor() {
        super()
        this.toneColor = SionNesToneColor.SQUARE_DUTY_50;
        this._constructorName = "SionNesInstrument";
    }
    getMMLSelect() {
        return "%1@" + this.toneColor;
    }
}

class SionEffectSend {
    constructor() {
        this.id = "";
        this.effect = "";
        this.sendLevel = 0;
        this._constructorName = "SionEffectSend";
    }
    setEffect(t) {
        this.effect = t;
        return this;
    }
    setSendLevel(t) {
        this.sendLevel = t;
        return this;
    }
}

class SionInstrumentChannelMap {
    constructor() {
        this.id = "";
        this.renderChannel = "";
        this.instrument = new SionPresetInstrument();
        this.masterVolume = 64;
        this.effectSends = [];
        this._constructorName = "SionInstrumentChannelMap";
    }
    getMML(effectArr) {
        const sendArr = [0, 0, 0, 0, 0, 0, 0, 0];
        sendArr[0] = this.masterVolume;

        for (const effectSend of this.effectSends) {
            const index = getObjectIndexWithId(effectSend.effect, effectArr);
            if (index >= 0 && index < sendArr.length) {
                sendArr[index + 1] = effectSend.sendLevel;
            }
        }

        return this.instrument.getMMLSelect() + " @v" + sendArr.join(",");
    }
}

class SionEffect {
    constructor() {
        this.id = "";
        this.effectIndex = 0; // Auto
        this._constructorName = "SionEffect";
    }
    getMML() {
        return "";
    }
}

class SionSerialEffect extends SionEffect {
    constructor() {
        super()
        this.effects = [];
        this._constructorName = "SionSerialEffect";
    }
    getMML() {
        let result = "";

        for (const effect of this.effects) {
            result += effect.getMML();
        }

        return result;
    }
}

class SionDelayEffect extends SionEffect {
    constructor() {
        super()
        this.time = 200;
        this.feedback = 25;
        this.cross = 0;
        this.wet = 100;
        this._constructorName = "SionDelayEffect";
    }
    getMML() {
        return "delay" + this.time + "," + this.feedback + "," + this.cross + "," + this.wet;
    }
}

class SionReverbEffect extends SionEffect {
    constructor() {
        super()
        this.longDelay = 70;
        this.shortDelay = 40;
        this.feedback = 80;
        this.wet = 100;
        this._constructorName = "SionReverbEffect";
    }
    getMML() {
        return "reverb" + this.longDelay + "," + this.shortDelay + "," + this.feedback + "," + this.wet;
    }
}

class Sion3BandEqualizerEffect extends SionEffect {
    constructor() {
        super()
        this.lowGain = 100;
        this.middleGain = 100;
        this.highGain = 100;
        this.lowFrequency = 800;
        this.highFrequency = 5000;
        this._constructorName = "Sion3BandEqualizerEffect";
    }
    getMML() {
        return "eq" + this.lowGain + "," + this.middleGain + "," + this.highGain + "," + this.lowFrequency + "," + this.highFrequency;
    }
}

class SionChorusEffect extends SionEffect {
    constructor() {
        super()
        this.delayTime = 20;
        this.feedback = 50;
        this.depth = 200;
        this.wet = 100;
        this._constructorName = "SionChorusEffect";
    }
    getMML() {
        return "chorus" + this.delayTime + "," + this.feedback + "," + this.depth + "," + this.wet;
    }
}

class SionDistortionEffect extends SionEffect {
    constructor() {
        super()
        this.preGain = -60;
        this.postGain = -12;
        this.lpfFreq = 2400;
        this.lpfSlope = 1;
        this._constructorName = "SionDistortionEffect";
    }
    getMML() {
        return "dist" + this.preGain + "," + this.postGain + "," + this.lpfFreq + "," + this.lpfSlope;
    }
}

class SionCompressorEffect extends SionEffect {
    constructor() {
        super()
        this.threshold = 70;
        this.windowWidth = 50;
        this.attack = 20;
        this.release = 20;
        this.maxGain = 6;
        this.outputLevel = 50;
        this._constructorName = "SionCompressorEffect";
    }
    getMML() {
        return "comp" + this.threshold + "," + this.windowWidth + "," + this.attack + "," + this.release + "," + this.maxGain + "," + this.outputLevel;
    }
}

class SionWaveShaperEffect extends SionEffect {
    constructor() {
        super()
        this.distortion = 50;
        this.outputLevel = 100;
        this._constructorName = "SionWaveShaperEffect";
    }
    getMML() {
        return "ws" + this.distortion + "," + this.outputLevel;
    }
}

class SionRenderer {
    constructor() {
        this.id = "";
        this.structure = "";
        this.effects = [];
        this.mappings = [];
        this.masterEffects = []; // Treated as a serial effect
        this._constructorName = "SionRenderer";
    }
    getLengthString(onOff) {
        let lengthLeft = onOff.wholeNoteLength;
        let resultString = "";
        const maxDivider = 64;
        while (lengthLeft > 1.0 / maxDivider) {
            // Go through the dividers
            const startIndex = Math.max(1, Math.floor(1 / lengthLeft));
            for (let i = startIndex; i <= 64; i++) {
                const wholeNotes = 1.0 / i;
                if (wholeNotes <= lengthLeft) {
                    lengthLeft -= wholeNotes;
                    if (!resultString) {
                        resultString = "" + i;
                    }
                    else {
                        resultString += "^" + i;
                    }
                    break;
                }
            }
        }
        // logit("Whole note length " + onOff.wholeNoteLength + " gives string '" + resultString + "<br />");
        return resultString;
    }
    getNoteMML(onOff) {
        let noteString = "";
        if (onOff.isRest) {
            noteString = "r";
        }
        else {
            let note = onOff.on.note;
            if (onOff.percussionNote != 0) {
                note = onOff.percussionNote;
            }
            let octave = Math.floor(note / 12);
            const pitchClass = note % 12;
            switch (pitchClass) {
                case 0:
                    noteString = "c";
                    break;
                case 1:
                    noteString = "c#";
                    break;
                case 2:
                    noteString = "d";
                    break;
                case 3:
                    noteString = "d#";
                    break;
                case 4:
                    noteString = "e";
                    break;
                case 5:
                    noteString = "f";
                    break;
                case 6:
                    noteString = "f#";
                    break;
                case 7:
                    noteString = "g";
                    break;
                case 8:
                    noteString = "g#";
                    break;
                case 9:
                    noteString = "a";
                    break;
                case 10:
                    noteString = "a#";
                    break;
                case 11:
                    noteString = "b";
                    break;
            }
        }
        if (onOff.isRest) {
            return noteString;
        }
        else {
            return "o" + octave + "" + noteString;
        }
    }
    getOnOffMML(onOff) {
        let result = "";
        if (onOff.isRest) {
            result = "r";
        }
        else {
            result = this.getNoteMML(onOff);
        }
        result += this.getLengthString(onOff) + " ";
        return result;
    }
    appendNoteOnOff(noff, tracks, theMapping) {
        const channelId = noff.on.renderChannel.id;
        let suitableTrack = null;
        let bestRestLength = 9999999;
        let restLength = 0;

        for (const track of tracks) {
            if (track.channel == channelId && track.mapping == theMapping) {
                const lastNoff = track.noteOnOffs[track.noteOnOffs.length - 1];
                const diffTime = noff.on.time - lastNoff.off.time;
                if (diffTime < bestRestLength && diffTime >= -0.000001) {
                    suitableTrack = track;
                    restLength = diffTime;
                    bestRestLength = diffTime;
                }
            }
        }

        if (!suitableTrack) {
            suitableTrack = {
                channel: channelId,
                noteOnOffs: [],
                mapping: theMapping
            };
            tracks.push(suitableTrack);
            restLength = noff.on.time;
        }
        //    logit("Creating noff " + noff.on.note + " length: " + noff.wholeNoteLength + " rest before: " + restLength + "<br />");
        // Add a rest if necessary
        if (restLength > 0) {
            const rest = new NoteOnOff();
            rest.wholeNoteLength = restLength;
            rest.isRest = true;
            suitableTrack.noteOnOffs.push(rest);
        }
        suitableTrack.noteOnOffs.push(noff);
    }
    processNoteOnOrOffEvent(event, noteOnMaps, tracks, module) {
        let noteArrMap = noteOnMaps[event.renderChannel.id];
        if (!noteArrMap) {
            noteArrMap = {};
            noteOnMaps[event.renderChannel.id] = noteArrMap;
        }
        let noteArr = noteArrMap[event.note];
        if (!noteArr) {
            noteArr = [];
            noteArrMap[event.note] = noteArr;
        }
        let theMapping = null;

        for (const mapping of this.mappings) {
            if (mapping.renderChannel == event.renderChannel.id) {
                if (mapping.instrument.isPercussion) {
                    const namedNote = module.getNamedNote(mapping.instrument.percussionNote);
                    if (namedNote && event.note == namedNote.note) {
                        theMapping = mapping;
                    }
                }
                else {
                    theMapping = mapping;
                }
            }
        }

        if (theMapping == null) {
            logit("Could not find mapping for event " + event + "<br />");
        }
        if (event.type == "noteOn") {
            noteArr.push(event);
        }
        else {
            // Note off
            let onEvent = null;

            for (const otherEvent of noteArr) {
                onEvent = otherEvent;
                break;
            }

            if (!onEvent) {
                logit("Could not find matching note on for note off");
            }
            else {
                noteArr.splice(0, 1);
                const noff = new NoteOnOff();
                if (theMapping.instrument.isPercussion) {
                    noff.percussionNote = theMapping.instrument.percussionPlayNote;
                }
                noff.on = onEvent;
                noff.off = event;
                noff.wholeNoteLength = (event.time - onEvent.time) / 1;
                noff.isRest = false;
                this.appendNoteOnOff(noff, tracks, theMapping);
            }
        }
    }
    processEvent(renderEvent, noteOnMaps, tracks, module) {
        if (renderEvent.type == "noteOn" || renderEvent.type == "noteOff") {
            this.processNoteOnOrOffEvent(renderEvent, noteOnMaps, tracks, module);
        }
    }
    getMML(renderData, module) {
        const resultArr = [];
        // { channel: "ch1", noteOnOffs: [] }
        const tracks = [];
        const noteOnMaps = {};

        for (const event of renderData.events) {
            this.processEvent(event, noteOnMaps, tracks, module);
        }

        let masterEffectString = "";

        for (let effect of this.masterEffects) {
            masterEffectString += effect.getMML();
        }

        if (masterEffectString) {
            masterEffectString = "#EFFECT0{" + masterEffectString + "}";
            resultArr.push(masterEffectString);
        }
        for (let i = 0; i < this.effects.length; i++) {
            let effect = this.effects[i];
            const effectString = "#EFFECT" + (i + 1) + "{" + effect.getMML() + "}";
            resultArr.push(effectString);
        }
        for (let i = 0; i < this.mappings.length; i++) {
            const mapping = this.mappings[i];
            mapping.instrument.index = i;
            const spec = mapping.instrument.getMMLSpec();
            if (spec) {
                resultArr.push(spec);
            }
        }

        for (const track of tracks) {
            const onOffs = track.noteOnOffs;
            let trackString = "";
            // var trackChannel = track.channel;
            const theMapping = track.mapping;
            //        for (var j=0; j<this.mappings.length; j++) {
            //            var mapping = this.mappings[j];
            //            if (mapping.renderChannel == trackChannel) {
            //                theMapping = mapping;
            //                break;
            //            }
            //        }
            if (theMapping) {
                trackString += theMapping.getMML(this.effects) + " ";
            }

            for (const onOff of onOffs) {
                trackString += this.getOnOffMML(onOff);
            }

            resultArr.push(trackString);
        }

        // return resultArr[0] + "; " + resultArr[1] + "; " + resultArr[2];  
        return resultArr.join("; ");
    }
}
