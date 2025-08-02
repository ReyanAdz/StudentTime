import React, { useState, useEffect, useCallback } from "react";
import { db } from "../firebase/firestore-config";
import {
  collection,
  query,
  where,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { Minus } from "lucide-react";

/**
 * useSubscriptions
 * @param uid        current user's UID
 * @param pushTxn    optional callback(txObj) -> void
 *                  (lets the parent immediately append the expense row)
 */
export function useSubscriptions(uid, pushTxn) {
  const [subs, setSubs] = useState([]);

  /* live Firestore listener */
  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, "subscriptions"), where("uid", "==", uid));
    const off = onSnapshot(q, (snap) =>
      setSubs(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return off;
  }, [uid]);

  /* CRUD helpers */
  const addSub = ({ name, amount, frequency, firstDue }) =>
    addDoc(collection(db, "subscriptions"), {
      uid,
      name,
      amount,
      frequency, // 'monthly' | 'weekly' | 'yearly'
      nextDue: Timestamp.fromDate(firstDue),
      createdAt: Timestamp.now(),
    });

  const removeSub = (id) => deleteDoc(doc(db, "subscriptions", id));

  /* roll any past-due subs forward */
  const rollForward = useCallback(async () => {
    if (!uid || !subs.length) return;
    const today = new Date();

    await Promise.all(
      subs.map(async (s) => {
        const due = s.nextDue.toDate();
        if (due > today) return; // not yet

        /* 1) write matching expense */
        const txnRef = await addDoc(collection(db, "transactions"), {
          uid,
          category: "Subscription",
          description: s.name,
          amount: -Math.abs(s.amount),
          date: Timestamp.fromDate(due),
          createdAt: Timestamp.now(),
        });

        /* 2) push to UI immediately (if callback provided) */
        pushTxn?.({
          id: txnRef.id,
          description: s.name,
          method: "Auto",
          date: due.toISOString().split("T")[0],
          amount: -Math.abs(s.amount),
          category: "Subscription",
          icon: <Minus size={16} />,
        });

        /* 3) advance nextDue */
        const next = new Date(due);
        switch (s.frequency) {
          case "weekly":
            next.setDate(next.getDate() + 7);
            break;
          case "yearly":
            next.setFullYear(next.getFullYear() + 1);
            break;
          default:
            next.setMonth(next.getMonth() + 1);
            break; // monthly
        }
        await updateDoc(doc(db, "subscriptions", s.id), {
          nextDue: Timestamp.fromDate(next),
        });
      })
    );
  }, [uid, subs, pushTxn]);

  return { subs, addSub, removeSub, rollForward };
}
