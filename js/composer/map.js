// Give credit to the one who coded this!

function MapClass(linkEntries) {
    this.current = undefined;
    this.size = 0;
    this.isLinked = true;

    if(linkEntries === false)
        this.disableLinking();
}

MapClass.from = function(obj, foreignKeys, linkEntries) {
    const map = new MapClass(linkEntries);

    for(const prop in obj) {
        if(foreignKeys || obj.hasOwnProperty(prop))
            map.put(prop, obj[prop]);
    }

    return map;
};

MapClass.noop = function() {
    return this;
};

MapClass.illegal = function() {
    throw new Error('can\'t do this with unlinked maps');
};

MapClass.prototype.disableLinking = function() {
    this.isLinked = false;
    this.link = MapClass.noop;
    this.unlink = MapClass.noop;
    this.disableLinking = MapClass.noop;
    this.next = MapClass.illegal;
    this.key = MapClass.illegal;
    this.value = MapClass.illegal;
    this.removeAll = MapClass.illegal;
    this.each = MapClass.illegal;
    this.flip = MapClass.illegal;
    this.drop = MapClass.illegal;
    this.listKeys = MapClass.illegal;
    this.listValues = MapClass.illegal;

    return this;
};

MapClass.prototype.hash = function(value) {
    return value instanceof Object ? (value.__hash ||
        (value.__hash = 'object ' + ++arguments.callee.current)) :
    (typeof value) + ' ' + String(value);
};

MapClass.prototype.hash.current = 0;

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

MapClass.reverseIndexTableFrom = function(array, linkEntries) {
    const map = new MapClass(linkEntries);

    for(let i = 0, len = array.length; i < len; ++i) {
        const entry = array[i], list = map.get(entry);

        if(list) list.push(i);
        else map.put(entry, [i]);
    }

    return map;
};

MapClass.cross = function(map1, map2, func, thisArg) {
    let linkedMapClass, otherMapClass;

    if(map1.isLinked) {
        linkedMapClass = map1;
        otherMapClass = map2;
    }
    else if(map2.isLinked) {
        linkedMapClass = map2;
        otherMapClass = map1;
    }
    else MapClass.illegal();

    for(let i = linkedMapClass.size; i--; linkedMapClass.next()) {
        const key = linkedMapClass.key();
        if(otherMapClass.contains(key))
            func.call(thisArg, key, map1.get(key), map2.get(key));
    }

    return thisArg;
};

MapClass.uniqueArray = function(array) {
    const map = new MapClass;

    for(let i = 0, len = array.length; i < len; ++i)
        map.put(array[i]);

    return map.listKeys();
};

