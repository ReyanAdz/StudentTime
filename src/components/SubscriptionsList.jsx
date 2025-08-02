// src/components/SubscriptionsList.jsx
import React from "react";
import { Button } from "../ui/button.jsx";
import { Card }   from "../ui/card.jsx";
import { format } from "date-fns";

/**
 * props
 *   subs      – array of subscription docs
 *   removeSub – helper to delete one (passed down from Finance)
 */
export default function SubscriptionsList({ subs = [], removeSub }) {
  if (!subs.length) {
    return <p className="mt-4 text-gray-500">No subscriptions yet.</p>;
  }

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-3">Your Reoccuring Payments</h3>
      <ul className="space-y-2">
        {subs.map((s) => (
          <li key={s.id} className="flex justify-between items-center">
            <span>
              {s.name} · ${s.amount.toFixed(2)} · next&nbsp;
              {format(s.nextDue.toDate(), "MMM d, yyyy")}
            </span>
            <Button onClick={() => removeSub(s.id)} className="text-red-500">
              Remove
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
