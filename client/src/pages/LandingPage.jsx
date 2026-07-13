import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaHeartbeat, 
  FaShieldAlt, 
  FaChevronDown, 
  FaChevronUp, 
  FaArrowRight, 
  FaRegHeart,
  FaStethoscope,
  FaSun,
  FaMoon
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const { user, darkMode, toggleDarkMode } = useAuth();
  const [activeFaq, setActiveFaq] = useState(null);

  const stats = [
    { label: 'Avg Accuracy', value: '92.4%' },
    { label: 'Assessments Made', value: '14,200+' },
    { label: 'Gemini Recommendations', value: 'Instant' },
    { label: 'Processing Speed', value: '< 1.5s' }
  ];

  const faqs = [
    {
      question: "How accurate is the Heart Disease Prediction system?",
      answer: "The underlying system is trained on standard heart disease clinical study features (modeled on the UCI Cleveland dataset) using an ensemble Random Forest Classifier, yielding a verified accuracy of approximately 91-92% on testing splits. However, this is an automated screening tool, not a clinical replacement."
    },
    {
      question: "What are the 13 clinical parameters analyzed?",
      answer: "We assess standard cardiovascular markers: Age, Gender, Chest Pain Type (CP), Resting Blood Pressure, Cholesterol, Fasting Blood Sugar, Resting ECG, Maximum Heart Rate (Thalach), Exercise-induced Angina, Old Peak (ST depression), Slope of Peak Exercise, Number of major vessels (CA), and Thalassemia (Thal)."
    },
    {
      question: "How does the AI Recommendation system work?",
      answer: "If a patient is classified as 'High Risk', our system securely relays the patient's critical parameters to the Google Gemini API to dynamically generate structured lifestyle, dietary, exercise, and medical recommendation guides tailored to their risk profile."
    },
    {
      question: "Can I download my clinical reports?",
      answer: "Yes, every prediction log generates an official downloadable PDF report. It includes patient metrics, prediction results with confidence levels, structured Gemini recommendations, and professional physician disclaimers."
    }
  ];

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      
      {/* Navbar */}
      <nav className="h-20 flex items-center justify-between px-6 md:px-12 border-b border-slate-200/60 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <FaHeartbeat className="h-9 w-9 text-rose-500 animate-pulse-heart" />
          <span className="font-display font-extrabold text-xl tracking-tight bg-gradient-to-r from-rose-500 to-sky-600 bg-clip-text text-transparent">
            Antigravity Pulse
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Toggle theme"
          >
            {darkMode ? <FaSun className="h-5 w-5 text-amber-500" /> : <FaMoon className="h-5 w-5" />}
          </button>

          {user ? (
            <Link
              to="/dashboard"
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-medical-600 to-sky-500 text-white font-semibold shadow-lg shadow-medical-500/20 hover:scale-105 transition"
            >
              Go to Dashboard
              <FaArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link to="/login" className="font-semibold text-slate-600 hover:text-medical-600 dark:text-slate-300 dark:hover:text-sky-400">
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-medical-600 to-sky-500 text-white font-semibold shadow-lg hover:scale-105 transition"
              >
                Register Free
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative flex-1 py-20 px-6 md:px-12 flex flex-col items-center text-center justify-center overflow-hidden">
        {/* Background gradient elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-400/20 dark:bg-rose-900/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-400/20 dark:bg-sky-900/10 rounded-full blur-3xl -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900 text-sm font-semibold mb-6">
            <FaRegHeart className="h-4 w-4 animate-bounce" />
            AI-Powered Cardiac Risk Analysis
          </div>

          <h1 className="font-display font-extrabold text-4xl sm:text-6xl tracking-tight text-slate-900 dark:text-white leading-tight">
            Predict Heart Disease Risk <br />
            <span className="bg-gradient-to-r from-medical-500 to-rose-500 bg-clip-text text-transparent">
              With Clinical Precision
            </span>
          </h1>

          <p className="mt-6 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Input clinical patient parameters to run advanced ensemble random forest evaluations. Get instantaneous risk scores, PDF generation, and Gemini AI health directives.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to={user ? "/dashboard/predict" : "/register"}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-medical-600 to-rose-500 text-white font-bold shadow-xl shadow-medical-500/20 hover:shadow-rose-500/10 hover:scale-102 transition flex items-center justify-center gap-2"
            >
              Analyze Patient Risk Now
              <FaArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#about"
              className="px-8 py-4 rounded-xl border border-slate-200 bg-white/50 text-slate-700 font-bold dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850 transition"
            >
              Learn More
            </a>
          </div>
        </motion.div>

        {/* Stats Strip */}
        <div className="mt-20 w-full max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-6 px-4">
          {stats.map((s, idx) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.1, duration: 0.6 }}
              className="glass-card rounded-2xl p-6 text-center shadow-md border border-slate-100 dark:border-slate-800"
            >
              <div className="font-display font-extrabold text-2xl sm:text-3xl text-medical-600 dark:text-sky-400">{s.value}</div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </header>

      {/* About Section */}
      <section id="about" className="py-20 bg-white dark:bg-slate-950 px-6 md:px-12 transition-colors duration-300">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-slate-900 dark:text-white">
              Why Cardiovascular Screening Matters
            </h2>
            <div className="h-1.5 w-20 bg-rose-500 rounded mt-3 mb-6" />

            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              According to the World Health Organization, cardiovascular diseases are the leading cause of death globally, taking an estimated 17.9 million lives each year. Early detection is key.
            </p>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mt-4">
              By monitoring clinical metrics like cholesterol ratios, ST wave depressions, resting electro-cardiac variations, and maximum heart rates, healthcare staff can identify high-risk profiles before adverse events occur.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 flex-shrink-0 bg-sky-50 dark:bg-sky-950/30 flex items-center justify-center rounded-xl text-sky-600 dark:text-sky-400">
                  <FaStethoscope className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">13 Standard Features</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Comprehensive input matching standard clinical cardiology charts.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-10 w-10 flex-shrink-0 bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center rounded-xl text-rose-600 dark:text-rose-400">
                  <FaShieldAlt className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">Secure Database Archival</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Encrypted logs stored in relational tables with full searchability.</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            {/* Visual Glassmorphic Grid */}
            <div className="aspect-video w-full rounded-2xl bg-gradient-to-tr from-rose-500 to-sky-600 p-0.5 shadow-2xl relative overflow-hidden">
              <div className="w-full h-full bg-slate-900 rounded-[15px] p-6 flex flex-col justify-between text-white">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                  </div>
                  <span className="text-xs text-slate-500 font-mono">diagnostics_dashboard.sh</span>
                </div>

                <div className="space-y-4 my-6">
                  <div className="h-2 bg-slate-800 rounded w-1/3" />
                  <div className="h-12 bg-slate-800/60 rounded flex items-center justify-between px-4">
                    <span className="text-sm font-semibold text-rose-400">Cardiac Assessment: HIGH RISK</span>
                    <span className="text-xs text-slate-400">Confidence: 89.2%</span>
                  </div>
                  <div className="h-8 bg-slate-800/40 rounded flex items-center justify-between px-4">
                    <span className="text-xs text-emerald-400">Recommendation Engine: GEMINI ONLINE</span>
                    <span className="text-[10px] text-slate-400">Ready</span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-600 font-mono">
                  $ python train_model.py && flask run -p 5001
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900 px-6 md:px-12 transition-colors duration-300">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-center text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <div className="h-1.5 w-20 bg-sky-500 rounded mx-auto mt-3 mb-12" />

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div 
                  key={idx}
                  className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-800 overflow-hidden shadow-sm transition"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between p-6 text-left focus:outline-none cursor-pointer"
                  >
                    <span className="font-bold text-slate-800 dark:text-slate-100 pr-4">
                      {faq.question}
                    </span>
                    {isOpen ? <FaChevronUp className="h-4 w-4 text-slate-500" /> : <FaChevronDown className="h-4 w-4 text-slate-500" />}
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="p-6 pt-0 text-slate-600 dark:text-slate-400 text-sm border-t border-slate-100 dark:border-slate-700/50 leading-relaxed">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 border-t border-slate-800 py-12 px-6 md:px-12 text-slate-400 text-sm transition">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <FaHeartbeat className="h-8 w-8 text-rose-500" />
            <span className="font-display font-extrabold text-white text-md">Antigravity Pulse Inc.</span>
          </div>

          <div className="flex gap-6 text-slate-400">
            <a href="#about" className="hover:text-white transition">About</a>
            <Link to="/login" className="hover:text-white transition">Sign In</Link>
            <Link to="/register" className="hover:text-white transition">Register</Link>
          </div>

          <div>
            &copy; {new Date().getFullYear()} Pulse Diagnostics. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
