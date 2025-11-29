import Medication from '../models/Medication.js';
import * as medicationService from '../services/medicationService.js';

// Calculate dosage based on medication name and weight
export const calculateDosage = async (req, res, next) => {
  try {
    const { medicineName, weight } = req.body;
    
    // Input validation
    if (!medicineName || !weight) {
      return res.status(400).json({
        error: 'Missing required fields: medicineName and weight are required'
      });
    }
    
    const dosageInfo = await medicationService.calculateMedicationDosage(medicineName, weight);
    res.json(dosageInfo);

  } catch (error) {
    // If the service throws an error with a specific status code, use it
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    // Otherwise, pass it to the general error handler
    next(error);
  }
};

// Get all medications
export const getAllMedications = async (req, res, next) => {
  try {
    const medications = await medicationService.getAllMedications();
    res.json(medications);
  } catch (error) {
    next(error);
  }
};

// Debug route to check database contents
export const debugDatabase = async (req, res, next) => {
  try {
    const medications = await Medication.find({}).select('medication_name concentration');
    
    res.json({
      totalDocuments: medications.length,
      medications: medications,
      message: "These are all medications currently in the database"
    });
  } catch (error) {
    next(error);
  }
};

// Debug endpoint to check what's in the database
export const debugMedications = async (req, res, next) => {
  try {
    const count = await Medication.countDocuments();
    const medications = await Medication.find({}).select('medication_name');
    res.json({
      totalCount: count,
      medications: medications
    });
  } catch (error) {
    next(error);
  }
};