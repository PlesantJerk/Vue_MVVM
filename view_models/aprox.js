class AProx
{
    #getters = new Map();
    #setters = new Map();
    #target = null;
    constructor(bp)
    {
        bp.set_proxy = (p)=> this.#target = p;
    }

    #set_target(target)
    {
        this.#target= target;
    }
    get(target,prop)
    {
        var ret = prop in target ? target[prop] : "Invalid Property";
        if (this.#getters.has(prop))
        {            
            ret = this.#getters.get(prop)(ret);
        }
        return ret;
    }

    set(target, prop, val)
    {
        var ret = prop in target;        
        if (ret) 
        {
            if (this.#setters.has(prop))
                val = this.#setters.get(prop)(target[prop], val);
            target[prop] = val;
        }
        return ret;
    }

    /**
     @params prop_name name of property
     @params callback function (val)=>return newValue
    */
    addGet(prop_name, callback)
    {
        this.#getters.set(prop_name, callback);
    }

    /**
     @params prop_name name of property
     @callback function (oldVal, newVal)=>return valueToSet
     */
    addSet(prop_name, callback)
    {
        this.#setters.set(prop_name, callback);
    }

    get target() { return this.#target; }

    static apply(target)
    {
        var bp={};
        var proxy_controller = new AProx(bp);
        var proxy_target = new Proxy(target, proxy_controller);        
        bp.set_proxy(proxy_target);
        return { proxy_controller, proxy_target }
    }    
}
