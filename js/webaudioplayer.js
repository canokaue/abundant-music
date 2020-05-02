class WebAudioVoice {
    constructor() {
        this.outputNode = null;
        this.offTime = 0;
    }
}

class WebAudioChannelNodes {
    constructor() {
        this.channelName = "";
        this.chorusSend = null;
        this.delaySend = null;
        this.reverbSend = null;
        this.gain = null;
        this.filter = null;
        this.panner = null;
    }
}

class WebAudioPlayer extends AudioPlayer {
    constructor() {
        super()
        this.notesPerSample = 6;
        this.context = null;
        this.compressor = null;
        this.melodicBuffers = {};
        this.percussionBuffers = {};
        this.bufferAmpScale = 0.1;
    }
    getContextTime() {
        return this.context.currentTime;
    }
    contextSupported() {
        return this.getContextConstructor() != null;
    }
    getContextConstructor() {
        let con = null;
        if (typeof (AudioContext) != 'undefined') {
            con = AudioContext;
        }
        else if (typeof (webkitAudioContext) != 'undefined') {
            con = webkitAudioContext;
        }
        return con;
    }
    createContextIfNecessary() {
        if (!this.context) {
            const con = this.getContextConstructor();
            this.context = new con();
        }
    }
    createBuffer(func, freq) {
        const buffer = this.context.createBuffer(1, this.context.sampleRate, this.context.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            const frac = i / (data.length - 1);
            data[i] = func.call(this, frac * freq);
        }
        return buffer;
    }
    stopVoice(v) {
        v.outputNode.disconnect();
    }
    getOrCreateChannelNodes(channel) {
        if (!this.compressor) {
            this.compressor = this.context.createDynamicsCompressor();
            this.compressor.connect(this.context.destination);
            //        void setPosition(in float x, in float y, in float z);
            //        void setOrientation(in float x, in float y, in float z, in float xUp, in float yUp, in float zUp);
            this.context.listener.setPosition(0, 0, 0);
            this.context.listener.setOrientation(0, 0, -1, 0, 1, 0);
        }
        let nodes = this.channelNodes[channel];
        if (!nodes) {
            nodes = new WebAudioChannelNodes();
            nodes.channelName = this.data.renderChannelNames[channel];
            this.channelNodes[channel] = nodes;
            nodes.panner = this.context.createPanner();
            nodes.panner.setPosition(0, 0, 1);
            nodes.panner.connect(this.compressor);
            nodes.filter = this.context.createBiquadFilter();
            nodes.filter.type = 0;
            nodes.filter.frequency.value = 10000;
            nodes.filter.Q.value = 0;
            nodes.filter.connect(nodes.panner);
            nodes.gain = this.context.createGain();
            nodes.gain.connect(nodes.filter);
            //        logit(" Creating nodes for channel " + channel);
        }
        return nodes;
    }
    scheduleControlWithChannelInfo(info, value, time) {
        try {
            if (info.nodes) {
                //        logit("Scheduling control for " + info.nodes.channelName);
                switch (info.controlType) {
                    case "Pan":
                        //                logit("Setting pan to " + value);
                        const maxAngle = Math.PI / 4;
                        const angleFrac = 2 * (value - 0.5);
                        const angle = angleFrac * maxAngle;
                        const distance = 1;
                        //                logit("Setting angle frac to " + angleFrac + " " + info.nodes.channelName + " " + this.data.controlChannelNames[channelIndex]);
                        info.nodes.panner.setPosition(distance * Math.sin(angle), 0, -distance * Math.cos(angle));
                        break;
                    case "FilterF":
                        //                info.nodes.filter.frequency.value =
                        const maxFreq = this.noteToFrequency(127);
                        const minFreq = this.noteToFrequency(0);
                        const frequency = minFreq + (maxFreq - minFreq) * value;
                        //                logit("Setting filter f to " + frequency + " at " + time + " " + maxFreq + " " + minFreq);
                        info.nodes.filter.frequency.exponentialRampToValueAtTime(frequency, time);
                        break;
                    case "FilterQ":
                        const newQ = 1.0 / (0.01 + 0.1 * value);
                        //                logit("Setting filter q to " + newQ + " at " + time);
                        info.nodes.filter.Q.exponentialRampToValueAtTime(newQ, time);
                        break;
                    default:
                        logit("Unknown control type " + info.controlType);
                        break;
                }
            }
        }
        catch (ex) {
            logit("Error when scheduling control");
        }
    }
    sineBufferFunc(f) {
        const a = 2.0 * Math.PI * f;
        return this.bufferAmpScale * Math.sin(a); //  + 0.25 * Math.sin(2 * a) + 0.15 * Math.sin(3 * a);
    }
    sawBufferFunc(f) {
        //    var a = 2.0 * Math.PI * f;
        f = mod(f, 1);
        return this.bufferAmpScale * (-1 + 2 * f);
    }
    squareBufferFunc(f) {
        //    var a = 2.0 * Math.PI * f;
        f = mod(f, 1);
        return this.bufferAmpScale * (f < 0.5 ? -1 : 1);
    }
    triangleBufferFunc(f) {
        //    var a = 2.0 * Math.PI * f;
        f = mod(f, 1);
        return this.bufferAmpScale * (f < 0.5 ? -1 + 4 * f : 3 - 4 * f);
    }
    snareBufferFunc(f) {
        return this.bufferAmpScale * (-1 + 2 * Math.random());
    }
    scheduleNoteOnOff(noteData) {
        const bufferInfoId = this.getBufferInfoId(noteData);
        const bufferInfo = this.bufferInfos[bufferInfoId];
        const isPercussion = bufferInfo.channelPrefix == "percussion";
        const onEvent = noteData.onEvent;
        const delay = 0.1;
        const onTime = noteData.onTime + this.contextOffset + delay;
        let offTime = noteData.offTime + this.contextOffset + delay;
        const origOffTime = offTime;
        // Add some reverb time
        offTime += 1;
        const voiceIndex = bufferInfo.voiceIndex;
        let instrType = null; // PrimitiveWebAudioPlayerInstrumentType.SQUARE;
        let instrumentArr = null;
        switch (bufferInfo.channelPrefix) {
            case "melody":
                instrumentArr = this.settings.melodyInstruments;
                break;
            case "inner1":
                instrumentArr = this.settings.inner1Instruments;
                break;
            case "inner2":
                instrumentArr = this.settings.inner2Instruments;
                break;
            case "bass":
                instrumentArr = this.settings.bassInstruments;
                break;
        }
        if (instrumentArr != null) {
            if (instrumentArr.length > 0) {
                const instrument = instrumentArr[voiceIndex % instrumentArr.length];
                if (instrument instanceof PrimitiveWebAudioPlayerInstrument) {
                    instrType = instrument.type;
                }
            }
            else {
                instrType = PrimitiveWebAudioPlayerInstrumentType.SQUARE;
            }
        }
        if (!isPercussion && typeof (instrType) === 'undefined') {
            //        logit("Got instr type " + instrType + " for prop name " + typePropName);
            instrType = PrimitiveWebAudioPlayerInstrumentType.MATCH;
        }
        if (instrType == null) {
            //        logit("Not scheduling " + bufferInfo.channelPrefix);
            return;
        }
        const nodes = this.getOrCreateChannelNodes(onEvent.c);
        const bufferSource = this.context.createBufferSource();
        let oscOutput = bufferSource;
        let buffer = null;
        if (isPercussion) {
            buffer = bufferInfo.buffer;
            if (!buffer) {
                logit("Could not find percussion buffer " + onEvent.n);
                buffer = this.percussionBuffers[onEvent.n];
                if (!buffer) {
                    let bufferFunc = this.snareBufferFunc;
                    buffer = this.createBuffer(bufferFunc, 1);
                    this.percussionBuffers[onEvent.n] = buffer;
                }
                let ampEnvNode = this.context.createGain();
                let ampEnvGainParam = ampEnvNode.gain;
                ampEnvGainParam.setValueAtTime(0, onTime);
                ampEnvGainParam.exponentialRampToValueAtTime(1, onTime + 0.01);
                ampEnvGainParam.exponentialRampToValueAtTime(0, onTime + 0.25);
                bufferSource.connect(ampEnvNode);
                bufferSource.playbackRate.value = 1;
                oscOutput = ampEnvNode;
            }
        }
        else {
            bufferSource.loop = true;
            const freq = this.noteToFrequency(onEvent.n);
            //            var freqScale = this.context.sampleRate / 500.0;
            const freqMult = 22;
            buffer = this.melodicBuffers[instrType];
            if (!buffer) {
                let bufferFunc = this.sineBufferFunc;
                switch (instrType) {
                    case PrimitiveWebAudioPlayerInstrumentType.SAW:
                        bufferFunc = this.sawBufferFunc;
                        break;
                    case PrimitiveWebAudioPlayerInstrumentType.SINE:
                        bufferFunc = this.sineBufferFunc;
                        break;
                    case PrimitiveWebAudioPlayerInstrumentType.TRIANGLE:
                        bufferFunc = this.triangleBufferFunc;
                        break;
                    case PrimitiveWebAudioPlayerInstrumentType.SQUARE:
                        bufferFunc = this.squareBufferFunc;
                        break;
                }
                buffer = this.createBuffer(bufferFunc, freqMult);
                this.melodicBuffers[instrType] = buffer;
            }
            bufferSource.playbackRate.value = freq / freqMult;
            const noteLength = origOffTime - onTime;
            const attackTime = Math.min(0.05, noteLength * 0.5);
            const decayTime = Math.min(0.2, noteLength * 0.5);
            const sustainValue = 0.25;
            const releaseTime = 0.25;
            let ampEnvNode = this.context.createGain();
            let ampEnvGainParam = ampEnvNode.gain;
            ampEnvGainParam.setValueAtTime(0, onTime);
            ampEnvGainParam.linearRampToValueAtTime(1, onTime + attackTime);
            ampEnvGainParam.linearRampToValueAtTime(sustainValue, onTime + attackTime + decayTime);
            ampEnvGainParam.linearRampToValueAtTime(sustainValue, origOffTime);
            ampEnvGainParam.linearRampToValueAtTime(0, origOffTime + releaseTime);
            bufferSource.connect(ampEnvNode);
            oscOutput = ampEnvNode;
        }
        bufferSource.buffer = buffer;
        //    logit(" Scheduling note with time " + noteData.onTime + " at " + onTime + " offset: " + this.contextOffset);
        //    logit(" Active source count: " + this.context.activeSourceCount);
        let volMult = 1;
        if (bufferInfo.channelPrefix == "percussion") {
            volMult = this.settings.percussionVolumeMultiplier;
        }
        else {
            const arr = this.settings[bufferInfo.channelPrefix + "VolumeMultipliers"];
            if (arr && arr.length > 0) {
                volMult = arr[bufferInfo.voiceIndex % arr.length];
            }
        }
        const velNode = this.context.createGain();
        velNode.gain.value = onEvent.v * volMult;
        //    logit(onEvent.v);
        oscOutput.connect(velNode);
        velNode.connect(nodes.gain);
        bufferSource.start(onTime);
        bufferSource.stop(offTime);
        const voice = new WebAudioVoice();
        voice.outputNode = oscOutput;
        voice.offTime = offTime;
        this.playingVoices.push(voice);
    }

    title = "Web Audio";

}
