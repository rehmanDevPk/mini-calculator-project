/**
 * Calculator — Full functionality
 * Supports: numbers, operators (+−×÷), decimal, percent, negate, backspace, clear, keyboard input
 */

(function () {
    'use strict';

    // ===== DOM References =====
    const displayCurrent    = document.getElementById('display-current');
    const displayExpression = document.getElementById('display-expression');
    const calculatorEl      = document.getElementById('calculator');
    const btnGrid           = document.querySelector('.btn-grid');

    // ===== State =====
    let currentInput   = '0';
    let previousInput  = '';
    let operator       = null;
    let shouldReset    = false;
    let lastExpression = '';

    // ===== Formatting =====
    function formatDisplay(value) {
        if (value === 'Error') return 'Error';

        const num = parseFloat(value);
        if (isNaN(num)) return value;

        // If the user is still typing a decimal (e.g. "3."), don't format
        if (value.endsWith('.')) return value;

        // Limit displayed digits to avoid overflow
        const str = value.toString();
        if (str.replace(/[^0-9]/g, '').length > 12) {
            return num.toExponential(6);
        }

        return value;
    }

    function updateDisplay() {
        const formatted = formatDisplay(currentInput);
        displayCurrent.textContent = formatted;

        // Shrink text when the display gets long
        if (formatted.length > 10) {
            displayCurrent.classList.add('shrink');
        } else {
            displayCurrent.classList.remove('shrink');
        }
    }

    function updateExpression(text) {
        displayExpression.textContent = text;
    }

    // ===== Operator symbol mapping =====
    const operatorSymbols = {
        '+': '+',
        '-': '−',
        '*': '×',
        '/': '÷'
    };

    // ===== Highlight active operator =====
    function highlightOperator(op) {
        document.querySelectorAll('.btn-accent').forEach(btn => {
            btn.classList.remove('active-operator');
            if (btn.dataset.value === op) {
                btn.classList.add('active-operator');
            }
        });
    }

    function clearOperatorHighlight() {
        document.querySelectorAll('.btn-accent').forEach(btn => {
            btn.classList.remove('active-operator');
        });
    }

    // ===== Core Actions =====

    function inputNumber(value) {
        if (shouldReset) {
            currentInput = value;
            shouldReset = false;
        } else {
            if (currentInput === '0' && value !== '.') {
                currentInput = value;
            } else {
                // Limit length
                if (currentInput.replace(/[^0-9]/g, '').length >= 15) return;
                currentInput += value;
            }
        }
        updateDisplay();
    }

    function inputDecimal() {
        if (shouldReset) {
            currentInput = '0.';
            shouldReset = false;
            updateDisplay();
            return;
        }
        if (!currentInput.includes('.')) {
            currentInput += '.';
        }
        updateDisplay();
    }

    function inputOperator(op) {
        if (operator && !shouldReset) {
            calculate();
        }
        previousInput = currentInput;
        operator = op;
        shouldReset = true;

        const symbol = operatorSymbols[op] || op;
        updateExpression(`${previousInput} ${symbol}`);
        highlightOperator(op);
    }

    function calculate() {
        if (!operator || previousInput === '') return;

        const prev = parseFloat(previousInput);
        const curr = parseFloat(currentInput);
        let result;

        switch (operator) {
            case '+': result = prev + curr; break;
            case '-': result = prev - curr; break;
            case '*': result = prev * curr; break;
            case '/':
                if (curr === 0) {
                    triggerError();
                    return;
                }
                result = prev / curr;
                break;
            default: return;
        }

        // Round to avoid floating point issues
        result = Math.round(result * 1e12) / 1e12;

        const symbol = operatorSymbols[operator] || operator;
        lastExpression = `${previousInput} ${symbol} ${currentInput} =`;
        updateExpression(lastExpression);

        currentInput = result.toString();
        operator = null;
        previousInput = '';
        shouldReset = true;

        clearOperatorHighlight();
        updateDisplay();
        flashResult();
    }

    function clearAll() {
        currentInput = '0';
        previousInput = '';
        operator = null;
        shouldReset = false;
        lastExpression = '';
        clearOperatorHighlight();
        updateDisplay();
        updateExpression('');
    }

    function backspace() {
        if (shouldReset) return;
        if (currentInput.length <= 1 || (currentInput.length === 2 && currentInput.startsWith('-'))) {
            currentInput = '0';
        } else {
            currentInput = currentInput.slice(0, -1);
        }
        updateDisplay();
    }

    function percent() {
        const num = parseFloat(currentInput);
        if (isNaN(num)) return;
        currentInput = (num / 100).toString();
        updateDisplay();
    }

    function negate() {
        if (currentInput === '0') return;
        if (currentInput.startsWith('-')) {
            currentInput = currentInput.slice(1);
        } else {
            currentInput = '-' + currentInput;
        }
        updateDisplay();
    }

    // ===== Visual Effects =====

    function flashResult() {
        displayCurrent.classList.remove('flash');
        // Force reflow
        void displayCurrent.offsetWidth;
        displayCurrent.classList.add('flash');
    }

    function triggerError() {
        currentInput = 'Error';
        operator = null;
        previousInput = '';
        shouldReset = true;
        clearOperatorHighlight();
        updateDisplay();
        updateExpression('Cannot divide by zero');

        calculatorEl.classList.remove('shake');
        void calculatorEl.offsetWidth;
        calculatorEl.classList.add('shake');

        setTimeout(() => {
            calculatorEl.classList.remove('shake');
        }, 500);
    }

    // ===== Ripple position tracking =====
    function setRipplePosition(btn, e) {
        const rect = btn.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        btn.style.setProperty('--ripple-x', `${x}%`);
        btn.style.setProperty('--ripple-y', `${y}%`);
    }

    // ===== Button Click Handler =====
    btnGrid.addEventListener('click', function (e) {
        const btn = e.target.closest('.btn');
        if (!btn) return;

        setRipplePosition(btn, e);

        const action = btn.dataset.action;
        const value  = btn.dataset.value;

        switch (action) {
            case 'number':   inputNumber(value);   break;
            case 'decimal':  inputDecimal();        break;
            case 'operator': inputOperator(value);  break;
            case 'equals':   calculate();           break;
            case 'clear':    clearAll();            break;
            case 'backspace': backspace();           break;
            case 'percent':  percent();             break;
            case 'negate':   negate();              break;
        }
    });

    // ===== Keyboard Support =====
    document.addEventListener('keydown', function (e) {
        const key = e.key;

        if (key >= '0' && key <= '9') {
            inputNumber(key);
        } else if (key === '.') {
            inputDecimal();
        } else if (key === '+') {
            inputOperator('+');
        } else if (key === '-') {
            inputOperator('-');
        } else if (key === '*') {
            inputOperator('*');
        } else if (key === '/') {
            e.preventDefault(); // Prevent Firefox quick-find
            inputOperator('/');
        } else if (key === 'Enter' || key === '=') {
            e.preventDefault();
            calculate();
        } else if (key === 'Backspace') {
            backspace();
        } else if (key === 'Escape' || key === 'Delete') {
            clearAll();
        } else if (key === '%') {
            percent();
        }
    });

    // ===== Initialize =====
    updateDisplay();

})();
