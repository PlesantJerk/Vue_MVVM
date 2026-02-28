export class VMCollection extends Array
{
    #notify = null;
    #propertyName = null;

    // ownerOrNotify: VMBase instance (with notify) OR a function
    // propertyName: property name on the owner to notify
    // initial items can be passed after propertyName
    constructor(ownerOrNotify = null, propertyName = null, ...initialItems)
    {
        super(...initialItems);
        this.#propertyName = propertyName;
        this.setNotifyHandler(ownerOrNotify, propertyName);
    }

    static get [Symbol.species]()
    {
        // map/filter/etc return plain arrays by default
        return Array;
    }

    setNotifyHandler(ownerOrNotify = null, propertyName = null)
    {
        this.#propertyName = propertyName;

        if (typeof ownerOrNotify === "function")
        {
            this.#notify = ownerOrNotify;
        }
        else if (ownerOrNotify && typeof ownerOrNotify.notify === "function")
        {
            this.#notify = () => ownerOrNotify.notify(this.#propertyName);
        }
        else
        {
            this.#notify = null;
        }
    }

    notify()
    {
        if (this.#notify)
        {
            this.#notify();
        }
    }

    // WPF-style helpers
    add(item)
    {
        return this.push(item);
    }

    insert(index, item)
    {
        this.splice(index, 0, item);
        return this.length;
    }

    removeAt(index)
    {
        if (index < 0 || index >= this.length)
        {
            return null;
        }
        const removed = this.splice(index, 1);
        return removed.length ? removed[0] : null;
    }

    remove(item)
    {
        const index = this.indexOf(item);
        if (index >= 0)
        {
            this.splice(index, 1);
            return true;
        }
        return false;
    }

    clear()
    {
        if (this.length > 0)
        {
            this.length = 0;
            this.notify();
        }
    }

    setItem(index, item)
    {
        this[index] = item;
        this.notify();
    }

    // Array overrides that mutate
    push(...items)
    {
        const res = super.push(...items);
        this.notify();
        return res;
    }

    pop()
    {
        const res = super.pop();
        this.notify();
        return res;
    }

    shift()
    {
        const res = super.shift();
        this.notify();
        return res;
    }

    unshift(...items)
    {
        const res = super.unshift(...items);
        this.notify();
        return res;
    }

    splice(start, deleteCount, ...items)
    {
        const res = super.splice(start, deleteCount, ...items);
        this.notify();
        return res;
    }

    sort(compareFn)
    {
        const res = super.sort(compareFn);
        this.notify();
        return res;
    }

    reverse()
    {
        const res = super.reverse();
        this.notify();
        return res;
    }

    copyWithin(target, start, end)
    {
        const res = super.copyWithin(target, start, end);
        this.notify();
        return res;
    }

    fill(value, start, end)
    {
        const res = super.fill(value, start, end);
        this.notify();
        return res;
    }
}
