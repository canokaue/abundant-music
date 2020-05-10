

class JQueryComponent {
    constructor() {
        this.$component = null;
        this.cssClassName = "component"; // Main class
        this.otherCssClasses = [];
        this.id = "";
        this.tagName = "div";
        this.children = [];
        this._constructorName = "JQueryComponent";
    }
    setUniqueId() {
        let counter = JQueryComponent.counters[this.cssClassName];
        if (!counter) {
            counter = 1;
        }
        else {
            counter++;
        }
        JQueryComponent.counters[this.cssClassName] = counter;
        this.id = this.cssClassName + "-" + counter;
    }
    hide() {
        this.$component.hide();
    }
    show() {
        this.$component.show();
    }
    addChild(c) {
        this.children.push(c);
    }
    addStartHtmlString(resultArr) {
        resultArr.push("<" + this.tagName + " " +
            "class=\"" + this.cssClassName + (this.otherCssClasses.length > 0 ? " " + this.otherCssClasses.join(" ") : "") + "\" " +
            (this.id ? "id=\"" + this.id + "\" " : "") +
            this.getTagAttributeString() +
            " >");
    }
    getTagAttributeString() {
        let result = "";
        const obj = {};
        this.getTagAttributes(obj);
        for (const atr in obj) {
            result += " " + atr + "=\"" + obj[atr] + " ";
        }
        return result;
    }
    getTagAttributes(obj) {
    }
    addEndHtmlString(resultArr) {
        resultArr.push("</" + this.tagName + ">");
    }
    spawn(parent) {
        const strings = [];
        this.createJQueryStrings(strings);
        const $item = $(strings.join(''));
        let $parentComponent = parent.$component;
        if (!$parentComponent) {
            $parentComponent = parent;
        }
        $parentComponent.append($item);
        this.jQueryCreated($parentComponent);
    }
    jQueryCreated($localRoot) {
        const selector = "." + this.cssClassName;
        if ($localRoot.is(selector)) {
            this.$component = $localRoot;
        }
        else {
            this.$component = $localRoot.find("." + this.cssClassName);
        }
        if (this.id) {
            this.$component = this.$component.filter("#" + this.id);
        }
        for (let i = 0; i < this.children.length; i++) {
            this.children[i].jQueryCreated($localRoot);
        }
    }
    createJQueryStrings(resultArr) {
        this.addStartHtmlString(resultArr);
        this.getHtmlContentBeforeChildren(resultArr);
        for (let i = 0; i < this.children.length; i++) {
            this.getHtmlContentBeforeChild(resultArr, i);
            this.children[i].createJQueryStrings(resultArr);
            this.getHtmlContentAfterChild(resultArr, i);
        }
        this.getHtmlContentAfterChildren(resultArr);
        this.addEndHtmlString(resultArr);
    }
    getHtmlContentBeforeChildren(resultArr) {
    }
    getHtmlContentAfterChildren(resultArr) {
    }
    getHtmlContentBeforeChild(resultArr, childIndex) {
    }
    getHtmlContentAfterChild(resultArr, childIndex) {
    }
    enable() {
    }
    disable() {
    }
}

JQueryComponent.prototype.counters = {}

class JQueryButton extends JQueryComponent {
    constructor(options) {
        super()
        this.tagName = "button";
        this.text = getValueOrDefault(options, "text", "");
        this.enableText = getValueOrDefault(options, "enableText", true);
        this.primaryIcon = getValueOrDefault(options, "primaryIcon", "");
        this.secondaryIcon = getValueOrDefault(options, "secondaryIcon", "");
        this.cssClassName = "jquery-button";
        this.setUniqueId();
        this.clickListeners = [];
        this._constructorName = "JQueryButton";
    }
    enable() {
        this.$component.button("enable");
    }
    disable() {
        this.$component.button("disable");
    }
    jQueryCreated($localRoot) {
        super.jQueryCreated($localRoot);
        const buttonOptions = {};
        buttonOptions.text = this.enableText;
        if (this.primaryIcon || this.secondaryIcon) {
            buttonOptions.icons = {};
            if (this.primaryIcon) {
                buttonOptions.icons["primary"] = this.primaryIcon;
            }
            if (this.secondaryIcon) {
                buttonOptions.icons["secondary"] = this.secondaryIcon;
            }
        }
        this.$component.button(buttonOptions);
        this.$component.click(this, this.buttonClick);
        //    logit("button " + this.$component.size() + " id: " + this.id);
    }
    buttonClick(event) {
        const button = event.data;
        $.each(button.clickListeners, function (key, value) {
            //        logit("bc data " + value.data + "<br />");
            value.clicked(value.data);
        });
        //    $.each(event, function(key, value) {
        //        logit(" " + key + ":" + value + "<br />");
        //    });
    }
    addClickListener(l) {
        this.clickListeners.push(l);
        return this;
    }
    getHtmlContentBeforeChildren(resultArr) {
        resultArr.push(this.text);
    }
}

class JQueryPanel extends JQueryComponent {
    constructor() {
        super()
        this._constructorName = "JQueryPanel";
    }
}

class JQueryListItem extends JQueryPanel{
    constructor() {
        super()
        this.cssClassName = "list-item";
        this.otherCssClasses.push("ui-widget-content");
        this.tagName = "li";
        this._constructorName = "JQueryListItem";
    }
}

class JQueryVerticalListItemDragHandle extends JQueryComponent {
    constructor() {
        super()
        this.iconClass = "ui-icon-carat-2-n-s";
        this.otherCssClasses.push("vertical-list-item-drag-handle");
        this._constructorName = "JQueryVerticalListItemDragHandle";
    }
    getHtmlContentBeforeChildren(resultArr) {
        resultArr.push("<span class='ui-icon " + this.iconClass + "'></span>");
    }
}

