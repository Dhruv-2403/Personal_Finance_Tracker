const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const auth = require('../middleware/auth');

// Get all income sources
router.get('/', auth, async (req, res) => {
    try {
        const incomeSources = await prisma.incomeSource.findMany({
            where: { userId: req.user.userId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(incomeSources);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get income source by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const incomeSource = await prisma.incomeSource.findFirst({
            where: { 
                id: parseInt(req.params.id),
                userId: req.user.userId
            }
        });
        if (!incomeSource) {
            return res.status(404).json({ error: 'Income source not found' });
        }
        res.json(incomeSource);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new income source
router.post('/', auth, async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        const incomeSource = await prisma.incomeSource.create({
            data: { name, description, userId: req.user.userId }
        });
        res.status(201).json(incomeSource);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update income source
router.put('/:id', auth, async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        const incomeSource = await prisma.incomeSource.updateMany({
            where: { 
                id: parseInt(req.params.id),
                userId: req.user.userId
            },
            data: { name, description }
        });
        if (incomeSource.count === 0) {
            return res.status(404).json({ error: 'Income source not found' });
        }
        const updated = await prisma.incomeSource.findUnique({
            where: { id: parseInt(req.params.id) }
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete income source
router.delete('/:id', auth, async (req, res) => {
    try {
        const sourceId = parseInt(req.params.id);
        const { force } = req.query;

        const source = await prisma.incomeSource.findFirst({
            where: { id: sourceId, userId: req.user.userId },
            include: { transactions: { take: 1 } }
        });

        if (!source) {
            return res.status(404).json({ error: 'Income source not found' });
        }

        const transactionCount = await prisma.transaction.count({
            where: { incomeSourceId: sourceId }
        });

        if (transactionCount > 0 && !force) {
            return res.status(400).json({
                error: `Income source has ${transactionCount} transactions. Use ?force=true to delete and unlink transactions, or reassign them first.`,
                transactions: transactionCount
            });
        }

        await prisma.incomeSource.delete({
            where: { id: sourceId }
        });

        res.json({
            message: 'Income source deleted successfully',
            unlinkedTransactions: transactionCount > 0 ? transactionCount : undefined
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
