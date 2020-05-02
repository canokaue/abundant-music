class FakeByteArray {
    constructor() {
        this.position = 0;
        this.length = 0;
        this.data = [];
        this.lengths = [];
    }
    toBuffer() {
        const result = new ArrayBuffer(this.length);
        const dv = new DataView(result);
        let bytePos = 0;
        for (let i = 0; i < this.data.length; i++) {
            const d = this.data[i];
            const dataLength = this.lengths[i];
            //        logit("bytepos " + bytePos + " dataLength: " + dataLength + " length: " + this.length);
            switch (dataLength) {
                case 1:
                    dv.setUint8(bytePos, d);
                    break;
                case 2:
                    dv.setUint16(bytePos, d);
                    break;
                case 4:
                    dv.setUint32(bytePos, d);
                    break;
            }
            bytePos += dataLength;
        }
        return result;
    }
    appendByteArray(arr) {
        for (let i = 0; i < arr.data.length; i++) {
            const d = arr.data[i];
            const dataLength = arr.lengths[i];
            switch (dataLength) {
                case 1:
                    //                logit("Appending byte " + d);
                    this.writeByte(d);
                    break;
                case 2:
                    //                logit("Appending short " + d);
                    this.writeShort(d);
                    break;
                case 4:
                    //                logit("Appending int " + d);
                    this.writeInt(d);
                    break;
            }
        }
    }
    writeByte(byt) {
        if (typeof (byt) === 'undefined') {
            logit("bad byte...");
        }
        this.length += 1;
        this.data[this.position] = byt;
        this.lengths[this.position] = 1;
        this.position += 1;
    }
    writeInt(i) {
        if (typeof (i) === 'undefined') {
            logit("bad int...");
        }
        this.length += 4;
        this.data[this.position] = i;
        this.lengths[this.position] = 4;
        this.position += 1;
    }
    writeShort(s) {
        if (typeof (s) === 'undefined') {
            logit("bad short...");
        }
        this.length += 2;
        this.data[this.position] = s;
        this.lengths[this.position] = 2;
        this.position += 1;
    }
}


