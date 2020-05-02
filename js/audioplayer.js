const AudioPlayerMode = {
    STOP: 0,
    PLAY: 1,
    PAUSE: 2
};


class AudioPlayer {
    constructor() {
        this.audioType = "audio/mpeg";
        this.loadSamplesAsyncOperationConstructor = LoadAudioBuffersAsyncOperation;
        this.controlChannelInfos = [];
        this.channelNodes = [];
        this.notesPerSample = 1;
        this.mode = AudioPlayerMode.STOP;
        this.channelMaps = null;
        this.data = null;
        this.origData = null;
        this.notes = null;
        this.origNotes = null;
        this.tempoEvents = null;
        this.origTempoEvents = null;
        this.controlEvents = null;
        this.origControlEvents = null;
        this.songPlayBeatTime = 0;
        this.currentTempo = 60;
        this.playSeconds = 0; // Where we are in song time
        this.contextOffset = 0; // How much after we are the context when play started
        this.soundFontType = SoundFontType.STANDARD_HEAVY;
        this.settings = new WebAudioPlayerSettings();
        //    this.bufferLengths = [
        //        [125, 250, 500, 1000, 1500, 2000],
        //        [125, 250, 500, 1000, 1500, 2000],
        //        [125, 250, 500, 1000, 1500, 2000],
        //        [125, 250, 500, 1000, 1500, 2000],
        //        [125, 250, 500, 1000, 1500, 2000],
        //        [125, 250, 500, 1000, 1500, 2000],
        //        [125, 250, 500, 1000, 1500, 2000]];
        this.percussionBufferLengths = [125];
        this.playingVoices = [];
        this.bufferInfos = {};
    }
    updateVoice(v) {
        if (v.offTime < this.getContextTime()) {
            this.stopVoice(v);
            return false;
        }
        else {
            return true;
        }
    }
    step() {
        const dSeconds = this.getContextTime() - this.contextOffset - this.playSeconds;
        switch (this.mode) {
            case AudioPlayerMode.PAUSE:
                this.contextOffset += dSeconds;
                break;
            case AudioPlayerMode.STOP:
                this.playSeconds = 0;
                this.contextOffset = this.getContextTime();
                break;
            case AudioPlayerMode.PLAY:
                // Calculate new beat
                const beatStep = this.getBeatStep(dSeconds);
                //            logit("  wap beatStep: " + beatStep + " ctx.time " + this.getContextTime());
                // Split
                //            logit(" player step bt: " + this.songPlayBeatTime + " sbt: " + scheduleToBeatTime + " s: " + this.playSeconds);
                // Update tempo events
                const lookaheadSeconds = 2.0;
                const tempoBeforeAfter = this.splitSortedEvents(this.tempoEvents, this.playSeconds + dSeconds);
                const newTempoEvents = tempoBeforeAfter[0];
                this.tempoEvents = tempoBeforeAfter[1];
                // Digest the tempo events by setting the tempo
                for (let i = 0; i < newTempoEvents.length; i++) {
                    this.currentTempo = newTempoEvents[i].b;
                }
                const controlBeforeAfter = this.splitSortedEvents(this.controlEvents, this.playSeconds + dSeconds);
                const newControlEvents = controlBeforeAfter[0];
                this.controlEvents = controlBeforeAfter[1];
                for (let i = 0; i < newControlEvents.length; i++) {
                    const cEvent = newControlEvents[i];
                    this.scheduleControl(cEvent);
                }
                // Schedule notes
                //            logit(" spliiting on " + (this.playSeconds + lookaheadSeconds));
                const notesBeforeAfter = this.splitSortedNotes(this.notes, this.playSeconds + lookaheadSeconds, 128);
                this.notes = notesBeforeAfter[1];
                const notesToSchedule = notesBeforeAfter[0];
                for (const ch in notesToSchedule) {
                    const arr = notesToSchedule[ch];
                    for (let i = 0; i < arr.length; i++) {
                        const noteData = arr[i];
                        if (noteData.onTime > this.playSeconds + lookaheadSeconds) {
                            logit("  stupid note should not play yet ");
                        }
                        this.scheduleNoteOnOff(arr[i]);
                    }
                }
                this.playSeconds += dSeconds;
                this.songPlayBeatTime += beatStep;
                break;
        }
        //    this.contextOffset = this.getContextTime();
        this.updateVoices();
    }
    stopAllPlayingVoices() {
        // All voices that are connected to the graph should be stopped and disconnected
        for (let i = 0; i < this.playingVoices.length; i++) {
            const v = this.playingVoices[i];
            this.stopVoice(v);
        }
        this.playingVoices = [];
    }
    updateVoices() {
        const newPlaying = [];
        for (let i = 0; i < this.playingVoices.length; i++) {
            const v = this.playingVoices[i];
            if (this.updateVoice(v)) {
                newPlaying.push(v);
            }
        }
        this.playingVoices = newPlaying;
    }
    noteToFrequency(note) {
        const n = note - 69; // A4;
        const p = Math.pow(2.0, n / 12.0);
        //    logit("Converting " + note + " to freq n: " + n + " p: " + p + " result: " + (440 * p));
        return 440.0 * p;
    }
    beatsToSeconds(beats, tempo) {
        tempo = tempo ? tempo : this.currentTempo;
        return 60.0 * (beats / tempo);
    }
    secondsToBeats(seconds, tempo) {
        tempo = tempo ? tempo : this.currentTempo;
        return seconds * tempo / 60.0;
    }
    getBeatStep(dSeconds) {
        return (this.currentTempo * dSeconds) / 60.0;
    }
    setRenderData(data) {
        this.data = copyValueDeep(data);
        this.origData = copyValueDeep(data);
        this.notes = copyValueDeep(gatherNotesFromEvents(this.data.events));
        this.origNotes = copyValueDeep(this.notes);
        this.tempoEvents = copyValueDeep(gatherEventsWithType(this.data.events, "t"));
        this.origTempoEvents = copyValueDeep(this.tempoEvents);
        this.controlEvents = copyValueDeep(gatherEventsWithType(this.data.events, "c"));
        this.origControlEvents = copyValueDeep(this.controlEvents);
        return this;
    }
    setChannelMaps(maps) {
        this.channelMaps = {};
        //    this.bufferInfos = {};
        for (let i = 0; i < maps.length; i++) {
            const map = maps[i];
            this.channelMaps[map.renderChannel] = map;
        }
    }
    splitSortedEvents(events, seconds) {
        const before = [];
        const after = [];
        let splitIndex = events.length;
        for (let i = 0; i < events.length; i++) {
            const e = events[i];
            if (e.seconds < seconds) {
                before.push(e);
            }
            else {
                splitIndex = i;
                break;
            }
        }
        for (let i = splitIndex; i < events.length; i++) {
            after.push(events[i]);
        }
        return [before, after];
    }
    splitSortedNotes(notes, seconds, maxCount) {
        const before = {};
        const after = {};
        maxCount = maxCount ? maxCount : 128;
        let count = 0;
        for (const ch in notes) {
            const arr = notes[ch];
            let beforeArr = null;
            let splitIndex = arr.length;
            for (let i = 0; i < arr.length; i++) {
                const noteData = arr[i];
                //            var onEvent = noteData.onEvent;
                const onTime = noteData.onTime;
                if (onTime < seconds && count < maxCount) {
                    // Should be in left
                    if (beforeArr == null) {
                        beforeArr = [];
                        before[ch] = beforeArr;
                    }
                    beforeArr.push(noteData);
                    count++;
                }
                else {
                    splitIndex = i;
                    break;
                }
            }
            if (splitIndex < arr.length) {
                const afterArr = [];
                after[ch] = afterArr;
                for (let i = splitIndex; i < arr.length; i++) {
                    afterArr.push(arr[i]);
                }
            }
        }
        return [before, after];
    }
    createContextIfNecessary() {
    }
    play() {
        this.createContextIfNecessary();
        switch (this.mode) {
            case AudioPlayerMode.PAUSE:
                // playSeconds should be correct. It is updated in step()
                break;
            case AudioPlayerMode.STOP:
                this.contextOffset = this.getContextTime();
                break;
        }
        this.mode = AudioPlayerMode.PLAY;
    }
    predictTime(tempoEvents, beat) {
        let result = 0;
        let currentTempo = 120;
        let prevBeat = 0;
        for (let i = 0; i < tempoEvents.length; i++) {
            const e = tempoEvents[i];
            if (e.t < beat) {
                let diff = e.t - prevBeat;
                let dt = this.beatsToSeconds(diff, currentTempo);
                result += dt;
                currentTempo = e.b;
                prevBeat = e.t;
            }
            else {
                break;
            }
        }
        if (beat > prevBeat) {
            let diff = beat - prevBeat;
            let dt = this.beatsToSeconds(diff, currentTempo);
            result += dt;
        }
        return result;
    }
    gotoBeat(beat) {
        this.stopAllPlayingVoices();
        const nextBeat = Math.max(0, beat);
        this.data = copyValueDeep(this.origData);
        this.notes = copyValueDeep(this.origNotes);
        this.tempoEvents = copyValueDeep(this.origTempoEvents);
        this.controlEvents = copyValueDeep(this.origControlEvents);
        const newTime = this.predictTime(this.tempoEvents, nextBeat);
        //    logit("Trying to set beat to " + nextBeat + " predicted time: " + newTime);
        this.tempoEvents = this.splitSortedEvents(this.tempoEvents, newTime)[1];
        this.controlEvents = this.splitSortedEvents(this.controlEvents, newTime)[1];
        this.notes = this.splitSortedNotes(this.notes, newTime)[1];
        const secondsDiff = newTime - this.playSeconds;
        this.songPlayBeatTime = nextBeat;
        this.playSeconds = newTime;
        this.contextOffset -= secondsDiff;
    }
    stop() {
        this.stopAllPlayingVoices();
        this.mode = AudioPlayerMode.STOP;
        this.data = copyValueDeep(this.origData);
        this.notes = copyValueDeep(this.origNotes);
        this.tempoEvents = copyValueDeep(this.origTempoEvents);
        this.controlEvents = copyValueDeep(this.origControlEvents);
        this.songPlayBeatTime = 0;
        this.playSeconds = 0;
        this.contextOffset = this.getContextTime();
    }
    pause() {
        this.stopAllPlayingVoices();
        this.mode = AudioPlayerMode.PAUSE;
    }
    getProgramIndex(map) {
        return map.program;
    }
    getBufferInfoId(noteData) {
        //    var lengths = this.bufferLengths[this.soundFontType];
        //    var noteLength = (noteData.offTime - noteData.onTime);
        //    var lengthMillis = 1000 * noteLength;
        //    var bestLength = lengths[0];
        //    // Find the best length
        //    for (let i=0; i<lengths.length; i++) {
        //        var length = lengths[i];
        //        if (length <= lengthMillis) {
        //            bestLength = length;
        //        }
        //    }
        let result = this.getSoundFontPrefix(this.soundFontType);
        const onEvent = noteData.onEvent;
        const channelName = this.data.renderChannelNames[onEvent.c];
        const map = this.channelMaps[channelName];
        const program = this.getProgramIndex(map);
        if (channelName.indexOf("percussion") == 0) {
            result += "_perc_";
        }
        else {
            result += "_" + program + "_";
        }
        result += "" + onEvent.n; // + "_" + bestLength;
        return result;
    }
    createBufferInfos() {
        for (const ch in this.notes) {
            const arr = this.notes[ch];
            for (let i = 0; i < arr.length; i++) {
                this.createBufferInfoForNoteData(arr[i]);
            }
        }
    }
    getSoundFontPrefix(type) {
        return SoundFontType.getSamplesPrefix(type);
    }
    createBufferInfoForNoteData(noteData) {
        const onEvent = noteData.onEvent;
        const offEvent = noteData.offEvent;
        const note = onEvent.n;
        const channelName = this.data.renderChannelNames[onEvent.c];
        const isPercussion = channelName.indexOf("percussion") == 0;
        const channelPrefix = channelName.substring(0, channelName.indexOf("Render"));
        const voiceIndex = parseInt(channelName.substring(channelName.length - 1, channelName.length)) - 1;
        let sampleNote = clamp(Math.ceil(note / this.notesPerSample) * this.notesPerSample, 0, 127);
        if (isPercussion) {
            sampleNote = note;
        }
        //    var noteFreq = this.noteToFrequency(note);
        //    var sampleNoteFreq = this.noteToFrequency(sampleNote);
        //    var playbackRate = noteFreq / sampleNoteFreq;
        //    logit("playback rate: " + playbackRate);
        const map = this.channelMaps[channelName];
        //    var lengths = this.bufferLengths[this.soundFontType];
        let lengths = [125];
        const program = this.getProgramIndex(map);
        let programDir = "program" + program;
        if (isPercussion) {
            lengths = this.percussionBufferLengths;
            programDir = "percussion";
        }
        const noteLength = (noteData.offTime - noteData.onTime);
        const lengthMillis = 1000 * noteLength;
        let bestLength = lengths[0];
        // Find the best length
        for (let i = 0; i < lengths.length; i++) {
            const length = lengths[i];
            if (length <= lengthMillis) {
                bestLength = length;
            }
        }
        //    logit("bestLength " + bestLength + " for length: " + lengthMillis + " " + (noteData.offEvent.t - noteData.onEvent.t));
        const id = this.getBufferInfoId(noteData);
        let bufferInfo = this.bufferInfos[id];
        if (!bufferInfo) {
            const prefix = this.getSoundFontPrefix(this.soundFontType);
            //        logit("creating buffer info " + channelName + " " + channelPrefix + " " + voiceIndex);
            bufferInfo = {
                id: id,
                channelName: channelName,
                channelPrefix: channelPrefix,
                voiceIndex: voiceIndex,
                isPercussion: isPercussion,
                url: isPercussion ? "samples/" + prefix + "/" + programDir + "/length" + bestLength + "/note_" + sampleNote + (canPlayMp3 ? ".mp3" : ".ogg") : "",
                buffer: null
                //            playbackRate: playbackRate
            };
            //        logit("Adding buffer info:" + JSON.stringify(bufferInfo));
            this.bufferInfos[id] = bufferInfo;
        }
    }
    getReadyForPlay(callback, cancelFunc) {
        this.createBufferInfos();
        const urls = [];
        const bufferInfoArr = [];
        for (const id in this.bufferInfos) {
            const bufferInfo = this.bufferInfos[id];
            if (!bufferInfo.buffer) {
                const url = bufferInfo.url;
                if (url) {
                    urls.push(url);
                    bufferInfoArr.push(bufferInfo);
                }
            }
        }
        this.createContextIfNecessary();
        //    callback();
        if (urls.length == 0) {
            callback();
        }
        else {
            if (canPlayMp3) {
                this.audioType = 'audio/mpeg';
            }
            else {
                this.audioType = 'audio/ogg';
            }
            const op = new this.loadSamplesAsyncOperationConstructor({
            bufferUrls: urls, audioContext: this.context, audioType: this.audioType,
                onDone: function () {
                    for (let i = 0; i < bufferInfoArr.length; i++) {
                        const bufferInfo = bufferInfoArr[i];
                        bufferInfo.buffer = op.resultBuffers[i];
                    }
                    callback();
                },
                onCancel: function () {
                    if (cancelFunc) {
                        cancelFunc();
                    }
                }
            });
            addAsyncOperation(op);
        }
    }
    scheduleControl(cEvent) {
        const delay = 0.1;
        const time = cEvent.seconds + this.contextOffset + delay;
        const channelIndex = cEvent.c;
        const value = cEvent.v;
        const info = this.getChannelInfoForControlChannel(channelIndex);
        this.scheduleControlWithChannelInfo(info, value, time);
    }
    getChannelInfoForControlChannel(cChannelIndex) {
        let info = this.controlChannelInfos[cChannelIndex];
        if (!info) {
            info = {};
            const cChannelName = this.data.controlChannelNames[cChannelIndex];
            let index = -1;
            const str = "ControlChannel";
            const wanted = cChannelName.substring(0, cChannelName.indexOf(str)) + "RenderChannel" + cChannelName.charAt(cChannelName.length - 1);
            const controlType = cChannelName.substring(cChannelName.indexOf(str) + str.length, cChannelName.length - 1);
            info.controlType = controlType;
            for (let i = 0; i < this.data.renderChannelNames.length; i++) {
                const rChannelName = this.data.renderChannelNames[i];
                if (rChannelName == wanted) {
                    index = i;
                    break;
                }
            }
            if (index != -1) {
                const nodes = this.getOrCreateChannelNodes(index);
                info.nodes = nodes;
            }
            this.controlChannelInfos[cChannelIndex] = info;
        }
        return info;
    }

    title = "Player";
}
