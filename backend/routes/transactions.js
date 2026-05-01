const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const auth = require('../middleware/auth');

// Get all transactions
router.get('/', auth, async (req, res) => {
    try {
        const { type, startDate, endDate } = req.query;
        
        const where = { userId: req.user.userId };
        if (type) where.type = type;
        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate);
            if (endDate) where.date.lte = new Date(endDate);
        }

        const transactions = await prisma.transaction.findMany({
            where,
            include: {
                incomeSource: true,
                expenseCategory: true
            },
            orderBy: [
                { date: 'desc' },
                { createdAt: 'desc' }
            ]
        });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get transaction summary
router.get('/summary', auth, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'startDate and endDate are required' });
        }

        const transactions = await prisma.transaction.findMany({
            where: {
                userId: req.user.userId,
                date: {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                }
            }
        });

        const summary = transactions.reduce((acc, transaction) => {
            if (!acc[transaction.type]) {
                acc[transaction.type] = { count: 0, total: 0 };
            }
            acc[transaction.type].count += 1;
            acc[transaction.type].total = Math.round((acc[transaction.type].total + parseFloat(transaction.amount)) * 100) / 100;
            return acc;
        }, {});

        res.json(summary);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get transaction by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const transaction = await prisma.transaction.findFirst({
            where: { 
                id: parseInt(req.params.id),
                userId: req.user.userId
            },
            include: {
                incomeSource: true,
                expenseCategory: true
            }
        });
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        res.json(transaction);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new transaction
router.post('/', auth, async (req, res) => {
    try {
        const { type, amount, description, date, incomeSourceId, expenseCategoryId, isRefund } = req.body;
        
        if (!type || !amount || !date) {
            return res.status(400).json({ error: 'type, amount, and date are required' });
        }

        if (type !== 'income' && type !== 'expense') {
            return res.status(400).json({ error: 'type must be either "income" or "expense"' });
        }

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount)) {
            return res.status(400).json({ error: 'amount must be a valid number' });
        }

        if (parsedAmount <= 0 && !isRefund) {
            return res.status(400).json({ error: 'amount must be positive. Use isRefund=true for negative amounts' });
        }

        const finalAmount = Math.abs(parsedAmount);
        const finalType = isRefund && type === 'expense' ? 'income' : (isRefund && type === 'income' ? 'expense' : type);

        if (incomeSourceId) {
            const source = await prisma.incomeSource.findFirst({ where: { id: parseInt(incomeSourceId), userId: req.user.userId } });
            if (!source) return res.status(400).json({ error: 'Income source not found' });
        }

        if (expenseCategoryId) {
            const category = await prisma.expenseCategory.findFirst({ where: { id: parseInt(expenseCategoryId), userId: req.user.userId } });
            if (!category) return res.status(400).json({ error: 'Expense category not found' });
        }

        const transaction = await prisma.transaction.create({
            data: {
                type: finalType,
                amount: finalAmount,
                description: isRefund ? `(Refund) ${description || ''}` : description,
                date: new Date(date),
                incomeSourceId: incomeSourceId ? parseInt(incomeSourceId) : null,
                expenseCategoryId: expenseCategoryId ? parseInt(expenseCategoryId) : null,
                userId: req.user.userId
            },
            include: {
                incomeSource: true,
                expenseCategory: true
            }
        });
        res.status(201).json(transaction);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update transaction
router.put('/:id', auth, async (req, res) => {
    try {
        const { type, amount, description, date, incomeSourceId, expenseCategoryId, isRefund } = req.body;
        
        if (!type || !amount || !date) {
            return res.status(400).json({ error: 'type, amount, and date are required' });
        }

        if (type !== 'income' && type !== 'expense') {
            return res.status(400).json({ error: 'type must be either "income" or "expense"' });
        }

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount)) {
            return res.status(400).json({ error: 'amount must be a valid number' });
        }

        if (parsedAmount <= 0 && !isRefund) {
            return res.status(400).json({ error: 'amount must be positive. Use isRefund=true for refunds' });
        }

        const finalAmount = Math.abs(parsedAmount);
        const finalType = isRefund && type === 'expense' ? 'income' : (isRefund && type === 'income' ? 'expense' : type);

        if (incomeSourceId) {
            const source = await prisma.incomeSource.findFirst({ where: { id: parseInt(incomeSourceId), userId: req.user.userId } });
            if (!source) return res.status(400).json({ error: 'Income source not found' });
        }

        if (expenseCategoryId) {
            const category = await prisma.expenseCategory.findFirst({ where: { id: parseInt(expenseCategoryId), userId: req.user.userId } });
            if (!category) return res.status(400).json({ error: 'Expense category not found' });
        }

        const transaction = await prisma.transaction.updateMany({
            where: { 
                id: parseInt(req.params.id),
                userId: req.user.userId
            },
            data: {
                type: finalType,
                amount: finalAmount,
                description: isRefund ? `(Refund) ${description || ''}` : description,
                date: new Date(date),
                incomeSourceId: incomeSourceId ? parseInt(incomeSourceId) : null,
                expenseCategoryId: expenseCategoryId ? parseInt(expenseCategoryId) : null
            }
        });

        if (transaction.count === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        const updated = await prisma.transaction.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                incomeSource: true,
                expenseCategory: true
            }
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete transaction
router.delete('/:id', auth, async (req, res) => {
    try {
        const result = await prisma.transaction.deleteMany({
            where: { 
                id: parseInt(req.params.id),
                userId: req.user.userId
            }
        });
        if (result.count === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        res.json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
