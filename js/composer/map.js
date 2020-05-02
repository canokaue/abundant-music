// Give credit to the one who coded this!

function MapClass(linkEntries) {
    this.current = undefined;
    this.size = 0;
    this.isLinked = true;
}

MapClass.prototype.link = function(entry) {
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

MapClass.prototype.unlink = function(entry) {
    if(this.size === 0)
        this.current = undefined;
    else {
        entry.prev.next = entry.next;
        entry.next.prev = entry.prev;
        if(entry === this.current)
            this.current = entry.next;
    }
};

MapClass.prototype.get = function(key) {
    const entry = this[this.hash(key)];
    return typeof entry === 'undefined' ? undefined : entry.value;
};

MapClass.prototype.put = function(key, value) {
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

MapClass.prototype.remove = function(key) {
    const hash = this.hash(key);

    if(this.hasOwnProperty(hash)) {
        --this.size;
        this.unlink(this[hash]);

        delete this[hash];
    }

    return this;
};

MapClass.prototype.removeAll = function() {
    while(this.size)
        this.remove(this.key());

    return this;
};

MapClass.prototype.contains = function(key) {
    return this.hasOwnProperty(this.hash(key));
};

MapClass.prototype.isUndefined = function(key) {
    const hash = this.hash(key);
    return this.hasOwnProperty(hash) ?
    typeof this[hash] === 'undefined' : false;
};

MapClass.prototype.next = function() {
    this.current = this.current.next;
};

MapClass.prototype.key = function() {
    return this.current.key;
};

MapClass.prototype.value = function() {
    return this.current.value;
};

MapClass.prototype.each = function(func, thisArg) {
    if(typeof thisArg === 'undefined')
        thisArg = this;

    for(let i = this.size; i--; this.next()) {
        const n = func.call(thisArg, this.key(), this.value(), i > 0);
        if(typeof n === 'number')
            i += n; // allows to add/remove entries in func
    }

    return this;
};

MapClass.prototype.flip = function(linkEntries) {
    const map = new MapClass(linkEntries);

    for(let i = this.size; i--; this.next()) {
        const value = this.value(), list = map.get(value);

        if(list) list.push(this.key());
        else map.put(value, [this.key()]);
    }

    return map;
};

MapClass.prototype.drop = function(func, thisArg) {
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

MapClass.prototype.listValues = function() {
    const list = [];

    for(let i = this.size; i--; this.next())
        list.push(this.value());

    return list;
}

MapClass.prototype.listKeys = function() {
    const list = [];

    for(let i = this.size; i--; this.next())
        list.push(this.key());

    return list;
}

MapClass.prototype.toString = function() {
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

MapClass.prototype.hash = function(value) {
    return value instanceof Object ? (value.__hash ||
        (value.__hash = 'object ' + ++arguments.callee.current)) :
    (typeof value) + ' ' + String(value);
};

MapClass.prototype.hash.current = 0;