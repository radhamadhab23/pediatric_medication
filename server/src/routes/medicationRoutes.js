import express from 'express';
import { 
    calculateDosage, 
    getAllMedications, 
    debugMedications, 
    debugDatabase 
} from '../controllers/medicationController.js';

const router = express.Router();

// Route to get all medications
router.get('/', getAllMedications);

// Route for dosage calculation
router.post('/calculate-dosage', calculateDosage);

// Debug routes
router.get('/debug', debugMedications);
router.get('/debug-db', debugDatabase);

// Simple test route
router.get('/test', (req, res) => {
  res.json({ message: 'Medication routes are working!' });
});

export default router;