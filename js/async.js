/*global setTimeout: false, console: false */
(function () {

    const async = {};

    // global on the server, window in the browser
    const root = this, previous_async = root.async;

    async.noConflict = () => {
        root.async = previous_async;
        return async;
    };

    //// cross-browser compatiblity functions ////

    const _forEach = (arr, iterator) => {
        if (arr.forEach) {
            return arr.forEach(iterator);
        }
        for (let i = 0; i < arr.length; i += 1) {
            iterator(arr[i], i, arr);
        }
    };

    const _map = (arr, iterator) => {
        if (arr.map) {
            return arr.map(iterator);
        }
        const results = [];
        _forEach(arr, (x, i, a) => {
            results.push(iterator(x, i, a));
        });
        return results;
    };

    const _reduce = (arr, iterator, memo) => {
        if (arr.reduce) {
            return arr.reduce(iterator, memo);
        }
        _forEach(arr, (x, i, a) => {
            memo = iterator(memo, x, i, a);
        });
        return memo;
    };

    const _keys = obj => {
        if (Object.keys) {
            return Object.keys(obj);
        }
        const keys = [];
        for (const k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    };

    //// exported async module functions ////

    //// nextTick implementation with browser-compatible fallback ////
    if (typeof process === 'undefined' || !(process.nextTick)) {
        async.nextTick = fn => {
            setTimeout(fn, 0);
        };
    }
    else {
        async.nextTick = process.nextTick;
    }

    async.forEach = (arr, iterator, callback) => {
        callback = callback || (() => {});
        if (!arr.length) {
            return callback();
        }
        let completed = 0;
        _forEach(arr, x => {
            iterator(x, err => {
                if (err) {
                    callback(err);
                    callback = () => {};
                }
                else {
                    completed += 1;
                    if (completed === arr.length) {
                        callback(null);
                    }
                }
            });
        });
    };

    async.forEachSeries = (arr, iterator, callback) => {
        callback = callback || (() => {});
        if (!arr.length) {
            return callback();
        }
        let completed = 0;
        const iterate = () => {
            iterator(arr[completed], err => {
                if (err) {
                    callback(err);
                    callback = () => {};
                }
                else {
                    completed += 1;
                    if (completed === arr.length) {
                        callback(null);
                    }
                    else {
                        iterate();
                    }
                }
            });
        };
        iterate();
    };

    async.forEachLimit = (arr, limit, iterator, callback) => {
        callback = callback || (() => {});
        if (!arr.length || limit <= 0) {
            return callback();
        }
        let completed = 0;
        let started = 0;
        let running = 0;

        (function replenish () {
            if (completed === arr.length) {
                return callback();
            }

            while (running < limit && started < arr.length) {
                started += 1;
                running += 1;
                iterator(arr[started - 1], err => {
                    if (err) {
                        callback(err);
                        callback = () => {};
                    }
                    else {
                        completed += 1;
                        running -= 1;
                        if (completed === arr.length) {
                            callback();
                        }
                        else {
                            replenish();
                        }
                    }
                });
            }
        })();
    };


    const doParallel = fn => (function() {
        const args = Array.prototype.slice.call(arguments);
        return fn.apply(null, [async.forEach].concat(args));
    });
    const doSeries = fn => (function() {
        const args = Array.prototype.slice.call(arguments);
        return fn.apply(null, [async.forEachSeries].concat(args));
    });


    const _asyncMap = (eachfn, arr, iterator, callback) => {
        const results = [];
        arr = _map(arr, (x, i) => ({
            index: i,
            value: x
        }));
        eachfn(arr, (x, callback) => {
            iterator(x.value, (err, v) => {
                results[x.index] = v;
                callback(err);
            });
        }, err => {
            callback(err, results);
        });
    };
    async.map = doParallel(_asyncMap);
    async.mapSeries = doSeries(_asyncMap);


    // reduce only has a series version, as doing reduce in parallel won't
    // work in many situations.
    async.reduce = (arr, memo, iterator, callback) => {
        async.forEachSeries(arr, (x, callback) => {
            iterator(memo, x, (err, v) => {
                memo = v;
                callback(err);
            });
        }, err => {
            callback(err, memo);
        });
    };
    // inject alias
    async.inject = async.reduce;
    // foldl alias
    async.foldl = async.reduce;

    async.reduceRight = (arr, memo, iterator, callback) => {
        const reversed = _map(arr, x => x).reverse();
        async.reduce(reversed, memo, iterator, callback);
    };
    // foldr alias
    async.foldr = async.reduceRight;

    const _filter = (eachfn, arr, iterator, callback) => {
        const results = [];
        arr = _map(arr, (x, i) => ({
            index: i,
            value: x
        }));
        eachfn(arr, (x, callback) => {
            iterator(x.value, v => {
                if (v) {
                    results.push(x);
                }
                callback();
            });
        }, err => {
            callback(_map(results.sort((a, b) => a.index - b.index), x => x.value));
        });
    };
    async.filter = doParallel(_filter);
    async.filterSeries = doSeries(_filter);
    // select alias
    async.select = async.filter;
    async.selectSeries = async.filterSeries;

    const _reject = (eachfn, arr, iterator, callback) => {
        const results = [];
        arr = _map(arr, (x, i) => ({
            index: i,
            value: x
        }));
        eachfn(arr, (x, callback) => {
            iterator(x.value, v => {
                if (!v) {
                    results.push(x);
                }
                callback();
            });
        }, err => {
            callback(_map(results.sort((a, b) => a.index - b.index), x => x.value));
        });
    };
    async.reject = doParallel(_reject);
    async.rejectSeries = doSeries(_reject);

    const _detect = (eachfn, arr, iterator, main_callback) => {
        eachfn(arr, (x, callback) => {
            iterator(x, result => {
                if (result) {
                    main_callback(x);
                    main_callback = () => {};
                }
                else {
                    callback();
                }
            });
        }, err => {
            main_callback();
        });
    };
    async.detect = doParallel(_detect);
    async.detectSeries = doSeries(_detect);

    async.some = (arr, iterator, main_callback) => {
        async.forEach(arr, (x, callback) => {
            iterator(x, v => {
                if (v) {
                    main_callback(true);
                    main_callback = () => {};
                }
                callback();
            });
        }, err => {
            main_callback(false);
        });
    };
    // any alias
    async.any = async.some;

    async.every = (arr, iterator, main_callback) => {
        async.forEach(arr, (x, callback) => {
            iterator(x, v => {
                if (!v) {
                    main_callback(false);
                    main_callback = () => {};
                }
                callback();
            });
        }, err => {
            main_callback(true);
        });
    };
    // all alias
    async.all = async.every;

    async.sortBy = (arr, iterator, callback) => {
        async.map(arr, (x, callback) => {
            iterator(x, (err, criteria) => {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, {value: x, criteria: criteria});
                }
            });
        }, (err, results) => {
            if (err) {
                return callback(err);
            }
            else {
                const fn = (left, right) => {
                    const a = left.criteria, b = right.criteria;
                    return a < b ? -1 : a > b ? 1 : 0;
                };
                callback(null, _map(results.sort(fn), x => x.value));
            }
        });
    };

    async.auto = (tasks, callback) => {
        callback = callback || (() => {});
        const keys = _keys(tasks);
        if (!keys.length) {
            return callback(null);
        }

        const results = {};

        const listeners = [];
        const addListener = fn => {
            listeners.unshift(fn);
        };
        const removeListener = fn => {
            for (let i = 0; i < listeners.length; i += 1) {
                if (listeners[i] === fn) {
                    listeners.splice(i, 1);
                    return;
                }
            }
        };
        const taskComplete = () => {
            _forEach(listeners.slice(0), fn => {
                fn();
            });
        };

        addListener(() => {
            if (_keys(results).length === keys.length) {
                callback(null, results);
                callback = () => {};
            }
        });

        _forEach(keys, k => {
            const task = (tasks[k] instanceof Function) ? [tasks[k]]: tasks[k];
            const taskCallback = function (err) {
                if (err) {
                    callback(err);
                    // stop subsequent errors hitting callback multiple times
                    callback = () => {};
                }
                else {
                    let args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    taskComplete();
                }
            };
            const requires = task.slice(0, Math.abs(task.length - 1)) || [];
            const ready = () => _reduce(requires, (a, x) => a && results.hasOwnProperty(x), true) && !results.hasOwnProperty(k);
            if (ready()) {
                task[task.length - 1](taskCallback, results);
            }
            else {
                const listener = () => {
                    if (ready()) {
                        removeListener(listener);
                        task[task.length - 1](taskCallback, results);
                    }
                };
                addListener(listener);
            }
        });
    };

    async.waterfall = (tasks, callback) => {
        callback = callback || (() => {});
        if (!tasks.length) {
            return callback();
        }
        const wrapIterator = iterator => (function(err) {
            if (err) {
                callback(err);
                callback = () => {};
            }
            else {
                const args = Array.prototype.slice.call(arguments, 1);
                const next = iterator.next();
                if (next) {
                    args.push(wrapIterator(next));
                }
                else {
                    args.push(callback);
                }
                async.nextTick(() => {
                    iterator.apply(null, args);
                });
            }
        });
        wrapIterator(async.iterator(tasks))();
    };

    async.parallel = (tasks, callback) => {
        callback = callback || (() => {});
        if (tasks.constructor === Array) {
            async.map(tasks, (fn, callback) => {
                if (fn) {
                    fn(function (err) {
                        let args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            const results = {};
            async.forEach(_keys(tasks), (k, callback) => {
                tasks[k](function (err) {
                    let args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, err => {
                callback(err, results);
            });
        }
    };

    async.series = (tasks, callback) => {
        callback = callback || (() => {});
        if (tasks.constructor === Array) {
            async.mapSeries(tasks, (fn, callback) => {
                if (fn) {
                    fn(function (err) {
                        let args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            const results = {};
            async.forEachSeries(_keys(tasks), (k, callback) => {
                tasks[k](function (err) {
                    let args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, err => {
                callback(err, results);
            });
        }
    };

    async.iterator = tasks => {
        const makeCallback = index => {
            class fn {
                constructor(...args) {
                    if (tasks.length) {
                        tasks[index].apply(null, args);
                    }
                    return fn.next();
                }

                static next() {
                    return (index < tasks.length - 1) ? makeCallback(index + 1): null;
                }
            }

            return fn;
        };
        return makeCallback(0);
    };

    async.apply = function (fn) {
        const args = Array.prototype.slice.call(arguments, 1);
        return function () {
            return fn.apply(
                null, args.concat(Array.prototype.slice.call(arguments))
            );
        };
    };

    const _concat = (eachfn, arr, fn, callback) => {
        let r = [];
        eachfn(arr, (x, cb) => {
            fn(x, (err, y) => {
                r = r.concat(y || []);
                cb(err);
            });
        }, err => {
            callback(err, r);
        });
    };
    async.concat = doParallel(_concat);
    async.concatSeries = doSeries(_concat);

    async.whilst = (test, iterator, callback) => {
        if (test()) {
            iterator(err => {
                if (err) {
                    return callback(err);
                }
                async.whilst(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.until = (test, iterator, callback) => {
        if (!test()) {
            iterator(err => {
                if (err) {
                    return callback(err);
                }
                async.until(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.queue = (worker, concurrency) => {
        let workers = 0;
        const q = {
            tasks: [],
            concurrency: concurrency,
            saturated: null,
            empty: null,
            drain: null,
            push: function (data, callback) {
                if(data.constructor !== Array) {
                    data = [data];
                }
                _forEach(data, task => {
                    q.tasks.push({
                        data: task,
                        callback: typeof callback === 'function' ? callback : null
                    });
                    if (q.saturated && q.tasks.length == concurrency) {
                        q.saturated();
                    }
                    async.nextTick(q.process);
                });
            },
            process: function () {
                if (workers < q.concurrency && q.tasks.length) {
                    const task = q.tasks.shift();
                    if(q.empty && q.tasks.length == 0) q.empty();
                    workers += 1;
                    worker(task.data, (...args) => {
                        workers -= 1;
                        if (task.callback) {
                            task.callback.apply(task, args);
                        }
                        if(q.drain && q.tasks.length + workers == 0) q.drain();
                        q.process();
                    });
                }
            },
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            }
        };
        return q;
    };

    const _console_fn = name => (function(fn) {
        const args = Array.prototype.slice.call(arguments, 1);
        fn.apply(null, args.concat([function (err) {
            const args = Array.prototype.slice.call(arguments, 1);
            if (typeof console !== 'undefined') {
                if (err) {
                    if (console.error) {
                        console.error(err);
                    }
                }
                else if (console[name]) {
                    _forEach(args, x => {
                        console[name](x);
                    });
                }
            }
        }]));
    });
    async.log = _console_fn('log');
    async.dir = _console_fn('dir');
    /*async.info = _console_fn('info');
    async.warn = _console_fn('warn');
    async.error = _console_fn('error');*/

    async.memoize = (fn, hasher) => {
        const memo = {};
        const queues = {};
        hasher = hasher || (x => x);
        const memoized = function () {
            const args = Array.prototype.slice.call(arguments);
            const callback = args.pop();
            const key = hasher.apply(null, args);
            if (key in memo) {
                callback.apply(null, memo[key]);
            }
            else if (key in queues) {
                queues[key].push(callback);
            }
            else {
                queues[key] = [callback];
                fn.apply(null, args.concat([function () {
                    memo[key] = arguments;
                    const q = queues[key];
                    delete queues[key];
                    for (let i = 0, l = q.length; i < l; i++) {
                      q[i].apply(null, arguments);
                    }
                }]));
            }
        };
        memoized.unmemoized = fn;
        return memoized;
    };

    async.unmemoize = fn => (...args) => (fn.unmemoized || fn).apply(null, args);

    // AMD / RequireJS
    if (typeof define !== 'undefined' && define.amd) {
        define('async', [], () => async);
    }
    // Node.js
    else if (typeof module !== 'undefined' && module.exports) {
        module.exports = async;
    }
    // included directly via <script> tag
    else {
        root.async = async;
    }

}());
