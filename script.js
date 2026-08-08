(() => {
  "use strict";

  const expressionEl = document.getElementById("expression");
  const resultEl = document.getElementById("result");
  const keysEl = document.getElementById("keys");

  let tokens = [];
  let justEvaluated = false;

  const OPERATORS = new Set(["+", "−", "×", "÷"]);



  function currentOperand() {

    const last = tokens[tokens.length - 1];
    return last !== undefined && !OPERATORS.has(last) ? last : "";
  }

  function render() {
    expressionEl.textContent = tokens.length ? tokens.join(" ") : "\u00A0";
    const operand = currentOperand();
    resultEl.textContent = operand !== "" ? operand : tokens.length ? "" : "0";
    resultEl.classList.remove("is-error");
  }

  function showError(message) {
    resultEl.textContent = message;
    resultEl.classList.add("is-error");
  }



  function inputDigit(digit) {
    if (justEvaluated) {
      tokens = [];
      justEvaluated = false;
    }
    const last = tokens[tokens.length - 1];
    if (last === undefined || OPERATORS.has(last)) {
      tokens.push(digit === "." ? "0." : digit);
    } else {
      if (digit === "." && last.includes(".")) return; 
      tokens[tokens.length - 1] = last + digit;
    }
    render();
  }

  function inputOperator(op) {
    if (tokens.length === 0) {
      // allow leading minus
      if (op === "−") {
        tokens.push("0", op);
        render();
      }
      return;
    }
    justEvaluated = false;
    const last = tokens[tokens.length - 1];
    if (OPERATORS.has(last)) {
      tokens[tokens.length - 1] = op; // replace operator
    } else {
      tokens.push(op);
    }
    render();
  }

  function inputPercent() {
    const last = tokens[tokens.length - 1];
    if (last === undefined || OPERATORS.has(last)) return;
    const value = parseFloat(last) / 100;
    tokens[tokens.length - 1] = trimNumber(value);
    render();
  }

  function backspace() {
    if (tokens.length === 0) return;
    const last = tokens[tokens.length - 1];
    if (OPERATORS.has(last) || last.length <= 1) {
      tokens.pop();
    } else {
      tokens[tokens.length - 1] = last.slice(0, -1);
    }
    justEvaluated = false;
    render();
  }

  function clearAll() {
    tokens = [];
    justEvaluated = false;
    render();
  }



  function trimNumber(num) {
    if (!isFinite(num)) throw new Error("Math error");
    
    const rounded = Math.round(num * 1e10) / 1e10;
    return String(rounded);
  }

  function toNumberTokens(list) {
    return list.map((t) => (OPERATORS.has(t) ? t : parseFloat(t)));
  }

  function evaluate(list) {
    if (list.length === 0) throw new Error("Empty expression");

    if (OPERATORS.has(list[list.length - 1])) {
      list = list.slice(0, -1);
    }
    if (list.length === 0) throw new Error("Empty expression");

    let nums = toNumberTokens(list);

    for (let i = 1; i < nums.length; i += 2) {
      const op = nums[i];
      if (op === "×" || op === "÷") {
        const a = nums[i - 1];
        const b = nums[i + 1];
        if (b === undefined || isNaN(a) || isNaN(b))
          throw new Error("Invalid expression");
        let value;
        if (op === "÷") {
          if (b === 0) throw new Error("Can't divide by zero");
          value = a / b;
        } else {
          value = a * b;
        }
        nums.splice(i - 1, 3, value);
        i -= 2;
      }
    }


    let total = nums[0];
    if (typeof total !== "number" || isNaN(total))
      throw new Error("Invalid expression");
    for (let i = 1; i < nums.length; i += 2) {
      const op = nums[i];
      const b = nums[i + 1];
      if (typeof b !== "number" || isNaN(b))
        throw new Error("Invalid expression");
      if (op === "+") total += b;
      else if (op === "−") total -= b;
      else throw new Error("Invalid expression");
    }

    return total;
  }

  function calculate() {
    if (tokens.length === 0) return;
    try {
      const value = evaluate(tokens);
      const formatted = trimNumber(value);
      expressionEl.textContent = tokens.join(" ") + " =";
      resultEl.textContent = formatted;
      resultEl.classList.remove("is-error");
      tokens = [formatted];
      justEvaluated = true;
    } catch (err) {
      showError(err.message || "Error");
      tokens = [];
      justEvaluated = true;
    }
  }


  function addRipple(button, x, y) {
    const rect = button.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.className = "ripple";
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${(x ?? rect.width / 2) - size / 2}px`;
    ripple.style.top = `${(y ?? rect.height / 2) - size / 2}px`;
    button.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());
  }

  function flashOperator(button) {
    document
      .querySelectorAll(".key--op.is-active")
      .forEach((b) => b.classList.remove("is-active"));
    if (button) button.classList.add("is-active");
  }

  keysEl.addEventListener("click", (e) => {
    const button = e.target.closest(".key");
    if (!button) return;

    const rect = button.getBoundingClientRect();
    addRipple(button, e.clientX - rect.left, e.clientY - rect.top);

    const { action, value } = button.dataset;

    switch (action) {
      case "number":
        inputDigit(value);
        flashOperator(null);
        break;
      case "decimal":
        inputDigit(".");
        break;
      case "operator":
        inputOperator(value);
        flashOperator(button);
        break;
      case "percent":
        inputPercent();
        break;
      case "delete":
        backspace();
        break;
      case "clear":
        clearAll();
        flashOperator(null);
        break;
      case "equals":
        calculate();
        flashOperator(null);
        break;
    }
  });

  window.addEventListener("keydown", (e) => {
    const key = e.key;
    if (/^[0-9]$/.test(key)) {
      inputDigit(key);
    } else if (key === ".") {
      inputDigit(".");
    } else if (key === "+" || key === "-") {
      inputOperator(key === "+" ? "+" : "−");
    } else if (key === "*") {
      inputOperator("×");
    } else if (key === "/") {
      e.preventDefault();
      inputOperator("÷");
    } else if (key === "%") {
      inputPercent();
    } else if (key === "Enter" || key === "=") {
      e.preventDefault();
      calculate();
    } else if (key === "Backspace") {
      backspace();
    } else if (key === "Escape") {
      clearAll();
    }
  });

  render();
})();
