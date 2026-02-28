<script setup>
import { VMBase } from '../view_models/vmbase.js'
import { VMInvoice } from '../view_models/vminvoice.js'

const vm = VMBase.wrap(new VMInvoice())
</script>

<template>
  <div class="page">
    <h1>Invoice Editor</h1>

    <section class="card">
      <h2>Customer</h2>
      <div class="grid">
        <label>First Name <input v-model="vm.first_name" /></label>
        <label>Last Name <input v-model="vm.last_name" /></label>
        <label>Company <input v-model="vm.company" /></label>
        <label>Street <input v-model="vm.street_address" /></label>
        <label>City <input v-model="vm.city" /></label>
        <label>State <input v-model="vm.state" /></label>
        <label>Zip <input v-model="vm.zip_code" /></label>
      </div>
    </section>

    <section class="card">
      <div class="row between">
        <h2>Items</h2>
        <button @click="vm.DoCommand('add_invoice')">Add Item</button>
      </div>

      <table class="items">
        <thead>
          <tr>
            <th>#</th>
            <th>Description</th>
            <th>Quantity</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in vm.invoices" :key="item.invoice_id">
            <td>{{ item.invoice_id }}</td>
            <td><input v-model="item.description" /></td>
            <td>
              <input
                type="number"
                step="1"
                v-model.number="item.quantity"
              />
            </td>
            <td>
              <input
                type="number"
                step="0.01"
                v-model.number="item.amount"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="card totals">
      <div>Invoice # <strong>{{ vm.id }}</strong></div>
      <div>Total <strong>{{ vm.invoice_total.toFixed(2) }}</strong></div>
      <div class="row">
        <button @click="vm.DoCommand('save')">Save</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem 1rem 4rem;
}

h1 {
  margin-bottom: 1rem;
}

.card {
  background: #1c1c1c;
  border: 1px solid #333;
  border-radius: 10px;
  padding: 1rem;
  margin: 1rem 0;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.75rem 1rem;
}

.row {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.row.between {
  justify-content: space-between;
}

.items {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0.75rem;
}

.items th,
.items td {
  border-bottom: 1px solid #333;
  padding: 0.5rem;
  text-align: left;
}

.items input {
  width: 100%;
  padding: 0.35rem 0.5rem;
}

.totals {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

input {
  background: #111;
  border: 1px solid #333;
  border-radius: 6px;
  color: inherit;
}

button {
  background: #2d3b7c;
  border: none;
  color: white;
}
</style>
