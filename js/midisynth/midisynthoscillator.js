class MidiSynthOscillator extends MidiSynthSource{
    constructor(sampleFreq, bufferLen) {
        super(sampleFreq, bufferLen);
        this.freq = 440;
    }
    setFrequency(freq) {
        this.freq = freq;
    }
}

// func should have a frequency of 1
class MidiSynthCustomOscillator extends MidiSynthOscillator{
    constructor(sampleFreq, bufferLen, func) {
        super(sampleFreq, bufferLen);
        this.normalizedPhase = 0;
        this.phaseStep = 0;
        this.func = func;
        this.setFrequency(this.freq);
    }
    setFrequency(freq) {
        this.freq = freq;
        this.phaseStep = freq / this.sampleFreq;
    }
    write(arr, offset, len, restore) {
        for (let i = 0; i < len; i++) {
            arr[i + offset] += this.func(this.normalizedPhase);
            this.normalizedPhase += this.phaseStep;
            if (this.normalizedPhase > 1) {
                this.normalizedPhase = mod(this.normalizedPhase, 1);
            }
        }
    }
}

// func should have a frequency of 1
class MidiSynthSampleAndHoldOscillator extends MidiSynthOscillator{
    constructor(sampleFreq, bufferLen, func) {
        super(sampleFreq, bufferLen);
        this.normalizedPhase = 0;
        this.phaseStep = 0;
        this.func = func;
        this.funcSampleFreqMult = 1;
        this.value = null;
        this.setFrequency(this.freq);
    }
    setFrequency(freq) {
        this.freq = freq;
    }
    write(arr, offset, len, restore) {
        const funcSampleFreqMult = this.funcSampleFreqMult;
        this.phaseStep = this.freq / this.sampleFreq;
        if (this.value === null) {
            this.value = this.func(this.phase);
        }
        for (let i = 0; i < len; i++) {
            arr[i + offset] += this.value;
            this.normalizedPhase += this.phaseStep;
            this.phase += this.phaseStep;
            if (funcSampleFreqMult * this.normalizedPhase > 1) {
                this.normalizedPhase = mod(funcSampleFreqMult * this.normalizedPhase, 1);
                this.value = this.func(this.phase); // Take a new sample
            }
        }
    }
}

class MidiSynthSineOscillator extends MidiSynthOscillator{
    constructor(sampleFreq, bufferLen) {
        super(sampleFreq, bufferLen);
        this.sinVal = 0;
        this.cosVal = 1;
        this.dFreq = 0;
        this.setFrequency(this.freq);
    }
    setFrequency(freq) {
        this.freq = freq;
        this.delta = freq * (2 * Math.PI) / this.sampleFreq;
        const sinHalfDelta = Math.sin(this.delta * 0.5);
        this.alpha = 2 * sinHalfDelta * sinHalfDelta;
        this.beta = Math.sin(this.delta);
    }
    write(arr, offset, len, restore) {
        const oldSinVal = this.sinVal;
        const oldCosVal = this.cosVal;
        for (let i = 0; i < len; i++) {
            arr[i + offset] += this.sinVal;
            const cosVal = this.cosVal;
            const sinVal = this.sinVal;
            this.cosVal = cosVal - (this.alpha * cosVal + this.beta * sinVal);
            this.sinVal = sinVal - (this.alpha * sinVal - this.beta * cosVal);
        }
        if (restore) {
            this.sinVal = oldSinVal;
            this.cosVal = oldCosVal;
        }
    }
}
