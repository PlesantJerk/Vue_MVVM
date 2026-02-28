# LLM Guide: Vue MVVM Pattern (VMBase)

This project uses a **WPF‑style MVVM pattern** in Vue. The goal is to keep ViewModel (VM) logic **framework‑agnostic** and minimize Vue‑specific code inside templates/components.

If you are an LLM asked to extend this app, you **must**:

1) Create **new features as separate ViewModels** that **inherit from `VMBase`**.
2) Wrap any VM instance with `VMBase.wrap(...)` in Vue.
3) Use `notify()` for **private fields** (`#field`) or any data Vue cannot observe.
4) Use `DoCommand()` for UI actions instead of calling VM methods directly.

---

## Why this pattern exists

Vue does not track private fields (`#field`) and will not re‑render unless a reactive dependency is accessed during render. `VMBase.wrap()` creates a Proxy that “touches” properties so Vue can track dependencies, and `notify()` triggers per‑property refreshes.

---

## Required usage in Vue

**Every VM must be wrapped** using this pattern:

```
import { VMBase } from '../view_models/vmbase.js'
import { VMInvoice } from '../view_models/vminvoice.js'

const vm = VMBase.wrap(new VMInvoice())
```

Do **not** use `reactive()` or `computed()` for VM properties. The Proxy + notify system replaces that.

---

## VMBase source reference

If you need to recreate or compare the base class, the reference source is here:

https://github.com/PlesantJerk/Vue_MVVM/blob/master/view_models/vmbase.js

---

## Notify rules (critical)

### ✅ When you do NOT need notify
Public properties assigned directly are tracked by the proxy automatically:

```
class VMCustomer extends VMBase
{
  constructor()
  {
    super()
    this.first_name = "Ben"   // no notify needed
  }

  updateName(val)
  {
    this.first_name = val     // no notify needed
  }
}
```

### ✅ When you MUST call notify
If you update **private fields** (`#total`, `#items`, etc.) you **must** call notify.

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

You can also notify multiple or globally:

```
this.notify("amount")
this.notify(["amount", "items"])
this.notify()  // global refresh
```

---

## Command routing (UI → VM)

UI actions should call `DoCommand("methodName")`.

**Vue example**
```
<button @click="vm.DoCommand('add_invoice')">Add Item</button>
```

**VM example**
```
class VMInvoice extends VMBase
{
  add_invoice()
  {
    // logic here
  }
}
```

If you prefer a single command dispatcher, override `Clicked(command, ...args)` in the VM.

---

## Implementation checklist for new features

When adding a new feature, follow this pattern:

1) Create a new VM class in `view_models/` that **extends `VMBase`**.
2) Use public properties for fields you want Vue to auto‑track.
3) Use private fields for internal state and call `notify()` when they change.
4) In Vue, create a single wrapped instance:

```
const vm = VMBase.wrap(new YourViewModel())
```

5) Bind UI directly to `vm` properties and use `vm.DoCommand('...')` for clicks.

---

## Summary

This project uses a **VM‑first** architecture. Keep Vue simple. Let the ViewModels own behavior, and use `VMBase` to bridge change notifications into Vue.
