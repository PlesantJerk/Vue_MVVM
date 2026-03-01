export default class WaitHandle
{
  #promise = null
  #trigger = null;
  #name = "";
  auto_reset = true;

  constructor(sName, auto_reset = true) 
  {
    this.#name = sName.toLowerCase();
    this.auto_reset = auto_reset;
    this.reset();
  }


  get name() { return this.#name;  }

  async wait() { return this.#promise; }

  reset()
  {
    this.#promise = new Promise((resolve) => 
    {
      this.#trigger = resolve;  
    });

  }
  set() 
  { 
    this.#trigger?.(); 
    if (this.auto_reset)
        this.reset();
  }
}
