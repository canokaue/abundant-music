
class MidiSynthEnvelope {
    constructor(sampleFreq, bufferLen) {
        this.sampleFreq = sampleFreq;
        this.bufferLen = bufferLen;
        this.released = false;
    }
    writeEnvelope(arr, offset, len, synth) {
    }
    release() {
        this.released = true;
    }
}

class MidiSynthADSREnvelope extends MidiSynthEnvelope{
    constructor(sampleFreq, bufferLen) {
        super(sampleFreq, bufferLen);
        this.attackTime = 0.1;
        this.decayTime = 0.2;
        this.sustainLevel = 0.25;
        this.releaseTime = 0.15;
        this.attackBufLen = 100;
        this.decayBufLen = 100;
        this.releaseBufLen = 100;
        this.released = false;
        this.releaseValue = 1;
        this.bufferIndex = 0;
        this.lastValue = 0;
        this.done = false;
        this.ampScale = 1;
        this.updateBufferLengths();
    }
    updateBufferLengths() {
        this.attackBufLen = this.attackTime * this.sampleFreq;
        this.decayBufLen = this.decayTime * this.sampleFreq;
        this.releaseBufLen = this.releaseTime * this.sampleFreq;
    }
    setSpecification(attackTime, decayTime, sustainLevel, releaseTime) {
        this.attackTime = attackTime;
        this.decayTime = decayTime;
        this.sustainLevel = sustainLevel;
        this.releaseTime = releaseTime;
        this.updateBufferLengths();
    }
    release() {
        MidiSynthEnvelope.prototype.release.call(this);
        this.releaseBufferIndex = this.bufferIndex;
        this.releaseValue = this.lastValue;
    }
    writeEnvelope(arr, offset, len, synth) {
        if (this.done) {
            return;
        }
        let bufferIndex = this.bufferIndex;
        const attackBufLen = this.attackBufLen;
        const decayBufLen = this.decayBufLen;
        const releaseBufLen = this.releaseBufLen;
        const sustainLevel = this.sustainLevel;
        const ampScale = this.ampScale;
        let value = 0;
        if (this.releaseBufferIndex > 0) {
            const releaseBufferIndex = this.releaseBufferIndex;
            const releaseValue = this.releaseValue;
            for (let i = 0; i < len; i++) {
                const diffT = bufferIndex - releaseBufferIndex;
                const k = -releaseValue / releaseBufLen;
                value = k * diffT + releaseValue;
                if (value < 0) {
                    value = 0;
                    this.done = true;
                }
                arr[offset + i] += value * ampScale;
                bufferIndex++;
            }
        }
        else {
            for (let i = 0; i < len; i++) {
                value = 0;
                if (bufferIndex < attackBufLen) {
                    value = bufferIndex / attackBufLen;
                }
                else if (bufferIndex < attackBufLen + decayBufLen) {
                    const k = -(1 - sustainLevel) / decayBufLen;
                    value = 1 + k * (bufferIndex - attackBufLen);
                }
                else {
                    value = sustainLevel;
                }
                arr[offset + i] += value * ampScale;
                bufferIndex++;
            }
            //        logit("wrote attack phase. Attack buf len: " + attackBufLen + " len: " + len + " bufferIndex: " + bufferIndex + " " + JSON.stringify(arr));
        }
        this.bufferIndex = bufferIndex;
        this.lastValue = value;
    }
}

