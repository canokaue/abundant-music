

class MidiSynthInstrument {
    constructor(sampleFreq, bufferLen) {
        this.sampleFreq = sampleFreq;
        this.bufferLen = bufferLen;
    }
    writeVoice(arr, offset, len, synth, voice) {
    }
}

class DefaultMidiSynthInstrument extends MidiSynthInstrument{
    constructor(sampleFreq, bufferLen) {
        super(sampleFreq, bufferLen);
    }
    random(x) {
        return 2 * Math.random() - 1;
    }
    writeVoice(arr, offset, len, synth, voice) {
        let volEnvelope = voice.envelopes[0];
        let oscillator = voice.oscillators[0];
        if (!volEnvelope) {
            volEnvelope = new MidiSynthADSREnvelope(this.sampleFreq, this.bufferLen);
            voice.envelopes[0] = volEnvelope;
        }
        if (!oscillator) {
            if (voice.channel == 9) {
                const oscillatorType = 0;
                const oscFunc = this.random;
                const baseFreq = 100;
                let freqMult = 1;
                const attack = 0.001;
                const decay = 0.1;
                let sustain = 1;
                const release = 0.15;
                let ampScale = 1;
                switch (voice.note) {
                    case MidiDrum.BASS_DRUM_1:
                    case MidiDrum.BASS_DRUM_2:
                        freqMult = 2;
                        ampScale = 2;
                        break;
                    case MidiDrum.RIDE_BELL:
                    case MidiDrum.RIDE_CYMBAL_1:
                    case MidiDrum.RIDE_CYMBAL_2:
                        freqMult = 30;
                        sustain = 0.25;
                        ampScale = 0.3;
                        break;
                    case MidiDrum.CLOSED_HIHAT:
                    case MidiDrum.OPEN_HIHAT:
                    case MidiDrum.RIMSHOT:
                    case MidiDrum.PEDAL_HIHAT:
                        freqMult = 25;
                        sustain = 0.25;
                        ampScale = 0.5;
                        break;
                    case MidiDrum.CABASA:
                    case MidiDrum.CHINESE_CYMBAL:
                    case MidiDrum.CLAVES:
                    case MidiDrum.COWBELL:
                    case MidiDrum.CRASH_CYMBAL_1:
                    case MidiDrum.CRASH_CYMBAL_2:
                    case MidiDrum.HAND_CLAP:
                    case MidiDrum.HIGH_AGOGO:
                    case MidiDrum.HIGH_BONGO:
                    case MidiDrum.HIGH_TIMBALE:
                    case MidiDrum.HIGH_TOM_1:
                    case MidiDrum.HIGH_TOM_2:
                    case MidiDrum.HIGH_WOOD_BLOCK:
                    case MidiDrum.LONG_GUIRO:
                    case MidiDrum.LONG_WHISTLE:
                    case MidiDrum.LOW_AGOGO:
                    case MidiDrum.LOW_BONGO:
                    case MidiDrum.LOW_CONGA:
                    case MidiDrum.LOW_TIMBALE:
                    case MidiDrum.LOW_TOM_1:
                    case MidiDrum.LOW_TOM_2:
                    case MidiDrum.LOW_WOOD_BLOCK:
                    case MidiDrum.MARACAS:
                    case MidiDrum.MID_TOM_1:
                    case MidiDrum.MID_TOM_2:
                    case MidiDrum.MUTE_CUICA:
                    case MidiDrum.MUTE_HIGH_CONGA:
                    case MidiDrum.MUTE_TRIANGLE:
                    case MidiDrum.OPEN_CUICA:
                    case MidiDrum.OPEN_HIGH_CONGA:
                    case MidiDrum.OPEN_TRIANGLE:
                    case MidiDrum.SHORT_GUIRO:
                    case MidiDrum.SHORT_WHISTLE:
                    case MidiDrum.SNARE_DRUM_1:
                    case MidiDrum.SNARE_DRUM_2:
                    case MidiDrum.SPLASH_CYMBAL:
                    case MidiDrum.TAMBOURINE:
                    case MidiDrum.VIBRA_SLAP:
                        freqMult = 8;
                        sustain = 0.5;
                        break;
                }
                volEnvelope.setSpecification(attack, decay, sustain, release);
                volEnvelope.ampScale = ampScale;
                switch (oscillatorType) {
                    case 0:
                        oscillator = new MidiSynthSampleAndHoldOscillator(this.sampleFreq, this.bufferLen);
                        oscillator.setFrequency(baseFreq);
                        oscillator.func = oscFunc;
                        oscillator.funcSampleFreqMult = freqMult;
                        break;
                }
            }
            else {
                oscillator = new MidiSynthSineOscillator(this.sampleFreq, this.bufferLen);
                const noteFreq = midiNoteToFrequency(voice.note);
                oscillator.setFrequency(noteFreq);
            }
            voice.oscillators[0] = oscillator;
        }
        // Write the vol envelope
        const volBuf = createFilledArray(len, 0);
        switch (voice.mode) {
            case MidiSynthVoiceMode.ON:
            case MidiSynthVoiceMode.RELEASE:
                volEnvelope.writeEnvelope(volBuf, 0, len, synth);
                if (voice.mode == MidiSynthVoiceMode.RELEASE) {
                    if (!volEnvelope.released) {
                        volEnvelope.release();
                    }
                    if (volEnvelope.done) {
                        voice.mode = MidiSynthVoiceMode.OFF;
                    }
                }
                //            logit("Envelope wrote " + JSON.stringify(volBuf));
                break;
            case MidiSynthVoiceMode.OFF:
                return; // No need to write anything
        }
        const sourceBuf = createFilledArray(len, 0);
        oscillator.write(sourceBuf, 0, len, false);
        //    logit("Oscillator wrote " + JSON.stringify(sourceBuf));
        for (let i = 0; i < len; i++) {
            const val = volBuf[i] * sourceBuf[i];
            for (let j = 0; j < synth.channels; j++) {
                const buf = arr[j];
                buf[i + offset] += val;
            }
        }
    }
}
