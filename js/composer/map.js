// Give credit to the one who coded this!

function LinkedMap(linkEntries) {
    this.current = undefined;
    this.size = 0;
    this.isLinked = true;
}

LinkedMap.prototype.link = function(entry) {
    if(this.size === 0) {
        entry.prev = entry;
        entry.next = entry;
        this.current = entry;
    }
    else {
        entry.prev = this.current.prev;
        entry.prev.next = entry;
        entry.next = this.current;
        this.current.prev = entry;
    }
};

LinkedMap.prototype.unlink = function(entry) {
    if(this.size === 0)
        this.current = undefined;
    else {
        entry.prev.next = entry.next;
        entry.next.prev = entry.prev;
        if(entry === this.current)
            this.current = entry.next;
    }
};

LinkedMap.prototype.get = function(key) {
    const entry = this[this.hash(key)];
    return typeof entry === 'undefined' ? undefined : entry.value;
};

LinkedMap.prototype.put = function(key, value) {
    const hash = this.hash(key);

    if(this.hasOwnProperty(hash))
        this[hash].value = value;
    else {
        const entry = {
            key : key,
            value : value
        };
        this[hash] = entry;

        this.link(entry);
        ++this.size;
    }

    return this;
};

LinkedMap.prototype.remove = function(key) {
    const hash = this.hash(key);

    if(this.hasOwnProperty(hash)) {
        --this.size;
        this.unlink(this[hash]);

        delete this[hash];
    }

    return this;
};

LinkedMap.prototype.removeAll = function() {
    while(this.size)
        this.remove(this.key());

    return this;
};

LinkedMap.prototype.contains = function(key) {
    return this.hasOwnProperty(this.hash(key));
};

LinkedMap.prototype.isUndefined = function(key) {
    const hash = this.hash(key);
    return this.hasOwnProperty(hash) ?
    typeof this[hash] === 'undefined' : false;
};

LinkedMap.prototype.next = function() {
    this.current = this.current.next;
};

LinkedMap.prototype.key = function() {
    return this.current.key;
};

LinkedMap.prototype.value = function() {
    return this.current.value;
};

LinkedMap.prototype.each = function(func, thisArg) {
    if(typeof thisArg === 'undefined')
        thisArg = this;

    for(let i = this.size; i--; this.next()) {
        const n = func.call(thisArg, this.key(), this.value(), i > 0);
        if(typeof n === 'number')
            i += n; // allows to add/remove entries in func
    }

    return this;
};

LinkedMap.prototype.flip = function(linkEntries) {
    const map = new LinkedMap(linkEntries);

    for(let i = this.size; i--; this.next()) {
        const value = this.value(), list = map.get(value);

        if(list) list.push(this.key());
        else map.put(value, [this.key()]);
    }

    return map;
};

LinkedMap.prototype.drop = function(func, thisArg) {
    if(typeof thisArg === 'undefined')
        thisArg = this;

    for(let i = this.size; i--; ) {
        if(func.call(thisArg, this.key(), this.value())) {
            this.remove(this.key());
            --i;
        }
        else this.next();
    }

    return this;
};

LinkedMap.prototype.listValues = function() {
    const list = [];

    for(let i = this.size; i--; this.next())
        list.push(this.value());

    return list;
}

LinkedMap.prototype.listKeys = function() {
    const list = [];

    for(let i = this.size; i--; this.next())
        list.push(this.key());

    return list;
}

LinkedMap.prototype.toString = function() {
    let string = '[object MapClass';

    function addEntry(key, value, hasNext) {
        string += '    { ' + this.hash(key) + ' : ' + value + ' }' +
        (hasNext ? ',' : '') + '\n';
    }

    if(this.isLinked && this.size) {
        string += '\n';
        this.each(addEntry);
    }

    string += ']';
    return string;
};

LinkedMap.prototype.hash = function(value) {
    return value instanceof Object ? (value.__hash ||
        (value.__hash = 'object ' + ++arguments.callee.current)) :
    (typeof value) + ' ' + String(value);
};

LinkedMap.prototype.hash.current = 0;