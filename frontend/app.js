const API_BASE = 'http://localhost:3000/api';

// Check if user is logged in
function checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('dashboard-section').classList.remove('hidden');
        loadTransactions();
        loadIncomeSources();
        loadExpenseCategories();
    } else {
        document.getElementById('auth-section').classList.remove('hidden');
        document.getElementById('dashboard-section').classList.add('hidden');
    }
}

// Auth Tab Navigation
function showAuthTab(tab) {
    document.querySelectorAll('.auth-form').forEach(f => f.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`${tab}-form`).classList.remove('hidden');
    event.target.classList.add('active');
}

// Handle Login
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            checkAuth();
        } else {
            document.getElementById('login-error').textContent = data.error || 'Login failed';
        }
    } catch (error) {
        document.getElementById('login-error').textContent = 'Login failed';
    }
}

// Handle Register
async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            checkAuth();
        } else {
            document.getElementById('register-error').textContent = data.error || 'Registration failed';
        }
    } catch (error) {
        document.getElementById('register-error').textContent = 'Registration failed';
    }
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    checkAuth();
}

// Navigation
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    document.getElementById(`${sectionId}-section`).classList.remove('hidden');
    
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // Load data when section is shown
    if (sectionId === 'transactions') loadTransactions();
    if (sectionId === 'income-sources') loadIncomeSources();
    if (sectionId === 'expense-categories') loadExpenseCategories();
    if (sectionId === 'summary') loadSummary();
}

// API Helper
async function apiCall(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('token');
    const options = {
        method,
        headers: { 
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };
    if (body) options.body = JSON.stringify(body);
    
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    return response.json();
}

// Transactions
async function loadTransactions() {
    const transactions = await apiCall('/transactions');
    const list = document.getElementById('transactions-list');
    list.innerHTML = transactions.map(t => `
        <div class="list-item">
            <div class="info">
                <strong>${t.type.toUpperCase()}</strong>: $${parseFloat(t.amount).toFixed(2)}
                <br>
                <small>${t.description || 'No description'} - ${new Date(t.date).toLocaleDateString()}</small>
            </div>
            <div class="actions">
                <button class="delete-btn" onclick="deleteTransaction(${t.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

async function addTransaction(e) {
    e.preventDefault();
    const data = {
        type: document.getElementById('transaction-type').value,
        amount: document.getElementById('transaction-amount').value,
        description: document.getElementById('transaction-description').value,
        date: document.getElementById('transaction-date').value,
        incomeSourceId: document.getElementById('transaction-income-source').value || null,
        expenseCategoryId: document.getElementById('transaction-expense-category').value || null
    };
    
    await apiCall('/transactions', 'POST', data);
    e.target.reset();
    loadTransactions();
}

async function deleteTransaction(id) {
    await apiCall(`/transactions/${id}`, 'DELETE');
    loadTransactions();
}

// Income Sources
async function loadIncomeSources() {
    const sources = await apiCall('/income-sources');
    const list = document.getElementById('income-sources-list');
    list.innerHTML = sources.map(s => `
        <div class="list-item">
            <div class="info">
                <strong>${s.name}</strong>
                <br>
                <small>${s.description || 'No description'}</small>
            </div>
            <div class="actions">
                <button class="delete-btn" onclick="deleteIncomeSource(${s.id})">Delete</button>
            </div>
        </div>
    `).join('');

    // Update dropdown
    const select = document.getElementById('transaction-income-source');
    select.innerHTML = '<option value="">Select Income Source</option>' + 
        sources.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
}

async function addIncomeSource(e) {
    e.preventDefault();
    const data = {
        name: document.getElementById('income-source-name').value,
        description: document.getElementById('income-source-description').value
    };
    await apiCall('/income-sources', 'POST', data);
    e.target.reset();
    loadIncomeSources();
}

async function deleteIncomeSource(id) {
    await apiCall(`/income-sources/${id}`, 'DELETE');
    loadIncomeSources();
}

// Expense Categories
async function loadExpenseCategories() {
    const categories = await apiCall('/expense-categories');
    const list = document.getElementById('expense-categories-list');
    list.innerHTML = categories.map(c => `
        <div class="list-item">
            <div class="info">
                <strong>${c.name}</strong>
                <br>
                <small>${c.description || 'No description'}</small>
            </div>
            <div class="actions">
                <button class="delete-btn" onclick="deleteExpenseCategory(${c.id})">Delete</button>
            </div>
        </div>
    `).join('');

    // Update dropdown
    const select = document.getElementById('transaction-expense-category');
    select.innerHTML = '<option value="">Select Expense Category</option>' + 
        categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

async function addExpenseCategory(e) {
    e.preventDefault();
    const data = {
        name: document.getElementById('expense-category-name').value,
        description: document.getElementById('expense-category-description').value
    };
    await apiCall('/expense-categories', 'POST', data);
    e.target.reset();
    loadExpenseCategories();
}

async function deleteExpenseCategory(id) {
    await apiCall(`/expense-categories/${id}`, 'DELETE');
    loadExpenseCategories();
}

// Summary
async function loadSummary() {
    const transactions = await apiCall('/transactions');
    
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    document.getElementById('total-income').textContent = `$${totalIncome.toFixed(2)}`;
    document.getElementById('total-expenses').textContent = `$${totalExpenses.toFixed(2)}`;
    document.getElementById('net-balance').textContent = `$${(totalIncome - totalExpenses).toFixed(2)}`;
}

// Reports
async function loadMonthlyReport() {
    const report = await apiCall('/reports/monthly');
    const content = document.getElementById('report-content');
    content.innerHTML = '<h3>Monthly Income vs Expenses</h3>' + 
        report.map(m => `
            <div class="report-item">
                <strong>${m.month} ${m.year}</strong><br>
                Income: $${m.income.toFixed(2)} | Expenses: $${m.expenses.toFixed(2)} | Savings: $${m.savings.toFixed(2)}
            </div>
        `).join('');
}

async function loadExpenseByCategoryReport() {
    const report = await apiCall('/reports/expenses-by-category');
    const content = document.getElementById('report-content');
    content.innerHTML = '<h3>Expenses by Category</h3>' + 
        report.map(r => `
            <div class="report-item">
                <strong>${r.category}</strong>: $${r.totalAmount.toFixed(2)} (${r.transactionCount} transactions)
            </div>
        `).join('');
}

async function loadIncomeBySourceReport() {
    const report = await apiCall('/reports/income-by-source');
    const content = document.getElementById('report-content');
    content.innerHTML = '<h3>Income by Source</h3>' + 
        report.map(r => `
            <div class="report-item">
                <strong>${r.source}</strong>: $${r.totalAmount.toFixed(2)} (${r.transactionCount} transactions)
            </div>
        `).join('');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});
