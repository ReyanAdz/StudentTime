// src/tests/Finance.test.jsx
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Finance from "../components/Finance";

describe("Finance", () => {
  test("renders Finance page and adds a transaction", () => {
    render(
      <MemoryRouter>
        <Finance />
      </MemoryRouter>
    );

    // Fill in the form using placeholders
    fireEvent.change(screen.getByPlaceholderText(/description/i), {
      target: { value: "Coffee" },
    });
    fireEvent.change(screen.getByPlaceholderText(/amount/i), {
      target: { value: "3.50" },
    });

    // Try clicking "Expense" button
    fireEvent.click(screen.getByRole("button", { name: /expense/i }));

    // Check if transaction appears (this part might need adjusting depending on your UI updates)
    expect(screen.getByText("Coffee")).toBeInTheDocument();
    expect(screen.getByText("-3.50")).toBeInTheDocument();
  });
});
