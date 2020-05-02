

function traverseObject(obj, propInfoProvider, func, parentInfo, data) {
    try {
        if (obj && (typeof(obj) === 'object')) {

            const infos = propInfoProvider.getGuiPropertyInfos(obj, parentInfo);

            for (const info of infos.getIterator()) {
                func(obj, info, data);

                if (info.dataType == GuiPropertyDataType.OBJECT_LIST) {
                    let value = obj[info.propertyName];
                    if (value) {
                        for (let j=0; j<value.length; j++) {
                            traverseObject(value[j], propInfoProvider, func, info, data);
                        }
                    } else {
                        logit("Unable to get property " + info.propertyName + " from " + obj + " (" + obj._constructorName + ") <br />");
                    }
                }
                else if (info.dataType == GuiPropertyDataType.OBJECT) {
                    let value = obj[info.propertyName];
                    traverseObject(value, propInfoProvider, func, parentInfo, data);
                }
            }
        }
    } catch (ex) {
        showStacktraceDialog(ex, "traverseObject() constructor: " + obj._constructorName);
    }
}


function ComponentAlignmentInfo() {
    this.verticalOffsets = [];
}

ComponentAlignmentInfo.prototype.setVerticalOffset = function(index, offset) {
    let old = this.verticalOffsets[index];
    if (typeof old === 'undefined') {
        old = offset;
    }
    this.verticalOffsets[index] = Math.max(old, offset);
};

ComponentAlignmentInfo.prototype.getVerticalOffset = function(index) {
    const result = this.verticalOffsets[index];
    if (typeof result === 'undefined') {
        logit("vertical offset undefined");
        return 0;
    }
    return result;
};


function SplitComponent(object, groupMap, groupCaptions) {
    JQueryComponent.call(this);
    this.object = object;
    this.groupMap = groupMap;
    this.groupCaptions = groupCaptions;
}

SplitComponent.prototype = new JQueryComponent();

SplitComponent.prototype.gatherAlignmentInfo = function(info) {
};

SplitComponent.prototype.setAlignment = function(info) {
    // The default for split components is to ignore the parent alignment and deal with all the subcomponents itself
    this.alignComponents();
};

SplitComponent.prototype.alignComponents = function() {
    for (let i=0; i<this.children.length; i++) {
        const info = new ComponentAlignmentInfo();
        const child = this.children[i];
        child.gatherAlignmentInfo(info);
        child.setAlignment(info);
    }
};


function SplitTabsComponent(object, groupMap, groupCaptions) {
    SplitComponent.call(this, object, groupMap, groupCaptions);
    this.cssClassId = "ui-widget";
    this.groupMap.each(function(group, arr) {
        for (let i=0; i<arr.length; i++) {
            this.addChild(arr[i]);
        }
    }, this);
    this.setUniqueId();
    this._constructorName = "SplitTabsComponent";
}

SplitTabsComponent.prototype = new SplitComponent();


SplitTabsComponent.prototype.createJQueryStrings = function(resultArr) {
    this.addStartHtmlString(resultArr);

    resultArr.push("<ul>");
    this.groupMap.each(function(group, arr) {
        const tabId = this.id + "-" + group;
        const caption = this.groupCaptions.get(group);
        resultArr.push("<li>");
        resultArr.push("<a ");
        resultArr.push("href=\"#" + tabId + "\" ");
        resultArr.push(">");
        resultArr.push(caption);
        resultArr.push("</a>");
        resultArr.push("</li>");
    }, this);
    resultArr.push("</ul>");

    // Create a div for each group
    this.groupMap.each(function(group, arr) {
        const tabId = this.id + "-" + group;
        resultArr.push("<div ");
        resultArr.push(" id=\"" + tabId + "\" ");
        resultArr.push(">");
        for (let i=0; i<arr.length; i++) {
            arr[i].createJQueryStrings(resultArr);
        }
        resultArr.push("</div>");
    }, this);

    this.addEndHtmlString(resultArr);
};


SplitTabsComponent.prototype.jQueryCreated = function($localRoot) {
    JQueryComponent.prototype.jQueryCreated.call(this, $localRoot);
    this.$component.tabs();
};

function GuiPropertiesComponent(options) {
    JQueryComponent.call(this);
//    this.tagName = "table";
    this.object = getValueOrDefault(options, "object", null);
    this.propertyInfoProvider = getValueOrDefault(options, "propertyInfoProvider", null);
    this.componentRegisters = getValueOrDefault(options, "componentRegisters", []);
    this.parentPropertyInfo = getValueOrDefault(options, "parentPropertyInfo", null);
    this.passOnComponentRegisters = getValueOrDefault(options, "passOnComponentRegisters", true);
    this.propertyInfos = null;

    this.changeListeners = [];

    this.cssClassName = "properties-component";
    this.otherCssClasses.push("ui-widget-content");

    if (this.object != null) {
        if (this.object.getGuiPropertyInfos) {
            this.propertyInfos = this.object.getGuiPropertyInfos(this.parentPropertyInfo);
            logit("here 1")
        }
        if (!this.propertyInfos && this.propertyInfoProvider) {
            this.propertyInfos = this.propertyInfoProvider.getGuiPropertyInfos(this.object, this.parentPropertyInfo);
        }
        if (!this.propertyInfos) {
            logit("GuiPropertiesComponent missing propertyInfos for " + this.object + "<br />");
        } else {
            this.createComponents();
        }
    }

    this.setUniqueId();

    this._constructorName = "GuiPropertiesComponent";
}

GuiPropertiesComponent.prototype = new JQueryComponent();


GuiPropertiesComponent.prototype.componentRemoved = function() {
    for (let i=0; i<this.children.length; i++) {
        const c = this.children[i];
        if (c.componentRemoved) {
            c.componentRemoved();
        }
    }
};

GuiPropertiesComponent.prototype.gatherAlignmentInfo = function(info) {
};

GuiPropertiesComponent.prototype.setAlignment = function(info) {
    // The default for split components is to ignore the parent alignment and deal with all the subcomponents itself
    this.alignComponents();
};

GuiPropertiesComponent.prototype.alignComponents = function() {
    const info = new ComponentAlignmentInfo();
    for (let i=0; i<this.children.length; i++) {
        let c = this.children[i];
        //        logit(" " + c._constructorName + " <br />");
        c.gatherAlignmentInfo(info);
    }

    for (let i=0; i<this.children.length; i++) {
        let c = this.children[i];
        c.setAlignment(info);
    }
};

GuiPropertiesComponent.prototype.resetAlignment = function() {
    for (let i=0; i<this.children.length; i++) {
        const c = this.children[i];
        c.resetAlignment();
    }
};



GuiPropertiesComponent.prototype.createIntComponent = function(object, propertyInfo) {
    switch (propertyInfo.displayHint) {
        case NumberPropertyDisplayHint.TEXT:
            return new IntegerTextComponent(object, propertyInfo);
        case NumberPropertyDisplayHint.SELECT:
            return new IntegerSelectComponent(object, propertyInfo);
        case NumberPropertyDisplayHint.RADIO_BUTTON:
            return new IntegerRadioButtonsComponent(object, propertyInfo);
    }
    return null;
};

GuiPropertiesComponent.prototype.createIntListComponent = function(object, propertyInfo) {
    switch (propertyInfo.displayHint) {
        case NumberListPropertyDisplayHint.TEXT:
            return new IntegerListTextComponent(object, propertyInfo);
        case NumberListPropertyDisplayHint.SELECT_LIST:
            return new IntegerListSelectComponent(object, propertyInfo);
    }
    return null;
};

GuiPropertiesComponent.prototype.createIntList2DComponent = function(object, propertyInfo) {
    switch (propertyInfo.displayHint) {
        case NumberList2DPropertyDisplayHint.TEXT:
            return new IntegerList2DTextComponent(object, propertyInfo);
    }
    return null;
};


GuiPropertiesComponent.prototype.createFloatComponent = function(object, propertyInfo) {
    switch (propertyInfo.displayHint) {
        case NumberPropertyDisplayHint.TEXT:
            return new FloatTextComponent(object, propertyInfo);
        case NumberPropertyDisplayHint.SELECT:
            return new FloatSelectComponent(object, propertyInfo);
    }
    return null;
};

GuiPropertiesComponent.prototype.createFloatListComponent = function(object, propertyInfo) {
    switch (propertyInfo.displayHint) {
        case NumberListPropertyDisplayHint.TEXT:
            return new FloatListTextComponent(object, propertyInfo);
    }
    return null;
};


GuiPropertiesComponent.prototype.createFloatList2DComponent = function(object, propertyInfo) {
    switch (propertyInfo.displayHint) {
        case NumberList2DPropertyDisplayHint.TEXT:
            return new FloatList2DTextComponent(object, propertyInfo);
    }
    return null;
};


GuiPropertiesComponent.prototype.createStringComponent = function(object, propertyInfo) {
    switch (propertyInfo.displayHint) {
        case StringPropertyDisplayHint.TEXT:
            return new StringTextComponent(object, propertyInfo);
        case StringPropertyDisplayHint.TEXT_AREA:
            return new StringTextAreaComponent(object, propertyInfo);
        case StringPropertyDisplayHint.SELECT:
            return new StringSelectComponent(object, propertyInfo);
    }
    return null;
};

GuiPropertiesComponent.prototype.createBooleanComponent = function(object, propertyInfo) {
    switch (propertyInfo.displayHint) {
        case BooleanPropertyDisplayHint.SELECT:
            return new BooleanSelectComponent(object, propertyInfo);
    }
    return null;
};


GuiPropertiesComponent.prototype.createIdReferenceComponent = function(object, propertyInfo) {
    switch (propertyInfo.displayHint) {
        case IdReferencePropertyDisplayHint.SELECT:
            return new IdReferenceSelectComponent(object, propertyInfo);
    }
    return null;
};

GuiPropertiesComponent.prototype.createIdReferenceListComponent = function(object, propertyInfo) {
    switch (propertyInfo.displayHint) {
        case IdReferencePropertyDisplayHint.SELECT:
            return new IdReferenceListSelectComponent(object, propertyInfo);
    }
    return null;
};


GuiPropertiesComponent.prototype.createUniqueIdComponent = function(object, propertyInfo) {
    switch (propertyInfo.displayHint) {
        case UniqueIdPropertyDisplayHint.TEXT:
            return new UniqueIdTextComponent(object, propertyInfo);
    }
    return null;
};

GuiPropertiesComponent.prototype.createProcedureComponent = function(object, propertyInfo) {
    switch (propertyInfo.displayHint) {
        case ProcedureDisplayHint.BUTTON:
            return new ProcedureButtonComponent(object, propertyInfo);
    }
    return null;
};

GuiPropertiesComponent.prototype.createOtherComponent = function(object, propertyInfo) {
    const otherInfo = propertyInfo.otherInfo;
    if (otherInfo) {
        const result = eval("new " + otherInfo.componentConstructor + "()");
        result.object = object;
        result.propertyInfo = propertyInfo;
        return result;
    }
    return null;
};

GuiPropertiesComponent.prototype.createObjectListComponent = function(object, propertyInfo) {
    return new GuiObjectListComponent(object, propertyInfo);
};

GuiPropertiesComponent.prototype.createObjectComponent = function(object, propertyInfo) {
    return new GuiObjectComponent(object, propertyInfo);
};

GuiPropertiesComponent.prototype.createSplitComponent = function(object, groupMap, groupCaptions, splitType) {
    switch (splitType) {
        case GuiSplitType.TABS:
            return new SplitTabsComponent(object, groupMap, groupCaptions);
    }
    return null;
};

GuiPropertiesComponent.prototype.createComponent = function(info) {
    let component = null;
    switch (info.dataType) {
        case GuiPropertyDataType.INT:
            component = this.createIntComponent(this.object, info);
            break;
        case GuiPropertyDataType.INT_LIST:
            component = this.createIntListComponent(this.object, info);
            break;
        case GuiPropertyDataType.INT_LIST_2D:
            component = this.createIntList2DComponent(this.object, info);
            break;
        case GuiPropertyDataType.FLOAT:
            component = this.createFloatComponent(this.object, info);
            break;
        case GuiPropertyDataType.FLOAT_LIST:
            component = this.createFloatListComponent(this.object, info);
            break;
        case GuiPropertyDataType.FLOAT_LIST_2D:
            component = this.createFloatList2DComponent(this.object, info);
            break;
        case GuiPropertyDataType.BOOLEAN:
            component = this.createBooleanComponent(this.object, info);
            break;
        case GuiPropertyDataType.STRING:
            component = this.createStringComponent(this.object, info);
            break;
        case GuiPropertyDataType.ID_REFERENCE:
            component = this.createIdReferenceComponent(this.object, info);
            break;
        case GuiPropertyDataType.ID_REFERENCE_LIST:
            component = this.createIdReferenceListComponent(this.object, info);
            break;
        case GuiPropertyDataType.UNIQUE_ID:
            component = this.createUniqueIdComponent(this.object, info);
            break;
        case GuiPropertyDataType.SIMPLE_LIST:
            component = this.createSimpleListComponent(this.object, info);
            break;
        case GuiPropertyDataType.SIMPLE_SET:
            component = this.createSimpleSetComponent(this.object, info);
            break;
        case GuiPropertyDataType.OBJECT_LIST:
            component = this.createObjectListComponent(this.object, info);
            break;
        case GuiPropertyDataType.OBJECT:
            component = this.createObjectComponent(this.object, info);
            break;
        case GuiPropertyDataType.PROCEDURE:
            component = this.createProcedureComponent(this.object, info);
            break;
        case GuiPropertyDataType.OTHER:
            component = this.createOtherComponent(this.object, info);
            break;
    }
    return component;
};

GuiPropertiesComponent.prototype.createComponents = function() {
    const components = [];

    const splitComponents = new Map();

    const groupCaptions = new Map();

    const that = this;
    for (const info of this.propertyInfos.getIterator()) {

        if (this.passOnComponentRegisters && this.componentRegisters) {
            info.componentRegisters = this.componentRegisters;
        }

        const component = this.createComponent(info);

        component.changeListeners.push(function(c, oldValue, newValue) {
            for (let i=0; i<that.changeListeners.length; i++) {
                that.changeListeners[i](that, that.object, that.object);
            }
        });

        if (component != null) {
            const splitInfo = info.splitInfo;
            if (splitInfo) {
                let splitMap = splitComponents.get(splitInfo.splitType);
                if (!splitMap) {
                    splitMap = new Map();
                    splitComponents.set(splitInfo.splitType, splitMap);
                }
                let splitArr = splitMap.get(splitInfo.group);
                if (!splitArr) {
                    splitArr = [];
                    splitMap.set(splitInfo.group, splitArr);
                }
                splitArr.push(component);

                if (splitInfo.groupCaption) {
                    groupCaptions.set(splitInfo.group, splitInfo.groupCaption);
                } else {
                    const oldCaption = groupCaptions.get(splitInfo.group);
                    if (!oldCaption) {
                        groupCaptions.set(splitInfo.group, "Caption");
                    }
                }
            } else {
                components.push(component);
            }
        } else {
            logit("Could not create a component for data type " + info.dataType + "<br />");
        }
    }
    for (let i=0; i<components.length; i++) {
        this.addChild(components[i]);
    }

    splitComponents.forEach((groupMap, splitType) => {
        //    logit("group map: " + groupMap);
        const splitComponent = this.createSplitComponent(this.object, groupMap, groupCaptions, splitType);
        this.addChild(splitComponent);
    });

};


function GuiPropertyComponent(object, propertyInfo) {
    JQueryComponent.call(this);
    this.object = object;
    this.propertyInfo = propertyInfo;
    this.otherCssClasses.push("ui-widget");
    this.otherCssClasses.push("gui-property-component");
    this.changeListeners = [];
    this.hasValueTypeRadios = true;

    this.$valueType = null;

    if (this.propertyInfo) {
        const componentRegisters = this.propertyInfo.componentRegisters;
        if (componentRegisters) {
            for (let j=0; j<componentRegisters.length; j++) {
                componentRegisters[j].registerComponent(this, this.propertyInfo);
            }
        }
    }
    this._constructorName = "GuiPropertyComponent";
}

GuiPropertyComponent.prototype = new JQueryComponent();


GuiPropertyComponent.prototype.callChangeListeners = function() {
    const that = this;
    for (let i=0; i<that.changeListeners.length; i++) {
        that.changeListeners[i](that, that.object, that.object);
    }
};

GuiPropertyComponent.prototype.resetAlignment = function() {
};


GuiPropertyComponent.prototype.componentRemoved = function() {
    for (let i=0; i<this.children.length; i++) {
        const c = this.children[i];
        if (c.componentRemoved) {
            c.componentRemoved();
        }
    }
    if (this.propertyInfo) {
        const componentRegisters = this.propertyInfo.componentRegisters;
        if (componentRegisters) {
            for (let j=0; j<componentRegisters.length; j++) {
                componentRegisters[j].unregisterComponent(this, this.propertyInfo);
            }
        }
    }
};

GuiPropertyComponent.prototype.cleanAfterDelete = function(value) {
    if ((typeof(value) === 'object') && this.propertyInfo.propertyInfoProvider) {
//        removeUniqueIds(value, this.propertyInfo.propertyInfoProvider, this.propertyInfo);
//        removeUniqueIdReferenceListener(value, this.propertyInfo.propertyInfoProvider, this.propertyInfo);
    }
};



GuiPropertyComponent.prototype.createNewValue = function(constrInfo, parentPropInfo) {
    let newValue = null;
    if (constrInfo.nameIsConstructor) {
        newValue = eval("new " + constrInfo.name + "();");

        if (typeof(newValue) === 'object') {
//            var uiInfo = this.propertyInfo.uniqueIdInfo;
//            newValue.id = uiInfo.manager.getNextUniqueId(uiInfo.namespace, uiInfo.initPrefix);
//            if (uiInfo.manager.uniqueIdAvailable(null, uiInfo.namespace, newValue.id)) {
//                uiInfo.manager.addUniqueId(newValue, uiInfo.namespace, newValue.id);
//            }
//            addIdReferenceListenersRecursively(newValue, this.propertyInfo.propertyInfoProvider, parentPropInfo);
        }
    } else {
        newValue = constrInfo.createValue();
        //        logit("Created value " + newValue + "<br />");
    }
    return newValue;
};


GuiPropertyComponent.prototype.getConstructorsHtml = function(resultArr, constructorInfos, newMode) {
    if (newMode == GuiNewMode.BUTTONS) {
        for (let i=0; i<constructorInfos.length; i++) {
            let constrInfo = constructorInfos[i];
            resultArr.push("<button ");
            resultArr.push("id='" + (this.newButtonIdPrefix + "-" + i) + "' ");
            resultArr.push(">");
            resultArr.push(constrInfo.text);
            resultArr.push("</button>\n");
        }
    } else {
        logit("select new not supported yet...");
        for (let i=0; i<constructorInfos.length; i++) {
            let constrInfo = constructorInfos[i];
        }
    }
};


GuiPropertyComponent.prototype.addConstructorClickListeners = function(constructorInfos, func, newMode) {
    const comp = this;
    if (newMode == GuiNewMode.BUTTONS) {
        $.each(constructorInfos, function(i, constrInfo) {
            const $button = comp.$component.find("#" + comp.newButtonIdPrefix + "-" + i);
            const buttonOptions = {};
            buttonOptions.label = constrInfo.text;
            buttonOptions.text = true; // comp.listInfo.constructorInfos.length > 1;
            buttonOptions.icons = {};
            buttonOptions.icons["primary"] = "ui-icon-plus";

            $button.button(buttonOptions);
            $button.on("click", function() {
                func(constrInfo);
            });
        });
    }
};



GuiPropertyComponent.prototype.gatherAlignmentInfo = function(info) {
};

GuiPropertyComponent.prototype.setAlignment = function(info) {
};

GuiPropertyComponent.prototype.alignComponents = function() {
};

GuiPropertyComponent.prototype.getValue = function() {
    let value = this.object[this.propertyInfo.propertyName];
    if (typeof value === 'undefined') {
        logit("property was undefined " + this.propertyInfo.propertyName + " in " + this.object._constructorName + "<br />");
        value = this.propertyInfo.defaultValue;
    }
    if (!this.propertyInfo.allowNull && value == null) {
        logit("property was null " + this.propertyInfo.propertyName + " in " + this.object._constructorName + "<br />");
        value = this.propertyInfo.defaultValue;
    }

    // Check if the value is a function... then assume it is a getter function

    return value;
};

GuiPropertyComponent.prototype.getExpressionPropertyName = function() {
    return this.propertyInfo.propertyName + "Expression";
};

GuiPropertyComponent.prototype.getUseExpressionPropertyName = function() {
    return this.propertyInfo.propertyName + "UseExpression";
};


GuiPropertyComponent.prototype.getValueExpression = function() {
    const propName = this.getExpressionPropertyName();
    const expression = this.object[propName];
    if (!expression) {
        // Has no expression
        return "";
    }
    return expression;
};



GuiPropertyComponent.prototype.getUniqueIdManager = function() {
    const uniqueIdInfo = this.propertyInfo.uniqueIdInfo;
    if (uniqueIdInfo) {
        if (uniqueIdInfo.manager) {
            return uniqueIdInfo.manager;
        }else {
            logit("No uniquIdManager found in GuiPropertiesComponent<br />");
        }
    } else {
        logit("No uniquIdInfo found in GuiPropertiesComponent<br />");
    }
    return null;
};

GuiPropertyComponent.prototype.getUniqueIdNamespace = function() {
    const uniqueIdInfo = this.propertyInfo.uniqueIdInfo;
    if (uniqueIdInfo) {
        if (uniqueIdInfo.namespace) {
            return uniqueIdInfo.namespace;
        } else {
            logit("No namespace found in GuiPropertiesComponent<br />");
        }
    } else {
        logit("No namespace found in GuiPropertiesComponent<br />");
    }
    return null;
};



GuiPropertyComponent.prototype.verifyNumberConstraints = function(newValue) {

    let wasError = false;
    let errorText = "";

    for (let i=0; i<this.propertyInfo.constraints.length; i++) {
        const c = this.propertyInfo.constraints[i];
        if (c.getMinValue) {
            const minValue = c.getMinValue();
            if (newValue < minValue) {
                wasError = true;
                errorText = "Must be greater than or equal " + minValue;
            }
        }
        if (c.getMaxValue) {
            const maxValue = c.getMaxValue();
            if (newValue > maxValue) {
                wasError = true;
                errorText = "Must be less than or equal " + maxValue;
            }
        }
    }
    this.setError(wasError, errorText);
    return wasError;
};

// The newValue is assumed to be of the correct type
// It is the subclass that is responsible for converting the value
GuiPropertyComponent.prototype.setValueVerify = function(newValue) {
    const oldValue = this.getValue();

    let wasValid = true;

    if (oldValue != newValue) {

        let errorText = "";
        if (this.propertyInfo.possibleValues && this.propertyInfo.possibleValues.length > 0) {
            if (!arrayContains(this.propertyInfo.possibleValues, newValue)) {
                wasValid = false;
                errorText = "Must be one of: " + this.propertyInfo.possibleValues.join(", ");
            }
        }
        if (wasValid && this.propertyInfo.constraints) {
            for (let i=0; i<this.propertyInfo.constraints.length; i++) {
                const c = this.propertyInfo.constraints[i];
                if (c.isValid && !c.isValid(this.object, this.propertyInfo.propertyName, newValue)) {
                    const desc = c.getInvalidDescription(this.object, this.propertyInfo.propertyName, newValue);
                    errorText = desc;
                    wasValid = false;
                    break;
                }
                if (c.getPossibleValues) {
                    const possibleValues = c.getPossibleValues();
                    if (!arrayContains(possibleValues, newValue)) {
                        wasValid = false;
                        errorText = "Must be one of: " + possibleValues.join(", ");
                        break;
                    }
                }
            }
        }
        if (wasValid) {
            this.setError(false, "");
            // Todo: check if this.object[this.propertyInfo.propertyName] is a function.
            // Then it is treated as a setter function
            this.object[this.propertyInfo.propertyName] = newValue;
            for (let i=0; i<this.changeListeners.length; i++) {
                this.changeListeners[i](this, oldValue, newValue);
            }
        } else {
            this.setError(true, errorText);
        }
    } else {
        this.setError(false, "");
    }
    return wasValid;
};

GuiPropertyComponent.prototype.setError = function(e, text) {
};


GuiPropertyComponent.prototype.setupExpressionInput = function(wantedWidth) {
    this.$expressionInput = this.$component.find("#" + this.id + "-expression-input");
    this.$expressionInput.css("width", wantedWidth + "px");
    const valueExpression = this.getValueExpression();
    this.$expressionInput.val(valueExpression);
    const useExpression = !!this.object[this.getUseExpressionPropertyName()];
    if (useExpression) {
        this.$input.hide();
    } else {
        this.$expressionInput.hide();
    }

    const comp = this;
    this.$expressionInput.on("keydown keypress keyup change", function() {
        // var newValue = comp.$expressionInput.val();
        // logit("Setting expression to " + newValue + "<br />");
        comp.object[comp.getExpressionPropertyName()] = comp.$expressionInput.val();
    });
    // A hack to make right click pasting work...
    this.$expressionInput.on("paste", function() {
        setTimeout(function() {
            comp.object[comp.getExpressionPropertyName()] = comp.$expressionInput.val();
        }, 100);
    });

};


GuiPropertyComponent.prototype.createValueTypeRadioButtons = function($localRoot) {
    if (!this.hasValueTypeRadios) {
        return;
    }
    const valueTypeId = this.id + "-value-type";

    this.$valueType = this.$component.find("#" + valueTypeId);

    this.$valueType.buttonset();

    const valueRadioId = this.id + "-value-radio";
    const expressionRadioId = this.id + "-expression-radio";
    const $valueRadio = this.$component.find("#" + valueRadioId);
    const $expressionRadio = this.$component.find("#" + expressionRadioId);

    const comp = this;
    $valueRadio.click(function() {
        if (comp.$expressionInput) {
            comp.$input.show();
            comp.$expressionInput.hide();
            comp.object[comp.getUseExpressionPropertyName()] = false;
        }
    });
    $expressionRadio.click(function() {
        if (comp.$expressionInput) {
            comp.$input.hide();
            comp.$expressionInput.show();
            comp.object[comp.getUseExpressionPropertyName()] = true;
        }
    });

};

GuiPropertyComponent.prototype.getValueTypeButtonsHtml = function(resultArr) {
    if (!this.hasValueTypeRadios) {
        return;
    }
    const useExpression = !!this.object[this.getUseExpressionPropertyName()];

    const radioClass = "value-type-radio";
    const radiosClass = "value-type-radios";
    const valueTypeId = this.id + "-value-type";
    const radioName = valueTypeId + "-radio-name";
    const valueRadioId = this.id + "-value-radio";
    const expressionRadioId = this.id + "-expression-radio";
    resultArr.push("<span ");
    resultArr.push("id=\"" + valueTypeId + "\" ");
    resultArr.push("class=\"" + radiosClass + "\" ");
    resultArr.push(">")
    resultArr.push("<input type=\"radio\" name=\"" + radioName + "\" ");
    resultArr.push("id=\"" + valueRadioId + "\" ");
    resultArr.push("class=\"" + radioClass + "\" ");
    if (!useExpression) {
        resultArr.push("checked=\"checked\" ");
    }
    resultArr.push("/>");
    resultArr.push("<label ");
    resultArr.push("for=\"" + valueRadioId + "\" ");
    resultArr.push(">V</label>");
    resultArr.push("<input type=\"radio\" name=\"" + radioName + "\" ");
    resultArr.push("id=\"" + expressionRadioId + "\" ");
    resultArr.push("class=\"" + radioClass + "\" ");
    if (useExpression) {
        resultArr.push("checked=\"checked\" ");
    }
    resultArr.push("/>");
    resultArr.push("<label ");
    resultArr.push("for=\"" + expressionRadioId + "\" ");
    resultArr.push(">E</label>");

    resultArr.push("</span>");
};


function GuiPropertyTextComponent(object, propertyInfo) {
    GuiPropertyComponent.call(this, object, propertyInfo);
//    this.tagName = "tr";

    this.$input = null;
    this.$label = null;
    this.$errorLabel = null;
    this.inputTag = "input";
    this.setUniqueId();
    this._constructorName = "GuiPropertyTextComponent";
}

GuiPropertyTextComponent.prototype = new GuiPropertyComponent();


GuiPropertyTextComponent.prototype.gatherAlignmentInfo = function(info) {
    info.setVerticalOffset(0, this.$label.outerWidth());
    if (this.$valueType) {
        const valueTypeLeft = this.$valueType.position().left;
        // logit("vtl: " + valueTypeLeft + "<br />");
        info.setVerticalOffset(1, valueTypeLeft);
    }
};

GuiPropertyTextComponent.prototype.resetAlignment = function(info) {
    this.$label.css("padding-left", "0px");
    if (this.$valueType) {
        this.$valueType.css("padding-left", "0px");
    }
};

GuiPropertyTextComponent.prototype.setAlignment = function(info) {
    const labelWidth = this.$label.outerWidth();
    const labelOffset = info.getVerticalOffset(0);
    this.$label.css("padding-left", (labelOffset - labelWidth) + "px");

    if (this.$valueType) {
        const valueTypeLeft = this.$valueType.position().left;
        const maxValueTypeLeft = info.getVerticalOffset(1);
        const padding = Math.max(maxValueTypeLeft - valueTypeLeft + 5, 0);
        this.$valueType.css("padding-left", padding + "px");
    }

};





GuiPropertyTextComponent.prototype.getHtmlContentBeforeChildren = function(resultArr) {
    const inputId = this.id + "-input";
    const expressionInputId = this.id + "-expression-input";
    const labelId = this.id + "-label";
    const errorLabelId = this.id + "-error-label";
    resultArr.push("<span ");
    //    resultArr.push("for=\"" + inputId + "\" ");
    resultArr.push("id=\"" + labelId + "\" ");
    resultArr.push(">")
    resultArr.push(this.propertyInfo.propertyCaption + "</span>");
    resultArr.push("<" + this.inputTag + " ");
    resultArr.push("class=\"ui-corner-all\" ");
    resultArr.push("id=\"" + inputId + "\" ");
    if (this.propertyInfo.shortDescription) {
        resultArr.push("title=\"" + this.propertyInfo.shortDescription + "\" ");
    }
    resultArr.push(" />");
//    resultArr.push("<textarea ");
    // resultArr.push("class=\"ui-corner-all\" ");
//    resultArr.push("id=\"" + expressionInputId + "\" ");
//    resultArr.push(" />");
//    this.getValueTypeButtonsHtml(resultArr);
    resultArr.push("<label ");
    resultArr.push("id=\"" + errorLabelId + "\" ");
    resultArr.push("></label>");
};

GuiPropertyTextComponent.prototype.setError = function(e, text) {
    if (e) {
        this.$input.addClass("ui-state-error");
        //        this.$errorLabel.addClass("ui-state-error-text");
        this.$errorLabel.text(text);
    } else {
        this.$input.removeClass("ui-state-error");
        //        this.$errorLabel.removeClass("ui-state-error-text");
        this.$errorLabel.text("");
    }
};

GuiPropertyTextComponent.prototype.setValueVerifyRaw = function() {
    logit("GuiPropertyTextComponent must implement setValueVerifyRaw() <br />");
};

GuiPropertyTextComponent.prototype.valueToString = function(value) {
    return value;
};

GuiPropertyTextComponent.prototype.parseInteger = function(str, result) {
    result.error = false;
    const patt = /^[\-\+]?\d+$/g;
    if (!patt.test(str)) {
        result.error = true;
    }
    if (!result.error) {
        const intValue = parseInt(str);
        result.error = isNaN(intValue);
        result.value = intValue;
    }
};


GuiPropertyTextComponent.prototype.jQueryCreated = function($localRoot) {
    JQueryComponent.prototype.jQueryCreated.call(this, $localRoot);

//    this.createValueTypeRadioButtons($localRoot);

    this.$input = this.$component.find("#" + this.id + "-input");
    this.$label = this.$component.find("#" + this.id + "-label");
    this.$errorLabel = this.$component.find("#" + this.id + "-error-label");

    this.$errorLabel.css("padding-left", "0.7em");

    const currentLabelWidth = this.$label.width();

    //    if (currentLabelWidth < wantedLabelWidth) {
    //        this.$label.css("padding-left", (wantedLabelWidth - currentLabelWidth) + "px");
    //    }
    this.$label.css("padding-right", "0.7em");
    this.$input.css("width", "10em");

    const value = this.getValue();
    this.$input.val(this.valueToString(value));

//    this.setupExpressionInput(wantedInputWidth);

    //    setTimeout(function() {
    //    logit("label width: " + comp.$label.outerWidth() + " id: " + this.$label.get(0).id + "<br />");
    //    }, 1);

    let comp = this;
    this.$input.on("keydown keypress keyup change", function() {
        comp.setValueVerifyRaw();
    });
    // A hack to make right click pasting work...
    this.$input.on("paste", function() {
        setTimeout(function() {
            comp.setValueVerifyRaw();
        }, 100);
    });

//    this.$input.tooltip();

};


function GuiPropertySingleOptionComponent(object, propertyInfo) {
    GuiPropertyComponent.call(this, object, propertyInfo);
    this._constructorName = "GuiPropertySingleOptionComponent";
}

GuiPropertySingleOptionComponent.prototype = new GuiPropertyComponent();

GuiPropertySingleOptionComponent.prototype.getOptionHtml = function(resultArr, value, displayValue, optionIndex) {
};
GuiPropertySingleOptionComponent.prototype.addOption = function(value, displayValue) {
};


GuiPropertySingleOptionComponent.prototype.getValuesAndNamesHtml = function(resultArr, valuesAndNames) {
    for (let i=0; i<valuesAndNames.length; i++) {
        const valueName = valuesAndNames[i];
        const value = valueName[0];
        const displayValue = valueName[1];
        this.getOptionHtml(resultArr, value, displayValue, i);
    }
};


GuiPropertySingleOptionComponent.prototype.getValuesAndNames = function() {
    const result = [];
    for (let i=0; i<this.propertyInfo.possibleValues.length; i++) {
        const value = this.propertyInfo.possibleValues[i];
        let displayValue = value;
        if (this.propertyInfo.displayFunction) {
            displayValue = this.propertyInfo.displayFunction.call(this, this.object, this.propertyInfo.propertyName, value);
        }
        result.push([value, displayValue]);
    }
    return result;
};

GuiPropertySingleOptionComponent.prototype.setOptionsFromValuesAndNames = function(valuesAndNames) {
    this.$input.empty();
    for (let i=0; i<valuesAndNames.length; i++) {
        const valueName = valuesAndNames[i];
        const value = valueName[0];
        const displayValue = valueName[1];
        this.addOption(value, displayValue);
    }
};


function GuiPropertySelectComponent(object, propertyInfo) {
    GuiPropertySingleOptionComponent.call(this, object, propertyInfo);
    this.$input = null;
    this.$label = null;
    this.$errorLabel = null;
    this.setUniqueId();
    this._constructorName = "GuiPropertySelectComponent";
}

GuiPropertySelectComponent.prototype.componentRemoved = function() {
    GuiPropertyComponent.prototype.componentRemoved.call(this);
};

GuiPropertySelectComponent.prototype = new GuiPropertySingleOptionComponent();


GuiPropertySelectComponent.prototype.gatherAlignmentInfo = function(info) {
    info.setVerticalOffset(0, this.$label.outerWidth());
    if (this.$valueType) {
        info.setVerticalOffset(1, this.$valueType.position().left);
    }
};

GuiPropertySelectComponent.prototype.resetAlignment = function(info) {
    this.$label.css("padding-left", "0px");
    if (this.$valueType) {
        this.$valueType.css("padding-left", "0px");
    }
};


GuiPropertySelectComponent.prototype.setAlignment = function(info) {
    const labelWidth = this.$label.outerWidth();
    const labelOffset = info.getVerticalOffset(0);
    this.$label.css("padding-left", (labelOffset - labelWidth) + "px");

    if (this.$valueType) {
        const valueTypeLeft = this.$valueType.position().left;
        const maxValueTypeLeft = info.getVerticalOffset(1);
        const padding = Math.max(maxValueTypeLeft - valueTypeLeft + 5, 0);
        this.$valueType.css("padding-left", padding + "px");
    }
};


GuiPropertySelectComponent.prototype.getHtmlContentBeforeChildren = function(resultArr) {
    const inputId = this.id + "-input";
    const expressionInputId = this.id + "-expression-input";
    const labelId = this.id + "-label";
    const errorLabelId = this.id + "-error-label";
    resultArr.push("<label ");
    resultArr.push("for=\"" + inputId + "\" ");
    resultArr.push("id=\"" + labelId + "\" ");
    resultArr.push(">")
    resultArr.push(this.propertyInfo.propertyCaption + "</label>");
    resultArr.push("<select ");
    resultArr.push("class=\"ui-corner-all\" ");
    if (this.propertyInfo.shortDescription) {
        resultArr.push("title=\"" + this.propertyInfo.shortDescription + "\" ");
    }
    resultArr.push("id=\"" + inputId + "\" ");
    resultArr.push(">");
    const valuesAndNames = this.getValuesAndNames();
    this.getValuesAndNamesHtml(resultArr, valuesAndNames);

    resultArr.push("</select>");
//    resultArr.push("<textarea ");
    // resultArr.push("class=\"ui-corner-all\" ");
//    resultArr.push("id=\"" + expressionInputId + "\" ");
//    resultArr.push(" />");

//    this.getValueTypeButtonsHtml(resultArr);

    resultArr.push("<label ");
    resultArr.push("id=\"" + errorLabelId + "\" ");
    resultArr.push("></label>");
};

GuiPropertySelectComponent.prototype.getOptionHtml = function(resultArr, value, displayValue, optionIndex) {
    resultArr.push("<option ");
    resultArr.push("value=\"" + value + "\" ");
    resultArr.push("class=\"" + (this.id + "-option") + "\" ");
    resultArr.push(">");
    resultArr.push("" + displayValue);
    resultArr.push("</option>");
};

GuiPropertySelectComponent.prototype.setError = function(e, text) {
    if (e) {
        this.$input.addClass("ui-state-error");
        //        this.$errorLabel.addClass("ui-state-error-text");
        this.$errorLabel.text(text);
    } else {
        this.$input.removeClass("ui-state-error");
        //        this.$errorLabel.removeClass("ui-state-error-text");
        this.$errorLabel.text("");
    }
};


GuiPropertySelectComponent.prototype.removeOption = function(value, newValueIfCurrent) {
    const $theOption = this.$component.find("option").filter("[value=\"" + value + "\"]");
    //    logit("Removing " + $theOption + "<br />");
    const currentValue = this.$input.val();
    if (value == currentValue) {
        //        logit("Removing the currently selected option " + value + "<br />");
    }
    $theOption.remove();
    const newValue = this.$input.val();
    if (newValue != currentValue) {
        //        logit("value changed from " + currentValue + " to " + newValue + "<br />");
        this.setValueVerifyRaw();
    }
};

GuiPropertySelectComponent.prototype.changeOption = function(oldValue, newValue, newDisplayValue) {
    const $theOption = this.$component.find("option").filter("[value=\"" + oldValue + "\"]");
    $theOption.val(newValue);
    $theOption[0].innerHTML = newDisplayValue;
    this.setValueVerifyRaw();
};

GuiPropertySelectComponent.prototype.addOption = function(value, displayValue) {
    const resultArr = [];
    const optionCount = this.$component.find("option").size();
    this.getOptionHtml(resultArr, value, displayValue, optionCount - 1);
    const $newOption = $(resultArr.join(''));
    this.$input.append($newOption);
};


GuiPropertySelectComponent.prototype.setValueVerifyRaw = function() {
    logit("GuiPropertySelectComponent must implement setValueVerifyRaw() <br />");
};


GuiPropertySelectComponent.prototype.jQueryCreated = function($localRoot) {
    JQueryComponent.prototype.jQueryCreated.call(this, $localRoot);

//    this.createValueTypeRadioButtons($localRoot);

    this.$input = this.$component.find("#" + this.id + "-input");
    this.$label = this.$component.find("#" + this.id + "-label");
    this.$errorLabel = this.$component.find("#" + this.id + "-error-label");
    this.$errorLabel.css("padding-left", "0.7em");

    //    var wantedLabelWidth = 250;
    const wantedLabelPaddingRight = 10;

    //    var currentLabelWidth = this.$label.width();

    //    if (currentLabelWidth < wantedLabelWidth) {
    //        this.$label.css("padding-left", (wantedLabelWidth - currentLabelWidth) + "px");
    //    }
    this.$label.css("padding-right", "0.7em");
    this.$input.css("width", "13em");

    //    logit("label outerwidth: " + this.$label.outerWidth() + "<br />");

    const value = this.getValue();

    //    logit(" setting value to " + value + "<br />");
    this.$input.val("" + value);

    const comp = this;
    this.$input.on("change", function() {
        comp.setValueVerifyRaw();
        //        logit("changed to " + comp.$input.prop("value"));
    });

//    this.$input.tooltip();

//    this.setupExpressionInput(wantedInputWidth);
};





function GuiPropertyRadioButtonsComponent(object, propertyInfo) {
    GuiPropertySingleOptionComponent.call(this, object, propertyInfo);
    this.$input = null;
    this.$label = null;
    this.$errorLabel = null;
    this.setUniqueId();
    this._constructorName = "GuiPropertyRadioButtonsComponent";
}

GuiPropertyRadioButtonsComponent.prototype = new GuiPropertySingleOptionComponent();


GuiPropertyRadioButtonsComponent.prototype.getHtmlContentBeforeChildren = function(resultArr) {
    const valuesAndNames = this.getValuesAndNames();
    this.getValuesAndNamesHtml(resultArr, valuesAndNames);
};

GuiPropertyRadioButtonsComponent.prototype.getOptionHtml = function(resultArr, value, displayValue, optionIndex) {
    //    <input type="radio" id="radio1" name="radio" /><label for="radio1">Choice 1</label>

    const radioId = this.id + "-radio-" + optionIndex;
    const labelId = this.id + "-label-" + optionIndex;
    resultArr.push("<input ");
    resultArr.push("type=\"radio\" ");
    resultArr.push("name=\"radio\" ");
    resultArr.push("id=\"" + radioId + "\" ");
    resultArr.push("class=\"radiobutton\" ");
    resultArr.push("/>");
    resultArr.push("<label ");
    resultArr.push("for=\"" + radioId + "\" ");
    resultArr.push("class=\"radiobutton-label\" ");
    resultArr.push("id=\"" + labelId + "\" ");
    resultArr.push(">")
    resultArr.push("" + displayValue);
    resultArr.push("</label>")
};



GuiPropertyRadioButtonsComponent.prototype.removeOption = function(value, newValueIfCurrent) {
    const $theOption = this.$component.find("button").filter(function(index) {
        const optionValue = $(this).data("optionValue");
        return value == optionValue;
    });

    const currentValue = this.$input.val();
    if (value == currentValue) {
        //        logit("Removing the currently selected option " + value + "<br />");
    }
    $theOption.remove();
    const newValue = this.$input.val();
    if (newValue != currentValue) {
        //        logit("value changed from " + currentValue + " to " + newValue + "<br />");
        this.setValueVerifyRaw();
    }
};

GuiPropertyRadioButtonsComponent.prototype.changeOption = function(oldValue, newValue, newDisplayValue) {
    const $button = this.$component.find("button").filter(function(index) {
        const optionValue = $(this).data("optionValue");
        return oldValue == optionValue;
    });
    $button.data("optionData", newValue);

    $button[0].innerHTML = newDisplayValue;
    this.setValueVerifyRaw();
};

GuiPropertyRadioButtonsComponent.prototype.addOption = function(value, displayValue) {
    const resultArr = [];
    this.getOptionHtml(resultArr, value, displayValue);
    const $newOption = $(resultArr.join(''));
    $newOption.data("optionValue", value);
    this.$input.append($newOption);
};


GuiPropertyRadioButtonsComponent.prototype.setValueVerifyRaw = function() {
    logit("GuiPropertySelectComponent must implement setValueVerifyRaw() <br />");
};


GuiPropertyRadioButtonsComponent.prototype.jQueryCreated = function($localRoot) {
    JQueryComponent.prototype.jQueryCreated.call(this, $localRoot);

    const buttonArr = this.$component.find("button").filter(".radiobutton").get();
    const labelArr = this.$component.find("label").filter(".radiobutton-label").get();

    if (buttonArr.length != labelArr.length) {
        logit("Buttons not equal count to labels in GuiPropertyRadioButtonsComponent<br/>");
    }
    const valuesAndNames = this.getValuesAndNames();
    for (let i=0; i<buttonArr.length; i++) {
        const button = buttonArr[i];
        const label = labelArr[i];
        const value = valuesAndNames[i][0];
        $(button).data("optionValue", value);
        $(label).data("optionValue", value);
    }

    this.$component.buttonset();

    this.$label = this.$component.find("#" + this.id + "-label");

    const wantedLabelWidth = 250;
    const wantedLabelPaddingRight = 10;

    const currentLabelWidth = this.$label.width();

    if (currentLabelWidth < wantedLabelWidth) {
        this.$label.css("padding-left", Math.round((wantedLabelWidth - currentLabelWidth) / 15.0) + "em");
    }
    this.$label.css("padding-right", "0.7em");


//    var comp = this;
//    this.$input.on("change", function() {
//        comp.setValueVerifyRaw();
//    //        logit("changed to " + comp.$input.prop("value"));
//    });
};


function GuiAbstractListComponent(object, propertyInfo) {
    GuiPropertyComponent.call(this, object, propertyInfo);

    if (propertyInfo) {
        this.listInfo = propertyInfo.listInfo;
    }
    this.$deleteButton = null;
    this.$list = null;
    this.listItemCounter = 1;
    this.listItemClass = "object-list-item";
    this.listClass = "object-list";

    // These use keys from the generated IDs from listItemCounter and maps to <li> DOM-elements
    this.selectedListItems = {};
    this.listItems = {};

    this._constructorName = "GuiAbstractListComponent";
}

GuiAbstractListComponent.prototype = new GuiPropertyComponent();




GuiAbstractListComponent.prototype.componentRemoved = function() {
    GuiPropertyComponent.prototype.componentRemoved.call(this);
};

GuiAbstractListComponent.prototype.getListItemContentHtml = function(valueItem, resultArr, itemIndex) {
    const listInfo = this.listInfo;

    if (listInfo.itemsDisplayFunction) {
        resultArr.push(listInfo.itemsDisplayFunction.call(this, valueItem));
    } else if (valueItem.id) {
        resultArr.push(valueItem.id);
    } else if (typeof(valueItem) === "object") {
        // Assign a unique ID
        const uiInfo = this.propertyInfo.uniqueIdInfo;
        if (uiInfo) {
            //            var newId = uiInfo.manager.getNextUniqueId(uiInfo.namespace, uiInfo.initPrefix);
            //            uiInfo.manager.addUniqueId(valueItem, uiInfo.namespace, newId);
            //            valueItem.id = newId;
            resultArr.push(valueItem.id);
        } else {
            logit("Cannot put objects in GuiAbstractListComponent without an id or a unique id manager");
        }
    } else {
        // Is just a plain stuff
        resultArr.push("" + valueItem);
    }
};



GuiAbstractListComponent.prototype.setIds = function() {
    this.listId = this.id + "-list";
    this.newButtonIdPrefix = this.id + "-new-button";
    this.copyButtonIdPrefix = this.id + "-copy-button";
    this.newSelectId = this.id + "-new-select";
    this.deleteButtonId = this.id + "-delete-button";
    this.copyButtonId = this.id + "-copy-button";
    this.detailsId = this.id + "-details";
};


GuiAbstractListComponent.prototype.getHtmlContentBeforeChildren = function(resultArr) {

    const listInfo = this.listInfo;

    // Getting the list
    const list = this.getValue();

    // Scroll list panel
    //    resultArr.push("<div ");
    //    resultArr.push("id=\"" + this.scrollPanelId + "\" ");
    //    resultArr.push("class='ui-widget-content' ");
    //    resultArr.push(">\n");

    resultArr.push("<span class='ui-widget' >" + this.propertyInfo.propertyCaption + "</span><br />");

    // List
    resultArr.push("<ul ");
    resultArr.push("id=\"" + this.listId + "\" ");
    resultArr.push("class='object-list' ");
    resultArr.push(">\n");

    for (let i=0; i<list.length; i++) {
        const value = list[i];
        this.getListItemHtml(value, resultArr, i);
    }

    resultArr.push("</ul>\n");

    // Add/delete panel
    resultArr.push("<div>\n");

    // New components
    this.getConstructorsHtml(resultArr, this.listInfo.constructorInfos, this.listInfo.newMode);

    // Delete button
    resultArr.push("<button ");
    resultArr.push("id=\"" + this.deleteButtonId + "\" ");
    resultArr.push(">");
    resultArr.push("</button>\n");

//    logit("Delete button id: " + this.deleteButtonId);

    // Copy button
    resultArr.push("<button ");
    resultArr.push("id=\"" + this.copyButtonId + "\" ");
    resultArr.push(">");
    resultArr.push("</button>\n");

    resultArr.push("</div>\n"); // End of add/delete panel

//    resultArr.push("</div>\n");

};


GuiAbstractListComponent.prototype.getListItemHtml = function(valueItem, resultArr, itemIndex) {
    const listInfo = this.listInfo;
    resultArr.push("<li ");
    resultArr.push("class='" + this.listItemClass + " ui-widget-content' ");
    resultArr.push("id='" + (this.id + "-item-" + this.listItemCounter) +  "' ");
    resultArr.push(">");
    resultArr.push("<div class='vertical-list-item-drag-handle' >")
    resultArr.push("<span class='ui-icon ui-icon-carat-2-n-s'></span>");
    resultArr.push("</div>");

    this.listItemCounter++;

    resultArr.push("<span class='object-list-item-content' >")
    this.getListItemContentHtml(valueItem, resultArr, itemIndex);
    resultArr.push("</span>");
    //    if (!valueItem.id) {
    //        logit("stuff that should be part of lists must have a unique ID")
    //    }
    resultArr.push("</li>\n");
};


GuiAbstractListComponent.prototype.jQueryCreated = function($localRoot) {
    GuiPropertyComponent.prototype.jQueryCreated.call(this, $localRoot);

    const comp = this;

    this.$details = this.$component.find("#" + this.detailsId);

    // Create the list
    this.$list = this.$component.find("#" + this.listId);

    const $listItems = this.$component.find(".object-list-item");
    const list = this.getValue();
    $listItems.each(function(index, element) {
        const valueItem = list[index];
        if (typeof(valueItem) === 'undefined') {
            logit("could not find value for index " + index + " in " + JSON.stringify(list) + " property: " + comp.propertyInfo.propertyName + "<br />");
        } else {
            const $element = $(element);
            $element.data("value", valueItem);
            comp.listItems[element.id] = element;
        }
    });

    this.$list.sortable({
        handle: ".vertical-list-item-drag-handle"
    });
    this.$list.on("sortstop", function(event, ui) {
        comp.itemSortStop(event, ui);
    });

    this.$list.selectable({
        selected: function(event, ui) {
            comp.listItemSelected(event, ui);
        },
        unselected: function(event, ui) {
            comp.listItemUnselected(event, ui);
        }
    });
//    this.$list.on( "selectableunselected", );


    this.addConstructorClickListeners(this.listInfo.constructorInfos, function(constrInfo) {
        comp.appendNewItem(constrInfo, comp.propertyInfo);
    }, this.listInfo.newMode);


    //    if (this.listInfo.newMode == GuiNewMode.BUTTONS) {
    //        $.each(this.listInfo.constructorInfos, function(i, constrInfo) {
    //            var $button = comp.$component.find("#" + this.newButtonIdPrefix + "-" + i);
    //            var buttonOptions = {};
    //            buttonOptions.label = constrInfo.text;
    //            buttonOptions.text = true; // comp.listInfo.constructorInfos.length > 1;
    //            buttonOptions.icons = {};
    //            buttonOptions.icons["primary"] = "ui-icon-plus";
    //
    //            $button.button(buttonOptions);
    //            $button.on("click", function() {
    //                comp.appendNewItem(constrInfo);
    //            });
    //        });
    //    }

    this.$deleteButton = this.$component.find("#" + this.deleteButtonId);
    let buttonOptions = {};
    buttonOptions.label = "Delete";
    buttonOptions.text = false;
    buttonOptions.icons = {};
    buttonOptions.icons["primary"] = "ui-icon-trash";

    this.$deleteButton.button(buttonOptions);
    this.$deleteButton.button("disable");
    this.$deleteButton.click(this, function() {
        comp.deleteSelectedItems();
    });

    this.$copyButton = this.$component.find("#" + this.copyButtonId);
    buttonOptions = {};
    buttonOptions.label = "Copy";
    buttonOptions.text = false;
    buttonOptions.icons = {};
    buttonOptions.icons["primary"] = "ui-icon-copy";

    this.$copyButton.button(buttonOptions);
    this.$copyButton.button("disable");
    this.$copyButton.click(this, function() {
        comp.copySelectedItems();
    });

};

GuiAbstractListComponent.prototype.itemAppended = function($newItem, newValue) {
};



GuiAbstractListComponent.prototype.appendNewValue = function(newValue) {
    const list = this.getValue();
    const resultArr = [];
    this.getListItemHtml(newValue, resultArr, list.length);
    const $newItem = $(resultArr.join(""));
    this.$list.append($newItem);

    $newItem.data("value", newValue);
    //    $newItem.val("" + newValue);
    this.listItems[$newItem.get(0).id] = $newItem.get(0);

    list.push(newValue);

    const comp = this;
    $newItem.on("change", function() {
        comp.setValueVerifyRaw();
    });

    this.itemAppended($newItem, newValue);
    this.callChangeListeners();
};


GuiAbstractListComponent.prototype.appendNewItem = function(constrInfo, parentPropInfo) {
    const newValue = this.createNewValue(constrInfo, parentPropInfo);
    this.appendNewValue(newValue);
};


GuiAbstractListComponent.prototype.clearSelection = function() {
    const items = this.getSelectedItems();
    for (let i=0; i<items.length; i++) {
        const item = items[i];
        delete this.selectedListItems[item.id];
    }
    this.selectedListItems = {};
    return this;
};


GuiAbstractListComponent.prototype.getSelectedItems = function() {
    const result = [];
    $.each(this.selectedListItems, function(key, value) {
        if (value.id) {
            result.push(value);
        } else {
            // I don't know why this happens sometimes...
        }
    });
    return result;
};


GuiAbstractListComponent.prototype.copySelectedItems = function() {
    const selectedItems = this.getSelectedItems();
    if (selectedItems.length > 0) {

        const list = this.getValue();

        const uiInfo = this.propertyInfo.uniqueIdInfo;

        for (let i=0; i<selectedItems.length; i++) {
            const item = selectedItems[i];
            //            logit("item " + i + ":" + item + " <br />");
            //            investigateObject(item);
            const $item = $(item);
            const valueItem = $item.data("value");

            //            logit("should copy item " + i + " <br />");

            const options = {
//                createUniqueIds: true,
//                propertyInfoProvider: this.propertyInfo.propertyInfoProvider
            };
            const copy = copyValueDeep(valueItem); // , options);

            this.appendNewValue(copy);

//            addIdReferenceListenersRecursively(copy, this.propertyInfo.propertyInfoProvider, this.propertyInfo);

        }
    }
};

GuiAbstractListComponent.prototype.deleteSelectedItems = function() {
    const selectedItems = this.getSelectedItems();
    if (selectedItems.length > 0) {

        const list = this.getValue();

        const uiInfo = this.propertyInfo.uniqueIdInfo;

        for (let i=0; i<selectedItems.length; i++) {
            const item = selectedItems[i];
            //            logit("item " + i + ":" + item + " <br />");
            //            investigateObject(item);
            const $item = $(item);
            const valueItem = $item.data("value");

            if (typeof(valueItem) != 'undefined') {
                $item.remove();
                arrayDelete(list, valueItem);

                this.cleanAfterDelete(valueItem);
            } else {
                logit("Can not find a value for item with index " + i + " and id " + item.id + "<br />");
                //                investigateArrayIds(list);
            }
        }
        this.clearSelection();
        this.$deleteButton.button("disable");
        this.callChangeListeners();
    }
};




GuiAbstractListComponent.prototype.listItemSelected = function(event, ui) {
    this.$deleteButton.button("enable");
    this.$copyButton.button("enable");
    this.selectedListItems[ui.selected.id] = ui.selected;

//    logit("Selected items:");
//    logit(this.selectedListItems);
};


GuiAbstractListComponent.prototype.listItemUnselected = function(event, ui) {
    delete this.selectedListItems[ui.unselected.id];

    if (this.getSelectedItems().length == 0) {
        this.$deleteButton.button("disable");
        this.$copyButton.button("disable");
    }
//    logit("Selected items:");
//    logit(this.selectedListItems);
};


GuiAbstractListComponent.prototype.itemSortStop = function(event, ui) {
    const newArr = [];

    const comp = this;

    this.$component.find(".object-list-item").each(function(index, value) {
        const $item = $(value);
        const valueItem = $item.data("value");
        newArr.push(valueItem);
    });

    const list = this.getValue();

    list.length = 0;
    addAll(list, newArr);

    this.callChangeListeners();

};


// A list that contains select components that can be modified
function GuiPropertySelectListComponent(object, propertyInfo) {
    GuiAbstractListComponent.call(this, object, propertyInfo);
    this.cssClassName = "object-list-panel";
    this.otherCssClasses.push("ui-widget-content");
    this.setUniqueId();

    this.setIds();

    this._constructorName = "GuiPropertySelectListComponent";
}

GuiPropertySelectListComponent.prototype = new GuiAbstractListComponent();

GuiPropertySelectListComponent.prototype.getValueItemId = function(itemIndex, optionIndex) {
    return this.id + "-option-" + itemIndex + "-" + optionIndex;
};

GuiPropertySelectListComponent.prototype.getOptionHtml = function(resultArr, value, displayValue, itemIndex, optionIndex) {
    resultArr.push("<option ");
    resultArr.push("value='" + value + "' ");
    resultArr.push("class='" + (this.id + "-option") + "' ");
    resultArr.push("id='" + this.getValueItemId(itemIndex, optionIndex) + "' ");
    resultArr.push(">");
    resultArr.push("" + displayValue);
    resultArr.push("</option>");
};


GuiPropertySelectListComponent.prototype.getValuesAndNamesHtml = function(resultArr, valuesAndNames, itemIndex) {
    for (let i=0; i<valuesAndNames.length; i++) {
        const valueName = valuesAndNames[i];
        const value = valueName[0];
        const displayValue = valueName[1];
        this.getOptionHtml(resultArr, value, displayValue, itemIndex, i);
    }
};


GuiPropertySelectListComponent.prototype.getValuesAndNames = function() {
    const result = [];
    for (let i=0; i<this.propertyInfo.listInfo.possibleValues.length; i++) {
        const value = this.propertyInfo.listInfo.possibleValues[i];
        let displayValue = value;

        const resultArr = [];
        GuiAbstractListComponent.prototype.getListItemContentHtml.call(this, value, resultArr);
        displayValue = resultArr.join("");
        result.push([value, displayValue]);
    }
    return result;
};


GuiPropertySelectListComponent.prototype.getListItemContentHtml = function(valueItem, resultArr, itemIndex) {
    const theId = this.id + "-select-" + itemIndex;
    resultArr.push("<select ");
    resultArr.push("class='" + this.id + "-select" + "' ");
    resultArr.push("id='" + theId + "' ");
    resultArr.push(">");
    const valuesAndNames = this.getValuesAndNames();
    this.getValuesAndNamesHtml(resultArr, valuesAndNames, itemIndex);
    resultArr.push("</select>");

//    logit("the id was " + theId + "<br />");
};



GuiPropertySelectListComponent.prototype.jQueryCreated = function($localRoot) {
    GuiAbstractListComponent.prototype.jQueryCreated.call(this, $localRoot);

    const list = this.getValue();

    const comp = this;

    for (let i=0; i<list.length; i++) {
        const $item = this.$component.find("#" + this.id + "-select-" + i);
        $item.val("" + list[i]);
        //        logit("Setting vlaue to " + list[i] + " " + $item.size() + "<br />");
        $item.on("change", function() {
            comp.setValueVerifyRaw(i);
        });
    }
};

GuiPropertySelectListComponent.prototype.getItemValue = function(itemString) {
    return itemString;
};


GuiPropertySelectListComponent.prototype.setValueVerifyRaw = function($localRoot) {
    const list = this.getValue();

    const comp = this;

    const $listItems = this.$component.find(".object-list-item");
    const $selectItems = this.$component.find("." + this.id + "-select");
    $listItems.each(function(index, element) {
        const $selectItem = $($selectItems.get(index));
        const itemString = $selectItem.val();
        list[index] = comp.getItemValue(itemString);
        $(element).data("value", list[index]);
    });

    this.callChangeListeners();
    this.setValueVerify(list);
};



GuiPropertySelectListComponent.prototype.itemAppended = function($newItem, newValue) {
//    logit(this._constructorName + " New value: " + JSON.stringify(newValue));
    $newItem.find("select").val("" + newValue);
};


GuiPropertySelectListComponent.prototype.removeOption = function(value, newValueIfCurrent) {
    const $theOption = this.$component.find("option").filter("[value=\"" + value + "\"]");
    $theOption.remove();
    this.setValueVerifyRaw();
};

GuiPropertySelectListComponent.prototype.changeOption = function(oldValue, newValue, newDisplayValue) {
    const $theOptions = this.$component.find("option").filter("[value=\"" + oldValue + "\"]");

    // logit("Changing options " + $theOptions.size() + "<br />");
    $theOptions.each(function(index, element) {
        element.innerHTML = newDisplayValue;
        const $theOption = $(element);
        $theOption.val(newValue);
    });
    this.setValueVerifyRaw();
};

GuiPropertySelectListComponent.prototype.addOption = function(value, displayValue) {

    const $selectItems = this.$component.find("." + this.id + "-select");

    const comp = this;
    $selectItems.each(function(index, element) {
        const resultArr = [];
        const $selectItem = $(element);
        const optionCount = $selectItem.find("option").size();
        comp.getOptionHtml(resultArr, value, displayValue, optionCount - 1);
        const $newOption = $(resultArr.join(''));
        $selectItem.append($newOption);
    });

};





function GuiPropertySliderComponent(object, propertyInfo) {
    GuiPropertyComponent.call(this, object, propertyInfo);
    this.$input = null;
    this.$label = null;
    this.inputTag = "span";
    this.setUniqueId();
    this._constructorName = "GuiPropertySliderComponent";
}

GuiPropertySliderComponent.prototype = new GuiPropertyComponent();


GuiPropertySliderComponent.prototype.gatherAlignmentInfo = function(info) {
    info.setVerticalOffset(0, this.$label.outerWidth());
};

GuiPropertySliderComponent.prototype.setAlignment = function(info) {
    const labelWidth = this.$label.outerWidth();
    const labelOffset = info.getVerticalOffset(0);
    this.$label.css("padding-left", (labelOffset - labelWidth) + "px");
};


GuiPropertySliderComponent.prototype.resetAlignment = function() {
    this.$label.css("padding-left", "0px");
//    if (this.$valueType) {
//        this.$valueType.css("padding-left", "0px");
//    }
};



GuiPropertySliderComponent.prototype.getHtmlContentBeforeChildren = function(resultArr) {
    const inputId = this.id + "-input";
    const labelId = this.id + "-label";
    resultArr.push("<span ");
    //    resultArr.push("for=\"" + inputId + "\" ");
    resultArr.push("id=\"" + labelId + "\" ");
    resultArr.push(">")
    resultArr.push(this.propertyInfo.propertyCaption + "</span>");
    resultArr.push("<" + this.inputTag + " ");
//    resultArr.push("class=\"ui-corner-all\" ");
    resultArr.push("id=\"" + inputId + "\" ");
    resultArr.push(" />");
};

GuiPropertySliderComponent.prototype.setError = function(e, text) {
    logit("Error not implemented in GuiPropertySliderComponent");
};

GuiPropertySliderComponent.prototype.setValueVerifyRaw = function() {
    logit("GuiPropertySliderComponent must implement setValueVerifyRaw() <br />");
};


GuiPropertySliderComponent.prototype.jQueryCreated = function($localRoot) {
    JQueryComponent.prototype.jQueryCreated.call(this, $localRoot);

//    this.createValueTypeRadioButtons($localRoot);

    let comp = this;

    this.$input = this.$component.find("#" + this.id + "-input");
    this.$label = this.$component.find("#" + this.id + "-label");

    const wantedLabelPaddingRight = 10;

    const value = this.getValue();

    this.$input.slider({
        value: value,
        slide: function( event, ui ) {
            comp.setValueVerifyRaw();
        }
    });

    this.$label.css("padding-right", "0.7em");
    this.$input.css("width", "13em");

};
