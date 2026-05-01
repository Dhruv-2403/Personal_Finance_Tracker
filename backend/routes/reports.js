const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const auth = require('../middleware/auth');

// Get monthly income vs expenses report
router.get('/monthly', auth, async (req, res) => {
    try {
        const { year } = req.query;
        const currentYear = year ? parseInt(year) : new Date().getFullYear();

        const monthlyData = [];

        for (let month = 0; month < 12; month++) {
            const startDate = new Date(currentYear, month, 1);
            const endDate = new Date(currentYear, month + 1, 0);

            const transactions = await prisma.transaction.findMany({
                where: {
                    userId: req.user.userId,
                    date: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            });

            const income = transactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + parseFloat(t.amount), 0);

            const expenses = transactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + parseFloat(t.amount), 0);

            monthlyData.push({
                month: new Date(currentYear, month).toLocaleString('default', { month: 'short' }),
                year: currentYear,
                income,
                expenses,
                savings: income - expenses
            });
        }

        res.json(monthlyData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get category-wise expense report
router.get('/expenses-by-category', auth, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const where = { userId: req.user.userId };
        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate);
            if (endDate) where.date.lte = new Date(endDate);
        }

        const expensesByCategory = await prisma.transaction.groupBy({
            by: ['expenseCategoryId'],
            where: {
                ...where,
                type: 'expense',
                expenseCategoryId: { not: null }
            },
            _sum: {
                amount: true
            },
            _count: {
                id: true
            }
        });

        const expenseCategories = await prisma.expenseCategory.findMany({
            where: { userId: req.user.userId }
        });

        const report = expensesByCategory.map(item => {
            const category = expenseCategories.find(c => c.id === item.expenseCategoryId);
            return {
                category: category ? category.name : 'Uncategorized',
                categoryId: item.expenseCategoryId,
                totalAmount: parseFloat(item._sum.amount || 0),
                transactionCount: item._count.id
            };
        });

        report.sort((a, b) => b.totalAmount - a.totalAmount);

        res.json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get income source report
router.get('/income-by-source', auth, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const where = { userId: req.user.userId };
        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate);
            if (endDate) where.date.lte = new Date(endDate);
        }

        const incomeBySource = await prisma.transaction.groupBy({
            by: ['incomeSourceId'],
            where: {
                ...where,
                type: 'income',
                incomeSourceId: { not: null }
            },
            _sum: {
                amount: true
            },
            _count: {
                id: true
            }
        });

        const incomeSources = await prisma.incomeSource.findMany({
            where: { userId: req.user.userId }
        });

        const report = incomeBySource.map(item => {
            const source = incomeSources.find(s => s.id === item.incomeSourceId);
            return {
                source: source ? source.name : 'Uncategorized',
                sourceId: item.incomeSourceId,
                totalAmount: parseFloat(item._sum.amount || 0),
                transactionCount: item._count.id
            };
        });

        report.sort((a, b) => b.totalAmount - a.totalAmount);

        res.json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
