// src/scripts/seedMedications.js

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Medication from '../models/Medication.js'; // Ensure this path is correct for your structure

// --- Configuration ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PDF_PATH = path.join(__dirname, '..', '..', 'medbook.pdf'); // Assumes PDF is in 'server' root
const MONGO_URI = process.env.MONGO_URI;

function parseDrugPage(pageText) {
    // ... (This function does not need changes)
    const doc = { medication_name: null, concentration: null, dosing_table: [] };
    const lines = pageText.split('\n');
    const title = lines[0] || '';
    const titleMatch = title.match(/^([A-Za-z\s/]+)(?:\s*\(.*\))?\s*(\d+m[cg]\/\d+ml)?/);
    if (titleMatch) {
        doc.medication_name = titleMatch[1].trim();
        if (titleMatch[2]) doc.concentration = titleMatch[2].trim();
    } else { return null; }
    const tableRegex = /^((\d+\.?\d*)\s+([\d\.\s]+)\s+([\d\.]+))\s+((\d+\.?\d*)\s+([\d\.\s]+)\s+([\d\.]+))?$/gm;
    let tableMatch;
    while ((tableMatch = tableRegex.exec(pageText)) !== null) {
        const [, , leftWeight, leftDose, leftVolume, , rightWeight, rightDose, rightVolume] = tableMatch;
        if (leftWeight) { doc.dosing_table.push({ weight_kg: parseFloat(leftWeight), dose_mg: parseFloat(leftDose.replace(/\s/g, '')), withdrawal_volume_ml: parseFloat(leftVolume) }); }
        if (rightWeight) { doc.dosing_table.push({ weight_kg: parseFloat(rightWeight), dose_mg: parseFloat(rightDose.replace(/\s/g, '')), withdrawal_volume_ml: parseFloat(rightVolume) }); }
    }
    return doc.medication_name && doc.dosing_table.length > 0 ? doc : null;
}

async function seedDatabase() {
    if (!MONGO_URI) {
        console.error('MONGO_URI is not defined in your .env file.');
        process.exit(1);
    }

    // **KEY CHANGE HERE: Dynamically import the CJS module**
    const { default: pdf } = await import('pdf-parse');

    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB.');

        console.log('📄 Reading and parsing PDF...');
        const dataBuffer = fs.readFileSync(PDF_PATH);
        const pdfData = await pdf(dataBuffer);

        const allDrugs = [];
        const processedDrugs = new Set();
        const pagesText = pdfData.text.split(/(?=Adrenaline 1mg\/1ml|Atropine 1 mg\/1 ml|Adenosine 6 mg\/2 ml|Amiodarone hydrochloride)/);

        for (const chunk of pagesText) {
            if (chunk.trim().length < 20) continue;
            const drugDoc = parseDrugPage(chunk);
            if (drugDoc && !processedDrugs.has(drugDoc.medication_name)) {
                allDrugs.push(drugDoc);
                processedDrugs.add(drugDoc.medication_name);
                console.log(`   - Parsed: ${drugDoc.medication_name}`);
            }
        }

        console.log(`\nFound ${allDrugs.length} unique medications.`);
        console.log('🗑️  Clearing existing medication data...');
        await Medication.deleteMany({});
        console.log('🌱 Inserting new medication data...');
        await Medication.insertMany(allDrugs);
        console.log('🎉 Seed process completed successfully!');

    } catch (error) {
        console.error('❌ An error occurred during the seed process:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 MongoDB connection closed.');
    }
}

seedDatabase();