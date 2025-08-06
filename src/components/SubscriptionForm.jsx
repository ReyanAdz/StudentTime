import React, { useState } from 'react';
import { useSubscriptions } from './useSubscriptions.jsx';
import { Button } from "../ui/button.jsx";
import { Card }  from "../ui/card.jsx";

export default function SubscriptionForm({ uid, addSub, rollForward }) {
  const [form, setForm] = useState({
    name: "",
    amount: "",
    frequency: "monthly",
    firstDue: new Date().toISOString().split("T")[0],
  });

  async function handleSubmit(e) {
    e.preventDefault();
    if (!uid) return alert("Log in first!");

    await addSub({
      ...form,
      amount: parseFloat(form.amount),
      firstDue: new Date(form.firstDue),
    });

    /* 🔄 immediately check if that new sub is already due
       (e.g. user picked a past date) */
    rollForward?.();

    setForm({ ...form, name: "", amount: "" });
  }

  return (
    <Card className="p-4 w-full max-w-md">
      <p style={{ color: "white" }}>Add Reoccuring Payments</p>
      <form onSubmit={handleSubmit} className="subscription-inputs">
        <input
          required
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          required
          type="number"
          step="0.01"
          placeholder="Amount"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
        />
        <select
          value={form.frequency}
          onChange={(e) => setForm({ ...form, frequency: e.target.value })}
        >
          <option value="monthly">Monthly</option>
          <option value="weekly">Weekly</option>
          <option value="yearly">Yearly</option>
        </select>
        <input
          type="date"
          value={form.firstDue}
          onChange={(e) => setForm({ ...form, firstDue: e.target.value })}
        />
        <Button type="submit" className="btn-green">Save</Button>
      </form>

    </Card>
  );
}