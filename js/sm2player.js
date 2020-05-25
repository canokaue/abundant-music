class AudioElementVoice {
    constructor() {
        this.audioElement = null;
        this.offTime = 0;
        this.isPlaying = false;
        this.timeout = null;
    }
}

class SoundManager2Player extends AudioPlayer{
    constructor() {
        super()
        this.notesPerSample = 1;
        this.contextStartTime = -1;
        this.loadSamplesAsyncOperationConstructor = LoadSM2SoundsAsyncOperation;
    }
    getSoundFontPrefix(type) {
        return SoundFontType.getSamplesPrefix(SoundFontType.STANDARD_HEAVY);
    }
    getProgramIndex(map) {
        return 0;
    }
    getContextTime() {
        const currentSeconds = Date.now() * 0.001;
        if (this.contextStartTime == -1) {
            this.contextStartTime = currentSeconds;
        }
        return currentSeconds - this.contextStartTime;
    }
    stopVoice(v) {
        if (v.timeout != null) {
            clearTimeout(v.timeout);
            v.timeout = null;
        }
        //    v.audioElement.pause();
        //    v.audioElement.currentTime = 0;
        //    v.isPlaying = false;
    }
    getOrCreateChannelNodes(channel) {
        let nodes = this.channelNodes[channel];
        if (!nodes) {
            nodes = {};
            nodes.channelName = this.data.renderChannelNames[channel];
            this.channelNodes[channel] = nodes;
        }
        return nodes;
    }
    scheduleControlWithChannelInfo(info, value) {
    }
    scheduleNoteOnOff(noteData) {
        const onEvent = noteData.onEvent;
        const delay = 0.1;
        const onTime = noteData.onTime + this.contextOffset + delay;
        let offTime = noteData.offTime + this.contextOffset + delay;
        // Add some reverb time
        offTime += 2;
        const bufferInfoId = this.getBufferInfoId(noteData);
        const bufferInfo = this.bufferInfos[bufferInfoId];
        const audioElement = bufferInfo.buffer;
        let volMult = 1;
        if (bufferInfo.channelPrefix == "percussion") {
            volMult = this.settings.percussionVolumeMultiplier;
        }
        else {
            const arr = this.settings[bufferInfo.channelPrefix + "VolumeMultipliers"];
            if (arr.length > 0) {
                volMult = arr[bufferInfo.voiceIndex % arr.length];
            }
        }
        const voice = new AudioElementVoice();
        voice.audioElement = audioElement;
        voice.offTime = offTime;
        voice.isPlaying = true;
        this.playingVoices.push(voice);
        const delaySeconds = Math.max(0, onTime - this.getContextTime());
        //    logit("delay " + delaySeconds);
        voice.timeout = setTimeout(() => {
            //        audioElement.stop();
            //        audioElement.currentTime = 0;
            audioElement.play({ volume: Math.round(clamp(volMult * 100, 0, 100)) });
        }, Math.round(delaySeconds * 1000));
    }

    
}
SoundManager2Player.prototype.title = "Sound Manager 2 (Web Audio not detected)";