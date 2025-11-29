const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const pdfParse = require('pdf-parse');
const Medication = require('../models/Medication.js');

dotenv.config();

// Path to your PDF file (assuming it's in the root of the server directory)
const PDF_PATH = path.join(__dirname, '../../../Pediatric Medication Book  2nd ed  2022.pdf');

// Function to parse medication information from PDF text
const parseMedicationFromText = (text) => {
    const medications = [];
    const sections = text.split(/(?=\n[A-Z][A-Za-z\s]+\n)/g);

    for (const section of sections) {
        try {
            // Extract medication name (usually the first line)
            const lines = section.trim().split('\n');
            const name = lines[0].trim();

            // Skip if not a medication section
            if (!name || name.length < 2) continue;

            // Look for dosage information
            const dosageMatch = section.match(/(\d+(?:\.\d+)?(?:\s*-\s*\d+(?:\.\d+)?)?)\s*mg\/kg/);
            const frequencyMatch = section.match(/every\s+(\d+(?:-\d+)?)\s*hours?|once daily|twice daily/i);
            const weightMatch = section.match(/minimum weight[:\s]+(\d+(?:\.\d+)?)\s*kg/i);
            const maxDoseMatch = section.match(/maximum\s+(?:single\s+)?dose[:\s]+(\d+(?:\.\d+)?)\s*(?:mg|mcg|g|ml)/i);
            const ageMatch = section.match(/(?:age|children)\s+(\d+(?:\.\d+)?)\s*(?:months?|years?)/i);
            const notesMatch = section.match(/(?:note|warning|caution)s?[:]\s*([^\n]+)/i);

            const medication = {
                name,
                dosageCalculation: dosageMatch ? 
                    `${dosageMatch[1]} mg/kg ${frequencyMatch ? frequencyMatch[0] : ''}` : 
                    'Dosage needs to be calculated based on specific factors',
                minAge: ageMatch ? parseFloat(ageMatch[1]) : 0,
                maxAge: 18, // Default max age
                weightBased: Boolean(dosageMatch),
                minimumWeight: weightMatch ? parseFloat(weightMatch[1]) : 3,
                maximumDose: maxDoseMatch ? parseFloat(maxDoseMatch[1]) : null,
                unit: maxDoseMatch ? maxDoseMatch[0].match(/(mg|mcg|g|ml)/i)[0] : 'mg',
                notes: notesMatch ? notesMatch[1].trim() : ''
            };

            // Only add if we have a valid medication name and some dosing information
            if (medication.name && (medication.dosageCalculation || medication.notes)) {
                medications.push(medication);
                console.log(`Parsed medication: ${medication.name}`);
            }
        } catch (error) {
            console.error('Error parsing section:', error);
            continue;
        }
    }
    return medications;
};

const seedDatabase = async () => {
    try {
        console.log('Reading PDF file...');
        const dataBuffer = fs.readFileSync(PDF_PATH);
        
        console.log('Parsing PDF content...');
        const pdfData = await pdfParse(dataBuffer);
        
        console.log('Extracting medications...');
        const medications = parseMedicationFromText(pdfData.text);
        
        console.log(`Found ${medications.length} medications`);
        
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Clear existing data
        await Medication.deleteMany({});
        console.log('Cleared existing medications');

        // Insert new data
        await Medication.insertMany(medications);
        console.log(`Successfully added ${medications.length} medications to database`);

        await mongoose.connection.close();
        console.log('Database connection closed');
    } catch (error) {
        console.error('Error seeding data:', error);
        if (error.code === 'ENOENT') {
            console.error('PDF file not found. Make sure the PDF is in the correct location.');
        }
        process.exit(1);
    }
};

seedDatabase();