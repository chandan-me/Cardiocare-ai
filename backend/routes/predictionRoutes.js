const express = require('express');
const router = express.Router();
const predictionController = require('../controllers/predictionController');
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/auth');

// All prediction routes are protected by JWT authentication
router.use(authMiddleware);

router.post('/predict', predictionController.createPrediction);
router.post('/predict-quick', predictionController.quickPredict);
router.post('/chat', chatController.handleChat);
router.post('/predict-extract', chatController.extractNotes);
router.post('/predict-ocr', chatController.extractOCR);
router.get('/predictions', predictionController.getPredictions);
router.get('/predictions/:id', predictionController.getPredictionById);
router.delete('/predictions/:id', predictionController.deletePrediction);
router.put('/predictions/:id', predictionController.updatePrediction);
router.get('/audit-logs', predictionController.getAuditLogs);
router.get('/download-template', predictionController.downloadIntakeTemplate);
router.post('/generate-report', predictionController.generatePDFReport);

module.exports = router;
