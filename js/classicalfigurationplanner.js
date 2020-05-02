
class FigurationPlanner {
    constructor() {
        this.id = "";
        this._constructorName = "FigurationPlanner";
    }
    getFigurator(options) {
        return new Figurator(options);
    }
}

class ClassicalFigurationPlanner extends FigurationPlanner{
    constructor() {
        super()
        this.maxMLSolutions = 10;
        this.maxSearchSteps = 1000;
        this._constructorName = "ClassicalFigurationPlanner";
    }
    getFigurator(options) {
        options.maxMLSolutions = this.maxMLSolutions;
        options.maxSearchSteps = this.maxSearchSteps;
        return new Figurator(options);
    }
}
