
class IdReferenceListSelectComponent extends GuiPropertySelectListComponent {
    constructor(object, propertyInfo) {
        super(object, propertyInfo);
        const manager = this.getUniqueIdManager();
        if (manager) {
            manager.addUniqueIdListener(this.propertyInfo.uniqueIdInfo.namespace, this);
        }
        else {
            logit("Could not find unique id manager in IdReferenceListSelectComponent<br />");
        }
    }
    getItemValue(itemString) {
        return itemString;
    }
    componentRemoved() {
        super.componentRemoved();
        const manager = this.getUniqueIdManager();
        if (manager) {
            manager.removeUniqueIdListener(this.propertyInfo.uniqueIdInfo.namespace, this);
        }
    }
    uniqueIdAdded(owner, namespace, newId) {
        this.addOption(newId, newId);
    }
    uniqueIdChanged(owner, namespace, oldId, newId) {
        this.changeOption(oldId, newId, newId);
    }
    uniqueIdRemoved(owner, namespace, theId) {
        this.removeOption(theId, "");
    }
    getValuesAndNames() {
        const result = [["", "None"]];
        const manager = this.getUniqueIdManager();
        if (manager) {
            const ids = manager.getUniqueIds(this.getUniqueIdNamespace());
            for (let i = 0; i < ids.length; i++) {
                result.push([ids[i], ids[i]]);
            }
        }
        return result;
    }
}

class IntegerSelectComponent extends GuiPropertySelectComponent {
    constructor(object, propertyInfo) {
        super(object, propertyInfo);
    }
    setValueVerifyRaw() {
        const value = this.$input.val();
        const intValue = parseInt(value);
        const error = isNaN(intValue);
        this.setError(error, "Invalid integer");
        if (!error) {
            this.setValueVerify(intValue);
        }
    }
}

class IntegerListSelectComponent extends GuiPropertySelectListComponent {
    constructor(object, propertyInfo) {
        super(object, propertyInfo);
    }
    getItemValue(itemString) {
        const intValue = parseInt(itemString);
        return intValue;
    }
}

class FloatSelectComponent extends GuiPropertySelectComponent {
    constructor(object, propertyInfo) {
        super(object, propertyInfo);
    }
    setValueVerifyRaw() {
        const value = this.$input.val();
        const floatValue = parseFloat(value);
        const error = isNaN(floatValue);
        this.setError(error, "Invalid decimal");
        if (!error) {
            this.setValueVerify(floatValue);
        }
    }
}

class StringSelectComponent extends GuiPropertySelectComponent{
    constructor(object, propertyInfo) {
        super(object, propertyInfo);
    }
    setValueVerifyRaw() {
        const value = this.$input.val();
        this.setValueVerify(value);
    }
}

class BooleanSelectComponent extends GuiPropertySelectComponent{
    constructor(object, propertyInfo) {
        super(object, propertyInfo);
    }
    setValueVerifyRaw() {
        const textValue = this.$input.val();
        const booleanValue = textValue == "true" ? true : false;
        //    logit(" in boolean select: textValue: " + textValue + " booleanValue: " + booleanValue + "<br />");
        this.setValueVerify(booleanValue);
    }
    getValuesAndNames() {
        const result = [];
        const values = [true, false];

        for (const value of values) {
            let displayValue = value;
            if (this.propertyInfo.displayFunction) {
                displayValue = this.propertyInfo.displayFunction.call(this, this.object, this.propertyInfo.propertyName, value);
            }
            result.push([value, displayValue]);
        }

        return result;
    }
}

class IntegerTextComponent extends GuiPropertyTextComponent{
    constructor(object, propertyInfo) {
        super(object, propertyInfo);
    }
    setValueVerifyRaw() {
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
    }
}

class StringTextAreaComponent extends GuiPropertyTextComponent {
    constructor(object, propertyInfo) {
        super(object, propertyInfo);
        this.inputTag = "textarea";
    }
    setValueVerifyRaw() {
        const textValue = this.$input.val();
        this.setValueVerify(textValue);
    }
}

class IntegerListTextComponent extends GuiPropertyTextComponent{
    constructor(object, propertyInfo) {
        super(object, propertyInfo);
    }
    valueToString(value) {
        return value.join(" ");
    }
    setValueVerifyRaw() {
        let error = false;
        let errorMessage = "";
        let textValue = this.$input.val();
        textValue = $.trim(textValue);
        const textArray = textValue.split(" ");
        const intArr = [];
        for (let i = 0; i < textArray.length; i++) {
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
    }
}

class IntegerList2DTextComponent extends GuiPropertyTextComponent{
    constructor(object, propertyInfo) {
       super(object, propertyInfo);
    }
    valueToString(value) {
        let result = "";
        for (let i = 0; i < value.length; i++) {
            const arr = value[i];
            result += arr.join(" ");
            if (i < value.length - 1) {
                result += ", ";
            }
        }
        return result;
    }
    setValueVerifyRaw() {
        let error = false;
        let errorMessage = "";
        let textValue = this.$input.val();
        textValue = $.trim(textValue);
        const intArrs = [];
        const arrayTexts = textValue.split(",");

        for (const arrayText of arrayTexts) {
            const textArray = arrayText.split(" ");
            const intArr = [];
            for (let i = 0; i < textArray.length; i++) {
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
    }
}

class FloatTextComponent extends GuiPropertyTextComponent {
    constructor(object, propertyInfo) {
        super(object, propertyInfo);
    }
    setValueVerifyRaw() {
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
    }
}

class FloatListTextComponent extends GuiPropertyTextComponent {
    constructor(object, propertyInfo) {
        super(object, propertyInfo);
    }
    valueToString(value) {
        return value.join(" ");
    }
    setValueVerifyRaw() {
        let error = false;
        let errorMessage = "";
        let textValue = this.$input.val();
        textValue = $.trim(textValue);
        const textArray = textValue.split(" ");
        const floatArr = [];
        for (let i = 0; i < textArray.length; i++) {
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
    }
}

class FloatList2DTextComponent extends GuiPropertyTextComponent {
    constructor(object, propertyInfo) {
        super(object, propertyInfo);
    }
    valueToString(value) {
        let result = "";
        for (let i = 0; i < value.length; i++) {
            const arr = value[i];
            result += arr.join(" ");
            if (i < value.length - 1) {
                result += ", ";
            }
        }
        return result;
    }
    setValueVerifyRaw() {
        let error = false;
        let errorMessage = "";
        let textValue = this.$input.val();
        textValue = $.trim(textValue);
        const floatArrs = [];
        if (textValue != "") {
            const arrayTexts = textValue.split(",");

            for (const arrayText of arrayTexts) {
                const textArray = arrayText.split(" ");
                const floatArr = [];
                for (let i = 0; i < textArray.length; i++) {
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
    }
}

class StringNotEmptyConstraint {
    constructor(options) {
        this.errorMessage = getValueOrDefault(options, "errorMessage", "Must not be empty");
    }
    isValid(object, propName, value) {
        return value != "";
    }
    getInvalidDescription(object, propName, value) {
        return this.errorMessage;
    }
}

class StringLengthConstraint {
    constructor(options) {
        this.maxLength = getValueOrDefault(options, "maxLength", 9999999999999);
        this.minLength = getValueOrDefault(options, "minLength", 0);
    }
    isValid(object, propName, value) {
        return value.length <= this.maxLength && value.length >= this.minLength;
    }
    getInvalidDescription(object, propName, value) {
        if (value.length < this.minLength) {
            let charStr = this.minLength == 1 ? "character" : "characters";
            return "Must have at least " + this.minLength + " " + charStr;
        }
        if (value.length > this.maxLength) {
            let charStr = this.maxLength == 1 ? "character" : "characters";
            return "Must have at most " + this.maxLength + " " + charStr;
        }
        return "";
    }
}

class StringTextComponent extends GuiPropertyTextComponent{
    constructor(object, propertyInfo) {
        super(object, propertyInfo);
    }
    setValueVerifyRaw() {
        const error = false;
        const textValue = this.$input.val();
        if (!error) {
            this.setValueVerify(textValue);
        }
    }
}

class IdReferenceSelectComponent extends GuiPropertySelectComponent {
    constructor(object, propertyInfo) {
        super(object, propertyInfo);
        // this.hasValueTypeRadios = false;
        const manager = this.getUniqueIdManager();
        if (manager) {
            manager.addUniqueIdListener(this.propertyInfo.uniqueIdInfo.namespace, this);
        }
        else {
            logit("Could not find unique id manager in IdReferenceSelectComponent<br />");
        }
    }
    componentRemoved() {
        super.componentRemoved();
        const manager = this.getUniqueIdManager();
        if (manager) {
            manager.removeUniqueIdListener(this.propertyInfo.uniqueIdInfo.namespace, this);
        }
    }
    uniqueIdAdded(owner, namespace, newId) {
        this.addOption(newId, newId);
    }
    uniqueIdChanged(owner, namespace, oldId, newId) {
        this.changeOption(oldId, newId, newId);
    }
    uniqueIdRemoved(owner, namespace, theId) {
        this.removeOption(theId, "");
    }
    getValuesAndNames() {
        const result = [["", "None"]];
        const manager = this.getUniqueIdManager();
        if (manager) {
            const ids = manager.getUniqueIds(this.getUniqueIdNamespace());
            for (let i = 0; i < ids.length; i++) {
                result.push([ids[i], ids[i]]);
            }
        }
        return result;
    }
    setValueVerifyRaw() {
        const value = this.$input.val();
        this.setValueVerify(value);
    }
}

class ProcedureButtonComponent extends GuiPropertyComponent {
    constructor(object, propertyInfo) {
        super(object, propertyInfo);
        this.tagName = "button";
        this.setUniqueId();
    }
    getHtmlContentBeforeChildren(resultArr) {
        resultArr.push(this.propertyInfo.propertyCaption);
    }
    jQueryCreated($localRoot) {
        super.jQueryCreated($localRoot);
        this.$component.button();
        const propertyInfo = this.propertyInfo;
        const object = this.object;
        const comp = this;
        this.$component.on("click", () => {
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
            }
            else {
                logit("Could not find procedure " + propertyInfo.propertyName + " in ProcedureButtonComponent<br />");
                logit("" + targetObject._constructorName + " " + propertyInfo.propertyName + "<br />");
            }
        });
    }
}

class UniqueIdTextComponent extends GuiPropertyTextComponent {
    constructor(object, propertyInfo) {
        super(object, propertyInfo);
        this.hasValueTypeRadios = false;
    }
    setValueVerifyRaw() {
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
        }
        else {
            this.setError(true, errorText);
        }
    }
}

class GuiObjectComponent extends GuiPropertyComponent {
    constructor(object, propertyInfo) {
        super(object, propertyInfo);
        this.$details = null;
        this.cssClassName = "object-list-panel";
        this.otherCssClasses.push("ui-widget-content");
        this.setUniqueId();
        this.detailsId = this.id + "-details";
        this.newButtonIdPrefix = this.id + "-new-button";
        this.detailsComponent = null;
        this._constructorName = "GuiObjectComponent";
    }
    componentRemoved() {
        super.componentRemoved();
        if (this.detailsComponent) {
            this.detailsComponent.componentRemoved();
        }
    }
    removeDetailsComponent() {
        if (this.detailsComponent) {
            this.detailsComponent.componentRemoved();
            this.detailsComponent = null;
        }
    }
    getHtmlContentBeforeChildren(resultArr) {
        resultArr.push("<div>" + this.propertyInfo.propertyCaption + "</div>");
        const objectInfo = this.propertyInfo.objectInfo;
        this.getConstructorsHtml(resultArr, objectInfo.constructorInfos, objectInfo.newMode);
        // Details panel
        resultArr.push("<div ");
        resultArr.push("id=\"" + this.detailsId + "\" ");
        resultArr.push(">\n");
        resultArr.push("</div>\n");
    }
    jQueryCreated($localRoot) {
        super.jQueryCreated($localRoot);
        this.$details = this.$component.find("#" + this.detailsId);
        const objectInfo = this.propertyInfo.objectInfo;
        const comp = this;
        this.addConstructorClickListeners(objectInfo.constructorInfos, constrInfo => {
            //        logit("Creating " + constrInfo.text + "<br />");
            const newValue = comp.createNewValue(constrInfo, comp.propertyInfo);
            comp.setValueVerify(newValue);
            //        comp.object[comp.propertyInfo.propertyName] = newValue;
            comp.updateDetailsPanel();
        }, objectInfo.newMode);
        this.updateDetailsPanel();
    }
    updateDetailsPanel() {
        const value = this.getValue();
        const propInfo = this.propertyInfo;
        this.$details.empty();
        this.removeDetailsComponent();
        let instanceText = null;
        const constructorInfos = propInfo.objectInfo.constructorInfos;
        if (constructorInfos.length > 1) {
            for (const ci of constructorInfos) {
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
    }
}

class IntegerSliderComponent extends GuiPropertySliderComponent {
    constructor(object, propertyInfo) {
        super(object, propertyInfo);
    }
    setValueVerifyRaw() {
        const error = false;
        const value = this.$input.slider("value");
        if (!error) {
            this.setValueVerify(value);
        }
    }
}
