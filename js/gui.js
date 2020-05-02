
function StrokeAndFillLooks(args) {
    this.fillStyle = args && args.fillStyle ? args.fillStyle : "#ffffff";
    this.fillAlpha = args && args.fillAlpha ? args.fillAlpha : 0.3;
    this.fill = getValueOrDefault(args, "fill", true);
    this.stroke = getValueOrDefault(args, "stroke", true);
    this.strokeLooks = getValueOrDefault(args, "strokeLooks", new StrokeLooks());
}

StrokeAndFillLooks.prototype.applyFillAndStroke = function(context) {
    if (this.fill) {
        context.globalAlpha = this.fillAlpha;
        context.fillStyle = this.fillStyle;
        context.fill();
    }
    if (this.stroke) {
        const size = this.strokeLooks.getSize();
        for (let i=0; i<size; i++) {
            this.strokeLooks.applyAndStroke(i, context);
        }
    }
};



function StrokeLooks(args) {
    this.strokeStyles = args && args.strokeStyles ? args.strokeStyles : ["#ffffff"];
    this.strokeAlphas = args && args.strokeAlphas ? args.strokeAlphas : [0.3, 0.9];
    this.lineWidths = args && args.lineWidths ? args.lineWidths : [5, 2];
    this.lineCaps = args && args.lineCaps ? args.lineCaps : ["round"];
    this.lineJoins = args && args.lineJoins ? args.lineJoins : ["round"];
}

StrokeLooks.prototype.getSize = function() {
    return Math.max(this.strokeStyles.length, this.strokeAlphas.length,
        this.lineWidths.length, this.lineCaps.length, this.lineJoins.length);
};

StrokeLooks.prototype.apply = function(i, context) {
    context.lineCap = this.lineCaps[i % this.lineCaps.length];
    context.lineJoin = this.lineJoins[i % this.lineJoins.length];
    context.globalAlpha = this.strokeAlphas[i % this.strokeAlphas.length];
    context.strokeStyle = this.strokeStyles[i % this.strokeStyles.length];
    context.lineWidth = this.lineWidths[i % this.lineWidths.length];
};

StrokeLooks.prototype.applyAndStroke = function(i, context) {
    this.apply(i, context);
    context.stroke();
};

StrokeLooks.prototype.applyAndStrokeAll = function(context) {
    const size = this.getSize();
    for (let i=0; i<size; i++) {
        this.applyAndStroke(i, context);
    }
};

function calculateAlignment(min, max, elementSize, alignment) {
    const w = max - min;
    const span = w - elementSize;
    const result = span * alignment + min;
    // logit("min: " + min + " max: " + max + " elementSize: " + elementSize + " align: " + alignment + " result: " + result + "\n");
    return result;
}



function LayoutManager(component, options) {
    this.component = component;
    this.options = options;
}

function VerticalLayoutManager(component, options) {
    LayoutManager.call(this, component, options);
}

VerticalLayoutManager.prototype = new LayoutManager();

VerticalLayoutManager.prototype.layout = function() {

    const options = this.options;
    const separation = getValueOrDefault(options, "separation", 5);
    const distribution = getValueOrDefault(options, "distribution", "none");
    const keepX = getValueOrDefault(options, "keepX", false);

    const component = this.component;
    const components = component.components;
    let step = separation;

    let currentY = 0;

    const rect = component.getContentRect();
    const contentWidth = rect[2];
    const contentHeight = rect[3];
    switch (distribution) {
        case "none":
            break;
        case "even":
            let sum = 0;
            for (let i=0; i<components.length; i++) {
                let c = components[i];
                sum += c.height;
            }
            const space = Math.max(0, contentHeight - sum);
            if (components.length > 1) {
                step = space / (components.length - 1);
            }
            break;
    }
    for (let i=0; i<components.length; i++) {
        let c = components[i];
        c.y = currentY;
        currentY += c.height + step;
        if (!keepX) {
            const newX = calculateAlignment(0, contentWidth, c.width, c.alignmentX);
            c.x = newX;
        }
    }
};

function HorizontalLayoutManager(component, options) {
    LayoutManager.call(this, component, options);
}

HorizontalLayoutManager.prototype = new LayoutManager();

HorizontalLayoutManager.prototype.layout = function() {

    const options = this.options;
    const separation = getValueOrDefault(options, "separation", 5);
    const distribution = getValueOrDefault(options, "distribution", "none");
    const keepY = getValueOrDefault(options, "keepY", false);

    let currentX = 0;

    const component = this.component;
    const components = component.components;
    let step = separation;

    const rect = component.getContentRect();
    const contentWidth = rect[2];
    const contentHeight = rect[3];
    let stepBefore = false;
    switch (distribution) {
        case "none":
            break;
        case "even":
        case "even2": // also adds space at start and end
            let sum = 0;
            for (let i=0; i<components.length; i++) {
                let c = components[i];
                sum += c.width;
            }
            const space = Math.max(0, contentWidth - sum);
            if (distribution == "even") {
                if (components.length > 1) {
                    step = space / (components.length - 1);
                }
            } else if (distribution == "even2") {
                step = space / (components.length + 1);
                stepBefore = true;
            }
            break;
    }
    for (let i=0; i<components.length; i++) {
        let c = components[i];
        if (stepBefore) {
            currentX += step;
        }
        c.x = currentX;
        if (!stepBefore) {
            currentX += c.width + step;
        } else {
            currentX += c.width;
        }
        if (!keepY) {
            const newY = calculateAlignment(0, contentHeight, c.height, c.alignmentY);
            c.y = newY;
        }
    }
};

function CardLayoutManager(component, options) {
    LayoutManager.call(this, component, options);
}


CardLayoutManager.prototype = new LayoutManager();


CardLayoutManager.prototype.layout = function() {

    const options = this.options;

    const rect = this.component.getContentRect();
    const contentWidth = rect[2];
    const contentHeight = rect[3];

    for (let i=0; i<this.component.components.length; i++) {
        const c = this.component.components[i];
        c.x = calculateAlignment(0, contentWidth, c.width, c.alignmentX);
        c.y = calculateAlignment(0, contentHeight, c.height, c.alignmentY);
    }
};



function GuiComponent(options) {
    this.x = getValueOrDefault(options, "x", 0);
    this.y = getValueOrDefault(options, "y", 0);
    this.width = getValueOrDefault(options, "width", 100);
    this.height = getValueOrDefault(options, "height", 100);
    this.components = [];
    this.alignmentX = 0.5; // For the layout stuff
    this.alignmentY = 0.5;
    this.leftBorder = 0;
    this.rightBorder = 0;
    this.topBorder = 0;
    this.bottomBorder = 0;
    this.layoutManager = null;
}

GuiComponent.prototype.getContentRect = function() {
    const result = [this.x + this.leftBorder, this.y + this.topBorder,
    this.width - this.leftBorder - this.rightBorder, this.height - this.topBorder - this.bottomBorder];
    return result;
};

GuiComponent.prototype.layout = function(layoutChildren) {
    if (this.layoutManager) {
        if (!this.layoutManager.component) {
            this.layoutManager.component = this;
        }
        this.layoutManager.layout();
    }
    if (layoutChildren) {
        for (let i=0; i<this.components.length; i++) {
            const c = this.components[i];
            c.layout(layoutChildren);
        }
    }
};



GuiComponent.prototype.paint = function(offsetX, offsetY, context) {
    if (!offsetX) {
        offsetX = 0;
    }
    if (!offsetY) {
        offsetY = 0;
    }

    //    context.fillStyle = "#ff0000";
    //    context.fillRect(this.x + offsetX, this.y + offsetY, this.width, this.height);
    for (let i=0; i<this.components.length; i++) {
        const c = this.components[i];
        const ox = this.x + offsetX;
        const oy = this.y + offsetY;
        c.paint(ox, oy, context);
    }
};

GuiComponent.prototype.step = function(offsetX, offsetY) {
    if (!offsetX) {
        offsetX = 0;
    }
    if (!offsetY) {
        offsetY = 0;
    }
    for (let i=0; i<this.components.length; i++) {
        const c = this.components[i];
        const ox = this.x + offsetX;
        const oy = this.y + offsetY;
        c.step(ox, oy);
    }
};


GuiComponent.prototype.addComponent = function(comp) {
    this.components.push(comp);
};


function TransparentPanel(x, y, width, height) {
    GuiComponent.call(this, x, y, width, height);
// Nothing here really, the GuiComponent has all the functionality
}

TransparentPanel.prototype = new GuiComponent();

TransparentPanel.prototype.shrinkWrap = function() {
    };


// Each component is
function CardPanel(x, y, width, height) {
    GuiComponent.call(this, x, y, width, height);
    this.currentCard = 0;
    this.layoutManager = new CardLayoutManager(this);
}

CardPanel.prototype = new GuiComponent();

CardPanel.prototype.setCardIndex = function(index) {
    if (index >= 0 && index < this.components.length) {
        this.currentCard = index;
    }
};

CardPanel.prototype.showNext = function() {
    if (this.components.length > 0) {
        this.currentCard = (this.currentCard + 1) % this.components.length;
    }
};

CardPanel.prototype.showPrevious = function() {
    if (this.components.length > 0) {
        this.currentCard--;
        if (this.currentCard < 0) {
            this.currentCard = this.components.length - 1;
        }
    }
};

CardPanel.prototype.paint = function(offsetX, offsetY, context) {
    if (!offsetX) {
        offsetX = 0;
    }
    if (!offsetY) {
        offsetY = 0;
    }
    //    logitRnd("painting card panel\n", 0.02);

    //    context.fillStyle = "#0000ff";
    //    context.fillRect(this.x + offsetX, this.y + offsetY, this.width, this.height);

    // Paint only the current card
    if (this.currentCard >= 0 && this.currentCard < this.components.length) {
        const c = this.components[this.currentCard];
        const ox = this.x + offsetX;
        const oy = this.y + offsetY;
        c.paint(ox, oy, context);
    }
};

CardPanel.prototype.step = function(offsetX, offsetY) {
    if (!offsetX) {
        offsetX = 0;
    }
    if (!offsetY) {
        offsetY = 0;
    }

    // Step only the current card
    if (this.currentCard >= 0 && this.currentCard < this.components.length) {
        const c = this.components[this.currentCard];
        const ox = this.x + offsetX;
        const oy = this.y + offsetY;
        c.step(ox, oy);
    }
};


function Button(options) {
    GuiComponent.call(this, options);
    this.text = "";
    this.maxTextScale = 1000;
    this.textAlignmentX = 0.5;
    this.textAlignmentY = 0.5;

    this.icon = null;
    this.iconSize = 10.0;
    this.iconAlignmentX = 0.5;
    this.iconAlignmentY = 0.5;

    this.iconLooks = new StrokeAndFillLooks({
        fill: false
    });

    this.overLooks = new StrokeAndFillLooks({
        fillAlpha: 0.7
    });
    this.toggledLooks = new StrokeAndFillLooks({
        fillAlpha: 0.8
    });
    this.pressedLooks = new StrokeAndFillLooks({
        fillAlpha: 0.9
    });

    this.isToggle = false;
    this.buttonGroup = null;

    this.toggled = false; // Only used for toggle buttons

    this.over = false;
    this.pressed = false;
    this.clicked = false;

    this.clickHandlers = [];
    this.enterHandlers = [];
    this.leaveHandlers = [];
}

Button.prototype = new GuiComponent();

Button.prototype.addClickHandler = function(clickHandler) {
    this.clickHandlers.push(clickHandler);
};

Button.prototype.addEnterHandler = function(enterHandler) {
    this.enterHandlers.push(enterHandler);
};

Button.prototype.addLeaveHandler = function(leaveHandler) {
    this.leaveHandlers.push(leaveHandler);
};

Button.prototype.setToggled = function() {
    this.toggled = true;
    for (let i = 0; i<this.buttonGroup.length; i++) {
        const b = this.buttonGroup[i];
        if (b != this) {
            b.toggled = false;
        }
    }
};

Button.prototype.step = function(offsetX, offsetY) {
    const rect = rectScaleCopy(this.panel.rect, this.size, this.size);
    rectTranslate(rect, offsetX + this.x, offsetY + this.y);

    this.clicked = this.pressed && !Input.mouseDown;
    if (this.clicked) {
        Sound.play(Sound.BUTTON_UP_ID);
        if (this.isToggle) {
            if (this.buttonGroup == null) {
                // Just toggle
                this.toggled = !this.toggled;
            } else {
                // Make sure that all other buttons are not toggled
                this.setToggled();
            }
        }
        for (let i=0; i<this.clickHandlers.length; i++) {
            let h = this.clickHandlers[i];
            h(this);
        }
    }

    const pressedBefore = this.pressed;
    this.pressed = this.over && Input.mouseDown;
    if (!pressedBefore && this.pressed) {
        Sound.play(Sound.BUTTON_DOWN_ID);
    }

    const overBefore = this.over;
    this.over = rectContains(rect, [Input.mouseX, Input.mouseY]);
    if (!overBefore && this.over) {
        Sound.play(Sound.MOUSE_OVER_ID);
        for (let i=0; i<this.enterHandlers.length; i++) {
            let h = this.enterHandlers[i];
            h(this);
        }
    }
    if (overBefore && !this.over) {
        for (let i=0; i<this.leaveHandlers.length; i++) {
            let h = this.leaveHandlers[i];
            h(this);
        }
    }

//    if (this.clicked) {
//        logit("clicked button\n");
//    }

};


Button.prototype.paint = function(offsetX, offsetY, context) {
    if (!offsetX) {
        offsetX = 0;
    }
    if (!offsetY) {
        offsetY = 0;
    }

    //    context.fillStyle = "#ffff00";
    //    context.fillRect(this.x + offsetX, this.y + offsetY, this.width, this.height);

    // Remember the old looks
    const oldLooks = this.looks;

    if (this.over) {
        this.looks = this.overLooks;
    }
    if (this.pressed) {
        this.looks = this.pressedLooks;
    }

    if (this.toggled) {
        this.looks = this.toggledLooks;
    }

    const oldContext = context;
    const currentContext = context;
    const oldOffsetX = offsetX;
    const oldOffsetY = offsetY;
    
    PanelComponent.prototype.paint.call(this, offsetX, offsetY, currentContext);
    this.looks = oldLooks;

    const rect = rectScaleCopy(this.panel.contentRect, this.size, this.size);
    const contentWidth = rect[2];
    const contentHeight = rect[3];

    if (this.text != "") {
        let textScale = rect[3];
        textScale = Math.min(textScale, this.maxTextScale);

        const textWidth = LineFont.getWidth(this.font, this.text, textScale, 0);
        const textHeight = textScale;

        const textX = this.x + calculateAlignment(rect[0], contentWidth + rect[0], textWidth, this.textAlignmentX) + offsetX;
        const textY = this.y + calculateAlignment(rect[1], contentHeight + rect[1], textHeight, this.textAlignmentY) + offsetY + textHeight;

//        LineFont.pathString(this.font, this.text, textX, textY, textScale, 0, currentContext);
//
//        this.textLooks.applyAndStrokeAll(currentContext);
    }
};

