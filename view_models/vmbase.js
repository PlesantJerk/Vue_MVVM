import { ref } from "vue";

const _metaMap = new WeakMap();

function ensureMeta(target)
{
    let meta = _metaMap.get(target);
    if (!meta)
    {
        meta = {
            global: ref(0),
            props: new Map(),
            bound: new Map(),
            proxy: null
        };
        _metaMap.set(target, meta);
    }
    return meta;
}

function ensurePropRef(meta, prop)
{
    let r = meta.props.get(prop);
    if (!r)
    {
        r = ref(0);
        meta.props.set(prop, r);
    }
    return r;
}

function isTrackableProp(prop)
{
    return (typeof prop === "string" && !prop.startsWith("__"));
}

export class VMBase
{
    #notifyHandler = null;

    // notifyHandler: function(propertyNameOrNamesOrNull) { ... }
    // - string: single property name
    // - array of string: multiple property names
    // - null/undefined: global refresh
    constructor(notifyHandler = null)
    {
        this.#notifyHandler = notifyHandler;
    }

    setNotifyHandler(handler)
    {
        this.#notifyHandler = handler;
    }

    getNotifyHandler()
    {
        return this.#notifyHandler;
    }

    static wrap(target)
    {
        if (target === null || typeof target !== "object")
        {
            return target;
        }

        if (target.__isVMProxy === true)
        {
            return target;
        }

        const meta = ensureMeta(target);
        if (meta.proxy)
        {
            return meta.proxy;
        }

        const handler = {
            get(obj, prop, receiver)
            {
                if (prop === "__isVMProxy")
                {
                    return true;
                }
                if (prop === "__vmTarget")
                {
                    return obj;
                }

                if (isTrackableProp(prop))
                {
                    VMBase.#touch(obj, prop);
                }

                const value = Reflect.get(obj, prop, obj);

                if (typeof value === "function" && prop !== "constructor")
                {
                    let bound = meta.bound.get(value);
                    if (!bound)
                    {
                        bound = value.bind(obj);
                        meta.bound.set(value, bound);
                    }
                    return bound;
                }

                return value;
            },
            set(obj, prop, value, receiver)
            {
                const oldValue = Reflect.get(obj, prop, obj);
                const ok = Reflect.set(obj, prop, value, obj);
                if (!ok)
                {
                    return false;
                }

                if (isTrackableProp(prop) && oldValue !== value)
                {
                    if (typeof obj.notify === "function")
                    {
                        obj.notify(prop);
                    }
                    else
                    {
                        VMBase.#notifyInternal(obj, prop);
                    }
                }

                return true;
            }
        };

        const proxy = new Proxy(target, handler);
        meta.proxy = proxy;
        return proxy;
    }

    static #touch(target, prop)
    {
        const meta = ensureMeta(target);
        // global ref for full refresh
        meta.global.value;
        // per-property ref
        ensurePropRef(meta, prop).value;
    }

    static #notifyInternal(target, propertyNames)
    {
        const meta = ensureMeta(target);

        if (propertyNames === undefined || propertyNames === null)
        {
            meta.global.value++;
            return;
        }

        const list = Array.isArray(propertyNames) ? propertyNames : [propertyNames];
        for (const name of list)
        {
            if (name === undefined || name === null)
            {
                continue;
            }
            ensurePropRef(meta, name).value++;
        }
    }

    // passed in property name, array of names,
    // or null/undefined for global refresh request
    notify(propertyNames = null)
    {
        VMBase.#notifyInternal(this, propertyNames);

        if (this.#notifyHandler)
        {
            this.#notifyHandler(propertyNames ?? null);
        }
    }

    // string command name -> call method by name
    // or fallback to Clicked(command, ...args)
    DoCommand(command, ...args)
    {
        if (command === undefined || command === null)
        {
            return;
        }

        if (typeof command !== "string")
        {
            if (typeof command === "function")
            {
                return command.apply(this, args);
            }
            return;
        }

        if (command === "DoCommand")
        {
            return;
        }

        const fn = this[command];
        if (typeof fn === "function")
        {
            return fn.apply(this, args);
        }

        if (typeof this.Clicked === "function")
        {
            return this.Clicked(command, ...args);
        }
    }

    // override in derived VMs if you want a switch-based dispatcher
    Clicked(command, ...args)
    {
        // default: do nothing
    }

    toNumber(val)
    {
        const num = Number(val);
        return Number.isFinite(num) ? num : 0;
    }
}
