

class MidiSynthFilter {
    constructor(sampleFreq, bufferLen) {
        this.sampleFreq = sampleFreq;
        this.bufferLen = bufferLen;
    }
    write(arr, offset, len, synth) {
    }
}


class SerialMidiSynthFilter extends MidiSynthFilter{
    constructor(sampleFreq, bufferLen) {
        super(sampleFreq, bufferLen);
    }
}

