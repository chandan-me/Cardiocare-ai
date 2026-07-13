const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

let genAI = null;
if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  } catch (err) {
    console.error('Failed to initialize Gemini for Chat:', err.message);
  }
}

exports.handleChat = async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages are required.' });
  }

  const latestMessage = messages[messages.length - 1].content;

  // Fallback if Gemini is not configured
  if (!genAI) {
    console.log('Gemini API key is not set. Generating mock cardiology assistant response.');
    
    // Simple intelligent mock replies based on keywords
    const lowerMsg = latestMessage.toLowerCase();
    let reply = "I am your Cardiocare AI Clinical Assistant. Currently, the live Google Gemini API key is not configured in the backend environment variables, so I am running in local screening simulation mode.\n\n";

    if (lowerMsg.includes('ecg') || lowerMsg.includes('electrocardiogram')) {
      reply += "For resting ECG anomalies: ST-T wave abnormalities often suggest myocardial ischemia or electrolyte imbalances. Left Ventricular Hypertrophy (LVH) usually relates to chronic high blood pressure. Standard clinical recommendation includes ordering a 12-lead diagnostic ECG and comparing with prior baselines.";
    } else if (lowerMsg.includes('cholesterol') || lowerMsg.includes('ldl') || lowerMsg.includes('statins')) {
      reply += "Based on AHA guidelines, adults age 40-75 with LDL-C >= 70 mg/dL and 10-year risk >= 7.5% should be initiated on moderate-intensity statin therapy. Lifestyle improvements (increasing soluble fiber, lowering saturated fats) are recommended for all patients.";
    } else if (lowerMsg.includes('bp') || lowerMsg.includes('hypertension') || lowerMsg.includes('blood pressure')) {
      reply += "Stage 1 Hypertension (systolic 130-139 or diastolic 80-89 mmHg) is treated initially with lifestyle adjustments, unless the patient has a high 10-year ASCVD risk (>=10%), in which case a single antihypertensive agent is recommended.";
    } else {
      reply += "How can I assist you with clinical guidelines, physiological parameters, or ECG interpretations today? Feel free to ask about blood pressure stages, cholesterol desirable ranges, or target heart rate zones.";
    }

    return res.json({ reply });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Construct a rich system prompt context for Gemini
    const systemPrompt = `You are a helpful, expert clinical cardiology assistant integrated into Cardiocare AI. 
You assist cardiologists, nurses, and clinicians with interpretations of vital signs, diagnostic reference ranges, AHA/ESC guidelines, cardiovascular health queries, and diagnostic advice.
Provide professional, evidence-based, and clear answers. Avoid long essays; format your answers with bold highlights and bullet points for quick reading in a fast clinical setting. 
Always include a brief, standard medical disclaimer at the very end of your response.

Here is the conversation history:
${messages.map(m => `${m.role === 'user' ? 'Clinician' : 'AI Assistant'}: ${m.content}`).join('\n')}

New Question: ${latestMessage}`;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const replyText = response.text();

    res.json({ reply: replyText });
  } catch (err) {
    console.error('Gemini chat error:', err.message);
    res.status(500).json({ error: 'Failed to process AI assistant message.' });
  }
};

exports.extractNotes = async (req, res) => {
  const { notes } = req.body;

  if (!notes || typeof notes !== 'string') {
    return res.status(400).json({ error: 'Clinical notes are required.' });
  }

  if (!genAI) {
    console.log('Gemini API key is not set for notes extraction. Running heuristic parser.');
    
    const nameMatch = notes.match(/(?:patient|name|mr\.|ms\.)\s*([a-zA-Z\s]+)(?:is|presents|,)/i);
    const ageMatch = notes.match(/(\d+)\s*(?:years|yr|y\.o\.)/i);
    const bpMatch = notes.match(/(?:bp|blood pressure|pressure)\s*(?:is|of)?\s*(\d{2,3})/i);
    const cholMatch = notes.match(/(?:cholesterol|chol)\s*(?:is|of)?\s*(\d{2,3})/i);
    const hrMatch = notes.match(/(?:heart rate|hr|pulse|thalach)\s*(?:is|of)?\s*(\d{2,3})/i);

    const extracted = {
      patient_name: nameMatch ? nameMatch[1].trim() : 'Unknown Patient',
      age: ageMatch ? parseInt(ageMatch[1]) : 52,
      sex: notes.toLowerCase().includes('female') || notes.toLowerCase().includes('woman') || notes.toLowerCase().includes('she') ? 0 : 1,
      cp: notes.toLowerCase().includes('squeezing') || notes.toLowerCase().includes('typical') ? 0 : (notes.toLowerCase().includes('sharp') ? 1 : 2),
      trestbps: bpMatch ? parseInt(bpMatch[1]) : 130,
      chol: cholMatch ? parseInt(cholMatch[1]) : 220,
      fbs: notes.toLowerCase().includes('sugar') || notes.toLowerCase().includes('diabetic') ? 1 : 0,
      restecg: 1,
      thalach: hrMatch ? parseInt(hrMatch[1]) : 145,
      exang: notes.toLowerCase().includes('exertion') || notes.toLowerCase().includes('angina') ? 1 : 0,
      oldpeak: 1.0,
      slope: 1,
      ca: 0,
      thal: 2
    };

    return res.json({ extracted, isFallback: true });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `You are an expert medical transcriptionist. Extract the following 13 clinical cardiovascular indicators from the doctor's unstructured patient notes. Return the results in raw, valid JSON matching the following schema. If any parameter is not mentioned, provide the standard clinical median defaults as indicated:
    - age (number: default 50)
    - sex (number: 1 for male, 0 for female, default 1)
    - cp (number: chest pain type: 0=typical angina, 1=atypical, 2=non-anginal, 3=asymptomatic. Look for descriptions: 'squeezing chest pain' = 0, 'sharp pain on chest movement' = 1, 'vague discomfort' = 2, 'no pain' = 3. Default 1)
    - trestbps (number: resting blood pressure in mmHg, default 130)
    - chol (number: serum cholesterol in mg/dl, default 220)
    - fbs (number: fasting blood sugar > 120 mg/dl: 1 if true/high, 0 if false/normal, default 0)
    - restecg (number: resting ECG: 0=normal, 1=ST wave abnormality, 2=left ventricular hypertrophy, default 1)
    - thalach (number: maximum heart rate achieved, default 150)
    - exang (number: exercise induced angina: 1 if yes, 0 if no, default 0)
    - oldpeak (number: ST depression oldpeak, default 1.0)
    - slope (number: ST slope: 0=upsloping, 1=flat, 2=downsloping, default 1)
    - ca (number: number of major vessels colored: 0 to 4, default 0)
    - thal (number: thalassemia: 0=normal/unknown, 1=fixed, 2=normal, 3=reversible, default 2)
    - patient_name (string: extract name or use 'Unknown Patient' if not mentioned)

    Doctor's notes:
    "${notes}"

    Return ONLY the raw JSON object, without markdown wraps, matching the schema above.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();
    
    if (text.startsWith('```')) {
      text = text.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
    }

    const extracted = JSON.parse(text);
    res.json({ extracted });
  } catch (err) {
    console.error('Error extracting patient notes:', err.message);
    res.status(500).json({ error: 'Failed to parse patient notes using AI.' });
  }
};

exports.extractOCR = async (req, res) => {
  const { image, mimeType } = req.body;

  if (!image || !mimeType) {
    return res.status(400).json({ error: 'Image data and mimeType are required.' });
  }

  if (!genAI) {
    console.log('Gemini API key is not set for OCR extraction. Returning mock parsed dataset.');
    const extracted = {
      patient_name: 'David Miller',
      age: 58,
      sex: 1,
      cp: 2,
      trestbps: 140,
      chol: 250,
      fbs: 0,
      restecg: 1,
      thalach: 135,
      exang: 1,
      oldpeak: 1.8,
      slope: 2,
      ca: 1,
      thal: 3
    };
    return res.json({ extracted, isFallback: true });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType
      }
    };

    const prompt = `You are an expert clinical laboratory data extraction agent. Extract the following 13 cardiovascular markers and the patient's name from the attached lab report scan or clinical document image. 
    Return the results in raw, valid JSON matching the following schema. If any parameter is not mentioned, provide standard median clinical defaults:
    - age (number: default 50)
    - sex (number: 1 for male, 0 for female, default 1)
    - cp (number: chest pain type: 0=typical, 1=atypical, 2=non-anginal, 3=asymptomatic, default 1)
    - trestbps (number: resting blood pressure in mmHg, default 130)
    - chol (number: serum cholesterol in mg/dl, default 220)
    - fbs (number: fasting blood sugar > 120: 1 if yes, 0 if no, default 0)
    - restecg (number: resting ECG: 0=normal, 1=ST wave abnormality, 2=LVH, default 1)
    - thalach (number: maximum heart rate, default 150)
    - exang (number: exercise induced angina: 1 if yes, 0 if no, default 0)
    - oldpeak (number: ST depression oldpeak, default 1.0)
    - slope (number: ST slope: 0=upsloping, 1=flat, 2=downsloping, default 1)
    - ca (number: number of vessels colored 0-4, default 0)
    - thal (number: thalassemia: 1=fixed, 2=normal, 3=reversible, default 2)
    - patient_name (string: patient full name if found, default 'Unknown Patient')

    Return ONLY the raw JSON object, without markdown wraps, matching the schema above.`;

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    let text = response.text().trim();

    if (text.startsWith('```')) {
      text = text.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
    }

    const extracted = JSON.parse(text);
    res.json({ extracted });
  } catch (err) {
    console.error('OCR Extraction error:', err.message);
    res.status(550).json({ error: 'Failed to extract variables from clinical scan.' });
  }
};
