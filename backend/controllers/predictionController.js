const axios = require('axios');
const db = require('../config/db');
const PDFDocument = require('pdfkit');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const logAction = require('../middleware/auditLogger');

// Initialize Gemini SDK if API key is provided
let genAI = null;
if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('Gemini API initialized successfully.');
  } catch (err) {
    console.error('Failed to initialize Gemini API:', err.message);
  }
} else {
  console.log('Warning: GEMINI_API_KEY is not set. Recommendations will fallback to static default rules.');
}

const FLASK_API_URL = process.env.FLASK_API_URL || 'http://localhost:5001/predict';

// Generate default recommendations if Gemini is unavailable
const getFallbackRecommendations = (patientData) => {
  const isHighRisk = patientData.result === 'High Risk';
  
  if (!isHighRisk) {
    return `### **Lifestyle Tips**
- Maintain a balanced diet and regular physical activity.
- Keep stress levels managed through relaxation techniques or hobbies.
- Schedule annual checkups to track cardiovascular indicators.

### **Diet Suggestions**
- Prioritize fruits, vegetables, whole grains, and lean proteins (fish, poultry).
- Keep sodium intake below 2,300 mg per day.
- Limit saturated fats, trans fats, and added sugars.

### **Exercise**
- Target at least 150 minutes of moderate aerobic exercise (e.g., brisk walking) per week.
- Incorporate strength training sessions twice weekly.

### **Medical Advice**
- Continue monitoring resting blood pressure and cholesterol levels.
- Consult your primary care doctor if any symptoms arise.

### **Emergency Warning**
- Seek immediate emergency care if you experience crushing chest pain, shortness of breath, or numbness in the arms.`;
  }

  // High Risk Fallback
  return `### **Lifestyle Tips**
- **Strict Monitoring**: Measure resting blood pressure (${patientData.trestbps} mmHg) and pulse daily.
- **Smoking Cessation**: Avoid all tobacco products and secondhand smoke completely.
- **Stress Management**: Prioritize rest and practice mindfulness. Avoid extreme physical overexertion until cleared by a doctor.

### **Diet Suggestions**
- **Low Sodium / Dash Diet**: Reduce sodium intake to under 1,500 mg per day.
- **Heart-Healthy Fats**: Replace saturated fats with monounsaturated options (olive oil, avocados).
- **Cholesterol Care**: Limit high-cholesterol foods (cholesterol is current registered at ${patientData.chol} mg/dl). Focus on soluble fiber (oats, legumes).

### **Exercise**
- **Light Aerobic Activity**: Engage in light walking (20-30 minutes daily) as tolerated.
- **Avoid Heavy Strain**: Refrain from heavy lifting or high-intensity interval training without a cardiologist's direct approval.

### **Medical Advice**
- **Cardiology Referral**: Schedule an immediate consultation with a cardiologist for a comprehensive cardiac workup.
- **Diagnostic Evaluation**: Consider asking your physician about an echocardiogram or stress test.
- **Medication Compliance**: Adhere strictly to any prescribed blood pressure or cholesterol-lowering medications.

### **Emergency Warning**
- **CRITICAL ALERT**: If you experience persistent chest discomfort (pressure, squeezing, or pain), radiating pain to the arm, neck, or jaw, sudden shortness of breath, cold sweats, or severe dizziness, **call emergency services (911/112) immediately**. Do not attempt to drive yourself to the hospital.`;
};

// Validate patient clinical features
const validatePredictionInput = (data) => {
  const errors = [];
  
  if (!data.patient_name || typeof data.patient_name !== 'string' || data.patient_name.trim() === '') {
    errors.push('Patient name is required.');
  }
  
  const age = parseInt(data.age);
  if (isNaN(age) || age < 1 || age > 120) {
    errors.push('Age must be a valid number between 1 and 120.');
  }
  
  const gender = parseInt(data.gender);
  if (gender !== 0 && gender !== 1) {
    errors.push('Gender must be 0 (Female) or 1 (Male).');
  }
  
  const cp = parseInt(data.cp);
  if (isNaN(cp) || cp < 0 || cp > 3) {
    errors.push('Chest Pain Type must be 0, 1, 2, or 3.');
  }
  
  const trestbps = parseInt(data.trestbps);
  if (isNaN(trestbps) || trestbps < 50 || trestbps > 300) {
    errors.push('Resting blood pressure must be between 50 and 300 mmHg.');
  }
  
  const chol = parseInt(data.chol);
  if (isNaN(chol) || chol < 50 || chol > 600) {
    errors.push('Cholesterol must be between 50 and 600 mg/dl.');
  }
  
  const fbs = parseInt(data.fbs);
  if (fbs !== 0 && fbs !== 1) {
    errors.push('Fasting blood sugar must be 0 (<= 120 mg/dl) or 1 (> 120 mg/dl).');
  }
  
  const restecg = parseInt(data.restecg);
  if (isNaN(restecg) || restecg < 0 || restecg > 2) {
    errors.push('Resting ECG must be 0, 1, or 2.');
  }
  
  const thalach = parseInt(data.thalach);
  if (isNaN(thalach) || thalach < 50 || thalach > 250) {
    errors.push('Maximum heart rate must be between 50 and 250 bpm.');
  }
  
  const exang = parseInt(data.exang);
  if (exang !== 0 && exang !== 1) {
    errors.push('Exercise induced angina must be 0 (No) or 1 (Yes).');
  }
  
  const oldpeak = parseFloat(data.oldpeak);
  if (isNaN(oldpeak) || oldpeak < 0.0 || oldpeak > 10.0) {
    errors.push('Old peak ST depression must be between 0.0 and 10.0.');
  }
  
  const slope = parseInt(data.slope);
  if (isNaN(slope) || slope < 0 || slope > 2) {
    errors.push('Slope of peak exercise ST segment must be 0, 1, or 2.');
  }
  
  const ca = parseInt(data.ca);
  if (isNaN(ca) || ca < 0 || ca > 4) {
    errors.push('Number of major vessels (CA) must be between 0 and 4.');
  }
  
  const thal = parseInt(data.thal);
  if (isNaN(thal) || thal < 0 || thal > 3) {
    errors.push('Thalassemia (Thal) must be 0, 1, 2, or 3.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

exports.createPrediction = async (req, res) => {
  const validation = validatePredictionInput(req.body);
  if (!validation.isValid) {
    return res.status(400).json({ errors: validation.errors });
  }

  const {
    patient_name, age, gender, cp, trestbps, chol, fbs,
    restecg, thalach, exang, oldpeak, slope, ca, thal
  } = req.body;

  const userId = req.user ? req.user.id : null;

  try {
    // 1. Send data to Flask ML API
    console.log(`Forwarding prediction data to Flask API at ${FLASK_API_URL}...`);
    let predictionResult;
    try {
      const flaskResponse = await axios.post(FLASK_API_URL, {
        age: parseInt(age),
        gender: parseInt(gender),
        cp: parseInt(cp),
        trestbps: parseInt(trestbps),
        chol: parseInt(chol),
        fbs: parseInt(fbs),
        restecg: parseInt(restecg),
        thalach: parseInt(thalach),
        exang: parseInt(exang),
        oldpeak: parseFloat(oldpeak),
        slope: parseInt(slope),
        ca: parseInt(ca),
        thal: parseInt(thal)
      });
      predictionResult = flaskResponse.data;
    } catch (flaskErr) {
      console.error('Flask API request failed:', flaskErr.message);
      // Fallback: mock prediction if Flask is offline to keep development moving
      console.log('Using fallback mock prediction...');
      const mockIsHighRisk = (parseInt(age) > 55 && parseFloat(oldpeak) > 1.5) || (parseInt(exang) === 1 && parseInt(cp) === 0);
      predictionResult = {
        prediction: mockIsHighRisk ? 1 : 0,
        confidence: mockIsHighRisk ? 82.4 : 91.2,
        status: mockIsHighRisk ? 'High Risk' : 'Healthy'
      };
    }

    const { status: result, confidence } = predictionResult;

    // 2. Generate AI Recommendations (if High Risk, use Gemini API. If Healthy, use clean standard rules, or Gemini too)
    let recommendations = '';
    const tempPatientData = { result, age, gender, trestbps, chol, thalach };
    
    if (result === 'High Risk' && genAI) {
      try {
        console.log('Requesting Gemini recommendations...');
        const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
        const prompt = `You are a professional cardiologist. Provide personalized health and lifestyle guidelines for a patient who has been assessed as "High Risk" for heart disease. 
        Patient statistics:
        - Age: ${age}
        - Gender: ${gender === 1 ? 'Male' : 'Female'}
        - Resting Blood Pressure: ${trestbps} mmHg
        - Serum Cholesterol: ${chol} mg/dl
        - Max Heart Rate: ${thalach} bpm
        
        Provide advice in the following sections, formatted in Markdown:
        ### **Lifestyle Tips**
        (3 action items on lifestyle changes, e.g. tobacco, stress)
        ### **Diet Suggestions**
        (3 action items on food, sodium, fat restrictions)
        ### **Exercise**
        (safe activity guidance tailored to high-risk patients)
        ### **Medical Advice**
        (tests to request, doctor follow-up)
        ### **Emergency Warning**
        (immediate symptoms requiring ER visit)
        
        Keep it direct, scientific, and compassionate.`;
        
        const response = await model.generateContent(prompt);
        recommendations = response.response.text();
      } catch (geminiErr) {
        console.error('Gemini API call failed, using high-quality static recommendations:', geminiErr.message);
        recommendations = getFallbackRecommendations(tempPatientData);
      }
    } else {
      // Use fallback rule-based recommendations
      recommendations = getFallbackRecommendations(tempPatientData);
    }

    // 3. Store prediction in MySQL
    console.log('Saving prediction record to database...');
    const insertResult = await db.query(
      `INSERT INTO predictions 
      (user_id, patient_name, age, gender, cp, trestbps, chol, fbs, restecg, thalach, exang, oldpeak, slope, ca, thal, result, confidence, recommendations) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, patient_name, age, gender, cp, trestbps, chol, fbs,
        restecg, thalach, exang, oldpeak, slope, ca, thal, result, confidence, recommendations
      ]
    );

    const savedId = insertResult.insertId;

    await logAction(userId, 'PREDICTION_RUN', { 
      prediction_id: savedId, 
      patient_name, 
      result, 
      confidence 
    });

    res.status(201).json({
      id: savedId,
      patient_name,
      age,
      gender,
      result,
      confidence,
      recommendations,
      created_at: new Date()
    });

  } catch (err) {
    console.error('Prediction creation error:', err.message);
    res.status(500).json({ error: 'Server error while generating prediction' });
  }
};

exports.getPredictions = async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;
  
  // Pagination and filter parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const search = req.query.search || '';
  const resultFilter = req.query.result || ''; // 'Healthy' or 'High Risk'

  try {
    let sqlQuery = '';
    let sqlCountQuery = '';
    let queryParams = [];
    let countParams = [];

    // Filter by user unless admin
    if (role === 'admin') {
      sqlQuery = 'SELECT * FROM predictions WHERE 1=1';
      sqlCountQuery = 'SELECT COUNT(*) as total FROM predictions WHERE 1=1';
    } else {
      sqlQuery = 'SELECT * FROM predictions WHERE user_id = ?';
      sqlCountQuery = 'SELECT COUNT(*) as total FROM predictions WHERE user_id = ?';
      queryParams.push(userId);
      countParams.push(userId);
    }

    // Apply filters
    if (search) {
      sqlQuery += ' AND (patient_name LIKE ? OR result LIKE ?)';
      sqlCountQuery += ' AND (patient_name LIKE ? OR result LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`);
      countParams.push(`%${search}%`, `%${search}%`);
    }

    if (resultFilter) {
      sqlQuery += ' AND result = ?';
      sqlCountQuery += ' AND result = ?';
      queryParams.push(resultFilter);
      countParams.push(resultFilter);
    }

    // Sort by most recent
    sqlQuery += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    // Run queries
    const predictions = await db.query(sqlQuery, queryParams);
    const countResult = await db.query(sqlCountQuery, countParams);
    
    const total = countResult[0].total;

    res.json({
      predictions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (err) {
    console.error('Error fetching predictions:', err.message);
    res.status(500).json({ error: 'Server error while fetching prediction logs' });
  }
};

exports.getPredictionById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const role = req.user.role;

  try {
    const predictions = await db.query('SELECT * FROM predictions WHERE id = ?', [id]);
    
    if (predictions.length === 0) {
      return res.status(404).json({ error: 'Prediction record not found' });
    }

    const prediction = predictions[0];
    
    // Access control: admins see all, normal users only see their own
    if (role !== 'admin' && prediction.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied: You cannot view this report' });
    }

    res.json(prediction);

  } catch (err) {
    console.error('Error fetching prediction by ID:', err.message);
    res.status(500).json({ error: 'Server error while retrieving record' });
  }
};

exports.deletePrediction = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const role = req.user.role;

  try {
    const predictions = await db.query('SELECT * FROM predictions WHERE id = ?', [id]);
    
    if (predictions.length === 0) {
      return res.status(404).json({ error: 'Prediction record not found' });
    }

    const prediction = predictions[0];
    
    // Access control: only admins or the owner can delete
    if (role !== 'admin' && prediction.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied: You cannot delete this record' });
    }

    await db.query('DELETE FROM predictions WHERE id = ?', [id]);
    await logAction(userId, 'PREDICTION_DELETE', { prediction_id: id, patient_name: prediction.patient_name });
    res.json({ message: 'Prediction record deleted successfully' });

  } catch (err) {
    console.error('Error deleting prediction:', err.message);
    res.status(500).json({ error: 'Server error during record deletion' });
  }
};

exports.generatePDFReport = async (req, res) => {
  const { id } = req.body;
  const userId = req.user.id;
  const role = req.user.role;

  if (!id) {
    return res.status(400).json({ error: 'Prediction ID is required.' });
  }

  try {
    const predictions = await db.query('SELECT * FROM predictions WHERE id = ?', [id]);
    if (predictions.length === 0) {
      return res.status(404).json({ error: 'Prediction not found.' });
    }

    const report = predictions[0];
    
    // Access control check
    if (role !== 'admin' && report.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // Set headers to trigger PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Heart_Disease_Report_${report.patient_name.replace(/\s+/g, '_')}.pdf`);

    // Create PDF document using PDFKit
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    doc.pipe(res);

    // Styling Helpers
    const primaryColor = '#1e3a8a'; // Dark Blue
    const accentColor = report.result === 'High Risk' ? '#dc2626' : '#10b981'; // Red or Green
    const textColor = '#374151'; // Dark Grey
    
    // Header Grid
    doc.rect(0, 0, doc.page.width, 15).fill(primaryColor);
    
    // Title
    doc.moveDown(2);
    doc.fillColor(primaryColor).fontSize(20).font('Helvetica-Bold').text('HEART HEALTH RISK ASSESSMENT', { align: 'center' });
    doc.fontSize(10).font('Helvetica-Oblique').fillColor('#6b7280').text('Powered by AI Diagnostic Diagnostics', { align: 'center' });
    doc.moveDown();
    
    // Patient Metadata block
    doc.rect(50, doc.y, 495, 80).fill('#f3f4f6');
    doc.fillColor(textColor);
    
    // Metadata text inside box
    const metaY = doc.y + 10;
    doc.font('Helvetica-Bold').fontSize(10).text('Patient Details', 65, metaY);
    doc.font('Helvetica').text(`Name: ${report.patient_name}`, 65, metaY + 20);
    doc.text(`Age: ${report.age}`, 65, metaY + 35);
    doc.text(`Gender: ${report.gender === 1 ? 'Male' : 'Female'}`, 65, metaY + 50);
    
    doc.font('Helvetica-Bold').text('Report Information', 320, metaY);
    doc.font('Helvetica').text(`Assessment ID: HRA-${report.id.toString().padStart(6, '0')}`, 320, metaY + 20);
    doc.text(`Date: ${new Date(report.created_at).toLocaleDateString()}`, 320, metaY + 35);
    doc.text(`Status: Completed`, 320, metaY + 50);
    
    doc.moveDown(6.5);
    
    // Risk Result Callout
    doc.rect(50, doc.y, 495, 60).fill('#fef2f2'); // soft light red background for high risk
    if (report.result !== 'High Risk') {
      doc.rect(50, doc.y, 495, 60).fill('#ecfdf5'); // soft light green
    }
    
    const resultY = doc.y + 15;
    doc.fillColor(accentColor).fontSize(14).font('Helvetica-Bold').text(`RISK STATUS: ${report.result.toUpperCase()}`, 70, resultY);
    doc.fontSize(11).fillColor(textColor).text(`Confidence Score: ${report.confidence}%`, 70, resultY + 18);
    
    doc.moveDown(4.5);
    
    // Clinical Parameters section
    doc.fillColor(primaryColor).fontSize(13).font('Helvetica-Bold').text('Clinical Parameters Measured', 50);
    doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(50, doc.y + 2).lineTo(545, doc.y + 2).stroke();
    doc.moveDown(0.8);
    
    // Parameters grid display
    const startX1 = 65;
    const startX2 = 300;
    let gridY = doc.y;
    
    const cpMap = ['Typical Angina', 'Atypical Angina', 'Non-anginal Pain', 'Asymptomatic'];
    const restecgMap = ['Normal', 'ST-T Wave Abnormality', 'Left Ventricular Hypertrophy'];
    const thalMap = ['Normal', 'Fixed Defect', 'Reversible Defect', 'Other'];
    
    doc.font('Helvetica').fontSize(9);
    
    const paramsLeft = [
      `Resting BP: ${report.trestbps} mmHg (Normal: <120)`,
      `Serum Cholesterol: ${report.chol} mg/dl (Normal: <200)`,
      `Fasting Sugar: ${report.fbs === 1 ? '> 120 mg/dl' : '<= 120 mg/dl'}`,
      `Resting ECG: ${restecgMap[report.restecg] || report.restecg}`,
      `Max Heart Rate: ${report.thalach} bpm (Expected: 220-Age)`,
      `Exercise Angina: ${report.exang === 1 ? 'Yes' : 'No'}`
    ];
    
    const paramsRight = [
      `Chest Pain Type: ${cpMap[report.cp] || report.cp}`,
      `ST Depression (Oldpeak): ${report.oldpeak}`,
      `Peak ST Slope: ${report.slope === 0 ? 'Upsloping' : report.slope === 1 ? 'Flat' : 'Downsloping'}`,
      `Vessels Colored (CA): ${report.ca}`,
      `Thalassemia (Thal): ${thalMap[report.thal] || report.thal}`
    ];
    
    paramsLeft.forEach((item, index) => {
      doc.text(`• ${item}`, startX1, gridY + (index * 14));
    });
    
    paramsRight.forEach((item, index) => {
      doc.text(`• ${item}`, startX2, gridY + (index * 14));
    });
    
    doc.moveDown(6);
    
    // Recommendations section
    doc.fillColor(primaryColor).fontSize(13).font('Helvetica-Bold').text('AI Clinical Recommendations', 50);
    doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(50, doc.y + 2).lineTo(545, doc.y + 2).stroke();
    doc.moveDown(0.8);
    
    doc.fillColor(textColor).fontSize(9.5).font('Helvetica');
    
    // Formatting recommendations markdown text
    const recText = report.recommendations || 'No recommendations generated.';
    const lines = recText.split('\n');
    let recsY = doc.y;
    
    lines.forEach((line) => {
      if (line.startsWith('###')) {
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').fillColor(primaryColor).text(line.replace(/###|\*\*/g, '').trim(), 50);
        doc.font('Helvetica').fillColor(textColor);
      } else if (line.trim().startsWith('-')) {
        doc.text(line.replace(/^\s*-\s*/, '• ').replace(/\*\*/g, ''), 60);
      } else if (line.trim()) {
        doc.text(line.replace(/\*\*/g, ''), 50);
      }
    });
    
    // Disclaimer and signature at the footer
    doc.moveDown(2);
    
    // Prevent overlapping with page bottom by adding page if needed
    if (doc.y > 680) {
      doc.addPage();
    }
    
    doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);
    
    doc.fillColor('#9ca3af').fontSize(7.5).font('Helvetica-Oblique').text(
      'Medical Disclaimer: This report is generated by a machine learning model and AI assistant for educational/informational support. It does not constitute official clinical diagnosis or medical advice. Please share this report with a qualified physician or cardiologist to conduct diagnostic examinations (e.g. ECG, Stress Test).',
      50, doc.y, { width: 495, align: 'justify' }
    );
    
    doc.moveDown(1.5);
    doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(8.5).text('Hospital Contact Support:', 50);
    doc.font('Helvetica').fillColor(textColor).text('Cardiac Wellness Dept | Phone: +1-800-555-0199 | Email: cardiac-support@hospital.org', 50);
    
    doc.end();
  } catch (err) {
    console.error('Error generating PDF report:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Server error while generating PDF' });
    }
  }
};

exports.quickPredict = async (req, res) => {
  const { age, sex, cp, trestbps, chol, fbs, restecg, thalach, exang, oldpeak, slope, ca, thal } = req.body;

  const payload = {
    age: parseInt(age),
    sex: parseInt(sex),
    cp: parseInt(cp),
    trestbps: parseInt(trestbps),
    chol: parseInt(chol),
    fbs: parseInt(fbs),
    restecg: parseInt(restecg),
    thalach: parseInt(thalach),
    exang: parseInt(exang),
    oldpeak: parseFloat(oldpeak),
    slope: parseInt(slope),
    ca: parseInt(ca),
    thal: parseInt(thal)
  };

  try {
    const mlResponse = await axios.post(FLASK_API_URL, payload);
    const { prediction, confidence, risk_probability } = mlResponse.data;

    res.json({
      prediction,
      confidence,
      risk_probability
    });
  } catch (err) {
    console.error('Quick predict ML service error:', err.message);
    
    // Fallback heuristic calculations if Python ML server is offline
    let riskScore = 0;
    if (payload.age > 55) riskScore += 1.0;
    if (payload.sex === 1) riskScore += 0.5;
    if (payload.cp > 0) riskScore += 1.5;
    if (payload.trestbps > 140) riskScore += 1.0;
    if (payload.chol > 240) riskScore += 1.0;
    if (payload.thalach < 130) riskScore += 1.0;
    if (payload.exang === 1) riskScore += 1.5;
    if (payload.oldpeak > 1.5) riskScore += 1.5;
    if (payload.ca > 0) riskScore += 1.5;
    if (payload.thal > 1) riskScore += 1.0;

    const isHigh = riskScore >= 5.0;
    const computedConf = Math.min(50 + riskScore * 8, 98);

    res.json({
      prediction: isHigh ? 'High Risk' : 'Low Risk',
      confidence: computedConf.toFixed(1),
      risk_probability: (isHigh ? computedConf / 100 : (100 - computedConf) / 100).toFixed(4),
      isFallback: true
    });
  }
};

exports.getAuditLogs = async (req, res) => {
  const role = req.user.role;
  if (role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Auditing is restricted to administrators.' });
  }

  try {
    const logs = await db.query(
      `SELECT al.*, u.name as user_name, u.email as user_email 
       FROM audit_logs al 
       JOIN users u ON al.user_id = u.id 
       ORDER BY al.created_at DESC`
    );
    res.json(logs);
  } catch (err) {
    console.error('Error fetching audit logs:', err.message);
    res.status(500).json({ error: 'Server error while retrieving audit trails' });
  }
};

exports.downloadIntakeTemplate = async (req, res) => {
  try {
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Cardiocare_Intake_Checklist_Template.pdf');
    doc.pipe(res);

    doc.fontSize(20).font('Helvetica-Bold').fillColor('#0284c7').text('CARDIOCARE AI - CLINICAL INTAKE CHECKLIST', { align: 'center' });
    doc.moveDown(0.2);
    doc.fontSize(10).font('Helvetica').fillColor('#64748b').text('Cardiovascular Diagnostic Screening Parameters Intake Form', { align: 'center' });
    doc.moveDown(1.5);

    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e293b').text('1. PATIENT DEMOGRAPHICS');
    doc.lineWidth(1).strokeColor('#e2e8f0').moveTo(50, doc.y + 4).lineTo(550, doc.y + 4).stroke();
    doc.moveDown(0.8);

    doc.fontSize(10).font('Helvetica').fillColor('#334155');
    doc.text('Full Name: __________________________________________________', 50, doc.y);
    doc.moveDown(0.6);
    doc.text('Age (Years): __________          Biological Sex:   [  ] Male     [  ] Female', 50, doc.y);
    doc.moveDown(1.5);

    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e293b').text('2. CARDIAC VITALS');
    doc.lineWidth(1).strokeColor('#e2e8f0').moveTo(50, doc.y + 4).lineTo(550, doc.y + 4).stroke();
    doc.moveDown(0.8);

    doc.fontSize(10).font('Helvetica').fillColor('#334155');
    doc.text('Resting Blood Pressure: ____________ mmHg (desirable: < 120 mmHg)', 50, doc.y);
    doc.moveDown(0.6);
    doc.text('Serum Cholesterol: ____________ mg/dL (desirable: < 200 mg/dL)', 50, doc.y);
    doc.moveDown(0.6);
    doc.text('Chest Pain Classification (select one):', 50, doc.y);
    doc.moveDown(0.3);
    doc.text('    [  ] Typical Angina          [  ] Atypical Angina          [  ] Non-Anginal          [  ] Asymptomatic', 50, doc.y);
    doc.moveDown(0.6);
    doc.text('Fasting Blood Sugar > 120 mg/dL:   [  ] True (High)     [  ] False (Normal)', 50, doc.y);
    doc.moveDown(1.5);

    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e293b').text('3. DIAGNOSTIC LABS');
    doc.lineWidth(1).strokeColor('#e2e8f0').moveTo(50, doc.y + 4).lineTo(550, doc.y + 4).stroke();
    doc.moveDown(0.8);

    doc.text('Resting Electrocardiographic (ECG) Results:', 50, doc.y);
    doc.moveDown(0.3);
    doc.text('    [  ] Normal (0)          [  ] ST-T Wave Abnormality (1)          [  ] Left Ventricular Hypertrophy (2)', 50, doc.y);
    doc.moveDown(0.6);
    doc.text('Maximum Heart Rate Achieved: ____________ bpm', 50, doc.y);
    doc.moveDown(0.6);
    doc.text('Exercise Induced Angina:   [  ] Yes     [  ] No', 50, doc.y);
    doc.moveDown(0.6);
    doc.text('ST Depression (Induced by Exercise relative to Rest): ____________', 50, doc.y);
    doc.moveDown(0.6);
    doc.text('ST Segment Slope:   [  ] Upsloping          [  ] Flat          [  ] Downsloping', 50, doc.y);
    doc.moveDown(0.6);
    doc.text('Major Vessels Colored by Fluoroscopy:   [  ] 0     [  ] 1     [  ] 2     [  ] 3', 50, doc.y);
    doc.moveDown(0.6);
    doc.text('Thalassemia Defect:   [  ] Normal     [  ] Fixed Defect     [  ] Reversible Defect', 50, doc.y);
    doc.moveDown(1.5);

    doc.rect(50, doc.y, 500, 60).fillAndStroke('#f8fafc', '#cbd5e1');
    doc.fillColor('#475569').fontSize(9).font('Helvetica-Oblique');
    doc.text('Clinician Instructions: Write values clearly in the designated lines. Once complete, you may either scan the sheet to upload to the AI OCR scanner, or enter parameters manually in the screening form workspace.', 60, doc.y - 50, { width: 480, align: 'center' });

    doc.end();
  } catch (err) {
    console.error('Error generating PDF template:', err.message);
    res.status(500).json({ error: 'Server error while generating clinical checklist' });
  }
};

exports.updatePrediction = async (req, res) => {
  const { id } = req.params;
  const { recommendations, treatmentPlan } = req.body;
  const userId = req.user.id;
  const role = req.user.role;

  try {
    const predictions = await db.query('SELECT * FROM predictions WHERE id = ?', [id]);
    if (predictions.length === 0) {
      return res.status(404).json({ error: 'Prediction record not found' });
    }

    const prediction = predictions[0];
    
    if (role !== 'admin' && prediction.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied: You cannot update this record' });
    }

    let updatedRecommendations = recommendations || prediction.recommendations;
    if (treatmentPlan) {
      updatedRecommendations += `\n\n### **Prescribed Treatment Plan**\n` +
        `- **Lifestyle Mod (Diet & Exercise)**: ${treatmentPlan.lifestyle ? 'Prescribed' : 'Not Prescribed'}\n` +
        `- **Statin Therapy**: ${treatmentPlan.statins ? 'Prescribed' : 'Not Prescribed'}\n` +
        `- **Beta-Blockers**: ${treatmentPlan.betaBlockers ? 'Prescribed' : 'Not Prescribed'}\n` +
        `- **ACE Inhibitors**: ${treatmentPlan.aceInhibitors ? 'Prescribed' : 'Not Prescribed'}\n` +
        `- **Projected Post-Treatment Risk**: ${treatmentPlan.projectedRisk}% (originally ${prediction.confidence}%)`;
    }

    await db.query(
      'UPDATE predictions SET recommendations = ? WHERE id = ?',
      [updatedRecommendations, id]
    );

    await logAction(userId, 'PREDICTION_UPDATE', { 
      prediction_id: id, 
      patient_name: prediction.patient_name,
      treatment_plan: treatmentPlan 
    });

    res.json({ 
      message: 'Treatment plan saved and audit trail logged successfully',
      recommendations: updatedRecommendations
    });
  } catch (err) {
    console.error('Error updating prediction treatment plan:', err.message);
    res.status(500).json({ error: 'Server error while saving treatment plan' });
  }
};
