import { VMBase } from "./vmbase.js";
import { VMInvoiceEntry } from "./vminvoice_entry.js";
import { VMCollection } from "./vmcollection.js";

export class VMInvoice extends VMBase
{
    #id;
    #invoices;
    #total = 0;

    constructor(notifyHandler = null)
    {
        super(notifyHandler);
        this.#id = 1000;
        this.#invoices = new VMCollection(this, "invoices");
        // display these properties read/write text fields
        this.first_name = "Ben";
        this.last_name = "licht";
        this.company = "Skyweb Tech of Nyack";
        this.street_address = "276 South Boulevard";
        this.state = "NY";
        this.city = "Nyack";
        this.zip_code = "10960";        
    }

    // invoke when they hit add button
    add_invoice()
    {
        var entry = new VMInvoiceEntry(this, this.getNotifyHandler());
        var wrapped = VMBase.wrap(entry);
        this.#invoices.push(wrapped);
        this.on_invoice_changed();
        return wrapped;
    }

    // save button calls here
    save()
    {
        var data = JSON.stringify(this);
        console.log(data);
    }

    on_invoice_changed()
    {
        this.#total = 0;
        for (var i = 0; i < this.#invoices.length; i++)
        {
            this.#total += this.#invoices[i].amount;
        }
        this.notify("invoice_total");   
    }
    // display readonly "invoice #"
    get id()
    {
        return this.#id;
    }

    get invoices()
    {
        return this.#invoices;
    }

    get invoice_total()
    {
        return this.#total;
    }

}
