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

// Highly descriptive mock clinical responses based on questions
const getHeuristicReply = (message, errorMsg = '') => {
  const lowerMsg = message.toLowerCase();
  let reply = "I am your **Cardiocare AI Clinical Assistant**. ";
  if (errorMsg) {
    reply += `*Note: Running in local heuristic fallback mode due to a Gemini connection warning (${errorMsg}).*\n\n`;
  } else {
    reply += "Currently, the Gemini API key is not configured, so I am running in local screening simulation mode.\n\n";
  }

  if (lowerMsg.includes('ecg') || lowerMsg.includes('electrocardiogram') || lowerMsg.includes('lvh')) {
    reply += "For resting ECG anomalies:\n" +
             "- **ST-T Wave Abnormalities**: Often suggest myocardial ischemia, electrolyte imbalances, or early repolarization. Compare with previous recordings.\n" +
             "- **Left Ventricular Hypertrophy (LVH)**: Strongly associated with chronic hypertension, valvular disease, or aortic stenosis.\n\n" +
             "**Recommendation**: Order a 12-lead diagnostic electrocardiogram to confirm and compare with patient baseline logs.";
  } else if (lowerMsg.includes('cholesterol') || lowerMsg.includes('ldl') || lowerMsg.includes('statins') || lowerMsg.includes('statin')) {
    reply += "Based on **2018 AHA/ACC guidelines on cholesterol management**:\n" +
             "- **Age 40-75 with Diabetes**: Initiate moderate-intensity statins immediately regardless of 10-year risk.\n" +
             "- **Age 40-75 without Diabetes**: Calculate the 10-year ASCVD risk score. If risk is >= 7.5% and LDL-C is 70-189 mg/dL, initiate moderate-intensity statin therapy.\n" +
             "- **Desirable Levels**: Total Cholesterol < 200 mg/dL, LDL-C < 100 mg/dL (or < 70 mg/dL for high-risk cohorts).";
  } else if (lowerMsg.includes('bp') || lowerMsg.includes('hypertension') || lowerMsg.includes('blood pressure') || lowerMsg.includes('thresholds') || lowerMsg.includes('2517') || lowerMsg.includes('2017') || lowerMsg.includes('aha')) {
    reply += "According to the **2017 ACC/AHA Hypertension Guidelines**:\n" +
             "- **Normal**: < 120/80 mmHg\n" +
             "- **Elevated**: 120-129 / < 80 mmHg\n" +
             "- **Stage 1 Hypertension**: 130-139 / 80-89 mmHg (Treat with lifestyle changes unless 10-year ASCVD risk is >= 10%)\n" +
             "- **Stage 2 Hypertension**: >= 140/90 mmHg (Lifestyle changes + antihypertensive pharmacotherapy with two first-line classes is standard)";
  } else if (lowerMsg.includes('heart rate') || lowerMsg.includes('zone') || lowerMsg.includes('60-year-old') || lowerMsg.includes('age') || lowerMsg.includes('rate')) {
    reply += "For a **60-year-old patient**:\n" +
             "- **Max Target Heart Rate**: ~160 bpm (calculated as 220 - age)\n" +
             "- **Moderate Intensity Zone (50-70% of max)**: 80 - 112 bpm\n" +
             "- **Vigorous Intensity Zone (70-85% of max)**: 112 - 136 bpm\n\n" +
             "**Clinical Note**: Always check resting pulse values. Resting bradycardia (< 60 bpm) or resting tachycardia (> 100 bpm) warrants further electrophysiological review.";
  } else {
    reply += "How can I assist you with clinical guidelines, physiological parameters, or ECG interpretations today? Feel free to ask about blood pressure stages, cholesterol desirable ranges, or target heart rate zones.";
  }

  reply += "\n\n*Disclaimer: Cardiocare AI is a clinical support assistant tool. All diagnostics must be validated by a licensed physician before starting therapy.*";
  return reply;
};

exports.handleChat = async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages are required.' });
  }

  const latestMessage = messages[messages.length - 1].content;

  if (!genAI) {
    console.log('Gemini API key is not set. Generating mock cardiology assistant response.');
    const reply = getHeuristicReply(latestMessage);
    return res.json({ reply });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });

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
    console.error('Gemini chat error, falling back to heuristics:', err.message);
    const reply = getHeuristicReply(latestMessage, err.message);
    res.json({ reply });
  }
};

exports.extractNotes = async (req, res) => {
  const { notes } = req.body;

  if (!notes || typeof notes !== 'string') {
    return res.status(400).json({ error: 'Clinical notes are required.' });
  }

  const getFallbackNotesExt = () => {
    const nameMatch = notes.match(/(?:patient|name|mr\.|ms\.)\s*([a-zA-Z\s]+)(?:is|presents|,)/i);
    const ageMatch = notes.match(/(\d+)\s*(?:years|yr|y\.o\.)/i);
    const bpMatch = notes.match(/(?:bp|blood pressure|pressure)\s*(?:is|of)?\s*(\d{2,3})/i);
    const cholMatch = notes.match(/(?:cholesterol|chol)\s*(?:is|of)?\s*(\d{2,3})/i);
    const hrMatch = notes.match(/(?:heart rate|hr|pulse|thalach)\s*(?:is|of)?\s*(\d{2,3})/i);

    return {
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
  };

  if (!genAI) {
    console.log('Gemini API key is not set for notes extraction. Running heuristic parser.');
    const extracted = getFallbackNotesExt();
    return res.json({ extracted, isFallback: true });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
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
    console.error('Error extracting patient notes, falling back to heuristics:', err.message);
    const extracted = getFallbackNotesExt();
    res.json({ extracted, isFallback: true, warning: err.message });
  }
};

exports.extractOCR = async (req, res) => {
  const { image, mimeType } = req.body;

  if (!image || !mimeType) {
    return res.status(400).json({ error: 'Image data and mimeType are required.' });
  }

  const getFallbackOCRExt = () => {
    return {
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
  };

  if (!genAI) {
    console.log('Gemini API key is not set for OCR extraction. Returning mock parsed dataset.');
    const extracted = getFallbackOCRExt();
    return res.json({ extracted, isFallback: true });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
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
    console.error('OCR Extraction error, falling back to heuristics:', err.message);
    const extracted = getFallbackOCRExt();
    res.json({ extracted, isFallback: true, warning: err.message });
  }
};
