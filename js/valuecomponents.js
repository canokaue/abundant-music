
function IdReferenceListSelectComponent(object, propertyInfo) {
    GuiPropertySelectListComponent.call(this, object, propertyInfo);
    const manager = this.getUniqueIdManager();
    if (manager) {
        manager.addUniqueIdListener(this.propertyInfo.uniqueIdInfo.namespace, this);
    } else {
        logit("Could not find unique id manager in IdReferenceListSelectComponent<br />");
    }
}

IdReferenceListSelectComponent.prototype = new GuiPropertySelectListComponent();


IdReferenceListSelectComponent.prototype.getItemValue = function(itemString) {
    return itemString;
};

IdReferenceListSelectComponent.prototype.componentRemoved = function() {
    GuiPropertySelectListComponent.prototype.componentRemoved.call(this);
    const manager = this.getUniqueIdManager();
    if (manager) {
        manager.removeUniqueIdListener(this.propertyInfo.uniqueIdInfo.namespace, this);
    }
};

IdReferenceListSelectComponent.prototype.uniqueIdAdded = function(owner, namespace, newId) {
    this.addOption(newId, newId);
};

IdReferenceListSelectComponent.prototype.uniqueIdChanged = function(owner, namespace, oldId, newId) {
    this.changeOption(oldId, newId, newId);
};

IdReferenceListSelectComponent.prototype.uniqueIdRemoved = function(owner, namespace, theId) {
    this.removeOption(theId, "");
};

IdReferenceListSelectComponent.prototype.getValuesAndNames = function() {
    const result = [["", "None"]];
    const manager = this.getUniqueIdManager();
    if (manager) {
        const ids = manager.getUniqueIds(this.getUniqueIdNamespace());
        for (let i=0; i<ids.length; i++) {
            result.push([ids[i], ids[i]]);
        }
    }
    return result;
};


function IntegerSelectComponent(object, propertyInfo) {
    GuiPropertySelectComponent.call(this, object, propertyInfo);
}

IntegerSelectComponent.prototype = new GuiPropertySelectComponent();

IntegerSelectComponent.prototype.setValueVerifyRaw = function() {
    const value = this.$input.val();
    const intValue = parseInt(value);
    const error = isNaN(intValue);
    this.setError(error, "Invalid integer");
    if (!error) {
        this.setValueVerify(intValue);
    }
};


function IntegerListSelectComponent(object, propertyInfo) {
    GuiPropertySelectListComponent.call(this, object, propertyInfo);
}

IntegerListSelectComponent.prototype = new GuiPropertySelectListComponent();


IntegerListSelectComponent.prototype.getItemValue = function(itemString) {
    const intValue = parseInt(itemString);
    return intValue;
};




function FloatSelectComponent(object, propertyInfo) {
    GuiPropertySelectComponent.call(this, object, propertyInfo);
}

FloatSelectComponent.prototype = new GuiPropertySelectComponent();

FloatSelectComponent.prototype.setValueVerifyRaw = function() {
    const value = this.$input.val();
    const floatValue = parseFloat(value);
    const error = isNaN(floatValue);
    this.setError(error, "Invalid decimal");
    if (!error) {
        this.setValueVerify(floatValue);
    }
};

function StringSelectComponent(object, propertyInfo) {
    GuiPropertySelectComponent.call(this, object, propertyInfo);
}

StringSelectComponent.prototype = new GuiPropertySelectComponent();

StringSelectComponent.prototype.setValueVerifyRaw = function() {
    const value = this.$input.val();
    this.setValueVerify(value);
};

function BooleanSelectComponent(object, propertyInfo) {
    GuiPropertySelectComponent.call(this, object, propertyInfo);
}

BooleanSelectComponent.prototype = new GuiPropertySelectComponent();

BooleanSelectComponent.prototype.setValueVerifyRaw = function() {
    const textValue = this.$input.val();
    const booleanValue = textValue == "true" ? true : false;
    //    logit(" in boolean select: textValue: " + textValue + " booleanValue: " + booleanValue + "<br />");
    this.setValueVerify(booleanValue);
};

BooleanSelectComponent.prototype.getValuesAndNames = function() {
    const result = [];
    const values = [true, false];
    for (let i=0; i<values.length; i++) {
        const value = values[i];
        let displayValue = value;
        if (this.propertyInfo.displayFunction) {
            displayValue = this.propertyInfo.displayFunction.call(this, this.object, this.propertyInfo.propertyName, value);
        }
        result.push([value, displayValue]);
    }
    return result;
};



function IntegerTextComponent(object, propertyInfo) {
    GuiPropertyTextComponent.call(this, object, propertyInfo);
}

IntegerTextComponent.prototype = new GuiPropertyTextComponent();

IntegerTextComponent.prototype.setValueVerifyRaw = function() {
    let error = false;
    const textValue = this.$input.val();

    const parseResult = {};
    this.parseInteger(textValue, parseResult);

    error = parseResult.error;

    if (!parseResult.error) {
        error = this.verifyNumberConstraints(parseResult.value);
        if (error) {
            // The setError() is called in verifyNumberConstraints()
            return;
        }
    }
    this.setError(error, "Invalid integer");

    if (!error) {
        this.setValueVerify(parseResult.value);
    }
};


function StringTextAreaComponent(object, propertyInfo) {
    GuiPropertyTextComponent.call(this, object, propertyInfo);
    this.inputTag = "textarea";
}

StringTextAreaComponent.prototype = new GuiPropertyTextComponent();

StringTextAreaComponent.prototype.setValueVerifyRaw = function() {
    const textValue = this.$input.val();
    this.setValueVerify(textValue);
};


function IntegerListTextComponent(object, propertyInfo) {
    GuiPropertyTextComponent.call(this, object, propertyInfo);
}

IntegerListTextComponent.prototype = new GuiPropertyTextComponent();

IntegerListTextComponent.prototype.valueToString = function(value) {
    return value.join(" ");
};


IntegerListTextComponent.prototype.setValueVerifyRaw = function() {
    let error = false;
    let errorMessage = "";

    let textValue = this.$input.val();

    textValue = $.trim(textValue);

    const textArray = textValue.split(" ");

    const intArr = [];
    for (let i=0; i<textArray.length; i++) {
        const text = $.trim(textArray[i]);
        if (text) {
            const parseResult = {};
            this.parseInteger(text, parseResult);
            if (!parseResult.error) {
                intArr.push(parseResult.value);
            }
            error = parseResult.error;
        }
        if (error) {
            errorMessage = "Invalid integer: '" + text + "'";
            break;
        }
    }
    this.setError(error, errorMessage);

    if (!error) {
        this.setValueVerify(intArr);
    }
};


function IntegerList2DTextComponent(object, propertyInfo) {
    GuiPropertyTextComponent.call(this, object, propertyInfo);
}

IntegerList2DTextComponent.prototype = new GuiPropertyTextComponent();

IntegerList2DTextComponent.prototype.valueToString = function(value) {
    let result = "";
    for (let i=0; i<value.length; i++) {
        const arr = value[i];
        result += arr.join(" ");
        if (i < value.length - 1) {
            result += ", ";
        }
    }
    return result;
};


IntegerList2DTextComponent.prototype.setValueVerifyRaw = function() {
    let error = false;
    let errorMessage = "";

    let textValue = this.$input.val();

    textValue = $.trim(textValue);

    const intArrs = [];

    const arrayTexts = textValue.split(",");

    for (let j=0; j<arrayTexts.length; j++) {
        const arrayText = arrayTexts[j];

        const textArray = arrayText.split(" ");

        const intArr = [];
        for (let i=0; i<textArray.length; i++) {
            const text = $.trim(textArray[i]);
            if (text) {
                const parseResult = {};
                this.parseInteger(text, parseResult);
                if (!parseResult.error) {
                    intArr.push(parseResult.value);
                }
                error = parseResult.error;
            }
            if (error) {
                errorMessage = "Invalid integer: '" + text + "'";
                break;
            }
        }
        if (error) {
            break;
        }
        if (intArr.length > 0) {
            intArrs.push(intArr);
        }
    }
    this.setError(error, errorMessage);

    if (!error) {
        this.setValueVerify(intArrs);
        //        logit("Setting value to " + JSON.stringify(intArrs) + "<br />");
    }
};




function FloatTextComponent(object, propertyInfo) {
    GuiPropertyTextComponent.call(this, object, propertyInfo);
}

FloatTextComponent.prototype = new GuiPropertyTextComponent();

FloatTextComponent.prototype.setValueVerifyRaw = function() {
    let error = false;
    const textValue = this.$input.val();
    if (!error) {
        let floatValue = parseFloat(textValue);
        error = isNaN(floatValue);
    }
    if (!error) {
        error = this.verifyNumberConstraints(floatValue);
        if (error) {
            // The setError() is called in verifyNumberConstraints()
            return;
        }
    }
    this.setError(error, "Invalid decimal");

    if (!error) {
        this.setValueVerify(floatValue);
    }
};


function FloatListTextComponent(object, propertyInfo) {
    GuiPropertyTextComponent.call(this, object, propertyInfo);
}

FloatListTextComponent.prototype = new GuiPropertyTextComponent();

FloatListTextComponent.prototype.valueToString = function(value) {
    return value.join(" ");
};


FloatListTextComponent.prototype.setValueVerifyRaw = function() {
    let error = false;
    let errorMessage = "";

    let textValue = this.$input.val();

    textValue = $.trim(textValue);

    const textArray = textValue.split(" ");

    const floatArr = [];
    for (let i=0; i<textArray.length; i++) {
        const text = $.trim(textArray[i]);
        if (text) {
            const floatValue = parseFloat(text);
            error = isNaN(floatValue);
            if (!error) {
                floatArr.push(floatValue);
            }
        }
        if (error) {
            errorMessage = "Invalid decimal: '" + text + "'";
            break;
        }
    }
    this.setError(error, errorMessage);

    if (!error) {
        this.setValueVerify(floatArr);
    }
};


function FloatList2DTextComponent(object, propertyInfo) {
    GuiPropertyTextComponent.call(this, object, propertyInfo);
}

FloatList2DTextComponent.prototype = new GuiPropertyTextComponent();

FloatList2DTextComponent.prototype.valueToString = function(value) {
    let result = "";
    for (let i=0; i<value.length; i++) {
        const arr = value[i];
        result += arr.join(" ");
        if (i < value.length - 1) {
            result += ", ";
        }
    }
    return result;
};


FloatList2DTextComponent.prototype.setValueVerifyRaw = function() {
    let error = false;
    let errorMessage = "";

    let textValue = this.$input.val();

    textValue = $.trim(textValue);

    const floatArrs = [];

    if (textValue != "") {

        const arrayTexts = textValue.split(",");

        for (let j=0; j<arrayTexts.length; j++) {
            const arrayText = arrayTexts[j];

            const textArray = arrayText.split(" ");

            const floatArr = [];
            for (let i=0; i<textArray.length; i++) {
                const text = $.trim(textArray[i]);
                if (text) {

                    const floatValue = parseFloat(text);
                    error = isNaN(floatValue);
                    if (!error) {
                        floatArr.push(floatValue);
                    }
                }
                if (error) {
                    errorMessage = "Invalid decimal: '" + text + "'";
                    break;
                }
            }
            if (error) {
                break;
            }
            floatArrs.push(floatArr);
        }
        this.setError(error, errorMessage);
    }
    if (!error) {
        this.setValueVerify(floatArrs);
        //        logit("Setting value to " + JSON.stringify(intArrs) + "<br />");
    }
};



function StringNotEmptyConstraint(options) {
    this.errorMessage = getValueOrDefault(options, "errorMessage", "Must not be empty");
}

StringNotEmptyConstraint.prototype.isValid = function(object, propName, value) {
    return value != "";
};

StringNotEmptyConstraint.prototype.getInvalidDescription = function(object, propName, value) {
    return this.errorMessage;
};

function StringLengthConstraint(options) {
    this.maxLength = getValueOrDefault(options, "maxLength", 9999999999999);
    this.minLength = getValueOrDefault(options, "minLength", 0);
}

StringLengthConstraint.prototype.isValid = function(object, propName, value) {
    return value.length <= this.maxLength && value.length >= this.minLength;
};

StringLengthConstraint.prototype.getInvalidDescription = function(object, propName, value) {
    if (value.length < this.minLength) {
        let charStr = this.minLength == 1 ? "character" : "characters";
        return "Must have at least " + this.minLength + " " + charStr;
    }
    if (value.length > this.maxLength) {
        let charStr = this.maxLength == 1 ? "character" : "characters";
        return "Must have at most " + this.maxLength + " " + charStr;
    }
    return "";
};

function StringTextComponent(object, propertyInfo) {
    GuiPropertyTextComponent.call(this, object, propertyInfo);
}

StringTextComponent.prototype = new GuiPropertyTextComponent();

StringTextComponent.prototype.setValueVerifyRaw = function() {
    const error = false;
    const textValue = this.$input.val();
    if (!error) {
        this.setValueVerify(textValue);
    }
};


function IdReferenceSelectComponent(object, propertyInfo) {
    GuiPropertySelectComponent.call(this, object, propertyInfo);

    // this.hasValueTypeRadios = false;
    const manager = this.getUniqueIdManager();
    if (manager) {
        manager.addUniqueIdListener(this.propertyInfo.uniqueIdInfo.namespace, this);
    } else {
        logit("Could not find unique id manager in IdReferenceSelectComponent<br />");
    }
}

IdReferenceSelectComponent.prototype = new GuiPropertySelectComponent();


IdReferenceSelectComponent.prototype.componentRemoved = function() {
    GuiPropertySelectComponent.prototype.componentRemoved.call(this);
    const manager = this.getUniqueIdManager();
    if (manager) {
        manager.removeUniqueIdListener(this.propertyInfo.uniqueIdInfo.namespace, this);
    }
};

IdReferenceSelectComponent.prototype.uniqueIdAdded = function(owner, namespace, newId) {
    this.addOption(newId, newId);
};

IdReferenceSelectComponent.prototype.uniqueIdChanged = function(owner, namespace, oldId, newId) {
    this.changeOption(oldId, newId, newId);
};

IdReferenceSelectComponent.prototype.uniqueIdRemoved = function(owner, namespace, theId) {
    this.removeOption(theId, "");
};

IdReferenceSelectComponent.prototype.getValuesAndNames = function() {
    const result = [["", "None"]];
    const manager = this.getUniqueIdManager();
    if (manager) {
        const ids = manager.getUniqueIds(this.getUniqueIdNamespace());
        for (let i=0; i<ids.length; i++) {
            result.push([ids[i], ids[i]]);
        }
    }
    return result;
};

IdReferenceSelectComponent.prototype.setValueVerifyRaw = function() {
    const value = this.$input.val();
    this.setValueVerify(value);
};


function ProcedureButtonComponent(object, propertyInfo) {
    GuiPropertyComponent.call(this, object, propertyInfo);
    this.tagName = "button";
    this.setUniqueId();
}

ProcedureButtonComponent.prototype = new GuiPropertyComponent();

ProcedureButtonComponent.prototype.getHtmlContentBeforeChildren = function(resultArr) {
    resultArr.push(this.propertyInfo.propertyCaption);
};


ProcedureButtonComponent.prototype.jQueryCreated = function($localRoot) {
    GuiPropertyComponent.prototype.jQueryCreated.call(this, $localRoot);
    this.$component.button();
    const propertyInfo = this.propertyInfo;
    const object = this.object;
    const comp = this;
    this.$component.on("click", function() {
        const procInfo = propertyInfo.procedureInfo;
        let args = [];
        let targetObject = null;
        if (procInfo) {
            args = procInfo.args;
            targetObject = procInfo.targetObject;
        }
        if (!targetObject) {
            targetObject = comp;
        }
        const proc = targetObject[propertyInfo.propertyName];
        if (proc && $.isFunction(proc)) {
            proc.apply(targetObject, args);
        } else {
            logit("Could not find procedure " + propertyInfo.propertyName + " in ProcedureButtonComponent<br />");
            logit("" + targetObject._constructorName + " " + propertyInfo.propertyName + "<br />");
        }
    });
};



function UniqueIdTextComponent(object, propertyInfo) {
    GuiPropertyTextComponent.call(this, object, propertyInfo);
    this.hasValueTypeRadios = false;

}

UniqueIdTextComponent.prototype = new GuiPropertyTextComponent();

UniqueIdTextComponent.prototype.setValueVerifyRaw = function() {
    let error = false;
    let errorText = "";
    const textValue = this.$input.val();

    if (!textValue) {
        error = true;
        errorText = "ID can not be empty";
    }
    const oldValue = this.getValue();
    if (!error && oldValue != textValue) {
        let manager = this.getUniqueIdManager();
        let namespace = this.getUniqueIdNamespace();
        error = !manager.uniqueIdAvailable(this.object, namespace, textValue);
        if (error) {
            errorText = "ID already exists";
        }
    }
    if (!error) {
        if (this.setValueVerify(textValue) && oldValue != textValue) {
            manager.changeUniqueId(this.object, namespace, oldValue, textValue);
        }
    } else {
        this.setError(true, errorText);
    }
};


function GuiObjectComponent(object, propertyInfo) {
    GuiPropertyComponent.call(this, object, propertyInfo);

    this.$details = null;
    this.cssClassName = "object-list-panel";
    this.otherCssClasses.push("ui-widget-content");
    this.setUniqueId();

    this.detailsId = this.id + "-details";
    this.newButtonIdPrefix = this.id + "-new-button";

    this.detailsComponent = null;

    this._constructorName = "GuiObjectComponent";
}

GuiObjectComponent.prototype = new GuiPropertyComponent();



GuiObjectComponent.prototype.componentRemoved = function() {
    GuiPropertyComponent.prototype.componentRemoved.call(this);
    if (this.detailsComponent) {
        this.detailsComponent.componentRemoved();
    }
};

GuiObjectComponent.prototype.removeDetailsComponent = function() {
    if (this.detailsComponent) {
        this.detailsComponent.componentRemoved();
        this.detailsComponent = null;
    }
};


GuiObjectComponent.prototype.getHtmlContentBeforeChildren = function(resultArr) {
    resultArr.push("<div>" + this.propertyInfo.propertyCaption + "</div>");

    const objectInfo = this.propertyInfo.objectInfo;
    this.getConstructorsHtml(resultArr,
        objectInfo.constructorInfos, objectInfo.newMode);
    // Details panel
    resultArr.push("<div ");
    resultArr.push("id=\"" + this.detailsId + "\" ");
    resultArr.push(">\n");
    resultArr.push("</div>\n");
};



GuiObjectComponent.prototype.jQueryCreated = function($localRoot) {
    GuiPropertyComponent.prototype.jQueryCreated.call(this, $localRoot);
    this.$details = this.$component.find("#" + this.detailsId);

    const objectInfo = this.propertyInfo.objectInfo;

    const comp = this;

    this.addConstructorClickListeners(objectInfo.constructorInfos, function(constrInfo) {
        //        logit("Creating " + constrInfo.text + "<br />");
        const newValue = comp.createNewValue(constrInfo, comp.propertyInfo);
        comp.setValueVerify(newValue);
        //        comp.object[comp.propertyInfo.propertyName] = newValue;
        comp.updateDetailsPanel();
    }, objectInfo.newMode);
    this.updateDetailsPanel();
};


GuiObjectComponent.prototype.updateDetailsPanel = function() {
    const value = this.getValue();

    const propInfo = this.propertyInfo;

    this.$details.empty();
    this.removeDetailsComponent();

    let instanceText = null;
    const constructorInfos = propInfo.objectInfo.constructorInfos;
    if (constructorInfos.length > 1) {
        for (let i=0; i<constructorInfos.length; i++) {
            const ci = constructorInfos[i];
            if (ci.nameIsConstructor && ci.name == value._constructorName) {
                instanceText = ci.text;
                break;
            }
        }
    }

    // Create or get the details component
    const newComponent = new GuiPropertiesComponent({
        propertyInfoProvider: propInfo.propertyInfoProvider,
        object: value,
        componentRegisters: propInfo.componentRegisters
    });
    newComponent.spawn(this.$details);
    if (instanceText) {
        newComponent.$component.prepend($("<div><p>" + instanceText + "</p></div>"));
    }
    newComponent.alignComponents();

    this.detailsComponent = newComponent;
};





function IntegerSliderComponent(object, propertyInfo) {
    GuiPropertySliderComponent.call(this, object, propertyInfo);
}

IntegerSliderComponent.prototype = new GuiPropertySliderComponent();

IntegerSliderComponent.prototype.setValueVerifyRaw = function() {
    const error = false;
    const value = this.$input.slider("value");

    if (!error) {
        this.setValueVerify(value);
    }
};
