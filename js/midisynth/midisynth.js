


class MidiSynth {
    constructor(options) {
        this.sampleFreq = getValueOrDefault(options, "sampleFreq", 44100);
        this.channels = getValueOrDefault(options, "channels", 2);
        this.voices = [];
        this.instruments = [];
    }
    synthesizeBatch(midiData, progressFunc) {
        const events = midiData.midiTracks[0].trackEvents;
        const midiDivisions = midiData.midiDivisions;
        const controlFreq = 200; // Hz
        const bufferLen = Math.max(1, Math.round(this.sampleFreq / controlFreq));
        //    logit("Control freq of " + controlFreq + " gives a buffer size " + bufferLen);
        const channelBuffers = [];
        const dirtyChannelBuffers = [];
        const midiChannelCount = 32;
        for (let i = 0; i < midiChannelCount; i++) {
            channelBuffers[i] = [];
            dirtyChannelBuffers[i] = false;
        }
        // Check if there is a set tempo event at time 0
        // Also get the max tick to calculate buffer length
        let currentMicrosPerQuarter = 500000; // Default is 120 bpm
        let tempMicrosPerQuarter = currentMicrosPerQuarter; // Use a temp for calculating song length
        let tempTick = 0;
        let tempSeconds = 0;

        for (const e of events) {
            const eventMessage = e.eventMessage;
            if (eventMessage.messageClass == "SetTempoMessage") {
                if (tempTick == 0) {
                    // The initial tempo
                    currentMicrosPerQuarter = eventMessage.microsPerQuarter;
                }
                tempMicrosPerQuarter = eventMessage.microsPerQuarter;
                //            logit("Tempo at " + tempSeconds + " set to " + (1000000 * 60) / tempMicrosPerQuarter);
            }
            const micros = tempMicrosPerQuarter * (e.eventTime / midiDivisions);
            const seconds = micros / 1000000;
            tempSeconds += seconds;
            tempTick += e.eventTime;
        }

        const maxTick = tempTick;
        // We now know the length of the song
        const endSeconds = 1;
        const totalBufferLen = Math.round(this.sampleFreq * (tempSeconds + endSeconds));
        //    logit("Total buffer length: " + totalBufferLen);
        const mixerBuffer = [];
        const result = [];
        for (let i = 0; i < this.channels; i++) {
            result[i] = [];
            mixerBuffer[i] = createFilledArray(bufferLen, 0);
        }
        let bufferLenLeft = totalBufferLen;
        //    logit("Max tick " + maxTick);
        //    logit("Song length " + tempSeconds + " seconds");
        //    logit("Init tempo is " + currentMicrosPerQuarter);
        //    logit("Bpm: " + (1000000 * 60) / currentMicrosPerQuarter);
        const bufferLenSeconds = bufferLen / this.sampleFreq;
        let currentBufferTimeSeconds = 0;
        let currentMidiTick = 0;
        let currentMidiTickSeconds = 0;
        let midiDataIndex = 0;
        const secondsPerMicros = 1 / 1000000;
        let bufferIndex = 0;
        const progPeriod = 22050;
        let progPhase = 0;
        while (bufferLenLeft > 0) {
            const nextBufferTimeSeconds = currentBufferTimeSeconds + bufferLenSeconds;
            const secondsPerMidiTick = secondsPerMicros * (currentMicrosPerQuarter / midiDivisions);
            let nextMicrosPerQuarter = currentMicrosPerQuarter;
            // Take care of midi messages
            for (let i = midiDataIndex; i < events.length; i++) {
                const e = events[i];
                const eventTime = e.eventTime;
                const stepSeconds = secondsPerMidiTick * eventTime;
                if (stepSeconds + currentMidiTickSeconds < nextBufferTimeSeconds) {
                    // This midi event should be taken care of
                    currentMidiTick += eventTime;
                    currentMidiTickSeconds += stepSeconds;
                    midiDataIndex = i + 1;
                    const eventMessage = e.eventMessage;
                    // Handle midi message here
                    switch (eventMessage.messageClass) {
                        case "ChannelMessage":
                            let statusStr = eventMessage.status;
                            //                        status = MessageStatus.CONTROL_CHANGE;
                            switch (statusStr) {
                                case "CONTROL_CHANGE":
                                    //                                status = MessageStatus.CONTROL_CHANGE;
                                    break;
                            }
                            //                        message = new ChannelMessage(status, eventMessage.channel, eventMessage.data1, eventMessage.data2);
                            break;
                        case "VoiceMessage":
                            //                        logit("Taking care of midi event " + JSON.stringify(e));
                            statusStr = eventMessage.status;
                            //                        status = MessageStatus.NOTE_OFF;
                            switch (statusStr) {
                                case "NOTE_ON":
                                    // Create a new voice
                                    const newVoice = new MidiSynthVoice(this.sampleFreq, bufferLen);
                                    newVoice.channel = eventMessage.channel;
                                    newVoice.note = eventMessage.data1;
                                    newVoice.velocity = eventMessage.data2;
                                    newVoice.startTime = currentMidiTickSeconds;
                                    this.voices.push(newVoice);
                                    //                                logit(newVoice);
                                    //                                logit("Adding note " + JSON.stringify(newVoice));
                                    break;
                                case "NOTE_OFF":
                                    // Find the oldest voice with the note
                                    let oldestVoice = null;
                                    let minTime = currentMidiTickSeconds + 100;

                                    //                                logit("Should remove note " + eventMessage.data1 + " on channel " + eventMessage.channel + " minTime " + minTime);
                                    for (const v of this.voices) {
                                        if (v.mode == MidiSynthVoiceMode.ON &&
                                            v.channel == eventMessage.channel &&
                                            v.note == eventMessage.data1) {
                                            if (v.startTime < minTime) {
                                                minTime = v.startTime;
                                                oldestVoice = v;
                                            }
                                        }
                                    }

                                    if (oldestVoice) {
                                        oldestVoice.noteOff();
                                    }
                                    else {
                                        logit("Could not find an active voice");
                                    }
                                    break;
                            }
                            //                        message = new VoiceMessage(status, eventMessage.channel, eventMessage.data1, eventMessage.data2);
                            break;
                        case "EndTrackMessage":
                            //                        message = EndTrackMessage.prototype.END_OF_TRACK;
                            break;
                        case "ProgramChangeMessage":
                            //                        message = new ProgramChangeMessage(eventMessage.channel, eventMessage.program);
                            break;
                        case "SetTempoMessage":
                            nextMicrosPerQuarter = eventMessage.microsPerQuarter;
                            break;
                        default:
                            logit("Unknown message ");
                            logit(eventMessage);
                            break;
                    }
                }
                else {
                    // We wait
                    break;
                }
            }
            //        logit("Voice count " + this.voices.length);
            const newVoices = [];

            // Gather everything from the voices
            for (const voice of this.voices) {
                const voiceBufArr = channelBuffers[voice.channel];
                if (!dirtyChannelBuffers[voice.channel]) {
                    // Writing for the first time this bufLength step
                    for (let j = 0; j < this.channels; j++) {
                        voiceBufArr[j] = createFilledArray(bufferLen, 0);
                    }
                }
                dirtyChannelBuffers[voice.channel] = true;
                voice.writeVoice(voiceBufArr, 0, bufferLen, this);
                if (voice.mode != MidiSynthVoiceMode.OFF) {
                    newVoices.push(voice);
                }
                else {
                    //                logit("Removing voice ");
                }
            }

            this.voices = newVoices;
            // Apply channel filters
            // Mixer
            for (let i = 0; i < this.channels; i++) {
                fillArray(mixerBuffer[i], bufferLen, 0);
            }
            for (let i = 0; i < channelBuffers.length; i++) {
                if (dirtyChannelBuffers[i]) {
                    const cBuf = channelBuffers[i];
                    for (let j = 0; j < this.channels; j++) {
                        const buf = cBuf[j];
                        for (let k = 0; k < buf.length; k++) {
                            mixerBuffer[j][k] += buf[k];
                        }
                    }
                    dirtyChannelBuffers[i] = false;
                }
            }
            // Apply final filters
            // Write to result buffer
            const toWriteLen = Math.min(bufferLen, bufferLenLeft);
            for (let i = 0; i < this.channels; i++) {
                const buf = mixerBuffer[i];
                const resultBuf = result[i];
                for (let j = 0; j < toWriteLen; j++) {
                    resultBuf[j + bufferIndex] = buf[j];
                }
            }
            currentMicrosPerQuarter = nextMicrosPerQuarter; // Update tempo
            currentBufferTimeSeconds += bufferLenSeconds;
            bufferLenLeft -= bufferLen;
            bufferIndex += bufferLen;
            // Send progress
            if (progressFunc) {
                progPhase += bufferLen;
                if (progPhase > progPeriod) {
                    progPhase = 0;
                    progressFunc(Math.min(1, bufferIndex / totalBufferLen));
                }
            }
        }
        if (this.voices.length > 0) {
            logit("Voice count after finish: " + this.voices.length);
            for (let i = 0; i < this.voices.length; i++) {
                const v = this.voices[i];
                logit(" voice " + i + ": " + v.mode);
            }
        }
        // Normalize result
        // Find the max value
        let absMax = 0;
        let maxIndex = 0;
        for (let j = 0; j < this.channels; j++) {
            const buf = result[j];
            buf.length = totalBufferLen;
            for (let k = 0; k < buf.length; k++) {
                const test = Math.abs(buf[k]);
                if (test > absMax) {
                    absMax = test;
                    maxIndex = k;
                }
            }
        }
        // Multiply to normalize
        const newMax = 0.95;
        const multiplier = newMax * (absMax > 0.001 ? 1 / absMax : 1);
        if (multiplier != newMax) {
            for (let j = 0; j < this.channels; j++) {
                const buf = result[j];
                for (let k = 0; k < buf.length; k++) {
                    buf[k] *= multiplier;
                }
            }
        }
        logit("Normalize multiplier: " + multiplier + " max: " + absMax + " at " + maxIndex);
        logit("Final buffer lengths " + result[0].length);
        return result;
    }
}
