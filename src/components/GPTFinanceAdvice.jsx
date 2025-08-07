import React, { useState, useMemo } from "react";
import { generateGPTResponse } from "../utils/gpt";

export default function GPTFinanceWidget({ financeData }) {
  const [prompt,  setPrompt]  = useState("");
  const [answer,  setAnswer]  = useState("");
  const [loading, setLoading] = useState(false);

  /* ── build a detailed snapshot for GPT ───────────────────── */
  const snapshot = useMemo(() => {
    if (!financeData) return "";

    const {
      currentBal,
      incomeTotal,
      expenseTotal,
      expenseByCat,
      transactions,
    } = financeData;

    /* top‑5 categories by spend */
    const sortedCats = Object.entries(expenseByCat)
      .sort(([,a],[,b]) => b - a)
      .slice(0, 5);

    const catLines = sortedCats
      .map(
        ([c, v]) =>
          `• ${c}: $${v.toFixed(2)} (${((v / expenseTotal) * 100 || 0).toFixed(
            1
          )} %)`
      )
      .join("\n");

    /* income & expense examples */
    const incomeTx = transactions.filter(t => t.amount > 0).slice(0, 5);
    const expTx    = transactions.filter(t => t.amount < 0).slice(0, 5);

    const txFmt = t =>
      `${t.description}: ${t.amount > 0 ? "+" : "-"}$${Math.abs(
        t.amount
      ).toFixed(2)} (${t.category})`;

    return `
← SNAPSHOT →  (use these numbers in your reply)

Balance  : $${currentBal.toFixed(2)}
Income   : $${incomeTotal.toFixed(2)}
Expenses : $${expenseTotal.toFixed(2)}

Top expense categories:
${catLines || "• —"}

Example income transactions:
${incomeTx.map(txFmt).join("\n") || "• —"}

Example expense transactions:
${expTx.map(txFmt).join("\n") || "• —"}
`.trim();
  }, [financeData,]);

  /* ask GPT */
  async function handleAsk(e) {
    e.preventDefault();
    const q = prompt.trim();
    if (!q) return;

    setLoading(true);
    setAnswer("");
    try {
      const fullPrompt = `
You are a personal‑finance assistant.  
**You must quote or reference the dollar amounts, categories, or transactions from the snapshot below** when you give advice; avoid generic tips that ignore the numbers.

${snapshot}

USER QUESTION: ${q}
`;
      const text = await generateGPTResponse(fullPrompt);
      setAnswer(text);
    } catch (err) {
      console.error(err);
      setAnswer("⚠️ GPT request failed.");
    } finally {
      setLoading(false);
    }
  }

  /* UI */
  return (
    <section style={{ marginTop: "2rem" }}>

      <form onSubmit={handleAsk} style={{ display: "flex", gap: 8 }}>
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Type any budgeting / money question…"
          className="input"
          style={{ flex: 1 }}
        />
        <button
          type="submit"
          disabled={loading}
          className="btn btn-green"
          style={{ minWidth: 110 }}
        >
          {loading ? "…thinking" : "Analyze My Spending"}
        </button>
      </form>

      {answer && (
          <div className="gpt-output">
            {answer}
          </div>
      )}
    </section>
  );
}
