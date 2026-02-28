import { VMBase } from "./vmbase.js";

export class VMInvoiceEntry extends VMBase
{
    static #cnt = 1;
    #invioce_id = 0;
    #amount = 100;
    #owner = null;
    #quantity = 1;  
    total = 0;
    constructor(owner, notifyHandler = null)
    {   
        super(notifyHandler);
        this.#owner = owner;
        this.#invioce_id = VMInvoiceEntry.#cnt++;
        this.#amount = 100;

        // display read/write text fields for these
        this.description = "Web Hosting";    
        this.#update_total();    
    }

    // display readonly as "item number"
    get invoice_id()
    {
        return this.#invioce_id;
    }

    get quantity()
    {
        return this.#quantity;
    }

    #update_total()
    {
        this.total = this.#quantity * this.#amount;
        this.notify("total");
        this.#owner.on_invoice_changed();
    }

    set quantity(val)
    {        
        this.#quantity = super.toNumber(val);
        this.#update_total();
        this.notify("quantity");
    }


    get amount()
    {
        return this.#amount;
    }

    set amount(val)
    {
        this.#amount = super.toNumber(val);
        this.#update_total();
        this.notify("amount");
    }
}
