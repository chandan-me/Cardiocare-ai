const express = require('express');
const router = express.Router();
const predictionController = require('../controllers/predictionController');
const authMiddleware = require('../middleware/auth');

// All prediction routes are protected by JWT authentication
router.use(authMiddleware);

router.post('/predict', predictionController.createPrediction);
router.get('/predictions', predictionController.getPredictions);
router.get('/predictions/:id', predictionController.getPredictionById);
router.delete('/predictions/:id', predictionController.deletePrediction);
router.post('/generate-report', predictionController.generatePDFReport);

module.exports = router;
