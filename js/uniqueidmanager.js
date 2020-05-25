
class UniqueIdManager {
    constructor() {
        this.listeners = {};
        this.uniqueIdInfos = {};
        this.globalListeners = [];
    }
    addGlobalUniqueIdListener(listener) {
        this.globalListeners.push(listener);
    }
    addUniqueIdListener(namespace, listener) {
        let listenerArr = this.listeners[namespace];
        if (!listenerArr) {
            listenerArr = [];
            this.listeners[namespace] = listenerArr;
        }
        listenerArr.push(listener);
    }
    removeUniqueIdListener(namespace, listener) {
        const listenerArr = this.listeners[namespace];
        if (listenerArr) {
            arrayDelete(listenerArr, listener);
        }
    }
    uniqueIdAvailable(owner, namespace, testId) {
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
    }
    uniqueIdExists(owner, namespace, testId) {
        const idInfos = this.uniqueIdInfos[namespace];
        if (!idInfos) {
            return false;
        }
        return idInfos.has(testId);
    }
    getNextUniqueId(namespace, prefix) {
        let counter = 1;
        const idInfos = this.uniqueIdInfos[namespace];
        while (true) {
            const testId = prefix + "" + counter;
            if (!idInfos || typeof idInfos.get(testId) === 'undefined') {
                return testId;
            }
            counter++;
        }
    }
    getUniqueIds(namespace) {
        const idInfos = this.uniqueIdInfos[namespace];
        if (!idInfos) {
            return [];
        }
        else {
            return idInfos.keys();
        }
    }
    getListeners(namespace) {
        const arr = this.listeners[namespace];
        return arr ? arr : [];
    }
    addUniqueId(owner, namespace, newId) {
        //    logit("Adding unique id " + newId + " ns: " + namespace + "<br />");
        let idInfos = this.uniqueIdInfos[namespace];
        if (!idInfos) {
            idInfos = new Map();
            this.uniqueIdInfos[namespace] = idInfos;
        }
        if (typeof idInfos.get(newId) === 'undefined') {
            idInfos.set(newId, owner);
            //        logit("addUniqueId() called in uid manager. Listeners: " + this.getListeners(namespace) + "<br />");
            $.each(this.getListeners(namespace), (key, value) => {
                //            logit("Calling listener for id added in uid manager<br />");
                value.uniqueIdAdded(owner, namespace, newId);
            });
            for (let i = 0; i < this.globalListeners.length; i++) {
                this.globalListeners[i].uniqueIdAdded(owner, namespace, newId);
            }
        }
        else {
            logit("id already existed in addUniqueId() " + namespace + " " + newId + "<br />");
        }
    }
    changeUniqueId(owner, namespace, oldId, newId) {
        const idInfos = this.uniqueIdInfos[namespace];
        if (idInfos) {
            idInfos.delete(oldId);
            idInfos.set(newId, owner);
            $.each(this.getListeners(namespace), (key, value) => {
                value.uniqueIdChanged(owner, namespace, oldId, newId);
            });
        }
        else {
            logit("could not find any ids for namespace " + namespace + " in changeUniqueId()<br />");
        }
        for (let i = 0; i < this.globalListeners.length; i++) {
            this.globalListeners[i].uniqueIdChanged(owner, namespace, oldId, newId);
        }
    }
    removeUniqueId(namespace, id) {
        const idInfos = this.uniqueIdInfos[namespace];
        if (idInfos) {
            let owner = idInfos.get(id);
            if (typeof owner === 'undefined') {
                logit("owner not exist in removeUniqueId() " + namespace + " " + id + "<br />");
            }
            else {
                idInfos.delete(id);
                $.each(this.getListeners(namespace), (key, value) => {
                    value.uniqueIdRemoved(owner, namespace, id);
                });
            }
        }
        else {
            logit("could not find any ids for namespace " + namespace + " in removeUniqueId()<br />");
        }
        for (let i = 0; i < this.globalListeners.length; i++) {
            this.globalListeners[i].uniqueIdRemoved(owner, namespace, id);
        }
    }
}
















