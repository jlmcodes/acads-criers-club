import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { 
  BookOpen, Folder, Bell, ChevronLeft, ChevronRight, Clock, GraduationCap, 
  StickyNote, Trash2, Plus, Save, Moon, Sun, User, Play, Edit, Menu, X, 
  FileText, CheckCircle, XCircle, Shuffle, Upload, Star, Sparkles, Send, 
  Archive, Check, Camera, ChevronDown, ArrowLeft, MoreVertical, Copy, 
  AlignLeft, Download, Eye, EyeOff, Calendar as CalendarIcon, PanelRightClose, 
  PanelRightOpen, ArrowRight, XSquare, PlusCircle, Quote, Calculator, LogIn,
  Cloud, CloudOff, RefreshCw
} from 'lucide-react';

// ----------------------------------------------------------------------
// 🔥 FIREBASE SETUP: Replace these values with your Firebase Config! 🔥
// You can find this in Firebase Console > Project Settings > Web App
// ----------------------------------------------------------------------
const localFirebaseConfig = {
  apiKey: "AIzaSyDdE4EvCBWap2FCCMFKef9_r0JAV0faT3s",
  authDomain: "acads-criers-club.firebaseapp.com",
  projectId: "acads-criers-club",
  storageBucket: "acads-criers-club.firebasestorage.app",
  messagingSenderId: "607225586157",
  appId: "1:607225586157:web:35fdf42977fbfd208187e4"
};

const firebaseConfig = typeof __firebase_config !== 'undefined' && __firebase_config 
  ? JSON.parse(__firebase_config) 
  : localFirebaseConfig;

let app, auth, db, provider;
try {
  // Only initialize if we have actual keys or are in the Canvas environment
  if (firebaseConfig.apiKey !== "YOUR_API_KEY" || typeof __firebase_config !== 'undefined') {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    provider = new GoogleAuthProvider();
  }
} catch (e) {
  console.warn('Firebase initialization error', e);
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const shuffleArray = (array) => {
  let newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const copyToClipboard = (text, onSuccess) => {
  const fallbackCopy = () => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    // Avoid scrolling to bottom
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand('copy');
      if (successful && onSuccess) onSuccess();
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
    }
    document.body.removeChild(textArea);
  };

  if (!navigator.clipboard) {
    fallbackCopy();
    return;
  }
  
  navigator.clipboard.writeText(text)
    .then(() => { if (onSuccess) onSuccess(); })
    .catch((err) => {
      console.warn("Modern clipboard API failed, using fallback.", err);
      fallbackCopy();
    });
};

const QuizExportButton = ({ quiz, isDarkMode }) => {
  const [copied, setCopied] = useState(false);
  const handleExport = () => {
    copyToClipboard(JSON.stringify(quiz, null, 2), () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={handleExport} className={`w-full py-2.5 ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'} rounded-xl font-bold flex justify-center items-center gap-2 transition-colors`}>
      {copied ? <Check size={16} className="text-emerald-500" /> : <Download size={16} />}
      {copied ? 'JSON Copied!' : 'Export JSON'}
    </button>
  );
};

const ImportQuizModal = ({ quizzes, setQuizzes, closeModal }) => {
  const [error, setError] = useState('');
  const [jsonText, setJsonText] = useState('');

  const sampleJson = `{
  "title": "FAR Review",
  "questions": [
    {
      "text": "What is the normal balance of an asset account?",
      "options": ["Credit", "Debit", "Zero", "None"],
      "correctIndex": 1
    }
  ]
}`;

  const handleCopySample = () => {
    copyToClipboard(sampleJson, () => {
        // Optional: you could show a brief "Copied!" state on the button
    });
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(jsonText.trim());
      if (parsed && parsed.title && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        const newQuiz = {
          id: generateId(),
          title: parsed.title + ' (Imported)',
          questions: parsed.questions.map(q => ({ 
            ...q, 
            id: generateId() 
          }))
        };
        setQuizzes([...quizzes, newQuiz]);
        closeModal();
      } else {
        setError('Invalid quiz format. Make sure it matches the required schema.');
      }
    } catch (e) {
      setError('Invalid JSON code. Please check for syntax errors.');
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <h2 className="text-xl font-black mb-4 flex items-center gap-2"><Upload size={20} className="text-indigo-500"/> Import Quiz</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
        {}
        <div>
           <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Required AI JSON Format:</p>
           <div className="relative group">
              <pre className="p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs font-mono text-slate-600 dark:text-slate-400 overflow-x-auto whitespace-pre-wrap">
                {sampleJson}
              </pre>
              <button 
                onClick={handleCopySample} 
                className="absolute top-2 right-2 p-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:text-indigo-600 dark:hover:text-indigo-400"
                title="Copy Sample"
              >
                <Copy size={14} />
              </button>
           </div>
           <p className="text-xs text-slate-500 mt-2 font-medium">Copy this format and prompt an AI (like ChatGPT) to generate questions following this exact structure.</p>
        </div>

        {}
        <div className="flex flex-col">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Paste JSON Here:</p>
          <textarea 
            value={jsonText}
            onChange={(e) => { setJsonText(e.target.value); setError(''); }}
            placeholder='Paste your generated JSON here...' 
            className={`flex-1 w-full p-3 rounded-xl border bg-transparent outline-none resize-none custom-scrollbar font-mono text-xs ${error ? 'border-red-500 focus:border-red-500' : 'border-slate-600 focus:border-indigo-500'}`}
          ></textarea>
        </div>
      </div>
      
      {error && <p className="text-red-500 text-xs font-bold mb-4">{error}</p>}
      
      <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <button onClick={closeModal} className="px-6 py-3 rounded-xl font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">Cancel</button>
        <button onClick={handleImport} className="px-6 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2"><Upload size={16}/> Import</button>
      </div>
    </div>
  );
};

const DEFAULT_GWA_SCALE = [
  { min: 96, max: 100, gwa: '1.00' },
  { min: 90, max: 95.99, gwa: '1.25' },
  { min: 85, max: 89.99, gwa: '1.50' },
  { min: 80, max: 84.99, gwa: '1.75' },
  { min: 75, max: 79.99, gwa: '2.00' },
  { min: 70, max: 74.99, gwa: '2.25' },
  { min: 65, max: 69.99, gwa: '2.50' },
  { min: 60, max: 64.99, gwa: '2.75' },
  { min: 0, max: 59.99, gwa: '3.00' },
];

const isInAppBrowser = /FBAN|FBAV|Instagram|LinkedInApp|Snapchat|Line/i.test(navigator.userAgent || '');

// Custom Hook to sync data with Firebase Cloud Firestore + Local Storage Fallback
const dispatchSyncStatus = (status, msg = '') => {
   window.dispatchEvent(new CustomEvent('acads_sync_status', { detail: { status, msg } }));
};

function useFirestoreState(defaultValue, key, uid) {
  const [state, setState] = React.useState(() => {
     if (!uid) return defaultValue;
     const cached = window.localStorage.getItem(`acads_cache_${uid}_${key}`);
     if (cached) {
        try { return JSON.parse(cached); } catch(e) {}
     }
     return defaultValue;
  });
  const [isLoaded, setIsLoaded] = React.useState(false);
  const currentUidRef = React.useRef(uid);
  
  const appId = typeof __app_id !== 'undefined' && __app_id ? __app_id : 'acads-criers-club';

  React.useEffect(() => {
    currentUidRef.current = uid;
    if (!uid) {
       setIsLoaded(true);
       return;
    }
    if (!db) {
       setIsLoaded(true);
       return;
    }

    const docRef = doc(db, 'artifacts', appId, 'users', uid, key, 'data');
    
    dispatchSyncStatus('syncing');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const rawData = docSnap.data().value;
        let parsed = rawData;
        try { parsed = typeof rawData === 'string' ? JSON.parse(rawData) : rawData; } catch(e) {}
        setState(parsed);
        window.localStorage.setItem(`acads_cache_${uid}_${key}`, typeof rawData === 'string' ? rawData : JSON.stringify(rawData));
        dispatchSyncStatus('synced');
      } else {
        // Cloud is empty. Only migrate local data if it actually contains meaningful modifications (prevents new devices from wiping the cloud)
        const backup = window.localStorage.getItem(`acads_cache_${uid}_${key}`);
        const defaultStr = JSON.stringify(defaultValue);
        
        if (backup && backup !== defaultStr && backup !== "[]" && backup !== "{}") {
           setDoc(docRef, { value: backup }, { merge: true })
             .then(() => dispatchSyncStatus('synced'))
             .catch(e => dispatchSyncStatus('error', e.message));
        } else {
           dispatchSyncStatus('synced');
        }
      }
      setIsLoaded(true);
    }, (err) => {
      console.error(`Firebase sync error for ${key}:`, err);
      dispatchSyncStatus('error', err.message);
      setIsLoaded(true);
    });

    return () => unsubscribe();
  }, [uid, key, appId]);

  const setPersistentState = React.useCallback((newValue) => {
    setState((prevState) => {
      const valueToStore = typeof newValue === 'function' ? newValue(prevState) : newValue;

      if (uid) {
         const serialized = JSON.stringify(valueToStore);
         window.localStorage.setItem(`acads_cache_${uid}_${key}`, serialized);
         
         if (db && currentUidRef.current === uid) {
            dispatchSyncStatus('syncing');
            const docRef = doc(db, 'artifacts', appId, 'users', uid, key, 'data');
            setDoc(docRef, { value: serialized }, { merge: true })
               .then(() => dispatchSyncStatus('synced'))
               .catch((e) => {
                  console.error(`Cloud save error for ${key}:`, e);
                  dispatchSyncStatus('error', e.message);
               });
         }
      }
      return valueToStore;
    });
  }, [uid, key, appId]);

  return [state, setPersistentState, isLoaded];
}

const AddFlashcardModal = ({ decks, setDecks, modalData, closeModal }) => {
  const [cardType, setCardType] = useState('basic');
  const [q, setQ] = useState('');
  const [a, setA] = useState('');
  const [items, setItems] = useState(['']);
  const [jeAccounts, setJeAccounts] = useState([{ title: '', debit: '', credit: '' }]);
  const [tLeft, setTLeft] = useState(['']);
  const [tRight, setTRight] = useState(['']);
  const [tTitle, setTTitle] = useState('Account Name');

  const handleSave = () => {
    let cardData = { id: generateId(), type: cardType, question: q };
    if (cardType === 'basic' || cardType === 'formula') cardData.answer = a;
    else if (cardType === 'itemized') cardData.items = items.filter(i => i.trim() !== '');
    else if (cardType === 'journal') cardData.journal = jeAccounts.filter(j => j.title.trim() !== '');
    else if (cardType === 'taccount') cardData.taccount = { title: tTitle, left: tLeft.filter(i => i.trim() !== ''), right: tRight.filter(i => i.trim() !== '') };

    setDecks(decks.map(d => d.id === modalData.deckId ? { ...d, cards: [...d.cards, cardData] } : d));
    closeModal();
  };

  return (
    <div className="w-full max-w-2xl">
       <h2 className="text-xl font-black mb-4">Add Flashcard</h2>
       <select value={cardType} onChange={(e) => setCardType(e.target.value)} className="w-full p-3 rounded-xl border bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 mb-4 font-bold outline-none text-slate-800 dark:text-slate-100">
          <option value="basic">Basic (Q & A)</option>
          <option value="formula">Formula / Equation</option>
          <option value="itemized">Itemized / List</option>
          <option value="journal">Journal Entry</option>
          <option value="taccount">T-Account</option>
       </select>
       
       <div className="space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2 mb-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Front (Question / Prompt)</label>
            <textarea value={q} onChange={e => setQ(e.target.value)} rows={3} className="w-full p-3 rounded-xl border bg-transparent border-slate-600 focus:border-indigo-500 outline-none resize-none" placeholder="What is the..."></textarea>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <label className="block text-xs font-bold text-slate-500 mb-2">Back (Answer)</label>
            
            {(cardType === 'basic' || cardType === 'formula') && (
              <textarea value={a} onChange={e => setA(e.target.value)} rows={4} className={`w-full p-3 rounded-xl border bg-transparent border-slate-600 focus:border-indigo-500 outline-none resize-none ${cardType === 'formula' ? 'font-mono text-center text-lg' : ''}`} placeholder="Answer..."></textarea>
            )}

            {cardType === 'itemized' && (
              <div className="space-y-2">
                 {items.map((item, i) => (
                   <div key={i} className="flex gap-2">
                     <span className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg font-bold">{i+1}.</span>
                     <input type="text" value={item} onChange={e => { const n = [...items]; n[i] = e.target.value; setItems(n); }} className="flex-1 p-3 rounded-xl border bg-transparent border-slate-600 outline-none" />
                     <button onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl"><Trash2 size={16}/></button>
                   </div>
                 ))}
                 <button onClick={() => setItems([...items, ''])} className="text-sm font-bold text-indigo-500 flex items-center gap-1 hover:underline"><Plus size={14}/> Add Item</button>
              </div>
            )}

            {cardType === 'journal' && (
              <div className="space-y-3">
                 <div className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-500 px-2">
                   <div className="col-span-6">Account Title</div>
                   <div className="col-span-3 text-right">Debit</div>
                   <div className="col-span-3 text-right">Credit</div>
                 </div>
                 {jeAccounts.map((acc, i) => (
                   <div key={i} className="grid grid-cols-12 gap-2 items-center">
                     <input type="text" placeholder="e.g. Cash" value={acc.title} onChange={e => { const n = [...jeAccounts]; n[i].title = e.target.value; setJeAccounts(n); }} className="col-span-6 p-2 rounded-lg border bg-transparent border-slate-600 outline-none italic" />
                     <input type="number" placeholder="0.00" value={acc.debit} onChange={e => { const n = [...jeAccounts]; n[i].debit = e.target.value; n[i].credit = ''; setJeAccounts(n); }} className="col-span-3 p-2 rounded-lg border bg-transparent border-slate-600 outline-none text-right" />
                     <input type="number" placeholder="0.00" value={acc.credit} onChange={e => { const n = [...jeAccounts]; n[i].credit = e.target.value; n[i].debit = ''; setJeAccounts(n); }} className="col-span-3 p-2 rounded-lg border bg-transparent border-slate-600 outline-none text-right font-bold" />
                     <button onClick={() => setJeAccounts(jeAccounts.filter((_, idx) => idx !== i))} className="col-span-12 p-1 text-red-500 hover:bg-red-500/10 rounded-lg flex justify-center mt-1"><Trash2 size={16}/></button>
                   </div>
                 ))}
                 <button onClick={() => setJeAccounts([...jeAccounts, { title: '', debit: '', credit: '' }])} className="text-sm font-bold text-indigo-500 flex items-center gap-1 hover:underline"><Plus size={14}/> Add Account Line</button>
              </div>
            )}

            {cardType === 'taccount' && (
              <div className="border-t-4 border-slate-500 pt-2 mt-4 relative">
                 <input type="text" value={tTitle} onChange={e => setTTitle(e.target.value)} className="w-full text-center font-black text-lg bg-transparent outline-none border-b-2 border-transparent focus:border-indigo-500 mb-2" placeholder="Account Title" />
                 <div className="grid grid-cols-2 gap-4 border-t-4 border-slate-500 relative">
                   <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-slate-500 -translate-x-1/2"></div>
                   
                   <div className="p-2 space-y-2">
                     <h4 className="text-center font-bold text-sm text-slate-500 mb-2">Debit</h4>
                     {tLeft.map((item, i) => (
                       <div key={i} className="flex items-center gap-1">
                         <input type="text" value={item} onChange={e => { const n = [...tLeft]; n[i] = e.target.value; setTLeft(n); }} className="w-full p-2 rounded border bg-transparent border-slate-600 outline-none text-sm" placeholder="Entry..." />
                         <button onClick={() => setTLeft(tLeft.filter((_, idx) => idx !== i))} className="p-2 text-red-500 hover:bg-red-500/10 rounded"><Trash2 size={14}/></button>
                       </div>
                     ))}
                     <button onClick={() => setTLeft([...tLeft, ''])} className="text-xs font-bold text-indigo-500"><Plus size={12} className="inline"/> Add Debit</button>
                   </div>
                   
                   <div className="p-2 space-y-2">
                     <h4 className="text-center font-bold text-sm text-slate-500 mb-2">Credit</h4>
                     {tRight.map((item, i) => (
                       <div key={i} className="flex items-center gap-1">
                         <input type="text" value={item} onChange={e => { const n = [...tRight]; n[i] = e.target.value; setTRight(n); }} className="w-full p-2 rounded border bg-transparent border-slate-600 outline-none text-sm" placeholder="Entry..." />
                         <button onClick={() => setTRight(tRight.filter((_, idx) => idx !== i))} className="p-2 text-red-500 hover:bg-red-500/10 rounded"><Trash2 size={14}/></button>
                       </div>
                     ))}
                     <button onClick={() => setTRight([...tRight, ''])} className="text-xs font-bold text-indigo-500"><Plus size={12} className="inline"/> Add Credit</button>
                   </div>
                 </div>
              </div>
            )}
            </div>
         </div>
         
         <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button onClick={closeModal} className="px-6 py-3 rounded-xl font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">Cancel</button>
            <button onClick={handleSave} className="px-6 py-3 rounded-xl font-bold bg-indigo-600 text-white">Save Card</button>
         </div>
      </div>
    );
  };

const QuizBuilderModal = ({ quizzes, setQuizzes, closeModal, modalData }) => {
  // Check if we are editing an existing quiz
  const isEditing = modalData && modalData.quizId;
  const existingQuiz = isEditing ? quizzes.find(q => q.id === modalData.quizId) : null;

  const [title, setTitle] = useState(existingQuiz ? existingQuiz.title : '');
  const [qs, setQs] = useState(
    existingQuiz 
      ? existingQuiz.questions 
      : [{ id: generateId(), text: '', options: ['', '', '', ''], correctIndex: 0 }]
  );
  
  const handleSaveQuiz = () => {
     if(!title.trim()) return;
     
     const updatedQuestions = qs.filter(q => q.text.trim() !== '');
     if (updatedQuestions.length === 0) return; // Don't save empty quizzes

     if (isEditing) {
       // Update existing quiz
       setQuizzes(quizzes.map(q => q.id === modalData.quizId ? { ...q, title, questions: updatedQuestions } : q));
     } else {
       // Create new quiz
       setQuizzes([...quizzes, { id: generateId(), title, questions: updatedQuestions }]);
     }
     closeModal();
  };

  return (
    <div className="w-full max-w-3xl">
       <h2 className="text-xl font-black mb-4">{isEditing ? 'Edit Quiz' : 'Quiz Builder'}</h2>
       {}
       <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Quiz Title (e.g., AFAR Final Preboard)" className="w-full p-3 rounded-xl border bg-transparent border-slate-600 focus:border-indigo-500 outline-none mb-6 font-bold text-lg" />
       
       <div className="max-h-[60vh] overflow-y-auto custom-scrollbar pr-4 space-y-8">
          {qs.map((q, qIndex) => (
            <div key={q.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
               <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-indigo-500">Question {qIndex + 1}</span>
                  <button onClick={() => setQs(qs.filter((_, i) => i !== qIndex))} className="text-red-500 hover:text-red-400"><Trash2 size={16}/></button>
               </div>
               {}
               <textarea value={q.text} onChange={e => { const n = [...qs]; n[qIndex].text = e.target.value; setQs(n); }} className="w-full p-3 rounded-xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 outline-none mb-4 resize-none" rows="2" placeholder="Enter question..."></textarea>
               
               <div className="space-y-2">
                  {q.options.map((opt, optIndex) => (
                    <div key={optIndex} className="flex items-center gap-3">
                       <input type="radio" name={`correct-${q.id}`} checked={q.correctIndex === optIndex} onChange={() => { const n = [...qs]; n[qIndex].correctIndex = optIndex; setQs(n); }} className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                       <input type="text" value={opt} onChange={e => { const n = [...qs]; n[qIndex].options[optIndex] = e.target.value; setQs(n); }} placeholder={`Option ${String.fromCharCode(65 + optIndex)}`} className={`flex-1 p-2 rounded-lg border outline-none ${q.correctIndex === optIndex ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600'}`} />
                    </div>
                  ))}
               </div>
            </div>
          ))}
          {}
          <button onClick={() => setQs([...qs, { id: generateId(), text: '', options: ['', '', '', ''], correctIndex: 0 }])} className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 font-bold flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><Plus size={18}/> Add Another Question</button>
       </div>
       
       <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
         <button onClick={closeModal} className="px-6 py-3 rounded-xl font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">Cancel</button>
         <button onClick={handleSaveQuiz} className="px-6 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700">{isEditing ? 'Save Changes' : 'Save Quiz'}</button>
       </div>
    </div>
  )
};

const ActiveQuizSession = ({ quiz, sessionState, setSessionState, isDarkMode }) => {
  const activeQuestions = sessionState.activeQuestionIds.map(id => quiz.questions.find(q => q.id === id)).filter(Boolean);
  const qIndex = sessionState.currentQIndex;
  const question = activeQuestions[qIndex];
  const isFinished = sessionState.isFinished;

  if (!question && !isFinished) return null;

  if (isFinished) {
    let correct = 0;
    let incorrectIds = [];
    activeQuestions.forEach((q) => {
       if(sessionState.answers[q.id] === q.correctIndex) correct++;
       else incorrectIds.push(q.id);
    });
    const pct = Math.round((correct / activeQuestions.length) * 100);

    return (
      <div className="animate-in zoom-in-95 duration-500 max-w-2xl mx-auto mt-10">
         <div className={`p-10 rounded-3xl border shadow-xl text-center ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 text-4xl shadow-inner ${pct >= 75 ? 'bg-emerald-100 text-emerald-500 dark:bg-emerald-900/30' : pct >= 50 ? 'bg-amber-100 text-amber-500 dark:bg-amber-900/30' : 'bg-red-100 text-red-500 dark:bg-red-900/30'}`}>
               {pct >= 75 ? '🔥' : pct >= 50 ? '👍' : '💪'}
            </div>
            <h2 className="text-3xl font-black mb-2">Quiz Completed!</h2>
            <p className="text-slate-500 font-bold mb-8">You scored <span className="text-2xl text-indigo-500">{correct}</span> out of {activeQuestions.length} ({pct}%)</p>
            
            <div className="space-y-4 mb-8 text-left max-h-[40vh] overflow-y-auto custom-scrollbar pr-4">
               <h3 className="font-bold text-lg border-b dark:border-slate-700 pb-2 mb-4">Review Answers</h3>
               {activeQuestions.map((q) => {
                  const userAns = sessionState.answers[q.id];
                  const isCorrect = userAns === q.correctIndex;
                  return (
                    <div key={q.id} className={`p-4 rounded-xl border ${isCorrect ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-900/10' : 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/10'}`}>
                       <p className="font-bold mb-2 flex items-start gap-2">
                          {isCorrect ? <CheckCircle size={18} className="text-emerald-500 shrink-0 mt-0.5"/> : <XCircle size={18} className="text-red-500 shrink-0 mt-0.5"/>}
                          {q.text}
                       </p>
                       <p className="text-sm pl-6"><span className="font-bold text-slate-500">Your Answer:</span> {userAns !== undefined ? q.options[userAns] : 'Skipped'}</p>
                       {!isCorrect && <p className="text-sm pl-6 mt-1"><span className="font-bold text-emerald-600 dark:text-emerald-400">Correct Answer:</span> {q.options[q.correctIndex]}</p>}
                    </div>
                  )
               })}
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
               <button onClick={() => setSessionState(null)} className="px-6 py-3 bg-slate-200 dark:bg-slate-700 font-bold rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">Exit</button>
               
               {incorrectIds.length > 0 && (
                 <button onClick={() => setSessionState({ quizId: quiz.id, currentQIndex: 0, answers: {}, isFinished: false, activeQuestionIds: incorrectIds })} className="px-6 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors flex items-center gap-2">
                    <XSquare size={18}/> Retake Incorrect ({incorrectIds.length})
                 </button>
               )}

               <button onClick={() => setSessionState({ quizId: quiz.id, currentQIndex: 0, answers: {}, isFinished: false, activeQuestionIds: quiz.questions.map(q=>q.id) })} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2">
                  <Shuffle size={18}/> Retake All
               </button>
            </div>
         </div>
      </div>
    )
  }

  const handleAnswer = (optIndex) => {
    const newAnswers = { ...sessionState.answers, [question.id]: optIndex };
    setTimeout(() => {
      if (qIndex < activeQuestions.length - 1) {
        setSessionState({ ...sessionState, answers: newAnswers, currentQIndex: qIndex + 1 });
      } else {
        setSessionState({ ...sessionState, answers: newAnswers, isFinished: true });
      }
    }, 450);
  };

  const currentAns = sessionState.answers[question.id];

  let currentScore = 0;
  Object.entries(sessionState.answers).forEach(([qId, ans]) => {
     const q = activeQuestions.find(x => x.id === qId);
     if (q && q.correctIndex === ans) currentScore++;
  });

  return (
    <div className="max-w-3xl mx-auto mt-8 animate-in fade-in duration-300">
       <div className="flex items-center justify-between mb-8">
          <button onClick={() => setSessionState(null)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold flex items-center gap-2"><ArrowLeft size={16}/> Quit</button>
          
          <div className="flex items-center gap-4">
             <span className="px-4 py-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full font-bold text-sm shadow-sm border border-emerald-200 dark:border-emerald-800">
                Score: {currentScore} / {activeQuestions.length}
             </span>
             <span className="px-4 py-1.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-full font-bold text-sm">
                Question {qIndex + 1} of {activeQuestions.length}
             </span>
          </div>
       </div>

       <div className={`p-8 rounded-3xl border shadow-lg ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <h3 className="text-2xl font-black mb-8 leading-snug">{question.text}</h3>
          
          <div className="space-y-4">
            {question.options.map((opt, i) => {
               let btnClass = `w-full text-left p-4 rounded-xl border-2 font-bold transition-all text-lg `;
               if (currentAns !== undefined) {
                 if (i === question.correctIndex) btnClass += 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 scale-[1.02] shadow-md';
                 else if (i === currentAns) btnClass += 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 scale-[0.98]';
                 else btnClass += 'border-slate-200 dark:border-slate-700 opacity-50';
               } else {
                 btnClass += 'border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:-translate-y-0.5 hover:shadow-md';
               }

               return (
                 <button key={i} disabled={currentAns !== undefined} onClick={() => handleAnswer(i)} className={btnClass}>
                    <span className="inline-block w-8 h-8 text-center leading-8 bg-black/5 dark:bg-white/10 rounded-lg mr-3 text-sm">{String.fromCharCode(65 + i)}</span>
                    {opt}
                 </button>
               )
            })}
          </div>
       </div>
    </div>
  );
};

const AddSubjectModal = ({ grades, setGrades, closeModal }) => {
  const [subjectName, setSubjectName] = useState('');
  const [units, setUnits] = useState(3);

  const handleSave = () => {
    if (!subjectName.trim()) return;
    setGrades({
      ...grades,
      subjects: [...grades.subjects, { id: generateId(), name: subjectName, units: Number(units) }]
    });
    closeModal();
  };

  return (
    <div className="w-full max-w-md">
       <h2 className="text-xl font-black mb-4">Add New Subject</h2>
       <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-500 mb-1">Subject Code / Name</label>
            <input type="text" autoFocus value={subjectName} onChange={e => setSubjectName(e.target.value)} placeholder="e.g., FAR, AFAR, TAX" className="w-full p-3 rounded-xl border bg-transparent border-slate-600 focus:border-indigo-500 outline-none font-bold" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-500 mb-1">Units</label>
            <input type="number" min="1" step="0.5" value={units} onChange={e => setUnits(e.target.value)} className="w-full p-3 rounded-xl border bg-transparent border-slate-600 focus:border-indigo-500 outline-none" />
          </div>
       </div>
       <div className="flex justify-end gap-2 mt-6">
          <button onClick={closeModal} className="px-6 py-3 rounded-xl font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">Cancel</button>
          <button onClick={handleSave} className="px-6 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700">Save Subject</button>
       </div>
    </div>
  );
};

const ConfigureScaleModal = ({ grades, setGrades, closeModal }) => {
  const [tempScale, setTempScale] = useState([...grades.scale]);

  const handleSave = () => {
    setGrades({ ...grades, scale: tempScale });
    closeModal();
  };

  return (
    <div className="w-full max-w-xl">
       <h2 className="text-xl font-black mb-2">Configure GWA Scale</h2>
       <p className="text-sm text-slate-500 mb-6 font-medium">Set how percentage grades translate to your university's GWA.</p>
       
       <div className="max-h-[50vh] overflow-y-auto custom-scrollbar pr-2 space-y-2 mb-6">
          <div className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-500 px-2">
             <div className="col-span-4 text-center">Min %</div>
             <div className="col-span-4 text-center">Max %</div>
             <div className="col-span-3 text-center">GWA</div>
             <div className="col-span-1"></div>
          </div>
          {tempScale.map((row, i) => (
             <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <input type="number" step="0.01" value={row.min} onChange={e => { const n = [...tempScale]; n[i].min = Number(e.target.value); setTempScale(n); }} className="col-span-4 p-2 rounded-lg border bg-transparent border-slate-600 outline-none text-center" />
                <input type="number" step="0.01" value={row.max} onChange={e => { const n = [...tempScale]; n[i].max = Number(e.target.value); setTempScale(n); }} className="col-span-4 p-2 rounded-lg border bg-transparent border-slate-600 outline-none text-center" />
                <input type="text" value={row.gwa} onChange={e => { const n = [...tempScale]; n[i].gwa = e.target.value; setTempScale(n); }} className="col-span-3 p-2 rounded-lg border bg-transparent border-slate-600 outline-none text-center font-black text-indigo-500" />
                <button onClick={() => setTempScale(tempScale.filter((_, idx) => idx !== i))} className="col-span-1 p-2 text-red-500 hover:bg-red-500/10 rounded-lg flex justify-center"><Trash2 size={16}/></button>
             </div>
          ))}
          <button onClick={() => setTempScale([...tempScale, { min: 0, max: 0, gwa: '0.00' }])} className="w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-indigo-500 font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors mt-4">
             <Plus size={14}/> Add Row
          </button>
       </div>

       <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button onClick={closeModal} className="px-6 py-3 rounded-xl font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">Cancel</button>
          <button onClick={handleSave} className="px-6 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700">Save Scale</button>
       </div>
    </div>
  );
};

const AddAssessmentModal = ({ grades, setGrades, modalData, closeModal }) => {
  const [name, setName] = useState('');
  const [score, setScore] = useState('');
  const [total, setTotal] = useState('');
  const [weight, setWeight] = useState('');
  const [periodId, setPeriodId] = useState(
    grades.periods.filter(p => p.subjectId === modalData?.subjectId).length > 0 
      ? grades.periods.filter(p => p.subjectId === modalData?.subjectId)[0].id 
      : ''
  );

  const handleSave = () => {
     if (!name.trim() || !score || !total || !weight || !periodId) return;
     setGrades({
        ...grades,
        assessments: [...grades.assessments, {
           id: generateId(),
           subjectId: modalData.subjectId,
           periodId: periodId,
           name,
           score: Number(score),
           total: Number(total),
           weight: Number(weight)
        }]
     });
     closeModal();
  };

  return (
    <div className="w-full max-w-md">
       <h2 className="text-xl font-black mb-4">Add Assessment</h2>
       
       <div className="space-y-4">
          {grades.periods.filter(p => p.subjectId === modalData?.subjectId).length === 0 ? (
             <div className="p-4 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 rounded-xl text-sm font-bold">
                Please add Grading Periods (e.g., Prelims, Midterms) for this subject first.
             </div>
          ) : (
            <>
               <div>
                  <label className="block text-sm font-bold text-slate-500 mb-1">Grading Period</label>
                  <select value={periodId} onChange={e => setPeriodId(e.target.value)} className="w-full p-3 rounded-xl border bg-transparent border-slate-600 focus:border-indigo-500 outline-none text-slate-800 dark:text-slate-100">
                     {grades.periods.filter(p => p.subjectId === modalData.subjectId).map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.weight}%)</option>
                     ))}
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-bold text-slate-500 mb-1">Assessment Name</label>
                  <input type="text" autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Quiz 1, Long Exam" className="w-full p-3 rounded-xl border bg-transparent border-slate-600 focus:border-indigo-500 outline-none" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-sm font-bold text-slate-500 mb-1">Your Score</label>
                     <input type="number" min="0" value={score} onChange={e => setScore(e.target.value)} className="w-full p-3 rounded-xl border bg-transparent border-slate-600 focus:border-indigo-500 outline-none" />
                  </div>
                  <div>
                     <label className="block text-sm font-bold text-slate-500 mb-1">Total Items</label>
                     <input type="number" min="1" value={total} onChange={e => setTotal(e.target.value)} className="w-full p-3 rounded-xl border bg-transparent border-slate-600 focus:border-indigo-500 outline-none" />
                  </div>
               </div>
               <div>
                  <label className="block text-sm font-bold text-slate-500 mb-1">Weight in Period (%)</label>
                  <input type="number" min="0" max="100" value={weight} onChange={e => setWeight(e.target.value)} placeholder="e.g., 10" className="w-full p-3 rounded-xl border bg-transparent border-slate-600 focus:border-indigo-500 outline-none" />
               </div>
            </>
          )}
       </div>

       <div className="flex justify-end gap-2 mt-6">
          <button onClick={closeModal} className="px-6 py-3 rounded-xl font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">Cancel</button>
          <button onClick={handleSave} disabled={grades.periods.filter(p => p.subjectId === modalData?.subjectId).length === 0} className="px-6 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">Add Record</button>
       </div>
    </div>
  )
}

const ManagePeriodsModal = ({ grades, setGrades, modalData, closeModal }) => {
   const subjectId = modalData.subjectId;
   const [periods, setPeriods] = useState(grades.periods.filter(p => p.subjectId === subjectId));
   const [newName, setNewName] = useState('');
   const [newWeight, setNewWeight] = useState('');

   const handleAddPeriod = () => {
      if(!newName.trim() || !newWeight) return;
      setPeriods([...periods, { id: generateId(), subjectId, name: newName, weight: Number(newWeight) }]);
      setNewName('');
      setNewWeight('');
   };

   const handleSave = () => {
      const otherPeriods = grades.periods.filter(p => p.subjectId !== subjectId);
      setGrades({ ...grades, periods: [...otherPeriods, ...periods] });
      closeModal();
   };

   const totalWeight = periods.reduce((sum, p) => sum + p.weight, 0);

   return (
      <div className="w-full max-w-lg">
         <h2 className="text-xl font-black mb-4 flex items-center justify-between">
            Manage Grading Periods
            <span className={`text-sm px-3 py-1 rounded-full ${totalWeight === 100 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>Total Weight: {totalWeight}%</span>
         </h2>
         <p className="text-sm text-slate-500 mb-6 font-medium">Define terms like Prelims, Midterms, Finals and their contribution to the final grade.</p>

         <div className="space-y-3 mb-6">
            {periods.map((p, i) => (
               <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <input type="text" value={p.name} onChange={e => { const n=[...periods]; n[i].name=e.target.value; setPeriods(n); }} className="flex-1 p-2 rounded-lg border bg-transparent border-slate-300 dark:border-slate-600 outline-none font-bold" />
                  <div className="relative">
                     <input type="number" value={p.weight} onChange={e => { const n=[...periods]; n[i].weight=Number(e.target.value); setPeriods(n); }} className="w-24 p-2 pr-6 rounded-lg border bg-transparent border-slate-300 dark:border-slate-600 outline-none text-right font-bold" />
                     <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">%</span>
                  </div>
                  <button onClick={() => setPeriods(periods.filter(x => x.id !== p.id))} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"><Trash2 size={18}/></button>
               </div>
            ))}
         </div>

         <div className="flex gap-2 items-center p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700">
            <input type="text" placeholder="Period Name (e.g., Finals)" value={newName} onChange={e=>setNewName(e.target.value)} className="flex-1 p-2 rounded-lg border bg-transparent border-slate-300 dark:border-slate-600 outline-none" />
            <input type="number" placeholder="Weight %" value={newWeight} onChange={e=>setNewWeight(e.target.value)} className="w-28 p-2 rounded-lg border bg-transparent border-slate-300 dark:border-slate-600 outline-none" />
            <button onClick={handleAddPeriod} className="p-2.5 bg-indigo-100 text-indigo-600 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 rounded-lg"><Plus size={18}/></button>
         </div>

         <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button onClick={closeModal} className="px-6 py-3 rounded-xl font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">Cancel</button>
            <button onClick={handleSave} className="px-6 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700">Save Periods</button>
         </div>
      </div>
   )
}

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [user, setUser] = useState(null);

  const [activeModal, setActiveModal] = useState(null); 
  const [modalData, setModalData] = useState(null);

  // Get the user's ID (assuming you have a 'user' state from Firebase auth)
  const currentUid = user ? user.uid : null;

  // Replaced local storage with secure Firebase Cloud syncing + Fail-safe local backup
  const [profile, setProfile, isProfileLoaded] = useFirestoreState(
    { 
      name: user?.displayName || 'Future CPA', 
      role: 'Accountancy Student', 
      avatar: user?.photoURL || null 
    },
    'profile',
    currentUid
  );

  // Auto-sync Google profile info ONLY after the database has finished loading to prevent overwriting
  useEffect(() => {
    if (user && !user.isAnonymous && isProfileLoaded) {
      let needsUpdate = false;
      let newProfile = { ...profile };

      if (profile.name === 'Future CPA' && user.displayName) {
         newProfile.name = user.displayName;
         needsUpdate = true;
      }
      if (!profile.avatar && user.photoURL) {
         newProfile.avatar = user.photoURL;
         needsUpdate = true;
      }

      if (needsUpdate) {
         setProfile(newProfile);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile.name, profile.avatar, isProfileLoaded]);

  const [manifestations, setManifestations] = useFirestoreState([], 'manifestations', currentUid);
  const [manInput, setManInput] = useState('');
  
  const [reminders, setReminders] = useFirestoreState([], 'reminders', currentUid);
  const [newReminder, setNewReminder] = useState('');
  
  const [schedule, setSchedule] = useFirestoreState([], 'schedule', currentUid);
  const [deadlines, setDeadlines] = useFirestoreState([], 'deadlines', currentUid); 
  
  const [decks, setDecks] = useFirestoreState([], 'decks', currentUid);
  const [activeDeckId, setActiveDeckId] = useState(null);
  
  const [grades, setGrades] = useFirestoreState(
    { subjects: [], periods: [], assessments: [], scale: DEFAULT_GWA_SCALE },
    'grades',
    currentUid
  );
  
  const [quizzes, setQuizzes] = useFirestoreState([], 'quizzes', currentUid);
  const [activeQuizSession, setActiveQuizSession] = useState(null);
  
  const [notes, setNotes] = useFirestoreState([], 'notes', currentUid);

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const [authError, setAuthError] = useState('');
  const [syncState, setSyncState] = useState({ status: 'synced', msg: '' });

  useEffect(() => {
     const handler = (e) => setSyncState(e.detail);
     window.addEventListener('acads_sync_status', handler);
     return () => window.removeEventListener('acads_sync_status', handler);
  }, []);

  // Real-time Clock
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.warn('Auth init failed:', err);
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    if (!auth || !provider) {
      setAuthError("Firebase keys missing. Please paste your config at the top of App.jsx.");
      return;
    }
    try {
      setAuthError('');
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Google Sign-in error:", error);
      
      let errorMsg = "Sign-in failed. Please try again.";
      
      // Handle Safari Private Browsing blocking the internal database
      if (error.message && (error.message.includes('Database is closing/hidden') || error.message.includes('indexedDB'))) {
         errorMsg = "Safari Private Browsing blocks Google Login. Please switch to a normal Safari tab.";
      } 
      // Handle mobile popup blockers by attempting a redirect instead
      else if (error.code === 'auth/popup-blocked' || error.code === 'auth/operation-not-supported-in-this-environment') {
         try {
            await signInWithRedirect(auth, provider);
            return; // Stop here as the page will redirect to Google
         } catch (redirectErr) {
            errorMsg = "Login blocked. Please open the app directly in your normal browser.";
         }
      } 
      else if (error.code === 'auth/popup-closed-by-user') {
         errorMsg = "You closed the popup before signing in.";
      } 
      else if (error.code === 'auth/unauthorized-domain') {
         errorMsg = "Domain not authorized. Please add it in Firebase Console.";
      } 
      else {
         errorMsg = error.message; 
      }
      
      setAuthError(errorMsg);
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const closeModal = () => {
    setActiveModal(null);
    setModalData(null);
  };

  const getDayString = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const calculatePeriodGrade = (subjectId, periodId) => {
     const periodAssessments = grades.assessments.filter(a => a.subjectId === subjectId && a.periodId === periodId);
     if (periodAssessments.length === 0) return 0;
     
     let earnedWeight = 0;
     let totalWeightPossible = 0;
     
     periodAssessments.forEach(a => {
        const pct = a.score / a.total;
        earnedWeight += pct * a.weight;
        totalWeightPossible += a.weight;
     });
     
     if (totalWeightPossible === 0) return 0;
     return (earnedWeight / totalWeightPossible) * 100;
  };

  const calculateSubjectFinalGrade = (subjectId) => {
     const subjectPeriods = grades.periods.filter(p => p.subjectId === subjectId);
     if (subjectPeriods.length === 0) return { pct: 0, gwa: 'N/A' };

     let finalPct = 0;
     let totalWeightPossible = 0;

     subjectPeriods.forEach(p => {
        const periodGradePct = calculatePeriodGrade(subjectId, p.id);
        if (grades.assessments.some(a => a.periodId === p.id)) {
           finalPct += (periodGradePct * (p.weight / 100));
           totalWeightPossible += p.weight;
        }
     });

     if (totalWeightPossible === 0) return { pct: 0, gwa: 'N/A' };
     
     const currentPct = (finalPct / (totalWeightPossible / 100));
     
     let gwa = '5.00';
     for (const scale of grades.scale) {
        if (currentPct >= scale.min && currentPct <= scale.max) {
           gwa = scale.gwa;
           break;
        }
     }

     return { pct: currentPct, gwa };
  };

  const calculateOverallGWA = () => {
     if (grades.subjects.length === 0) return '0.00';
     let totalUnits = 0;
     let sumGWA = 0;

     grades.subjects.forEach(sub => {
        const { gwa } = calculateSubjectFinalGrade(sub.id);
        if (gwa !== 'N/A' && !isNaN(parseFloat(gwa))) {
           sumGWA += parseFloat(gwa) * sub.units;
           totalUnits += sub.units;
        }
     });

     if (totalUnits === 0) return '0.00';
     return (sumGWA / totalUnits).toFixed(2);
  };

  const renderGlobalModals = () => {
    if (!activeModal) return null;

    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className={`w-full p-8 rounded-3xl shadow-2xl relative ${activeModal === 'jar' ? 'max-w-xl p-0 overflow-hidden' : 'max-w-lg'} ${isDarkMode ? 'bg-slate-800 text-white border border-slate-700' : 'bg-white text-slate-900 border border-slate-200'} my-8`}>
          {activeModal !== 'jar' && (
            <button onClick={closeModal} className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/10 transition-colors"><X size={20}/></button>
          )}
          
          {}
          {activeModal === 'profile' && (
            <div>
              <h2 className="text-2xl font-black mb-6 flex items-center gap-2"><User size={24} className="text-indigo-500"/> Edit Profile</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-1">Display Name</label>
                  <input type="text" value={profile.name} onChange={e => { const val = e.target.value; setProfile(prev => ({...prev, name: val})) }} className="w-full p-3 rounded-xl border bg-transparent border-slate-600 focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-1">Role / Course</label>
                  <input type="text" value={profile.role} onChange={e => { const val = e.target.value; setProfile(prev => ({...prev, role: val})) }} className="w-full p-3 rounded-xl border bg-transparent border-slate-600 focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-1">Avatar Image</label>
                  <input type="file" accept="image/*" onChange={(e) => {
                     const file = e.target.files[0];
                     if (file) {
                       const reader = new FileReader();
                       reader.onload = (event) => {
                         const img = new Image();
                         img.onload = () => {
                           // Compress image to ensure it easily fits within the 1MB Firestore limit
                           const canvas = document.createElement('canvas');
                           const ctx = canvas.getContext('2d');
                           const maxSize = 200;
                           let width = img.width;
                           let height = img.height;
                           if (width > height && width > maxSize) {
                             height *= maxSize / width;
                             width = maxSize;
                           } else if (height > maxSize) {
                             width *= maxSize / height;
                             height = maxSize;
                           }
                           canvas.width = width;
                           canvas.height = height;
                           ctx.drawImage(img, 0, 0, width, height);
                           const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
                           setProfile(prev => ({...prev, avatar: compressedBase64}));
                         };
                         img.src = event.target.result;
                       };
                       reader.readAsDataURL(file);
                     }
                  }} className="w-full p-2 rounded-xl border bg-transparent border-slate-600 text-sm focus:border-indigo-500 outline-none mb-2" />
                  <p className="text-xs font-bold text-slate-500 mb-1">Or paste Image URL:</p>
                  <input type="text" placeholder="https://..." value={profile.avatar || ''} onChange={e => { const val = e.target.value; setProfile(prev => ({...prev, avatar: val})) }} className="w-full p-3 rounded-xl border bg-transparent border-slate-600 focus:border-indigo-500 outline-none" />
                </div>
                <button onClick={closeModal} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold mt-4 hover:bg-indigo-700 transition-colors">Save Profile</button>
              </div>
            </div>
          )}

          {activeModal === 'jar' && (
            <div className="bg-[#0f172a] text-white p-8 relative overflow-hidden h-[600px] flex flex-col">
               <div className="absolute inset-0 pointer-events-none">
                 <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#0f172a] via-[#1e1b4b] to-[#0f172a] opacity-80"></div>
                 <div className="absolute w-1 h-1 bg-white rounded-full top-[10%] left-[20%] shadow-[0_0_8px_2px_#fff] animate-[pulse_2s_infinite]"></div>
                 <div className="absolute w-1.5 h-1.5 bg-yellow-200 rounded-full top-[30%] right-[25%] shadow-[0_0_10px_2px_#fef08a] animate-[pulse_3s_infinite]"></div>
                 <div className="absolute w-2 h-2 bg-blue-100 rounded-full top-[60%] left-[40%] shadow-[0_0_12px_2px_#dbeafe] animate-[pulse_4s_infinite]"></div>
                 <div className="absolute w-1 h-1 bg-white rounded-full top-[80%] right-[15%] shadow-[0_0_6px_2px_#fff] animate-[pulse_2.5s_infinite]"></div>
                 <div className="absolute w-1 h-1 bg-purple-200 rounded-full top-[45%] left-[10%] shadow-[0_0_8px_2px_#e9d5ff] animate-[pulse_3.5s_infinite]"></div>
               </div>

               <button onClick={closeModal} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors z-10"><X size={20}/></button>
               
               <div className="relative z-10 flex flex-col h-full">
                 <h2 className="text-3xl font-black mb-2 flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]">
                    <Sparkles size={28} className="text-yellow-400 animate-pulse"/> 
                    Manifestation Jar
                 </h2>
                 <p className="text-slate-300 text-sm mb-6 font-medium tracking-wide">Your claimed futures. Mark them when reality catches up.</p>
                 
                 <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3 pb-4">
                   {manifestations.length === 0 ? (
                      <div className="text-center py-20 opacity-50">
                         <Archive size={64} className="mx-auto mb-6 text-slate-400 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"/>
                         <p className="font-bold text-lg tracking-wider">Your jar is empty.</p>
                         <p className="text-sm">Speak your goals into existence.</p>
                      </div>
                   ) : manifestations.map(m => (
                      <div key={m.id} className={`p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 transform hover:-translate-y-1 ${m.isMet ? 'bg-emerald-900/30 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]'}`}>
                         <div className="flex justify-between items-start gap-4">
                            <p className={`flex-1 font-medium italic ${m.isMet ? 'text-emerald-300 line-through opacity-70' : 'text-slate-100'}`}>"{m.text}"</p>
                            <div className="flex items-center gap-2 shrink-0">
                               <button onClick={() => setManifestations(manifestations.map(x => x.id === m.id ? {...x, isMet: !x.isMet} : x))} className={`p-2 rounded-lg transition-all ${m.isMet ? 'bg-emerald-500/40 text-white hover:bg-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`} title={m.isMet ? "Unmark" : "Mark as Achieved"}>
                                  <Check size={14}/>
                               </button>
                               <button onClick={() => setManifestations(manifestations.filter(x => x.id !== m.id))} className="p-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/40 hover:text-white transition-colors"><Trash2 size={14}/></button>
                            </div>
                         </div>
                      </div>
                   ))}
                 </div>
               </div>
            </div>
          )}

          {activeModal === 'addDeadline' && (
             <div>
                <h2 className="text-xl font-black mb-6">Add Deadline for {modalData?.date}</h2>
                <input 
                  type="text" 
                  autoFocus
                  placeholder="e.g., FAR Midterm Exam" 
                  className="w-full p-3 rounded-xl border bg-transparent border-slate-600 focus:border-indigo-500 outline-none mb-4"
                  id="deadlineInput"
                />
                <button onClick={() => {
                   const val = document.getElementById('deadlineInput').value.trim();
                   if(val) {
                     setDeadlines([...deadlines, { id: generateId(), date: modalData.date, text: val }]);
                     closeModal();
                   }
                }} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">Add Deadline</button>
             </div>
          )}

          {activeModal === 'addClass' && (
             <div>
                <h2 className="text-xl font-black mb-6 flex items-center gap-2"><BookOpen size={20} className="text-indigo-500"/> Schedule Class</h2>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.target);
                  setSchedule([...schedule, {
                    id: generateId(),
                    subject: fd.get('subject'),
                    type: fd.get('type'),
                    instructor: fd.get('instructor'),
                    day: fd.get('day'),
                    startTime: fd.get('startTime'),
                    endTime: fd.get('endTime')
                  }]);
                  closeModal();
                }} className="space-y-4">
                  <div><label className="block text-xs font-bold text-slate-500 mb-1">Subject Code/Name</label><input required name="subject" type="text" className="w-full p-3 rounded-xl border bg-transparent border-slate-600 focus:border-indigo-500 outline-none" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-xs font-bold text-slate-500 mb-1">Course Type</label>
                      <select name="type" className="w-full p-3 rounded-xl border bg-transparent border-slate-600 focus:border-indigo-500 outline-none">
                        <option value="Major" className="text-black">Major</option>
                        <option value="Professional" className="text-black">Professional</option>
                        <option value="Minor" className="text-black">Minor</option>
                      </select>
                    </div>
                    <div><label className="block text-xs font-bold text-slate-500 mb-1">Day</label>
                      <select name="day" className="w-full p-3 rounded-xl border bg-transparent border-slate-600 focus:border-indigo-500 outline-none">
                        {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => <option key={d} value={d} className="text-black">{d}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div><label className="block text-xs font-bold text-slate-500 mb-1">Start Time</label><input required name="startTime" type="time" className="w-full p-3 rounded-xl border bg-transparent border-slate-600 focus:border-indigo-500 outline-none" /></div>
                     <div><label className="block text-xs font-bold text-slate-500 mb-1">End Time</label><input required name="endTime" type="time" className="w-full p-3 rounded-xl border bg-transparent border-slate-600 focus:border-indigo-500 outline-none" /></div>
                  </div>
                  <div><label className="block text-xs font-bold text-slate-500 mb-1">Instructor</label><input name="instructor" type="text" className="w-full p-3 rounded-xl border bg-transparent border-slate-600 focus:border-indigo-500 outline-none" /></div>
                  <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 mt-2">Save Class</button>
                </form>
             </div>
          )}

          {activeModal === 'createDeck' && (
             <div>
                <h2 className="text-xl font-black mb-6">{modalData?.parentId ? 'Create Subdeck' : 'Create Flashcard Deck'}</h2>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  setDecks([...decks, { id: generateId(), name: e.target.deckName.value, cards: [], parentId: modalData?.parentId || null }]);
                  closeModal();
                }}>
                  <input required name="deckName" autoFocus type="text" placeholder={modalData?.parentId ? "e.g., Chapter 1" : "e.g., RFBT Article 1156-1160"} className="w-full p-3 rounded-xl border bg-transparent border-slate-600 focus:border-indigo-500 outline-none mb-4" />
                  <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">{modalData?.parentId ? 'Create Subdeck' : 'Create Deck'}</button>
                </form>
             </div>
          )}

          {activeModal === 'addCard' && (
             <AddFlashcardModal decks={decks} setDecks={setDecks} modalData={modalData} closeModal={closeModal} />
          )}

          {activeModal === 'createQuiz' && (
             <QuizBuilderModal quizzes={quizzes} setQuizzes={setQuizzes} closeModal={closeModal} modalData={modalData} />
          )}

          {activeModal === 'addSubject' && (
             <AddSubjectModal grades={grades} setGrades={setGrades} closeModal={closeModal} />
          )}

          {activeModal === 'configScale' && (
             <ConfigureScaleModal grades={grades} setGrades={setGrades} closeModal={closeModal} />
          )}

          {activeModal === 'addAssessment' && (
             <AddAssessmentModal grades={grades} setGrades={setGrades} modalData={modalData} closeModal={closeModal} />
          )}

          {activeModal === 'managePeriods' && (
             <ManagePeriodsModal grades={grades} setGrades={setGrades} modalData={modalData} closeModal={closeModal} />
          )}

          {activeModal === 'importQuiz' && (
             <ImportQuizModal quizzes={quizzes} setQuizzes={setQuizzes} closeModal={closeModal} />
          )}
        </div>
      </div>
    );
  };

  const renderDashboard = () => {
    const totalDecks = decks.length;
    const pendingQuizzes = quizzes.length;
    const subjectsTracked = grades.subjects.length;

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`p-6 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Active Flashcard Decks</h3>
            <p className="text-4xl font-black text-indigo-500">{totalDecks}</p>
          </div>
          <div className={`p-6 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Available Quizzes</h3>
            <p className="text-4xl font-black text-emerald-500">{pendingQuizzes}</p>
          </div>
          <div className={`p-6 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Subjects Tracked</h3>
            <p className="text-4xl font-black text-amber-500">{subjectsTracked}</p>
          </div>
        </div>

        <div className={`p-8 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
              <CalendarIcon size={20} className="text-indigo-500"/> Class Schedule
            </h3>
            <button onClick={() => setActiveModal('addClass')} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm flex items-center gap-2 transition-colors">
              <Plus size={16}/> Add Class
            </button>
          </div>
          {schedule.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-xl border-slate-200 dark:border-slate-700">
              <BookOpen size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">No classes scheduled yet. Keep your schedule organized here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm uppercase tracking-wider">
                    <th className="py-3 px-4 font-bold">Subject</th>
                    <th className="py-3 px-4 font-bold">Type</th>
                    <th className="py-3 px-4 font-bold">Day</th>
                    <th className="py-3 px-4 font-bold">Time</th>
                    <th className="py-3 px-4 font-bold">Instructor</th>
                    <th className="py-3 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map(cls => {
                    const formatTime = (timeStr) => {
                      if(!timeStr) return '';
                      const [h, m] = timeStr.split(':');
                      const ampm = h >= 12 ? 'PM' : 'AM';
                      const h12 = h % 12 || 12;
                      return `${h12}:${m} ${ampm}`;
                    };
                    return (
                      <tr key={cls.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-4 px-4 font-black">{cls.subject}</td>
                        <td className="py-4 px-4">
                           <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                             cls.type === 'Major' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                             cls.type === 'Professional' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400' :
                             'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                           }`}>{cls.type}</span>
                        </td>
                        <td className="py-4 px-4 font-medium">{cls.day}</td>
                        <td className="py-4 px-4 font-medium font-mono text-sm">{formatTime(cls.startTime)} - {formatTime(cls.endTime)}</td>
                        <td className="py-4 px-4 font-medium text-slate-500">{cls.instructor}</td>
                        <td className="py-4 px-4 text-right">
                           <button onClick={() => setSchedule(schedule.filter(s => s.id !== cls.id))} className="text-slate-400 hover:text-red-500 p-2"><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderFlashcards = () => {
    const handleDeleteDeck = (e, deckId) => {
      e.stopPropagation();
      const idsToDelete = new Set([deckId]);
      let added = true;
      while (added) {
         added = false;
         decks.forEach(d => {
            if (idsToDelete.has(d.parentId) && !idsToDelete.has(d.id)) {
               idsToDelete.add(d.id);
               added = true;
            }
         });
      }
      setDecks(decks.filter(d => !idsToDelete.has(d.id)));
      if (activeDeckId && idsToDelete.has(activeDeckId)) {
         setActiveDeckId(null);
      }
    };

    if (activeDeckId) {
      const deck = decks.find(d => d.id === activeDeckId);
      if(!deck) { setActiveDeckId(null); return null; }
      const subdecks = decks.filter(d => d.parentId === activeDeckId);

      return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="flex items-center gap-4 mb-8">
             <button onClick={() => setActiveDeckId(deck.parentId || null)} className="p-2 bg-slate-200 dark:bg-slate-700 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"><ArrowLeft size={20}/></button>
             <h2 className="text-3xl font-black">{deck.name}</h2>
             <span className="ml-auto bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 px-3 py-1 rounded-full text-sm font-bold">{deck.cards.length} Cards</span>
           </div>

           {/* Subdecks Section */}
           <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-xl font-bold">Subdecks</h3>
                 <button onClick={() => { setActiveModal('createDeck'); setModalData({ parentId: deck.id }); }} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"><Plus size={16}/> Add Subdeck</button>
              </div>
              {subdecks.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {subdecks.map(sDeck => (
                     <div key={sDeck.id} onClick={() => setActiveDeckId(sDeck.id)} className={`p-4 rounded-xl border shadow-sm cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md flex items-center gap-4 ${isDarkMode ? 'bg-slate-800/50 border-slate-700 hover:border-indigo-500/50' : 'bg-slate-50 border-slate-200 hover:border-indigo-300'}`}>
                       <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                         <Folder size={18} />
                       </div>
                       <div className="flex-1 min-w-0">
                         <h4 className="font-bold truncate text-sm">{sDeck.name}</h4>
                         <p className="text-xs text-slate-500 font-medium">{sDeck.cards?.length || 0} Cards</p>
                       </div>
                       <button onClick={(e) => handleDeleteDeck(e, sDeck.id)} className="text-slate-400 hover:text-red-500 p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><Trash2 size={16}/></button>
                     </div>
                   ))}
                 </div>
              ) : (
                 <div className="p-6 border-2 border-dashed rounded-xl border-slate-300 dark:border-slate-700 text-center opacity-70">
                   <p className="text-sm font-bold text-slate-500">No subdecks. You can create one to organize further.</p>
                 </div>
              )}
           </div>

           {/* Cards Section */}
           <div className="flex justify-between items-center mb-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-bold">Cards in Deck</h3>
              <div className="flex gap-2">
                <button onClick={() => { setActiveModal('addCard'); setModalData({ deckId: deck.id }); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors"><Plus size={16}/> Add Card</button>
              </div>
           </div>

           {deck.cards.length === 0 ? (
             <div className="text-center py-20 border-2 border-dashed rounded-xl border-slate-300 dark:border-slate-700 opacity-70">
               <Copy size={48} className="mx-auto mb-4 text-slate-400" />
               <p className="font-bold">No cards yet. Start building your deck.</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {deck.cards.map(card => (
                  <div key={card.id} className={`p-6 rounded-2xl border shadow-sm flex flex-col relative group ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                     <span className="absolute top-4 right-4 text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded">{card.type}</span>
                     <h4 className="font-bold text-lg mb-4 pr-12">{card.question}</h4>
                     
                     <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700/50">
                        <button className="text-sm font-bold text-indigo-500 flex items-center gap-1 hover:underline"><Eye size={14}/> Preview Answer</button>
                     </div>
                     <button onClick={() => {
                        const newDecks = decks.map(d => d.id === deck.id ? {...d, cards: d.cards.filter(c => c.id !== card.id)} : d);
                        setDecks(newDecks);
                     }} className="absolute bottom-4 right-4 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 size={16}/></button>
                  </div>
                ))}
             </div>
           )}
        </div>
      );
    }

    const rootDecks = decks.filter(d => !d.parentId);

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-between items-center mb-8">
           <h2 className="text-3xl font-black">Your Flashcard Decks</h2>
           <button onClick={() => setActiveModal('createDeck')} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"><Plus size={18}/> New Deck</button>
        </div>
        
        {rootDecks.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed rounded-2xl border-slate-300 dark:border-slate-700 opacity-70">
            <Folder size={64} className="mx-auto mb-4 text-slate-400" />
            <p className="font-bold text-lg">No decks created yet.</p>
            <p className="text-slate-500 text-sm mt-2">Organize your topics by creating a deck.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {rootDecks.map(deck => (
              <div key={deck.id} onClick={() => setActiveDeckId(deck.id)} className={`p-6 rounded-2xl border shadow-sm cursor-pointer transition-all hover:scale-105 hover:shadow-xl ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:border-indigo-500/50' : 'bg-white border-slate-200 hover:border-indigo-300'}`}>
                 <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                   <Copy size={24} />
                 </div>
                 <h3 className="text-xl font-black mb-1 truncate">{deck.name}</h3>
                 <p className="text-slate-500 text-sm font-bold">{deck.cards.length} Cards</p>
                 <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <button className="text-sm font-bold text-indigo-500">Open Deck &rarr;</button>
                    <button onClick={(e) => handleDeleteDeck(e, deck.id)} className="text-slate-400 hover:text-red-500 p-2 -mr-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><Trash2 size={16}/></button>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderQuiz = () => {
    if (activeQuizSession) {
       const quiz = quizzes.find(q => q.id === activeQuizSession.quizId);
       return <ActiveQuizSession quiz={quiz} sessionState={activeQuizSession} setSessionState={setActiveQuizSession} isDarkMode={isDarkMode} />;
    }

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 shrink-0">
           <div>
              <h2 className="text-3xl font-black mb-1">Practice Quizzes</h2>
              <p className="text-slate-500 font-medium">Create or import quizzes to test your knowledge.</p>
           </div>
           <div className="flex gap-2">
             <button onClick={() => setActiveModal('importQuiz')} className="px-4 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"><Upload size={16}/> Import JSON</button>
             <button onClick={() => setActiveModal('createQuiz')} className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-md transition-all"><Plus size={16}/> Create Quiz</button>
           </div>
         </div>

         <div className="flex-1 overflow-y-auto custom-scrollbar p-2 -m-2">
           {quizzes.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed rounded-3xl border-slate-300 dark:border-slate-700 opacity-70">
              <FileText size={64} className="mx-auto mb-4 text-slate-400" />
              <p className="font-bold text-xl mb-2">No quizzes available.</p>
              <p className="text-slate-500 text-sm">Build a custom quiz or import JSON to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
               {}
               {quizzes.map(quiz => (
                 <div key={quiz.id} className={`p-6 rounded-3xl border shadow-sm flex flex-col transition-all hover:-translate-y-1 hover:shadow-xl ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:border-indigo-500/50' : 'bg-white border-slate-200 hover:border-indigo-300'}`}>
                    <div className="flex justify-between items-start mb-4">
                       <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center shadow-lg">
                         <FileText size={24} />
                       </div>
                       <div className="flex gap-1">
                         <button onClick={() => { setActiveModal('createQuiz'); setModalData({ quizId: quiz.id }); }} className="text-slate-400 hover:text-indigo-500 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title="Edit Quiz"><Edit size={16}/></button>
                         <button onClick={() => setQuizzes(quizzes.filter(q => q.id !== quiz.id))} className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title="Delete Quiz"><Trash2 size={16}/></button>
                       </div>
                    </div>
                    <h3 className="text-xl font-black mb-1 line-clamp-2">{quiz.title}</h3>
                    <p className="text-slate-500 text-sm font-bold mb-6">{quiz.questions.length} Questions</p>
                    
                    <div className="mt-auto space-y-2">
                       <div className="grid grid-cols-2 gap-2">
                          <button onClick={() => setActiveQuizSession({ quizId: quiz.id, currentQIndex: 0, answers: {}, isFinished: false, activeQuestionIds: quiz.questions.map(q=>q.id) })} className="py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex justify-center items-center gap-2 transition-colors">
                             <Play size={16}/> Start
                          </button>
                          <button onClick={() => setActiveQuizSession({ quizId: quiz.id, currentQIndex: 0, answers: {}, isFinished: false, activeQuestionIds: shuffleArray(quiz.questions.map(q=>q.id)) })} className="py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold flex justify-center items-center gap-2 transition-colors">
                             <Shuffle size={16}/> Shuffle
                          </button>
                       </div>
                       <QuizExportButton quiz={quiz} isDarkMode={isDarkMode} />
                    </div>
                 </div>
               ))}
            </div>
          )}
         </div>
      </div>
    );
  };

  const renderNotes = () => {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
         <div className="flex justify-between items-center mb-8 shrink-0">
           <h2 className="text-3xl font-black">Sticky Notes</h2>
           <button onClick={() => setNotes([...notes, { id: generateId(), text: '', color: 'bg-yellow-200 text-yellow-900 border-yellow-300' }])} className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all"><Plus size={18}/> New Note</button>
         </div>

         <div className="flex-1 overflow-y-auto custom-scrollbar p-2 -m-2">
           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {notes.map(note => (
                <div key={note.id} className={`p-5 rounded-2xl shadow-lg border min-h-[220px] flex flex-col relative group transform transition-all hover:-translate-y-1 hover:shadow-xl ${note.color}`}>
                   <textarea 
                     value={note.text} 
                     onChange={(e) => setNotes(notes.map(n => n.id === note.id ? {...n, text: e.target.value} : n))} 
                     placeholder="Jot something down..." 
                     className="w-full flex-1 bg-transparent resize-none outline-none font-medium placeholder-black/30 custom-scrollbar" 
                   />
                   <div className="absolute bottom-3 left-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {[
                        'bg-yellow-200 text-yellow-900 border-yellow-300',
                        'bg-blue-200 text-blue-900 border-blue-300',
                        'bg-pink-200 text-pink-900 border-pink-300',
                        'bg-emerald-200 text-emerald-900 border-emerald-300'
                      ].map(c => (
                        <button key={c} onClick={() => setNotes(notes.map(n => n.id === note.id ? {...n, color: c} : n))} className={`w-4 h-4 rounded-full border border-black/20 ${c.split(' ')[0]}`}></button>
                      ))}
                   </div>
                   <button onClick={() => setNotes(notes.filter(n => n.id !== note.id))} className="absolute top-3 right-3 p-1.5 bg-black/10 rounded-lg hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14}/></button>
                </div>
              ))}
           </div>
           {notes.length === 0 && (
              <div className="text-center py-20 opacity-50 mt-10">
                <StickyNote size={64} className="mx-auto mb-4" />
                <p className="font-bold text-xl mb-2">No notes yet.</p>
                <p>Click "New Note" to capture a quick thought.</p>
              </div>
           )}
         </div>
      </div>
    );
  };

  const renderGrades = () => {
     const overallGWA = calculateOverallGWA();

     return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 shrink-0">
              <div>
                 <h2 className="text-3xl font-black mb-1">Record Grades</h2>
                 <p className="text-slate-500 font-medium">Track your academic standing against your target GWA.</p>
              </div>
              <div className="flex gap-2">
                 <button onClick={() => setActiveModal('configScale')} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold flex items-center gap-2 transition-colors">
                    <AlignLeft size={16}/> Scale Settings
                 </button>
                 <button onClick={() => setActiveModal('addSubject')} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 transition-colors shadow-md">
                    <Plus size={16}/> Add Subject
                 </button>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8 shrink-0">
              <div className={`col-span-1 lg:col-span-4 p-6 rounded-3xl border shadow-lg relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-br from-indigo-900/50 to-slate-800 border-indigo-500/30' : 'bg-gradient-to-br from-indigo-50 to-white border-indigo-200'}`}>
                 <div className="absolute top-0 right-0 p-8 opacity-10"><GraduationCap size={120}/></div>
                 <h3 className="text-sm font-black uppercase tracking-widest text-indigo-500 mb-2">Cumulative GWA</h3>
                 <div className="flex items-end gap-4">
                    <span className="text-6xl font-black tracking-tighter text-slate-800 dark:text-white">{overallGWA}</span>
                    <span className="text-lg font-bold text-slate-500 mb-2">/ {grades.scale[0]?.gwa || '1.00'}</span>
                 </div>
                 <p className="text-sm mt-2 font-medium text-slate-600 dark:text-slate-400">Based on enrolled units and calculated subject grades.</p>
              </div>
           </div>

           <div className="flex-1 overflow-y-auto custom-scrollbar -m-2 p-2">
              {grades.subjects.length === 0 ? (
                 <div className="text-center py-20 border-2 border-dashed rounded-3xl border-slate-300 dark:border-slate-700 opacity-70">
                    <BookOpen size={64} className="mx-auto mb-4 text-slate-400" />
                    <p className="font-bold text-xl mb-2">No subjects tracked yet.</p>
                    <p className="text-slate-500">Add a subject to start encoding your grades.</p>
                 </div>
              ) : (
                 <div className="space-y-6">
                    {grades.subjects.map(subject => {
                       const { pct, gwa } = calculateSubjectFinalGrade(subject.id);
                       const subjectPeriods = grades.periods.filter(p => p.subjectId === subject.id);
                       const subjectAssessments = grades.assessments.filter(a => a.subjectId === subject.id);

                       return (
                          <div key={subject.id} className={`p-6 rounded-3xl border shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
                                <div>
                                   <div className="flex items-center gap-3 mb-1">
                                      <h3 className="text-2xl font-black text-slate-800 dark:text-white">{subject.name}</h3>
                                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-900 text-slate-500 text-xs font-bold rounded-lg">{subject.units} Units</span>
                                   </div>
                                   <div className="flex items-center gap-4 mt-2">
                                      <span className="text-lg font-bold">Grade: <span className="text-indigo-500">{pct.toFixed(2)}%</span></span>
                                      <span className="text-lg font-bold">GWA: <span className="text-emerald-500">{gwa}</span></span>
                                   </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                   <button onClick={() => { setActiveModal('managePeriods'); setModalData({ subjectId: subject.id }); }} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
                                      <Settings size={14} className="hidden md:inline" /> Manage Periods
                                   </button>
                                   <button onClick={() => { setActiveModal('addAssessment'); setModalData({ subjectId: subject.id }); }} className="px-4 py-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-400 dark:hover:bg-indigo-900/60 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
                                      <Plus size={14}/> Encode Grade
                                   </button>
                                   <button onClick={() => setGrades({ ...grades, subjects: grades.subjects.filter(s => s.id !== subject.id) })} className="p-2 text-slate-400 hover:bg-red-500 hover:text-white rounded-lg transition-colors"><Trash2 size={16}/></button>
                                </div>
                             </div>

                             {subjectPeriods.length === 0 ? (
                                <div className="text-center py-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                                   <p className="text-sm font-bold text-slate-500">No grading periods defined.</p>
                                   <button onClick={() => { setActiveModal('managePeriods'); setModalData({ subjectId: subject.id }); }} className="mt-2 text-sm text-indigo-500 font-bold hover:underline">Set them up now</button>
                                </div>
                             ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                   {subjectPeriods.map(period => {
                                      const pAssessments = subjectAssessments.filter(a => a.periodId === period.id);
                                      const pGrade = calculatePeriodGrade(subject.id, period.id);
                                      const totalPeriodWeightEntered = pAssessments.reduce((sum, a) => sum + a.weight, 0);

                                      return (
                                         <div key={period.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50">
                                            <div className="flex justify-between items-start mb-4">
                                               <div>
                                                  <h4 className="font-black text-slate-800 dark:text-white">{period.name}</h4>
                                                  <span className="text-xs font-bold text-slate-500">{period.weight}% of Final Grade</span>
                                               </div>
                                               <div className="text-right">
                                                  <div className="font-black text-lg text-indigo-500">{pGrade.toFixed(2)}%</div>
                                               </div>
                                            </div>

                                            <div className="space-y-2 mb-4">
                                               {pAssessments.map(a => (
                                                  <div key={a.id} className="flex justify-between items-center text-sm p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm group">
                                                     <div className="flex-1 truncate pr-2">
                                                        <span className="font-bold">{a.name}</span>
                                                        <span className="text-xs text-slate-400 block">{a.weight}% weight</span>
                                                     </div>
                                                     <div className="flex items-center gap-3 shrink-0">
                                                        <span className="font-mono font-bold bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded">{a.score}/{a.total}</span>
                                                        <button onClick={() => setGrades({ ...grades, assessments: grades.assessments.filter(x => x.id !== a.id) })} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14}/></button>
                                                     </div>
                                                  </div>
                                               ))}
                                               {pAssessments.length === 0 && <p className="text-xs text-slate-400 italic text-center py-2">No assessments encoded.</p>}
                                            </div>
                                            
                                            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                               <div className={`h-1.5 rounded-full ${totalPeriodWeightEntered >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(totalPeriodWeightEntered, 100)}%` }}></div>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-500 mt-1 text-right">{totalPeriodWeightEntered}% / 100% weights accounted</p>
                                         </div>
                                      )
                                   })}
                                </div>
                             )}
                          </div>
                       )
                    })}
                 </div>
              )}
           </div>
        </div>
     );
  };

  const navItems = [
    { id: 'dashboard', icon: BookOpen, label: 'Dashboard' },
    { id: 'flashcards', icon: Copy, label: 'Flashcards' },
    { id: 'grades', icon: GraduationCap, label: 'Record Grades' },
    { id: 'quiz', icon: FileText, label: 'Practice Quiz' },
    { id: 'notes', icon: StickyNote, label: 'Sticky Notes' },
  ];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const renderCalendarGrid = () => {
    let days = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = getDayString(currentYear, currentMonth, i);
      const isToday = i === new Date().getDate() && currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear();
      const hasDeadline = deadlines.some(d => d.date === dateStr);

      days.push(
        <button 
          key={`day-${i}`} 
          onClick={() => { setActiveModal('addDeadline'); setModalData({ date: dateStr }); }}
          className={`h-8 w-8 relative flex items-center justify-center rounded-full text-xs font-medium transition-all hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:text-indigo-600 dark:hover:text-indigo-400 ${isToday ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-700 dark:text-slate-300'}`}
        >
          {i}
          {hasDeadline && <span className="absolute bottom-1 w-1 h-1 bg-rose-500 rounded-full"></span>}
        </button>
      );
    }
    return days;
  };

  return (
    <div className={`w-full h-screen overflow-hidden flex font-sans antialiased transition-colors duration-300 ${isDarkMode ? 'dark bg-[#0f172a] text-gray-100' : 'bg-[#f8fafc] text-slate-900'}`}>
      
      {isInAppBrowser && (
         <div className="absolute top-0 left-0 w-full z-[100] bg-rose-500 text-white text-xs md:text-sm font-bold text-center px-4 py-2.5 shadow-md flex items-center justify-center gap-2">
            ⚠️ <span>You are using an in-app browser. Google Sign-In is blocked here. Please tap the menu (•••) and select <b>"Open in System Browser"</b> or <b>"Open in Safari/Chrome"</b> to log in.</span>
         </div>
      )}

      <aside className={`w-64 h-full flex flex-col border-r transition-colors duration-300 relative z-20 shrink-0 ${isDarkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="h-24 flex items-center px-6 border-b dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                <Calculator size={22} />
             </div>
             <div>
                <h1 className="text-xl font-black tracking-tight leading-none">Acads Criers Club</h1>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">For Future CPAs</p>
             </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 ${activeView === item.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}
            >
              <item.icon size={18} className={activeView === item.id ? 'text-white' : ''} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t dark:border-slate-700 shrink-0">
           <div className="p-5 rounded-2xl relative overflow-hidden transition-all duration-500 shadow-lg bg-gradient-to-br from-[#0B1021] via-[#1B1236] to-[#0A061E] border border-slate-700/50 group">
              <div className="absolute inset-0 pointer-events-none">
                 <div className="absolute top-[10%] left-[20%] w-1 h-1 bg-white rounded-full animate-ping opacity-70"></div>
                 <div className="absolute top-[40%] right-[20%] w-1.5 h-1.5 bg-yellow-200 rounded-full animate-pulse opacity-80" style={{animationDuration: '2s'}}></div>
                 <div className="absolute bottom-[20%] left-[30%] w-1 h-1 bg-white rounded-full animate-ping opacity-50" style={{animationDelay: '1s'}}></div>
                 <div className="absolute top-[60%] right-[40%] w-1 h-1 bg-blue-200 rounded-full animate-pulse opacity-60" style={{animationDuration: '3s'}}></div>
              </div>

              <div className="flex items-center justify-between mb-4 relative z-10">
                <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]"><Sparkles size={16} className="animate-pulse"/> Manifestations</h4>
                <button onClick={() => setActiveModal('jar')} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-300 hover:text-white" title="Open Jar"><Archive size={16}/></button>
              </div>
              <div className="relative z-10">
                <input 
                  type="text" 
                  value={manInput} 
                  onChange={e=>setManInput(e.target.value)} 
                  onKeyDown={e=>{if(e.key==='Enter' && manInput.trim()){ setManifestations([...manifestations, { id: generateId(), text: manInput, isMet: false }]); setManInput(''); }}} 
                  placeholder="Claim your future..." 
                  className="w-full pr-10 py-3 px-4 text-sm font-bold rounded-xl outline-none border transition-all bg-black/40 border-slate-600/50 text-white placeholder-slate-400 focus:border-yellow-400/50 focus:bg-black/60 focus:shadow-[0_0_15px_rgba(250,204,21,0.15)]" 
                />
                <button 
                  onClick={()=>{if(manInput.trim()){ setManifestations([...manifestations, { id: generateId(), text: manInput, isMet: false }]); setManInput(''); }}} 
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-yellow-400 hover:text-yellow-300 hover:bg-white/10 rounded-lg transition-all"
                >
                  <Send size={14}/>
                </button>
              </div>
           </div>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col h-full overflow-hidden relative z-0">
        <header className={`h-24 shrink-0 px-8 flex items-center justify-between border-b z-10 transition-colors duration-300 ${isDarkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
           <div className="flex items-center gap-4">
               {!isRightSidebarOpen && (
                   <button onClick={() => setIsRightSidebarOpen(true)} className="p-2.5 rounded-xl border shadow-sm bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all hover:scale-105 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 text-sm font-bold">
                       <PanelRightOpen size={18} /> Sidebar
                   </button>
               )}
               <h2 className="text-3xl font-black tracking-tight capitalize text-slate-800 dark:text-white">{activeView.replace('-', ' ')}</h2>
           </div>
           
           <div className="flex items-center gap-4">
            {user && !user.isAnonymous && (
               <div title={syncState.msg || "Cloud Sync Status"} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-colors shadow-sm ${syncState.status === 'error' ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:border-red-800' : syncState.status === 'syncing' ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800' : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800'}`}>
                 {syncState.status === 'error' && <CloudOff size={16} />}
                 {syncState.status === 'syncing' && <RefreshCw size={16} className="animate-spin" />}
                 {syncState.status === 'synced' && <Cloud size={16} />}
                 <span className="hidden md:inline">{syncState.status === 'error' ? 'Sync Failed' : syncState.status === 'syncing' ? 'Syncing...' : 'Cloud Synced'}</span>
               </div>
            )}
            <div className={`flex items-center gap-3 px-5 py-2.5 rounded-xl text-sm font-bold border shadow-sm transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}>
              <Clock size={16} className="text-indigo-500" /> 
              <span>
                {currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' })} 
                <span className="opacity-50 hidden sm:inline"> | {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </span>
            </div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 rounded-xl border shadow-sm bg-white dark:bg-slate-800 text-slate-600 dark:text-yellow-400 transition-all hover:scale-105 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 lg:p-10 custom-scrollbar flex flex-col relative z-0">
          {activeView === 'dashboard' && renderDashboard()}
          {activeView === 'flashcards' && renderFlashcards()}
          {activeView === 'quiz' && renderQuiz()}
          {activeView === 'notes' && renderNotes()}
          {activeView === 'grades' && renderGrades()}

          <footer className="mt-auto pt-20 pb-4 text-center space-y-2 opacity-50 text-xs font-medium">
            <p className="font-bold text-sm text-slate-800 dark:text-slate-200">&copy; {new Date().getFullYear()} Jaynard L. Monleon. All Rights Reserved.</p>
            <p className="max-w-xl mx-auto text-slate-600 dark:text-slate-400">Disclaimer: Unauthorized reproduction or imitation of this app without the consent of the creator is strictly prohibited.</p>
            <p className="pt-2 text-slate-600 dark:text-slate-400">Contact for problems or suggestions: <a href="mailto:monleonlelixjaynard@gmail.com" className="font-bold hover:underline hover:text-indigo-500 dark:hover:text-indigo-400">monleonlelixjaynard@gmail.com</a></p>
          </footer>
        </div>
      </main>

      <div className={`transition-all duration-300 ease-in-out shrink-0 overflow-hidden ${isRightSidebarOpen ? 'w-80 border-l opacity-100' : 'w-0 border-l-0 opacity-0'} ${isDarkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-200 shadow-[-4px_0_24px_rgba(0,0,0,0.02)]'}`}>
          <aside className="w-80 h-full flex flex-col relative z-20">
             <div className="p-8 border-b dark:border-slate-700 text-center relative shrink-0">
                <button onClick={() => setIsRightSidebarOpen(false)} className="absolute top-4 left-4 p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Hide Panel">
                    <PanelRightClose size={18}/>
                </button>
                <button onClick={() => setActiveModal('profile')} className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"><Edit size={16}/></button>
                
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-slate-700 dark:to-slate-600 rounded-full mb-4 shadow-inner flex items-center justify-center overflow-hidden border-4 border-white dark:border-slate-800">
                   {profile.avatar || (user && !user.isAnonymous && user.photoURL) ? (
                     <img src={profile.avatar || user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                   ) : (
                     <User size={40} className="text-indigo-300 dark:text-slate-400" />
                   )}
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white leading-tight">
                   {profile.name === 'Future CPA' && user && !user.isAnonymous && user.displayName ? user.displayName : profile.name}
                </h3>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1 mb-4">{profile.role}</p>

                {(!user || user.isAnonymous) ? (
                   <div className="w-full">
                      <button onClick={handleGoogleLogin} className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                         <LogIn size={16} /> Sign in with Google
                      </button>
                      {authError && <p className="text-xs text-red-500 font-bold mt-2 leading-tight">{authError}</p>}
                   </div>
                ) : (
                   <button onClick={handleLogout} className="w-full py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                      Sign Out
                   </button>
                )}
             </div>

             <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                <div>
                   <h4 className="font-black text-xs uppercase tracking-widest mb-4 text-slate-400 dark:text-slate-500 flex items-center gap-2"><CalendarIcon size={14}/> Calendar</h4>
                   <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <button onClick={() => setCurrentMonth(currentMonth === 0 ? 11 : currentMonth - 1)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"><ChevronLeft size={16}/></button>
                        <span className="font-bold text-sm uppercase tracking-wider">{monthNames[currentMonth]} {currentYear}</span>
                        <button onClick={() => setCurrentMonth(currentMonth === 11 ? 0 : currentMonth + 1)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"><ChevronRight size={16}/></button>
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-center mb-2">
                        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d} className="text-[10px] font-black text-slate-400">{d}</div>)}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {renderCalendarGrid()}
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                         {deadlines.filter(d => d.date.startsWith(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`)).length === 0 ? (
                           <p className="text-xs font-medium text-slate-400 text-center italic">No deadlines this month.</p>
                         ) : (
                           <div className="space-y-2">
                             {deadlines.filter(d => d.date.startsWith(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`)).map(d => (
                               <div key={d.id} className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                                  <div className="flex items-center gap-2">
                                     <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                     <span className="text-xs font-bold">{d.date.split('-')[2]} - {d.text}</span>
                                  </div>
                                  <button onClick={() => setDeadlines(deadlines.filter(x => x.id !== d.id))} className="text-slate-400 hover:text-red-500"><X size={12}/></button>
                               </div>
                             ))}
                           </div>
                         )}
                      </div>
                   </div>
                </div>

                <div>
                   <h4 className="font-black text-xs uppercase tracking-widest mb-4 text-slate-400 dark:text-slate-500 flex items-center gap-2"><Bell size={14}/> Quick Reminders</h4>
                   <div className="space-y-2 mb-4">
                     {reminders.map(r => (
                       <div key={r.id} className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${r.done ? (isDarkMode ? 'bg-slate-800/50 border-slate-700/50 opacity-40' : 'bg-slate-50 border-slate-100 opacity-50') : (isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200 shadow-sm')}`}>
                         <button onClick={() => setReminders(reminders.map(item => item.id === r.id ? {...item, done: !item.done} : item))} className={`shrink-0 w-5 h-5 mt-0.5 rounded border flex items-center justify-center transition-colors ${r.done ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300 dark:border-slate-500 hover:border-indigo-400'}`}>
                           {r.done && <Check size={12}/>}
                         </button>
                         <span className={`text-sm font-medium flex-1 leading-snug break-words ${r.done ? 'line-through' : 'text-slate-700 dark:text-slate-200'}`}>{r.text}</span>
                         <button onClick={() => setReminders(reminders.filter(item => item.id !== r.id))} className="text-slate-400 hover:text-red-500 transition-colors p-1"><Trash2 size={14}/></button>
                       </div>
                     ))}
                   </div>
                   <div className="relative">
                     <input type="text" value={newReminder} onChange={e => setNewReminder(e.target.value)} onKeyDown={e => {
                        if (e.key === 'Enter' && newReminder.trim()) { setReminders([...reminders, { id: generateId(), text: newReminder, done: false }]); setNewReminder(''); }
                     }} placeholder="Add a reminder..." className={`w-full pr-10 py-3 px-4 text-sm font-medium rounded-xl outline-none border transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700 focus:border-indigo-500 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-500 text-slate-900'}`} />
                     <button onClick={() => {
                        if (newReminder.trim()) { setReminders([...reminders, { id: generateId(), text: newReminder, done: false }]); setNewReminder(''); }
                     }} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 rounded-lg transition-colors"><Plus size={16}/></button>
                   </div>
                </div>
             </div>
          </aside>
      </div>

      {renderGlobalModals()}

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(156, 163, 175, 0.5); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(156, 163, 175, 0.8); }
      `}} />
    </div>
  );
}