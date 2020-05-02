

function gatherEventsWithType(events, type) {
    const result = [];
    for (let i=0; i<events.length; i++) {
        const e = events[i];

//        console.log(e);
        if (e.y == type) {
            result.push(e);
        }
    }
    return result;
}

function beatsToSeconds(beats, tempo) {
    return 60.0 * (beats / tempo);
}


function secondsToBeats(seconds, tempo) {
    return seconds * tempo / 60.0;
}

function predictBeat(tempoEvents, time) {

    let currentTempo = 120;

    let currentSeconds = 0;

    let currentBeat = 0;

    for (let i=0; i<tempoEvents.length; i++) {
        const e = tempoEvents[i];

        const beatStep = e.t - currentBeat;

        const secondsStep = beatsToSeconds(beatStep, currentTempo);

        if (time >= currentSeconds && time <= currentSeconds + secondsStep) {
            const timeFrac = (time - currentSeconds) / secondsStep;
            currentBeat += timeFrac * beatStep;
            currentSeconds += secondsStep * 2; // So we don't check true later
            break;
        }

        currentSeconds += secondsStep;
        currentBeat += beatStep;

        currentTempo = e.b;
    }
    if (time > currentSeconds) {
        const diff = time - currentSeconds;
        const dt = secondsToBeats(diff, currentTempo);
        currentBeat += dt;
    }
    return currentBeat;
}

// Events must be sorted
function gatherNotesFromEvents(events) {
    const notes = {};
    const notesDone = {};

    let currentTempo = 120;

    let currentTime = 0; // Seconds

    let currentBeat = 0;
    for (let i=0; i<events.length; i++) {
        const e = events[i];

//        console.log(e);

        const beatStep = e.t - currentBeat;
        if (beatStep < 0) {
            logit("The events must be sorted " + beatStep);
        }
        const timeStep = beatsToSeconds(beatStep, currentTempo);
        currentTime += timeStep;
        switch (e.y) { // The compressed format
            case "c":
                e.seconds = currentTime;
                break;
            case "n": {
                let current = notes[e.c];
                if (!current) {
                    current = [];
                    notes[e.c] = current;
                }
                current.push({onEvent: e, onTime: currentTime});
//                logit(" event beat: " + e.t + " seconds: " + currentTime + " tempo: " + currentTempo);
                break;
            }
            case "f": {
                let current = notes[e.c];
                if (!current) {
                    logit("Found note off without noteOn");
                } else {
                    let minTimeData = null;
                    for (let j=0; j<current.length; j++) {
                        const c = current[j];
                        if (e.n == c.onEvent.n) {
                            if (!minTimeData || c.onEvent.t < minTimeData.onEvent.t) {
                                minTimeData = c;
                            }
                        }
                    }
                    if (!minTimeData) {
                        logit("Failed to find matching noteOn event");
                    } else {
                        minTimeData.offEvent = e;
                        minTimeData.offTime = currentTime;
                        let doneArr = notesDone[e.c];
                        if (!doneArr) {
                            doneArr = [];
                            notesDone[e.c] = doneArr;
                        }
                        doneArr.push(minTimeData);
                        arrayDelete(current, minTimeData);
//                    current.indexOf(minTimeData)
                    }
                }
                break;
            }
            case "t":
                e.seconds = currentTime;
                const bpm = e.b;
                currentTempo = bpm;
                break;
            default:
                logit("Unknown event type " + e.y);
                break;
        }
        currentBeat = e.t;
    }
    return notesDone;

}