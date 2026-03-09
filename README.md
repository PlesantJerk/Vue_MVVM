# VMBase - WPF-Style View Models in Vue.js

This project demonstrates a **WPF‑style ViewModel pattern** in Vue. The `VMBase` class provides:

- **Property‑level notifications** (like `INotifyPropertyChanged`)
- **A Proxy wrapper** that lets Vue re‑render without computed hooks
- **A WPF‑style command dispatcher** (`DoCommand`) for button clicks
- **VMCollection** for collection change notifications
- **Nested Reactivity** through a lazy `.wrapped` property cache

The goal is to keep ViewModels nearly identical to WPF/WinUI style code while still letting Vue render and update correctly.

---

## 1. The Basics (Start Here)

### Example 1: A Simple View Model

To use this architecture, your class must extend `VMBase`. Public properties are automatically reactive. Private fields (`#field`) are invisible to Vue, so you must call `this.notify('propertyName')` when you change them.

**The ViewModel (`VMUserProfile.js`)**
```javascript
import { VMBase } from './VMBase.js';

export class VMUserProfile extends VMBase {
    // 1. Public properties are automatically tracked
    firstName = "John";
    lastName = "Doe";

    // 2. Private fields need getters/setters and manual notification
    #age = 30;

    get age() {
        return this.#age;
    }

    set age(value) {
        if (this.#age !== value) {
            this.#age = value;
            this.notify('age'); // Tell Vue the age changed!
        }
    }

    // 3. UI Commands are just standard methods
    incrementAge() {
        this.age++; // Triggers the setter and notify()
    }
}
```

**The Vue Template (`UserProfile.vue`)**
```html
<template>
  <div>
    <h2>User Profile</h2>
    
    <!-- Bind directly to public properties -->
    <label>First Name:</label>
    <input v-model="vm.firstName" />

    <label>Last Name:</label>
    <input v-model="vm.lastName" />

    <!-- Bind to the getter/setter for the private field -->
    <label>Age: {{ vm.age }}</label>
    
    <!-- Use DoCommand to trigger ViewModel methods -->
    <button @click="vm.DoCommand('incrementAge')">Happy Birthday</button>
  </div>
</template>

<script setup>
import { VMUserProfile } from './VMUserProfile.js';

// Always use .wrapped to get the Vue-reactive version of your ViewModel
const vm = new VMUserProfile().wrapped;
</script>
```

---

### Example 2: Collections and Loops (`VMCollection`)

When you have an array of ViewModels, use `VMCollection`. It behaves exactly like an array but automatically tells the UI to re-render when items are added or removed.

**The Child ViewModel (`VMTask.js`)**
```javascript
import { VMBase } from './VMBase.js';

export class VMTask extends VMBase {
    name = '';
    
    constructor(name) {
        super();
        this.name = name;
    }
}
```

**The Parent ViewModel (`VMTaskList.js`)**
```javascript
import { VMBase } from './VMBase.js';
import { VMCollection } from './VMCollection.js';
import { VMTask } from './VMTask.js';

export class VMTaskList extends VMBase {
    // Pass 'this' and the property name 'tasks' so the collection knows who to notify
    tasks = new VMCollection(this, 'tasks'); 

    constructor() {
        super();
        this.tasks.addItem(new VMTask("Buy groceries"));
        this.tasks.addItem(new VMTask("Finish report"));
    }

    addTask(taskName) {
        if (taskName) {
            // addItem automatically triggers UI updates for the list!
            this.tasks.addItem(new VMTask(taskName)); 
        }
    }

    removeTask(task) {
        const idx = this.tasks.indexOf(task);
        if (idx > -1) {
            this.tasks.splice(idx, 1);
        }
    }
}
```

**The Vue Template (`TaskList.vue`)**
```html
<template>
  <div>
    <h2>Task List</h2>
    
    <ul>
      <!-- Loop directly through the VMCollection -->
      <li v-for="task in vm.tasks" :key="task.name">
        <span>{{ task.name }}</span>
        <!-- Pass the specific task object back to the parent command -->
        <button @click="vm.DoCommand('removeTask', task)">X</button>
      </li>
    </ul>

    <!-- Note: Local component state (like a temporary input string) can just use standard Vue refs -->
    <input v-model="newTaskName" placeholder="New Task..." />
    <button @click="vm.DoCommand('addTask', newTaskName); newTaskName = ''">Add</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { VMTaskList } from './VMTaskList.js';

const vm = new VMTaskList().wrapped;
const newTaskName = ref(''); // Purely local UI state
</script>
```

---

## 2. Advanced Architecture

### Dealing with Nested ViewModels (The `.wrapped` property)

Because `VMBase.wrap()` creates a shallow proxy, assigning a nested ViewModel to a property does not automatically make the inner ViewModel reactive. 

**Solution:** `VMBase` provides a `.wrapped` property getter that lazily creates and caches a proxy of itself. You should use this when exposing child ViewModels via properties so Vue can track them deeply.

```javascript
// In VMRoleManager.js
get selected_role_group() { 
    // Return the .wrapped proxy instead of the raw object
    return this.#selected_role_group?.wrapped; 
}

set selected_role_group(val) {
    this.#selected_role_group = val;
    this.notify('selected_role_group');
}
```

Now, in your Vue template, you can bind directly through the hierarchy without using `computed` properties:
```html
<input v-model="vm.role_manager.wrapped.selected_role_group.wrapped.name" />
```

### Modals and Dialogs (VMDialog)

The `VMDialog` class extends `VMBase` to provide a C#-style async modal experience. It uses an internal Promise (`waitForEvent`) so that a ViewModel can "pause" execution, wait for the user to interact with the UI, and then resume.

**The Dialog ViewModel**
A dialog ViewModel extends `VMDialog` and provides a `template_name`. The Vue layer will use this name to dynamically load the correct HTML template.

```javascript
import { VMDialog } from './VMDialog.js';

export class VMDialogNewRoleGroup extends VMDialog
{
    constructor() {
        // template_name, title
        super('dialog_new_role_group', 'Create New Role Group');
        this.group_name = '';       
    }

    // Called by the Vue UI when the OK button is clicked
    async ok() {
        // Do async work here...
        var res = await db.save(this.group_name);
        
        // Signal the base class to close the dialog
        super.ok();
        
        // Critical: Tell Vue the async operation finished and state changed
        super.notify(null);
    }

    // Dynamically enables/disables the OK button
    canPressOk() {
        return this.group_name && this.group_name !== '';
    }
}
```

**Spawning the Dialog**
In your parent ViewModel, you instantiate the dialog, set up a `.then()` to handle the result, and return the `.wrapped` instance to the Vue layer.

```javascript
createVMDialogNewRoleGroup()
{
    var dlg = new VMDialogNewRoleGroup();
    
    dlg.waitForClose().then((evt) => {
        if (!dlg.cancelled) {
            this.role_groups.addItem(new VMRoleGroup(dlg.group_name));
        }
    });
    
    // Crucial: Return the .wrapped proxy so Vue tracks inputs inside the dialog
    return dlg.wrapped;
}
```

**The Vue Dialog Host (`ModalHost.vue`)**
In the Vue layer, a single generic host component observes the active dialog and dynamically injects the correct template.

```html
<template>
  <div v-if="activeDialog" class="modal-backdrop">
    <div class="modal">
      <div class="modal-header">
        <h3>{{ activeDialog.title }}</h3>
      </div>
      
      <div class="modal-body">
         <!-- Dynamically render the component based on template_name -->
         <component :is="dialogRegistry[activeDialog.template_name]" :vm="activeDialog" />
      </div>
      
      <div class="modal-footer">
        <!-- Call the VM functions directly inline to ensure reactivity -->
        <button @click="activeDialog.canPressCancel() && activeDialog.DoCommand('cancel')">Cancel</button>
        <button @click="activeDialog.canPressOk() && activeDialog.DoCommand('ok')">OK</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import DialogNewRoleGroup from './DialogNewRoleGroup.vue';

const dialogRegistry = {
    'dialog_new_role_group': DialogNewRoleGroup
};

const props = defineProps({ activeDialog: Object });
</script>
```

---

## 3. Reference Summary

- Use **.wrapped** to bridge C# objects into Vue (`const vm = new MyVM().wrapped`).
- Use **.wrapped** inside getters to safely expose nested ViewModels.
- Use **notify('propertyName')** for private field changes (especially at the end of `async` methods).
- Use **VMCollection** for auto‑notify on list changes.
- Use **VMDialog** to orchestrate asynchronous modal flows entirely from the ViewModel.