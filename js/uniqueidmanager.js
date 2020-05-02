
function UniqueIdManager() {
    this.listeners = {};
    this.uniqueIdInfos = {};

    this.globalListeners = [];
//var uniqueIdListener = {
//    uniqueIdAdded: function(owner, namespace, id) {
//    },
//    uniqueIdChanged: function(owner, namespace, oldId, newId) {
//    },
//    uniqueIdRemoved: function(owner, namespace, id) {
//    }
//}

}

UniqueIdManager.prototype.addGlobalUniqueIdListener = function(listener) {
    this.globalListeners.push(listener);
};


UniqueIdManager.prototype.addUniqueIdListener = function(namespace, listener) {
    let listenerArr = this.listeners[namespace];
    if (!listenerArr) {
        listenerArr = [];
        this.listeners[namespace] = listenerArr;
    }
    listenerArr.push(listener);
};

UniqueIdManager.prototype.removeUniqueIdListener = function(namespace, listener) {
    const listenerArr = this.listeners[namespace];
    if (listenerArr) {
        arrayDelete(listenerArr, listener);
    }
};


UniqueIdManager.prototype.uniqueIdAvailable = function(owner, namespace, testId) {
    const idInfos = this.uniqueIdInfos[namespace];
    if (!idInfos) {
        return true;
    }
    const existingOwner = idInfos.get(testId);
    if (existingOwner === owner) {
        return true;
    }
    if (typeof existingOwner === 'undefined') {
        return true;
    }
    return false;
};


UniqueIdManager.prototype.uniqueIdExists = function(owner, namespace, testId) {
    const idInfos = this.uniqueIdInfos[namespace];
    if (!idInfos) {
        return false;
    }
    return idInfos.has(testId);
};


UniqueIdManager.prototype.getNextUniqueId = function(namespace, prefix) {
    let counter = 1;
    const idInfos = this.uniqueIdInfos[namespace];
    while (true) {
        const testId = prefix + "" + counter;
        if (!idInfos || typeof idInfos.get(testId) === 'undefined') {
            return testId;
        }
        counter++;
    }
};

UniqueIdManager.prototype.getUniqueIds = function(namespace) {
    const idInfos = this.uniqueIdInfos[namespace];
    if (!idInfos) {
        return [];
    } else {
        return idInfos.keys();
    }
};

UniqueIdManager.prototype.getListeners = function(namespace) {
    const arr = this.listeners[namespace];
    return arr ? arr : [];
};

UniqueIdManager.prototype.addUniqueId = function(owner, namespace, newId) {
    //    logit("Adding unique id " + newId + " ns: " + namespace + "<br />");

    let idInfos = this.uniqueIdInfos[namespace];
    if (!idInfos) {
        idInfos = new Map();
        this.uniqueIdInfos[namespace] = idInfos;
    }
    if (typeof idInfos.get(newId) === 'undefined') {
        idInfos.set(newId, owner);
        //        logit("addUniqueId() called in uid manager. Listeners: " + this.getListeners(namespace) + "<br />");
        $.each(this.getListeners(namespace), function(key, value) {
            //            logit("Calling listener for id added in uid manager<br />");
            value.uniqueIdAdded(owner, namespace, newId);
        });
        for (let i=0; i<this.globalListeners.length; i++) {
            this.globalListeners[i].uniqueIdAdded(owner, namespace, newId);
        }
    } else {
        logit("id already existed in addUniqueId() " + namespace + " " + newId + "<br />");
    }
};

UniqueIdManager.prototype.changeUniqueId = function(owner, namespace, oldId, newId) {
    const idInfos = this.uniqueIdInfos[namespace];
    if (idInfos) {
        const oldOwner = idInfos.get(oldId);
        //        if (oldOwner == owner) {
        idInfos.delete(oldId);
        idInfos.set(newId, owner);
        $.each(this.getListeners(namespace), function(key, value) {
            value.uniqueIdChanged(owner, namespace, oldId, newId);
        });
        //        } else {
        //            logit("old owner not the same as new owner in changeUniqueId() " + namespace + " " + oldId + " " + newId + "<br />");
        //        }
    } else {
        logit("could not find any ids for namespace " + namespace + " in changeUniqueId()<br />");
    }
    for (let i=0; i<this.globalListeners.length; i++) {
        this.globalListeners[i].uniqueIdChanged(owner, namespace, oldId, newId);
    }

};

UniqueIdManager.prototype.removeUniqueId = function(namespace, id) {

    const idInfos = this.uniqueIdInfos[namespace];
    if (idInfos) {
        let owner = idInfos.get(id);
        if (typeof owner === 'undefined') {
            logit("owner not exist in removeUniqueId() " + namespace + " " + id + "<br />");
        } else {
            idInfos.delete(id);
            $.each(this.getListeners(namespace), function(key, value) {
                value.uniqueIdRemoved(owner, namespace, id);
            });
        }
    } else {
        logit("could not find any ids for namespace " + namespace + " in removeUniqueId()<br />");
    }

    for (let i=0; i<this.globalListeners.length; i++) {
        this.globalListeners[i].uniqueIdRemoved(owner, namespace, id);
    }

};

