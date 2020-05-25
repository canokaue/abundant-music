/* 
 * RIFFWAVE.js v0.03 - Audio encoder for HTML5 <audio> elements.
 * Copyleft 2011 by Pedro Ladaria <pedro.ladaria at Gmail dot com>
 *
 * Public Domain
 *
 * Changelog:
 *
 * 0.01 - First release
 * 0.02 - New faster base64 encoding
 * 0.03 - Support for 16bit samples
 *
 * Notes:
 *
 * 8 bit data is unsigned: 0..255
 * 16 bit data is signed: −32,768..32,767
 *
 */

const FastBase64 = {

    chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    encLookup: [],

    Init: function() {
        for (let i=0; i<4096; i++) {
            this.encLookup[i] = this.chars[i >> 6] + this.chars[i & 0x3F];
        }
    },

    Encode: function(src) {
        let len = src.length;
        let dst = '';
        let i = 0;
        while (len > 2) {
            const n = (src[i] << 16) | (src[i+1]<<8) | src[i+2];
            dst+= this.encLookup[n >> 12] + this.encLookup[n & 0xFFF];
            len-= 3;
            i+= 3;
        }
        if (len > 0) {
            const n1= (src[i] & 0xFC) >> 2;
            let n2= (src[i] & 0x03) << 4;
            if (len > 1) n2 |= (src[++i] & 0xF0) >> 4;
            dst+= this.chars[n1];
            dst+= this.chars[n2];
            if (len == 2) {
                let n3= (src[i++] & 0x0F) << 2;
                n3 |= (src[i] & 0xC0) >> 6;
                dst+= this.chars[n3];
            }
            if (len == 1) dst+= '=';
            dst+= '=';
        }
        return dst;
    } // end Encode

};

FastBase64.Init();

class RIFFWAVE {
    constructor(data) {
        this.data = []; // Array containing audio samples
        this.wav = []; // Array containing the generated wave file
        this.dataURI = ''; // http://en.wikipedia.org/wiki/Data_URI_scheme
        this.header = {
            chunkId: [0x52, 0x49, 0x46, 0x46],
            chunkSize: 0,
            format: [0x57, 0x41, 0x56, 0x45],
            subChunk1Id: [0x66, 0x6d, 0x74, 0x20],
            subChunk1Size: 16,
            audioFormat: 1,
            numChannels: 2,
            sampleRate: 44100,
            byteRate: 0,
            blockAlign: 0,
            bitsPerSample: 16,
            subChunk2Id: [0x64, 0x61, 0x74, 0x61],
            subChunk2Size: 0 // 40   4    data size = NumSamples*NumChannels*BitsPerSample/8
        };

        this.toDataURI = function () {
            return 'data:audio/wav;base64,' + FastBase64.Encode(this.wav);
        };
        // dataView points to a buffer that contains an array of Int16
        this.create = function (dataView) {
            this.header.blockAlign = (this.header.numChannels * this.header.bitsPerSample) >> 3;
            this.header.byteRate = this.header.blockAlign * this.sampleRate;
            this.header.subChunk2Size = (dataView.byteLength / 2) * (this.header.bitsPerSample >> 3);
            this.header.chunkSize = 36 + this.header.subChunk2Size;
            const byteLength = 44 + dataView.byteLength;
            const resultBuffer = new ArrayBuffer(byteLength);
            const view = new DataView(resultBuffer);
            function setInt8Array(view, arr, offset) {
                for (let i = 0; i < arr.length; i++) {
                    view.setInt8(offset++, arr[i], true);
                }
                return offset;
            }
            function copyInt16Array(view, viewToCopy, offset) {
                const len = viewToCopy.byteLength / 2;
                for (let i = 0; i < len; i++) {
                    view.setInt16(offset, viewToCopy.getInt16(i * 2, true), true);
                    offset += 2;
                }
                return offset;
            }
            let offset = 0;
            offset = setInt8Array(view, this.header.chunkId, offset);
            view.setUint32(offset, this.header.chunkSize, true);
            offset += 4;
            offset = setInt8Array(view, this.header.format, offset);
            offset = setInt8Array(view, this.header.subChunk1Id, offset);
            view.setUint32(offset, this.header.subChunk1Size, true);
            offset += 4;
            view.setUint16(offset, this.header.audioFormat, true);
            offset += 2;
            view.setUint16(offset, this.header.numChannels, true);
            offset += 2;
            view.setUint32(offset, this.header.sampleRate, true);
            offset += 4;
            view.setUint32(offset, this.header.byteRate, true);
            offset += 4;
            view.setUint16(offset, this.header.blockAlign, true);
            offset += 2;
            view.setUint16(offset, this.header.bitsPerSample, true);
            offset += 2;
            offset = setInt8Array(view, this.header.subChunk2Id, offset);
            view.setUint32(offset, this.header.subChunk2Size, true);
            offset += 4;
            offset = copyInt16Array(view, dataView, offset);
            this.buffer = resultBuffer;
            return resultBuffer;
        };
    }
}


