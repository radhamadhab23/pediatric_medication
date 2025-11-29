import mongoose from 'mongoose';

// This sub-schema defines the structure for each row in the dosing table
const DosingInfoSchema = new mongoose.Schema({
  weight_kg: {
    type: Number,
    required: true
  },
  dose_mg: {
    type: Number
    // Not always present, so not required
  },
  withdrawal_volume_ml: {
    type: Number
    // Not always present, so not required
  }
}, { _id: false }); // _id is not needed for sub-documents in an array

const medicationSchema = new mongoose.Schema({
  medication_name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true // Improves query performance
  },
  concentration: {
    type: String,
    trim: true
  },
  general_dose_rule: {
    type: String
  },
  preparation: {
    instructions: String,
    administration_time: String,
    compatible_diluents: [String]
  },
  stability: String,
  notes: String,
  // This is the most important part: an array of weight-based dosages
  dosing_table: [DosingInfoSchema]
});

export default mongoose.model('Medication', medicationSchema, 'pedia');