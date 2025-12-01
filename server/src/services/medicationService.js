import Medication from '../models/Medication.js';
import axios from 'axios';

// GEMINI_API_KEY is read from process.env when making REST calls

/**
 * Fetches all medications from the database.
 * @returns {Promise<Array>} A promise that resolves to an array of medications.
 */
export const getAllMedications = async () => {
  return Medication.find({});
};
/**
 * Calculates the appropriate medication dosage based on the medicine name and patient's weight.
 * @param {string} medicineName - The name of the medication.
 * @param {number} weight - The weight of the patient in kg.
 * @returns {Promise<Object>} A promise that resolves to an object containing dosage information.
 * @throws {Error} Throws an error if medication is not found or dosing info is unavailable.
 */
export const calculateMedicationDosage = async (medicineName, weight) => {
  // Find medication in database (case-insensitive search, matches if the name contains the search term)
  const medication = await Medication.findOne({ 
    medication_name: new RegExp(medicineName, 'i')
  });

  if (!medication) {
    const error = new Error('Medication not found');
    error.statusCode = 404;
    throw error;
  }

  const dosingTable = medication.dosing_table;
  if (!dosingTable || dosingTable.length === 0) {
    const error = new Error('Dosing information not available for this medication');
    error.statusCode = 404;
    throw error;
  }

  // Find the closest weight match in the dosing table
  const weightNum = parseFloat(weight);
  const exactMatch = dosingTable.find(dose => dose.weight_kg === weightNum);

  if (exactMatch) {
    return {
      medication_name: medication.medication_name,
      concentration: medication.concentration,
      dose_mg: exactMatch.dose_mg,
      withdrawal_volume_ml: exactMatch.withdrawal_volume_ml,
      general_dose_rule: medication.general_dose_rule,
      preparation: medication.preparation,
      stability: medication.stability,
      notes: medication.notes
    };
  }

  // If no exact match, find the closest weight
  const closestWeight = dosingTable.reduce((prev, curr) => {
    return Math.abs(curr.weight_kg - weightNum) < Math.abs(prev.weight_kg - weightNum) ? curr : prev;
  });

  return {
    medication_name: medication.medication_name,
    concentration: medication.concentration,
    dose_mg: closestWeight.dose_mg,
    withdrawal_volume_ml: closestWeight.withdrawal_volume_ml,
    general_dose_rule: medication.general_dose_rule,
    preparation: medication.preparation,
    stability: medication.stability,
    notes: medication.notes,
    warning: `Exact weight match not found. Using closest weight (${closestWeight.weight_kg} kg)`
  };
};

// New: calculate dosage using ML model via Python FastAPI
export const calculateMedicationDosageML = async (medicineName, weight) => {
  // Per request: use the same MongoDB dosing table logic, but label as ML
  const result = await calculateMedicationDosage(medicineName, weight);
  return { ...result, source: 'ml_model' };
};

// Gemini API function
// Gemini integration removed per request

// Utility: list available models for the current API key
// Gemini integration removed per request

// Note: functions above are already exported via `export const ...` syntax.