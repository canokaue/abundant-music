

function GuiObjectListComponent(object, propertyInfo) {
    GuiAbstractListComponent.call(this, object, propertyInfo);
    this.$details = null;
    this.cssClassName = "object-list-panel";
    this.otherCssClasses.push("ui-widget-content");
    this.setUniqueId();

    this.setIds();

    this._constructorName = "GuiObjectListComponent";

    this.currentDetailComponent = null;

    const uiInfo = propertyInfo.uniqueIdInfo;
//    uiInfo.manager.addUniqueIdListener(uiInfo.namespace, this);
}

GuiObjectListComponent.prototype = new GuiAbstractListComponent();


GuiObjectListComponent.prototype.componentRemoved = function() {
    GuiAbstractListComponent.prototype.componentRemoved.call(this);
    const uiInfo = this.propertyInfo.uniqueIdInfo;
//    uiInfo.manager.removeUniqueIdListener(uiInfo.namespace, this);
    if (this.currentDetailComponent) {
        this.currentDetailComponent.componentRemoved();
    }
};



GuiObjectListComponent.prototype.getHtmlContentBeforeChildren = function(resultArr) {

    GuiAbstractListComponent.prototype.getHtmlContentBeforeChildren.call(this, resultArr);


    // Details panel
    resultArr.push("<div ");
    resultArr.push("id=\"" + this.detailsId + "\" ");
    resultArr.push(">\n");
    resultArr.push("</div>\n");

};


GuiObjectListComponent.prototype.jQueryCreated = function($localRoot) {
    GuiAbstractListComponent.prototype.jQueryCreated.call(this, $localRoot);

    this.$details = this.$component.find("#" + this.detailsId);
};

GuiObjectListComponent.prototype.itemAppended = function($newItem, newValue) {
    GuiAbstractListComponent.prototype.itemAppended.call(this, $newItem, newValue);
    this.callChangeListeners();
};


GuiObjectListComponent.prototype.deleteSelectedItems = function() {
    GuiAbstractListComponent.prototype.deleteSelectedItems.call(this);
    this.updateDetailsPanel();
    this.callChangeListeners();
};

GuiObjectListComponent.prototype.removeDetailComponent = function() {
    if (this.currentDetailComponent) {
        //        this.propertyInfo.

        this.currentDetailComponent.componentRemoved();
        this.currentDetailComponent = null;
    }
};


GuiObjectListComponent.prototype.updateDetailsPanel = function() {
    const selectedArr = this.getSelectedItems();
    const comp = this;
    const propInfo = this.propertyInfo;
    if (selectedArr.length == 1) {
        const item = selectedArr[0];

        const valueItem = $(item).data("value");

        if (valueItem) {
            this.$details.empty();
            // Create or get the details component
            //            logit("Creating details component with parentPropInfo " + propInfo + "<br />");

            let instanceText = null;
            const constructorInfos = propInfo.listInfo.constructorInfos;
            if (constructorInfos.length > 1) {
                for (let i=0; i<constructorInfos.length; i++) {
                    const ci = constructorInfos[i];
                    if (ci.nameIsConstructor && ci.name == valueItem._constructorName) {
                        instanceText = ci.text;
                        break;
                    }
                }
            }
            const newComponent = new GuiPropertiesComponent({
                propertyInfoProvider: propInfo.propertyInfoProvider,
                object: valueItem,
                parentPropertyInfo: propInfo,
                componentRegisters: propInfo.componentRegisters
            });

            const that = this;
            newComponent.changeListeners.push(
                function(c, oldValue, newValue) {
                    that.callChangeListeners();
                    const items = that.getSelectedItems();
                    for (let i=0; i<items.length; i++) {
                        const item = items[i];
                        const valueItem = $(item).data("value");
                        const rArr = [];
                        that.getListItemContentHtml(valueItem, rArr);
//                            logit("new item html " + rArr.join(""));
                        $(item).find(".object-list-item-content")[0].innerHTML = rArr.join("");
                    }
                }
            );

            this.$details.show();
            newComponent.spawn(this.$details);
            if (instanceText) {
                newComponent.$component.prepend($("<div><p>" + instanceText + "</p></div>"));
            }
            newComponent.alignComponents();

            // Make sure that the previous detail component knows about its removal
            this.removeDetailComponent();
            this.currentDetailComponent = newComponent;
            // Show the details
        }
    } else {
        // Hide all details
        this.$details.empty();
        this.removeDetailComponent();
    }
};


GuiObjectListComponent.prototype.listItemSelected = function(event, ui) {
    GuiAbstractListComponent.prototype.listItemSelected.call(this, event, ui);
    this.updateDetailsPanel();
};


GuiObjectListComponent.prototype.listItemUnselected = function(event, ui) {
    GuiAbstractListComponent.prototype.listItemUnselected.call(this, event, ui);
    this.updateDetailsPanel();
};

