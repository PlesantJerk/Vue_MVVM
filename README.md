# View Model Testing (VMBase + Vue)

This project demonstrates a **WPF‑style ViewModel pattern** in Vue. The `VMBase` class provides:

- **Property‑level notifications** (like `INotifyPropertyChanged`)
- **A Proxy wrapper** that lets Vue re‑render without computed hooks
- **A WPF‑style command dispatcher** (`DoCommand`) for button clicks
- **VMCollection** for collection change notifications

The goal is to keep ViewModels nearly identical to WPF/WinUI style code while still letting Vue render and update correctly.

---

## How VMBase Works

### 1) Proxy wrapper

Use `VMBase.wrap(vm)` when you create the VM. The proxy “touches” each property when Vue reads it, which registers a reactive dependency. When you later call `notify()` for that property, Vue automatically re‑renders.

```
import { VMBase } from './view_models/vmbase.js'
import { VMInvoice } from './view_models/vminvoice.js'

const vm = VMBase.wrap(new VMInvoice())
```

### 2) `notify()` supports: single, multiple, or global

```
this.notify("invoice_total")               // single property
this.notify(["invoice_total", "items"])     // multiple properties
this.notify()                              // global refresh
```

### 3) You only notify when Vue can’t detect changes

Because Vue does **not** observe private fields (`#total`, `#items`, etc.), those changes **must** call `notify()`.

Public fields or properties assigned directly *do not* need manual notify because Vue sees the assignment via the proxy.

---

## VMCollection (auto‑notify on collection changes)

Use `VMCollection` when you want collection mutations (push/splice/etc.) to automatically notify the owner VM.

```
import { VMCollection } from './view_models/vmcollection.js'

class VMInvoice extends VMBase
{
  #invoices

  constructor()
  {
    super()
    this.#invoices = new VMCollection(this, "invoices")
  }

  add_invoice(item)
  {
    this.#invoices.push(item)   // auto‑notify("invoices")
  }

  get invoices()
  {
    return this.#invoices
  }
}
```

Notes:
- `VMCollection` is array‑like and works with `v-for`.
- It auto‑notifies on common mutating methods (`push`, `splice`, `pop`, `shift`, `unshift`, `sort`, `reverse`, `fill`, `copyWithin`).
- If you assign by index, use `setItem(index, value)` or call `notify("invoices")` yourself.

---

## Example: Field that needs **no** notify

Public properties or direct assignments are detected by the proxy automatically:

```
class VMCustomer extends VMBase
{
  constructor()
  {
    super()
    this.first_name = "Ben"  // no notify needed
  }

  updateName(val)
  {
    this.first_name = val    // no notify needed
  }
}
```

---

## Example: Private field that **does** need notify

Vue can’t see private fields, so you must call `notify()`:

```
class VMBalance extends VMBase
{
  #amount = 0

  deposit(val)
  {
    this.#amount += val
    this.notify("amount")
  }

  get amount()
  {
    return this.#amount
  }
}
```

---

## Example: Button click → VM method

Vue calls `DoCommand("methodName")`, which routes to the ViewModel method of the same name.

**Vue**
```
<button @click="vm.DoCommand('add_invoice')">Add Item</button>
```

**ViewModel**
```
class VMInvoice extends VMBase
{
  add_invoice()
  {
    // logic here
  }
}
```

If you prefer a dispatcher instead of direct method calls, override `Clicked()`:

```
class VMInvoice extends VMBase
{
  Clicked(command)
  {
    switch(command)
    {
      case "add_invoice":
        this.add_invoice()
        break
      case "save":
        this.save()
        break
    }
  }
}
```

---

## Summary

- Use **VMBase.wrap** once when constructing the VM
- Use **notify()** for private field changes
- Use **VMCollection** for auto‑notify on list changes
- Use **DoCommand()** for WPF‑style click routing

This keeps the Vue side almost “dumb” and keeps your VMs clean and close to C# MVVM style.
