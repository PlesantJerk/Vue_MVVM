import { VMBase } from "./vmbase.js";

export class VMInvoiceEntry extends VMBase
{
    static #cnt = 1;
    #invioce_id = 0;
    #amount = 100;
    #owner = null;
    constructor(owner, notifyHandler = null)
    {   
        super(notifyHandler);
        this.#owner = owner;
        this.#invioce_id = VMInvoiceEntry.#cnt++;
        this.#amount = 100;

        // display read/write text fields for these
        this.description = "Web Hosting";
        this.quantity = 1;  
    }

    // display readonly as "item number"
    get invoice_id()
    {
        return this.#invioce_id;
    }

    get amount()
    {
        return this.#amount;
    }

    set amount(val)
    {
        const num = Number(val);
        this.#amount = Number.isFinite(num) ? num : 0;
        if (this.#owner)
        {
            this.#owner.on_invoice_changed();
        }
        else
        {
            this.notify("amount");
        }
    }
}
