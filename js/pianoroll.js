
class PianoRoll extends GuiComponent{
    constructor(options) {
        super(options);
        this.autoWidth = getValueOrDefault(options, "autoSize", true);
        this.autoHeight = getValueOrDefault(options, "autoSize", true);
        this.showKeys = getValueOrDefault(options, "showKeys", true);
        this.keysWidth = getValueOrDefault(options, "keysWidth", 60);
        this.noteRowHeight = getValueOrDefault(options, "noteRowHeight", 8);
        this.beatWidth = getValueOrDefault(options, "beatWidth", 50);
        this.harmony = getValueOrDefault(options, "harmony", new ConstantHarmonicRythm([new ConstantHarmonyElement()]));
        this.renderData = getValueOrDefault(options, "renderData", null);
        this.visibleChannels = getValueOrDefault(options, "visibleChannels", null); // Null means that all are visible
        this.controlSlotDatas = getValueOrDefault(options, "controlSlotDatas", null);
        this.visibleControlChannels = getValueOrDefault(options, "visibleControlChannels", null); // Null means that all are visible
        this.channelColors = getValueOrDefault(options, "channelColors", {});
        this.autoNoteLimits = getValueOrDefault(options, "autoNoteLimits", true);
        this.noteLimits = getValueOrDefault(options, "noteLimits", [20, 100]);
        this.noRenderDataLimits = getValueOrDefault(options, "noteLimits", [60, 75]);
        this.noteLimitBorder = getValueOrDefault(options, "noteLimitBorder", 1);
        this.harmonyInHeader = getValueOrDefault(options, "harmonyInHeader", true);
        this.highlightScales = getValueOrDefault(options, "highlightScales", false);
        this.highlightChords = getValueOrDefault(options, "highlightChords", false);
        this.updateNoteLimits();
        this.updateSize();
    }
    updateNoteLimits() {
        if (this.autoNoteLimits && this.renderData != null) {
            let minLimit = 127;
            let maxLimit = 0;
            const events = this.renderData.getEvents();
            for (let i = 0; i < events.length; i++) {
                const e = events[i];
                if (e instanceof NoteOffEvent || e instanceof NoteOnEvent) {
                    if (!this.visibleChannels || this.visibleChannels[e.renderChannel.id]) {
                        minLimit = Math.min(e.note, minLimit);
                        maxLimit = Math.max(e.note, maxLimit);
                    }
                }
            }
            minLimit = Math.max(0, minLimit - this.noteLimitBorder);
            maxLimit = Math.min(127, maxLimit + this.noteLimitBorder);
            this.noteLimits = [minLimit, maxLimit];
        }
        else if (this.renderData == null) {
            this.noteLimits = [this.noRenderDataLimits[0], this.noRenderDataLimits[1]];
        }
        else {
            // Just keep the current limits
        }
    }
    getHeaderHeight() {
        return 0;
    }
    getFooterHeight() {
        return 0;
    }
    getNoteRowsHeight() {
        return 0;
    }
    getNoteRowsWidth() {
        const ches = this.harmony.getConstantHarmonyElements();
        let harmonyWidth = 0;
        for (let i = 0; i < ches.length; i++) {
            const e = ches[i];
            const beats = positionUnitToBeats(e.getLength(), e.getLengthUnit(), e.tsNumerator, e.tsDenominator);
            harmonyWidth += beats * this.beatWidth;
        }
        let dataWidth = 0;
        if (this.renderData) {
            const limits = this.renderData.getTimeLimits();
            dataWidth = Math.ceil(limits[1] * this.beatWidth);
        }
        return Math.max(harmonyWidth, dataWidth);
    }
    updateSize() {
        this.updateNoteLimits();
        if (this.autoWidth) {
            let sum = 0;
            if (this.showKeys) {
                sum += this.keysWidth;
            }
            sum += this.getNoteRowsWidth();
            this.width = sum;
        }
        if (this.autoHeight) {
            let sum = 0;
            // Calculate header height
            // Calculate note rows height
            const rows = this.noteLimits[1] - this.noteLimits[0] + 1;
            sum += this.noteRowHeight * rows;
            // Calculate footer height
            this.height = sum;
        }
    }
    paintKeys(x, y, context) {
        const startNote = this.noteLimits[0];
        const endNote = this.noteLimits[1];
        const range = endNote - startNote + 1;
        const totalHeight = this.noteRowHeight * range;
        const whites = [true, false, true, false, true, true, false, true, false, true, false, true];
        const whiteIndices = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];
        //    logit("startNote " + startNote + " endNote " + endNote);
        const border = 2;
        // Paint all white keys first
        const whiteSize = this.noteRowHeight * (12.0 / 7.0);
        for (let i = startNote - 1; i <= endNote + 1; i++) {
            let pitchClass = i % 12;
            if (whites[pitchClass]) {
                let keyX = x;
                let index = i - startNote;
                const lastCIndex = Math.floor(i / 12) * 12;
                const whiteIndex = whiteIndices[pitchClass];
                let keyY = y + totalHeight - (whiteIndex + 0.35) * whiteSize - (lastCIndex - startNote + 1) * this.noteRowHeight;
                let keyHeight = whiteSize;
                context.fillStyle = "#ffffff";
                context.fillRect(keyX, keyY, this.keysWidth, keyHeight);
                context.fillStyle = "#aaaaaa";
                context.fillRect(keyX + border, keyY + border, this.keysWidth - border, keyHeight - border);
                context.fillStyle = "#eeeeee";
                context.fillRect(keyX + border, keyY + border, this.keysWidth - border * 2, keyHeight - border * 2);
            }
        }
        // Paint all black keys
        for (let i = startNote; i <= endNote; i++) {
            let pitchClass = i % 12;
            if (!whites[pitchClass]) {
                let keyX = x;
                let index = i - startNote;
                let keyY = y + totalHeight - (index + 1) * this.noteRowHeight;
                let keyHeight = this.noteRowHeight;
                const keyWidth = this.keysWidth * 0.6;
                context.fillStyle = "#222222";
                context.fillRect(keyX, keyY, keyWidth, keyHeight);
                context.fillStyle = "#000000";
                context.fillRect(keyX + border, keyY + border, keyWidth - border, keyHeight - border);
                context.fillStyle = "#111111";
                context.fillRect(keyX + border, keyY + border, keyWidth - border * 2, keyHeight - border * 2);
            }
        }
    }
    paintNotes(x, y, context) {
        if (this.renderData) {
            const border = 2;
            const startNote = this.noteLimits[0];
            const endNote = this.noteLimits[1];
            const range = endNote - startNote + 1;
            const totalHeight = this.noteRowHeight * range;
            this.renderData.sort();
            const events = this.renderData.getEvents();
            const notesOn = {};
            for (let i = 0; i < events.length; i++) {
                const e = events[i];
                if (e instanceof NoteOnEvent) {
                    let noteArr = notesOn[e.note];
                    if (!noteArr) {
                        noteArr = [];
                        notesOn[e.note] = noteArr;
                    }
                    noteArr.push(e.getTime());
                }
                else if (e instanceof NoteOffEvent) {
                    let noteArr = notesOn[e.note];
                    if (noteArr && noteArr.length > 0) {
                        const startBeat = noteArr.shift();
                        // Paint the note
                        const index = e.note - startNote;
                        const noteX = x + startBeat * this.beatWidth;
                        const noteY = y + totalHeight - (index + 1) * this.noteRowHeight;
                        const noteWidth = (e.getTime() - startBeat) * this.beatWidth;
                        context.fillStyle = "#44ff44";
                        context.fillRect(noteX, noteY, noteWidth, this.noteRowHeight);
                        context.fillStyle = "#00aa00";
                        context.fillRect(noteX + border, noteY + border, noteWidth - border, this.noteRowHeight - border);
                        context.fillStyle = "#11ff11";
                        context.fillRect(noteX + border, noteY + border, noteWidth - border * 2, this.noteRowHeight - border * 2);
                    }
                    else {
                        logit("Could not find a note on that matches note off for note " + e.note + "<br />");
                    }
                }
            }
        }
    }
    paintRows(x, y, context) {
        const startNote = this.noteLimits[0];
        const endNote = this.noteLimits[1];
        const range = endNote - startNote + 1;
        const w = this.getNoteRowsWidth();
        for (let i = 0; i < range; i++) {
            if (i % 2 == 0) {
                context.fillStyle = "#aaaaaa";
            }
            else {
                context.fillStyle = "#cccccc";
            }
            context.fillRect(x, y + i * this.noteRowHeight, w, this.noteRowHeight);
        }
        // Paint the beat lines
        let beats = w / this.beatWidth;
        let currentX = x;
        context.beginPath();
        for (let i = 0; i < beats; i++) {
            currentX = x + i * this.beatWidth;
            context.moveTo(currentX, y);
            context.lineTo(currentX, y + range * this.noteRowHeight);
        }
        context.lineWidth = 1;
        context.strokeStyle = "#888888";
        context.stroke();
        const ches = this.harmony.getConstantHarmonyElements();
        const totalHeight = this.noteRowHeight * range;
        if (this.highlightScales || this.highlightChords) {
            currentX = x;
            for (let i = 0; i < ches.length; i++) {
                let e = ches[i];
                let beats = positionUnitToBeats(e.getLength(), e.getLengthUnit(), e.tsNumerator, e.tsDenominator);
                const scalePitchClasses = e.getPitchClassesFromAbsoluteNotes(e.getScaleAbsoluteNotes());
                const chordPitchClasses = e.getPitchClassesFromAbsoluteNotes(e.getAbsoluteNotesFromScaleIndices(e.getChordRootPositionScaleIndices()));
                for (let j = 0; j < range; j++) {
                    const note = j + startNote;
                    const pitchClass = note % 12;
                    const highlightScale = arrayContains(scalePitchClasses, pitchClass);
                    const highlightChord = arrayContains(chordPitchClasses, pitchClass);
                    const noteY = y + totalHeight - (j + 1) * this.noteRowHeight;
                    if (highlightChord && this.highlightChords) {
                        context.fillStyle = "#ffff00";
                        context.fillRect(currentX, noteY, beats * this.beatWidth, this.noteRowHeight);
                    }
                    else if (highlightScale && this.highlightScales) {
                        context.fillStyle = "#ffffff";
                        context.fillRect(currentX, noteY, beats * this.beatWidth, this.noteRowHeight);
                    }
                }
                currentX += beats * this.beatWidth;
            }
        }
        // Paint the harmony lines
        currentX = x;
        context.beginPath();
        for (let i = 0; i < ches.length; i++) {
            let e = ches[i];
            let beats = positionUnitToBeats(e.getLength(), e.getLengthUnit(), e.tsNumerator, e.tsDenominator);
            currentX += beats * this.beatWidth;
            context.moveTo(currentX, y);
            context.lineTo(currentX, y + range * this.noteRowHeight);
        }
        context.lineWidth = 2;
        context.strokeStyle = "#666666";
        context.stroke();
    }
    paint(offsetX, offsetY, context) {
        if (!offsetX) {
            offsetX = 0;
        }
        if (!offsetY) {
            offsetY = 0;
        }
        // Paint one harmony at a time since the time signature can change
        context.fillStyle = "#444444";
        context.fillRect(offsetX, offsetY, this.width, this.height);
        const keysY = offsetY;
        if (this.showKeys) {
            this.paintKeys(offsetX, keysY, context);
        }
        let rowsX = offsetX;
        const rowsY = keysY;
        if (this.showKeys) {
            rowsX += this.keysWidth;
        }
        this.paintRows(rowsX, rowsY, context);
        this.paintNotes(rowsX, rowsY, context);
    }
}
