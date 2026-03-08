import { VMBase } from './VMBase.js';

export class VMDialog extends VMBase
{
    #EVT_CLOSE = "EVT_CLOSE";

    #template_name = "";
    #didCancel = false;
    title = '';
    constructor(templateName, title)
    {
        super();
        this.#template_name = templateName;        
        this.title = title;
    }

    get template_name() { return this.#template_name;}
        
    async waitForClose()
    {
        await this.waitForEvent(this.#EVT_CLOSE);
    }

    cancel()
    {
        if (this.canPressCancel())
        {
            this.#didCancel = true;
            this.setEvent(this.#EVT_CLOSE);
        }
    }

    ok()
    {
        if (this.canPressOk())
        {
            this.#didCancel = false;
            this.setEvent(this.#EVT_CLOSE);
        }
    }

    canPressOk()
    {
        return true;
    }

    canPressCancel()
    {
        return true;
    }

    get cancelled() { return this.#didCancel; }
    
}