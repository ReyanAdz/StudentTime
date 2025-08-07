import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import GPTFinanceWidget from "./GPTFinanceAdvice";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Plus, Minus, ChevronDown } from "lucide-react";

import { auth } from "../firebase/firebase-config";
import { db } from "../firebase/firestore-config";
import { doc, getDoc, setDoc } from "firebase/firestore";

import { useSubscriptions } from "./useSubscriptions.jsx";
import SubscriptionsList from "./SubscriptionsList";
import SubscriptionForm from "./SubscriptionForm";

import entertainmentIcon from "../assets/entertainment.png";
import transportIcon from "../assets/transportation.png";
import educationIcon from "../assets/education.jpeg";
import foodIcon from "../assets/food.png";
import incomeIcon from "../assets/moneysign.png";
import reoccuringpaymentIcon from "../assets/reoccuringpayment.png";
import healthIcon from "../assets/health.png";
import otherIcon from "../assets/other.png";

const ICON_MAP = {
  Entertainment: entertainmentIcon,
  Transport: transportIcon,
  Education: educationIcon,
  Food: foodIcon,
  Income: incomeIcon,
  "Health and Wellness": healthIcon,
  ReoccuringPayment: reoccuringpaymentIcon,
  Other: otherIcon
};

/* ---------- colour map ---------- */
const COLOR_MAP = {
  Entertainment: "#3B82F6",
  Food: "#10B981",
  Transport: "#F59E0B",
  Education: "#8B5CF6",
  "Health and Wellness": "#EC4899",
  Subscription: "#F87171",
  Other: "#64748B",
};

export default function Finance() {
  /* manual transactions */
  const [transactions, setTransactions] = useState([]);
  const [showTx, setShowTx] = useState(true);
  const [form, setForm] = useState({ desc: "", amount: "", category: "Other" });
  const [triedAdd, setTriedAdd] = useState(false);
  const [showAddSub, setShowAddSub] = useState(false);


  /* subscriptions */
  const uid = auth.currentUser?.uid;
  const { subs, addSub, removeSub, rollForward } = useSubscriptions(
    uid,
    (tx) => setTransactions((prev) => [tx, ...prev]) // push new expense instantly
  );

  /* run rollForward on mount & whenever subscriptions change */
  useEffect(() => {
    if (uid && subs.length) rollForward();
  }, [uid, subs, rollForward]);

  /* manual add */
  const addTransaction = (asExpense = false) => {
    setTriedAdd(true);
    const amt = parseFloat(form.amount);
    if (!form.desc || Number.isNaN(amt)) return;
    setTransactions((prev) => [
      {
        id: prev.length + 1,
        description: form.desc,
        method: "Manual",
        date: new Date().toISOString().split("T")[0],
        amount: asExpense ? -Math.abs(amt) : Math.abs(amt),
        category: asExpense ? form.category : "Income",
        icon: asExpense ? <Minus size={16} /> : <Plus size={16} />,
      },
      ...prev,
    ]);
    setForm({ desc: "", amount: "", category: "Other" });
    setTriedAdd(false);
  };

  /* totals & chart data */
  const incomeTotal = transactions
    .filter((t) => t.amount > 0)
    .reduce((s, t) => s + t.amount, 0);
  const expenseTotal = transactions
    .filter((t) => t.amount < 0)
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  const currentBal = incomeTotal - expenseTotal;

  const expenseByCat = transactions
    .filter((t) => t.amount < 0)
    .reduce((acc, t) => {
      const key = t.category || "Other";
      acc[key] = (acc[key] || 0) + Math.abs(t.amount);
      return acc;
    }, {});

  const pieData = Object.entries(expenseByCat).map(([name, value]) => ({
    name,
    value,
    color: COLOR_MAP[name] || COLOR_MAP.Other,
  }));

  const isAmountInvalid = form.amount !== "" && Number.isNaN(parseFloat(form.amount));
  const canAdd = form.desc.trim() !== "" && !Number.isNaN(parseFloat(form.amount));

  /* Firestore SAVE / LOAD  */
  const saveTransactionsToFirestore = async () => {
    const user = auth.currentUser;
    if (!user) return alert("Please log in to save your finances.");
    try {
      const cleaned = transactions.map(({ icon, ...rest }) => rest);
      await setDoc(
        doc(db, "users", user.uid),
        { financeData: { transactions: cleaned } },
        { merge: true }
      );
      alert("Finance data saved!");
    } catch (err) {
      console.error("FIRESTORE SAVE ERROR:", err);
      alert("Something went wrong while saving.");
    }
  };

  const loadTransactionsFromFirestore = async () => {
    const user = auth.currentUser;
    if (!user) return alert("Please log in to load your finances.");
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      const data = snap.data();
      if (data?.financeData?.transactions) {
        setTransactions(data.financeData.transactions);
        alert("Finance data loaded!");
      } else {
        alert("No saved data found.");
      }
    } catch (err) {
      console.error("Failed to load:", err);
      alert("Something went wrong while loading.");
    }
  };

  /* ─────────── UI ─────────── */
  return (
    <>
      <Navbar />

      <div className="finance-wrapper">
        {/* balance box */}
        <section className="balance-box">
          <div className="save-load-row">
            <button onClick={saveTransactionsToFirestore} className="btn btn-green">
              💾 Save Finances
            </button>
            <div style={{ flex: 1 }}></div>
            <button onClick={loadTransactionsFromFirestore} className="btn btn-blue">
              📥 Load Finances
            </button>
          </div>

          <h2>
            ${currentBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h2>
          <p style={{ color: "white" }}>Current Balance</p>

          <div className="balance-grid">
            <div>
              <p className="balance-income">
                ${incomeTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p style={{ fontSize: ".875rem", color: "white" }}>Income</p>
            </div>
            <div>
              <p className="balance-expense">
                ${expenseTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p style={{ fontSize: ".875rem", color: "white" }}>Expenses</p>
            </div>
          </div>

          <div className="finance-inputs">
          <input
            type="number"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="Amount"
            className="input"
            style={{
              border: triedAdd && isAmountInvalid ? "1px solid #dc2626" : undefined,
            }}
          />
          <input
            value={form.desc}
            onChange={(e) => setForm({ ...form, desc: e.target.value })}
            placeholder="Description"
            className="input"
          />
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="input"
          >
            {Object.keys(COLOR_MAP).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => addTransaction(false)}
            className="btn btn-green"
            disabled={!canAdd}
          >
            <Plus size={14} /> Income
          </button>
          <button
            type="button"
            onClick={() => addTransaction(true)}
            className="btn btn-red"
            disabled={!canAdd}
          >
            <Minus size={14} /> Expense
          </button>
        </div>
          {/* save / load */}
          <div
            style={{
              marginTop: "1rem",
              display: "flex",
              gap: "0.75rem",
              justifyContent: "center",
            }}
          >
          </div>
        </section>

        {/* Recurring Payments Section */}
       <div className="recurring-payments-box">
          <h3>Recurring Payments</h3>
          <SubscriptionsList subs={subs} removeSub={removeSub} />
          <div>
            {showAddSub ? (
              <SubscriptionForm
                uid={uid}
                addSub={addSub}
                rollForward={rollForward}
                onClose={() => setShowAddSub(false)}
              />
            ) : (
              <button onClick={() => setShowAddSub(true)} className="btn btn-green">
                + Add Subscription
              </button>
            )}
          </div>
        </div>


        {/* analytics & transactions */}
        <div className="card-grid">
          {/* pie chart card */}
          <div className="card">
            <p style={{ color: "white" }}>Expenses By Category</p>
            {pieData.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((p) => (
                      <Cell key={p.name} fill={p.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ textAlign: "center", padding: "2rem 0", color: "white" }}>
                No expenses yet
              </p>
            )}
          </div>

          {/* last transactions */}
          <div className="card">
            <h3
              style={{ display: "flex", cursor: "pointer", userSelect: "none", color: "white"}}
              onClick={() => setShowTx(!showTx)}
            >
              Last transactions
              <ChevronDown
                size={18}
                style={{
                  marginLeft: 4,
                  transition: "transform .2s",
                  transform: showTx ? "rotate(180deg)" : "rotate(0)",
                }}
              />
            </h3>

            {showTx && (
              <div className="txn-list">
                {transactions.length === 0 ? (
                  <p style={{ padding: "1rem", color: "white" }}>
                    No transactions yet
                  </p>
                ) : (
                  transactions.map((t, idx) => (
                    <div key={t.id ?? idx} className="txn" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", gap: 12 }}>
                        <div className="txn-icon">
                          <img
                            src={ICON_MAP[t.category] || otherIcon}
                            alt={t.category}
                            style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                          />
                        </div>

                        <div className="txn-main">
                          <p className="txn-desc">{t.description}</p>
                          <p style={{ fontSize: ".75rem", color: "#6b7280" }}>{t.category}</p>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p className={"txn-amt " + (t.amount > 0 ? "txn-green" : "txn-red")}>
                          {t.amount > 0 ? "+" : ""}
                          {t.amount.toFixed(2)}
                        </p>
                        <p style={{ fontSize: ".75rem", color: "#6b7280" }}>{t.date}</p>
                        <button
                          className="btn btn-grey"
                          style={{ fontSize: ".75rem", marginTop: "0.25rem" }}
                          onClick={() =>
                            setTransactions((prev) => prev.filter((_, i) => i !== idx))
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))

                )}
              </div>
            )}
          </div>
        </div>

        {/* GPT widget */}
        <GPTFinanceWidget
          financeData={{
            currentBal,
            incomeTotal,
            expenseTotal,
            expenseByCat,
            transactions,
          }}
        />
      </div>

      <Footer />
    </>
  );
}