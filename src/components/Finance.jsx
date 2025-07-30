/* src/components/Finance.jsx */
import React, { useState } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import GPTFinanceWidget from "./GPTFinanceAdvice";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  Plus,
  Minus,
  ChevronDown,
} from "lucide-react";

// 🔥 ADDED
import { auth } from "../firebase/firebase-config";
import { db } from "../firebase/firestore-config";
import { doc, getDoc, setDoc } from "firebase/firestore";

/* ---------- colour map ---------- */
const COLOR_MAP = {
  Entertainment: "#3B82F6",
  Food: "#10B981",
  Transport: "#F59E0B",
  Education: "#8B5CF6",
  "Health and Wellness": "#EC4899",
  Other: "#64748B",
};

export default function Finance() {
  const [transactions, setTransactions] = useState([]);
  const [showTx, setShowTx] = useState(true);
  const [form, setForm] = useState({
    desc: "",
    amount: "",
    category: "Other",
  });

  const addTransaction = (asExpense = false) => {
    const amt = parseFloat(form.amount);
    if (!form.desc || Number.isNaN(amt)) return;

    setTransactions((prev) => [
      {
        id: prev.length + 1,
        description: form.desc,
        method: "Manual",
        date: new Date().toISOString().split("T")[0],
        amount: asExpense ? -Math.abs(amt) : Math.abs(amt),
        category: form.category,
        icon: asExpense ? <Minus size={16} /> : <Plus size={16} />,
      },
      ...prev,
    ]);

    setForm({ desc: "", amount: "", category: "Other" });
  };

  const incomeTotal = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const expenseTotal = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

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

  const saveTransactionsToFirestore = async () => {
  const user = auth.currentUser;
  if (!user) {
    alert("Please log in to save your finances.");
    return;
  }

  try {
    const userRef = doc(db, "users", user.uid);

    // Strip out the icon field before saving
    const cleanedTransactions = transactions.map(({ icon, ...rest }) => rest);

    await setDoc(userRef, { financeData: { transactions: cleanedTransactions } }, { merge: true });

    alert("Finance data saved!");
  } catch (err) {
    console.error("🔥 FIRESTORE SAVE ERROR:", err);
    alert("Something went wrong while saving.");
  }
};


  // 🔥 LOAD expenses from Firestore
  const loadTransactionsFromFirestore = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("Please log in to load your finances.");
      return;
    }

    try {
    const user = auth.currentUser;
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    const data = userSnap.data();
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

  return (
    <>
      <Navbar />

      <div className="finance-wrapper">
        <section className="balance-box">
          <h2>${currentBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
          <p style={{ color: "#4b5563" }}>Current Balance</p>

          <div className="balance-grid">
            <div>
              <p className="balance-income">
                ${incomeTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p style={{ fontSize: ".875rem", color: "#4b5563" }}>Income</p>
            </div>
            <div>
              <p className="balance-expense">
                ${expenseTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p style={{ fontSize: ".875rem", color: "#4b5563" }}>Expenses</p>
            </div>
          </div>

          <input
            value={form.desc}
            onChange={(e) => setForm({ ...form, desc: e.target.value })}
            placeholder="Description"
            className="input"
          />
          <input
            type="number"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="Amount"
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
            onClick={() => addTransaction(false)}
            className="btn btn-green"
            style={{ marginRight: ".5rem" }}
          >
            <Plus size={14} /> Income
          </button>
          <button onClick={() => addTransaction(true)} className="btn btn-red">
            <Minus size={14} /> Expense
          </button>

          {/* 🔥 Save/Load Buttons */}
          <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem", justifyContent: "center" }}>
            <button onClick={saveTransactionsToFirestore} className="btn btn-green">
              💾 Save Finances
            </button>
            <button onClick={loadTransactionsFromFirestore} className="btn btn-blue">
              📥 Load Finances
            </button>
          </div>
        </section>

        <div className="card-grid">
          <div className="card">
            <h3>Expenses by category</h3>
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
              <p style={{ textAlign: "center", padding: "2rem 0" }}>No expenses yet</p>
            )}

            {pieData.length > 0 && (
              <div className="legend">
                {pieData.map((p) => (
                  <span key={p.name}>
                    <svg width="10" height="10" style={{ marginRight: 4 }}>
                      <rect width="10" height="10" fill={p.color} />
                    </svg>
                    {p.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h3
              style={{ display: "flex", cursor: "pointer", userSelect: "none" }}
              onClick={() => setShowTx(!showTx)}
            >
              Last transactions
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
                {transactions.length === 0 && (
                  <p style={{ padding: "1rem", color: "#6b7280" }}>
                    No transactions yet
                  </p>
                )}

                {transactions.map((t) => (
                  <div key={t.id} className="txn">
                    <div style={{ display: "flex", gap: 12 }}>
                      <div className="txn-icon">{t.icon}</div>
                      <div className="txn-main">
                        <p style={{ fontSize: ".875rem" }}>{t.description}</p>
                        <p style={{ fontSize: ".75rem", color: "#6b7280" }}>{t.category}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p className={"txn-amt " + (t.amount > 0 ? "txn‑green" : "txn‑red")}>
                        {t.amount > 0 ? "+" : ""}
                        {t.amount.toFixed(2)}
                      </p>
                      <p style={{ fontSize: ".75rem", color: "#6b7280" }}>{t.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

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
