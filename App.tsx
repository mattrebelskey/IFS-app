import React, { useState, useEffect, useRef } from 'react';
import {
  Home,
  Calendar,
  Trophy,
  BookOpen,
  Settings as SettingsIcon,
  CheckCircle2,
  Plus,
  Trash2,
  Heart,
  BrainCircuit,
  Users,
  Mic,
  MicOff,
  Camera,
  Download,
  MessageSquarePlus,
  Sparkles,
  X,
  Edit2,
  FileText,
  AlertTriangle,
  Info,
  Book,
  Watch,
  GripVertical,
  RefreshCw,
  Star,
  Phone,
  ChevronRight
} from 'lucide-react';
import {
  AppState,
  LevelName,
  XP_THRESHOLDS,
  WinEntry,
  Part,
  PartsCheckIn,
  JournalType,
  Badge,
  TaskItem
} from './types';
import { 
  DEFAULT_DAILY_BASICS, 
  SURVIVAL_MODE_BASICS, 
  COMPASSION_QUOTES,
  BADGES,
  DEFAULT_PARTS,
  INITIAL_STATE,
  ADHD_TEMPLATE,
  GRIEF_TEMPLATE,
  LIBRARY_CONTENT
} from './constants';
import { saveState, loadState, calculateLevel } from './services/storageService';
import { generateCompassionMessage, suggestTasks } from './services/geminiService';

// --- HELPER COMPONENTS ---

const XpStaircase: React.FC<{ totalXp: number; prestigeLevel: number }> = ({ totalXp, prestigeLevel }) => {
  const xpInCurrentCycle = totalXp % 500;
  const blocks = Array.from({ length: 500 }, (_, i) => i + 1);
  
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-700 flex items-center gap-2">
          Journey Progress
          {prestigeLevel > 0 && (
            <span className="flex items-center gap-1 text-yellow-500">
              {Array.from({ length: prestigeLevel }).map((_, i) => (
                <Star key={i} size={14} fill="currentColor" />
              ))}
            </span>
          )}
        </h3>
        <span className="text-sm text-gray-500 font-mono">{xpInCurrentCycle} / 500 XP</span>
      </div>
      <div className="grid grid-cols-10 sm:grid-cols-20 gap-1 h-64 overflow-y-auto pr-2 custom-scrollbar">
        {blocks.map((num) => {
          let bgClass = 'bg-gray-100';
          if (num <= xpInCurrentCycle) {
            if (num <= 50) bgClass = 'bg-green-400';
            else if (num <= 150) bgClass = 'bg-blue-400';
            else if (num <= 300) bgClass = 'bg-orange-400';
            else bgClass = 'bg-purple-400';
          } else {
             if (num <= 50) bgClass = 'bg-green-50';
             else if (num <= 150) bgClass = 'bg-blue-50';
             else if (num <= 300) bgClass = 'bg-orange-50';
             else bgClass = 'bg-purple-50';
          }
          return <div key={num} className={`w-full pt-[100%] relative rounded-sm ${bgClass} transition-all duration-300`} title={`XP: ${num}`}></div>;
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
         <span className="px-2 py-1 rounded bg-green-100 text-green-800">Survivor (0-50)</span>
         <span className="px-2 py-1 rounded bg-blue-100 text-blue-800">Curious (51-150)</span>
         <span className="px-2 py-1 rounded bg-orange-100 text-orange-800">Courageous (151-300)</span>
         <span className="px-2 py-1 rounded bg-purple-100 text-purple-800">Connected (301-500)</span>
      </div>
      {prestigeLevel > 0 && (
        <div className="mt-3 text-center text-sm text-gray-500">
          Lifetime XP: {totalXp} • Prestige Level: {prestigeLevel}
        </div>
      )}
    </div>
  );
};

const Confetti: React.FC<{ active: boolean }> = ({ active }) => {
  if (!active) return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex justify-center items-start pt-20">
      <div className="animate-bounce text-6xl">🎉</div>
    </div>
  );
};

const Toast: React.FC<{ message: string | null, onClose: () => void }> = ({ message, onClose }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 animate-fade-in pointer-events-none shadow-xl border border-gray-700">
      <CheckCircle2 size={18} className="text-green-400" />
      <span className="text-sm font-bold">{message}</span>
    </div>
  );
};

// --- TASK ROW COMPONENT (DRAG & SWIPE) ---

interface TaskRowProps {
  task: TaskItem;
  index: number;
  isChecked: boolean;
  onToggle: () => void;
  onDelete?: () => void;
  onReorder?: (from: number, to: number) => void;
  listId: string;
}

const TaskRow: React.FC<TaskRowProps> = ({ 
  task, 
  index, 
  isChecked, 
  onToggle, 
  onDelete, 
  onReorder,
  listId
}) => {
  const [dragOffset, setDragOffset] = useState(0);
  const startX = useRef(0);
  const isDragging = useRef(false);

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    if (diff < 0 && onDelete) {
      setDragOffset(diff);
    }
  };

  const onTouchEnd = () => {
    isDragging.current = false;
    if (dragOffset < -100 && onDelete) {
       if(window.confirm("Delete this task?")) {
         onDelete?.();
       }
    }
    setDragOffset(0);
  };

  const handleDragStart = (e: React.DragEvent) => {
      if (onReorder) {
        e.dataTransfer.setData('index', index.toString());
        e.dataTransfer.setData('listId', listId);
        e.dataTransfer.effectAllowed = 'move';
      }
  };
  const handleDragOver = (e: React.DragEvent) => {
      if (onReorder) e.preventDefault();
  };
  const handleDrop = (e: React.DragEvent) => {
      if (onReorder) {
        e.preventDefault();
        const fromIndex = parseInt(e.dataTransfer.getData('index'));
        const srcListId = e.dataTransfer.getData('listId');
        
        if (srcListId === listId && !isNaN(fromIndex) && fromIndex !== index) {
            onReorder(fromIndex, index);
        }
      }
  };

  return (
    <div 
      className="relative overflow-hidden mb-3 select-none touch-pan-y"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
       <div className="absolute inset-0 bg-red-500 rounded-xl flex items-center justify-end px-6">
          <Trash2 className="text-white w-6 h-6" />
       </div>

       <div 
          className={`relative bg-white rounded-xl transition-transform duration-100 ${dragOffset === 0 ? 'transition-all' : ''}`}
          style={{ transform: `translateX(${dragOffset}px)` }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
       >
          <div className={`flex items-center gap-2 p-4 border-2 rounded-xl transition-all duration-200 ${isChecked ? 'border-green-500 bg-green-50 text-green-900' : 'border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
             
             {onReorder && (
               <div 
                 draggable 
                 onDragStart={handleDragStart}
                 onMouseDown={(e) => e.stopPropagation()}
                 className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 mr-1 flex flex-col justify-center h-full py-2 px-1"
               >
                  <GripVertical size={20} />
               </div>
             )}
             
             <button onClick={onToggle} className="flex-1 flex items-center text-left outline-none">
                <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center transition-all flex-shrink-0 ${isChecked ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                    {isChecked && <CheckCircle2 className="w-4 h-4 text-white animate-check-pop" />}
                </div>
                <span className={`font-medium text-lg ${isChecked ? 'line-through opacity-60' : ''}`}>{task.text}</span>
             </button>
             
             {onDelete && (
                 <button 
                    onClick={(e) => { e.stopPropagation(); onDelete?.(); }} 
                    className="text-gray-300 hover:text-red-500 p-2 ml-2 flex-shrink-0"
                 >
                     <Trash2 size={18} />
                 </button>
             )}
          </div>
       </div>
    </div>
  );
};

// --- MODALS ---

const BadgeModal = ({ badge, onClose, isUnlocked }: { badge: Badge, onClose: () => void, isUnlocked: boolean }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
    <div className="bg-white rounded-2xl p-8 w-full max-w-xs text-center shadow-2xl transform transition-all scale-100" onClick={e => e.stopPropagation()}>
      <div className="text-6xl mb-6">{badge.icon}</div>
      <h3 className="text-2xl font-bold text-gray-800 mb-3">{badge.name}</h3>
      <p className="text-gray-600 mb-8 leading-relaxed">{badge.description}</p>
      
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-6 ${isUnlocked ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
         {isUnlocked ? (
           <><Trophy size={14} /> Earned</>
         ) : (
           <>Locked</>
         )}
      </div>

      <button 
        onClick={onClose} 
        className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-700 transition-colors"
      >
        Close
      </button>
    </div>
  </div>
);

const LibraryModal = ({ onClose }: { onClose: () => void }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = ['All', 'IFS', 'Specific Parts', 'Self-Compassion'];

  const filteredContent = activeCategory === 'All' 
    ? LIBRARY_CONTENT 
    : LIBRARY_CONTENT.filter(item => item.category === activeCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Book className="text-blue-500" /> Learning Library
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                  activeCategory === cat 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          {filteredContent.map((item, i) => (
            <div key={i} className="mb-6 last:mb-0">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-blue-800">{item.title}</h3>
                <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-bold">{item.category}</span>
              </div>
              <p className="text-gray-600 leading-relaxed text-sm">{item.content}</p>
            </div>
          ))}
          {filteredContent.length === 0 && (
            <div className="text-center text-gray-400 py-8">No content found for this category.</div>
          )}
        </div>
      </div>
    </div>
  );
};

const WearableModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Watch className="text-blue-500" /> Syncing Wearables
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
      </div>
      
      <div className="space-y-4 text-gray-600 text-sm leading-relaxed">
        <p>
          <strong>Why can't I sync automatically?</strong><br/>
          Web browsers prioritize your privacy and security. They block websites from accessing your personal health data (from Apple Health, Google Fit, or Oura) directly.
        </p>
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
          <h3 className="font-bold text-blue-800 mb-2">How to use Body Battery:</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-700">
            <li>Check your wearable's app (Fitbit, Health, Oura).</li>
            <li>Note your <strong>Sleep Hours</strong> and <strong>Movement Minutes</strong>.</li>
            <li>Enter them manually here to earn XP!</li>
          </ol>
        </div>
        <p className="italic text-xs text-gray-400 text-center mt-4">
          (Automatic syncing is planned for our future mobile app release!)
        </p>
      </div>
      
      <button 
        onClick={onClose} 
        className="w-full mt-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-700 transition-colors"
      >
        Got it
      </button>
    </div>
  </div>
);

const CrisisModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-bold text-red-600 flex items-center gap-2">
          <AlertTriangle className="text-red-500" /> Crisis Resources
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
      </div>
      
      <div className="space-y-4 text-gray-600 text-sm leading-relaxed">
        <p className="text-gray-700 font-medium">
          If you're in crisis or having thoughts of suicide, please reach out for help.
        </p>
        
        <div className="space-y-3">
          <a href="tel:988" className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100 hover:bg-red-100 transition-colors">
            <Phone className="text-red-500" size={24} />
            <div>
              <div className="font-bold text-red-700">988 Suicide & Crisis Lifeline</div>
              <div className="text-red-600 text-xs">Call or text 988 (US)</div>
            </div>
          </a>
          
          <a href="sms:741741&body=HELLO" className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors">
            <MessageSquarePlus className="text-blue-500" size={24} />
            <div>
              <div className="font-bold text-blue-700">Crisis Text Line</div>
              <div className="text-blue-600 text-xs">Text HOME to 741741</div>
            </div>
          </a>
          
          <a href="https://findahelpline.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl border border-purple-100 hover:bg-purple-100 transition-colors">
            <Users className="text-purple-500" size={24} />
            <div>
              <div className="font-bold text-purple-700">International Resources</div>
              <div className="text-purple-600 text-xs">findahelpline.com</div>
            </div>
          </a>
        </div>
        
        <p className="text-xs text-gray-400 text-center mt-4 italic">
          You are not alone. Help is available.
        </p>
      </div>
      
      <button 
        onClick={onClose} 
        className="w-full mt-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-700 transition-colors"
      >
        Close
      </button>
    </div>
  </div>
);

const PrestigeModal = ({ onClose, onPrestige, totalXp }: { onClose: () => void, onPrestige: () => void, totalXp: number }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">⭐</div>
        <h2 className="text-2xl font-bold text-gray-800">Ready to Prestige?</h2>
      </div>
      
      <div className="space-y-4 text-gray-600 text-sm leading-relaxed">
        <p>
          You've reached the Connected level! You can now <strong>prestige</strong> to start a new cycle.
        </p>
        
        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
          <h3 className="font-bold text-yellow-800 mb-2">What happens:</h3>
          <ul className="list-disc list-inside space-y-1 text-yellow-700">
            <li>Your cycle XP resets to 0</li>
            <li>You earn a permanent prestige star ⭐</li>
            <li>Your lifetime XP ({totalXp}) is preserved</li>
            <li>All badges and progress stay unlocked</li>
          </ul>
        </div>
        
        <p className="text-xs text-gray-400 text-center italic">
          Prestige honors that healing is a cycle, not a destination.
        </p>
      </div>
      
      <div className="flex gap-3 mt-6">
        <button 
          onClick={onClose} 
          className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-700 transition-colors"
        >
          Not Yet
        </button>
        <button 
          onClick={() => { onPrestige(); onClose(); }} 
          className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-600 rounded-xl font-bold text-white transition-colors"
        >
          Prestige ⭐
        </button>
      </div>
    </div>
  </div>
);

// --- MAIN APP ---

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(loadState);
  
  // Migrate old state if necessary
  useEffect(() => {
    setState(prev => ({
      ...prev,
      parts: prev.parts || DEFAULT_PARTS,
      checkIns: prev.checkIns || [],
      healthLogs: prev.healthLogs || {},
      habitStacks: prev.habitStacks || [],
      customBasics: prev.customBasics || DEFAULT_DAILY_BASICS,
      activeTemplate: prev.activeTemplate || "Standard",
      prestigeLevel: prev.prestigeLevel || 0
    }));
  }, []);

  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'progress' | 'journal' | 'parts' | 'settings'>('daily');
  const [showConfetti, setShowConfetti] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [compassionMsg, setCompassionMsg] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isSuggestingTasks, setIsSuggestingTasks] = useState(false);
  const [viewingBadge, setViewingBadge] = useState<Badge | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showWearableHelp, setShowWearableHelp] = useState(false);
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [showPrestigeModal, setShowPrestigeModal] = useState(false);
  
  // Basics Editing
  const [isEditingBasics, setIsEditingBasics] = useState(false);
  const [newBasicTask, setNewBasicTask] = useState('');

  // Journal State
  const [journalText, setJournalText] = useState('');
  const [journalMode, setJournalMode] = useState<JournalType>('text');
  const [mediaData, setMediaData] = useState<string | undefined>(undefined);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Parts State
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [partCheckInNote, setPartCheckInNote] = useState('');
  const [partIntensity, setPartIntensity] = useState(5);
  const [isAddingPart, setIsAddingPart] = useState(false);
  const [newPartName, setNewPartName] = useState('');
  const [newPartRole, setNewPartRole] = useState<Part['role']>('unknown');

  // Other
  const [newFocusTask, setNewFocusTask] = useState('');
  const [suggestedTasks, setSuggestedTasks] = useState<string[]>([]);

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  useEffect(() => {
    saveState(state);
  }, [state]);

  // Badge Check
  useEffect(() => {
    const unlockedBadges = [...state.badges];
    let hasNewBadge = false;
    BADGES.forEach(badge => {
      if (!unlockedBadges.includes(badge.id)) {
        if (badge.condition(state)) {
          unlockedBadges.push(badge.id);
          hasNewBadge = true;
        }
      }
    });
    if (hasNewBadge) {
      setState(prev => ({ ...prev, badges: unlockedBadges }));
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [state.dailyHistory, state.totalXp, state.checkIns, state.parts]);

  // --- COMPUTED VALUES ---
  const todayStr = getTodayStr();
  const todayTasks = state.dailyHistory[todayStr] || [];
  const currentBasics = state.settings.survivalMode ? SURVIVAL_MODE_BASICS : (state.customBasics || DEFAULT_DAILY_BASICS);
  const currentLevel = calculateLevel(state.totalXp % 500);
  const levelInfo = XP_THRESHOLDS[currentLevel];
  const xpInCycle = state.totalXp % 500;
  const canPrestige = xpInCycle >= 450;

  // --- ACTIONS ---

  const showToast = (msg: string) => setToastMessage(msg);

  const handleTaskToggle = (taskId: string, dateStr: string, xpValue: number) => {
    setState(prev => {
      const dayTasks = prev.dailyHistory[dateStr] || [];
      const isCompleted = dayTasks.includes(taskId);
      let newHistory = isCompleted 
        ? { ...prev.dailyHistory, [dateStr]: dayTasks.filter(id => id !== taskId) }
        : { ...prev.dailyHistory, [dateStr]: [...dayTasks, taskId] };
      
      const xpChange = isCompleted ? -xpValue : xpValue;
      const newXp = Math.max(0, prev.totalXp + xpChange);
      return { ...prev, dailyHistory: newHistory, totalXp: newXp };
    });
    if (!todayTasks.includes(taskId)) {
      showToast(`+${xpValue} XP earned!`);
    }
  };

  const handleAddBasicTask = () => {
    if (!newBasicTask.trim()) return;
    const newTask: TaskItem = {
      id: `basic_custom_${Date.now()}`,
      text: newBasicTask.trim(),
      category: 'basic',
      xpValue: 1
    };
    setState(prev => ({
      ...prev,
      customBasics: [...(prev.customBasics || DEFAULT_DAILY_BASICS), newTask]
    }));
    setNewBasicTask('');
    showToast('Task added!');
  };

  const handleDeleteBasicTask = (taskId: string) => {
    setState(prev => ({
      ...prev,
      customBasics: (prev.customBasics || DEFAULT_DAILY_BASICS).filter(t => t.id !== taskId)
    }));
  };

  const handleReorderBasics = (fromIndex: number, toIndex: number) => {
    setState(prev => {
      const basics = [...(prev.customBasics || DEFAULT_DAILY_BASICS)];
      const [moved] = basics.splice(fromIndex, 1);
      basics.splice(toIndex, 0, moved);
      return { ...prev, customBasics: basics };
    });
  };

  const handleAddFocusTask = () => {
    if (!newFocusTask.trim()) return;
    const newTask: TaskItem = {
      id: `focus_${Date.now()}`,
      text: newFocusTask.trim(),
      category: 'focus',
      xpValue: 2
    };
    setState(prev => ({
      ...prev,
      focusTasks: [...prev.focusTasks, newTask]
    }));
    setNewFocusTask('');
    showToast('Focus task added!');
  };

  const handleDeleteFocusTask = (taskId: string) => {
    setState(prev => ({
      ...prev,
      focusTasks: prev.focusTasks.filter(t => t.id !== taskId)
    }));
  };

  const handleAddWin = () => {
    if (!journalText.trim() && !mediaData) return;
    const newWin: WinEntry = {
      id: `win_${Date.now()}`,
      date: todayStr,
      text: journalText.trim(),
      type: journalMode,
      mediaData: mediaData
    };
    setState(prev => ({
      ...prev,
      wins: [newWin, ...prev.wins],
      totalXp: prev.totalXp + 1
    }));
    setJournalText('');
    setMediaData(undefined);
    setJournalMode('text');
    showToast('+1 XP for journaling!');
  };

  const handleDeleteWin = (winId: string) => {
    setState(prev => ({
      ...prev,
      wins: prev.wins.filter(w => w.id !== winId)
    }));
  };

  // --- PARTS ACTIONS ---

  const handleAddPart = () => {
    if (!newPartName.trim()) return;
    const newPart: Part = {
      id: `part_${Date.now()}`,
      name: newPartName.trim(),
      role: newPartRole,
      description: ''
    };
    setState(prev => ({
      ...prev,
      parts: [...prev.parts, newPart]
    }));
    setNewPartName('');
    setNewPartRole('unknown');
    setIsAddingPart(false);
    showToast('Part added!');
  };

  const handleDeletePart = (partId: string) => {
    setState(prev => ({
      ...prev,
      parts: prev.parts.filter(p => p.id !== partId)
    }));
  };

  const handlePartsCheckIn = () => {
    if (!selectedPartId) return;
    const checkIn: PartsCheckIn = {
      id: `checkin_${Date.now()}`,
      date: todayStr,
      activeParts: [selectedPartId],
      notes: partCheckInNote,
      intensity: partIntensity
    };
    setState(prev => ({
      ...prev,
      checkIns: [checkIn, ...prev.checkIns],
      totalXp: prev.totalXp + 2
    }));
    setSelectedPartId(null);
    setPartCheckInNote('');
    setPartIntensity(5);
    showToast('+2 XP for parts check-in!');
  };

  // --- MEDIA ACTIONS ---

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setMediaData(reader.result as string);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      showToast('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const takePhoto = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      
      const imageData = canvas.toDataURL('image/jpeg');
      setMediaData(imageData);
      setJournalMode('photo');
      
      stream.getTracks().forEach(track => track.stop());
      showToast('Photo captured!');
    } catch (err) {
      showToast('Camera access denied');
    }
  };

  // --- AI ACTIONS ---

  const handleGenerateCompassion = async () => {
    setIsGeneratingAi(true);
    try {
      const message = await generateCompassionMessage(state);
      setCompassionMsg(message);
    } catch (err) {
      setCompassionMsg(COMPASSION_QUOTES[Math.floor(Math.random() * COMPASSION_QUOTES.length)]);
    }
    setIsGeneratingAi(false);
  };

  const handleSuggestTasks = async () => {
    setIsSuggestingTasks(true);
    try {
      const suggestions = await suggestTasks('low energy');
      setSuggestedTasks(suggestions);
    } catch (err) {
      setSuggestedTasks(['Take 3 deep breaths', 'Drink water', 'Stretch for 1 minute']);
    }
    setIsSuggestingTasks(false);
  };

  // --- SETTINGS ACTIONS ---

  const handleToggleSurvivalMode = () => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, survivalMode: !prev.settings.survivalMode }
    }));
    showToast(state.settings.survivalMode ? 'Survival mode off' : 'Survival mode on');
  };

  const handleNameChange = (name: string) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, name }
    }));
  };

  const handleTemplateChange = (templateName: string) => {
    let newBasics = DEFAULT_DAILY_BASICS;
    let newFocus: TaskItem[] = [];

    if (templateName === 'ADHD Support') {
      newBasics = ADHD_TEMPLATE.basics;
      newFocus = ADHD_TEMPLATE.focus;
    } else if (templateName === 'Grief Journey') {
      newBasics = GRIEF_TEMPLATE.basics;
      newFocus = GRIEF_TEMPLATE.focus;
    }

    setState(prev => ({
      ...prev,
      customBasics: newBasics,
      focusTasks: newFocus,
      activeTemplate: templateName
    }));
    showToast(`Template: ${templateName}`);
  };

  const handlePrestige = () => {
    setState(prev => ({
      ...prev,
      prestigeLevel: (prev.prestigeLevel || 0) + 1
    }));
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
    showToast('⭐ Prestige earned!');
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `healing-journey-backup-${todayStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported!');
  };

  const handleResetData = () => {
    if (window.confirm('Are you sure? This will erase all progress.')) {
      setState(INITIAL_STATE);
      showToast('Data reset');
    }
  };

  // --- RENDER TABS ---

  const renderDailyTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Hello, {state.settings.name || 'Friend'} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => setShowCrisisModal(true)}
          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
          title="Crisis Resources"
        >
          <AlertTriangle size={20} />
        </button>
      </div>

      {/* Level Badge */}
      <div className={`${levelInfo.color} ${levelInfo.text} p-4 rounded-xl flex justify-between items-center`}>
        <div className="flex items-center gap-3">
          <div className="text-3xl">
            {currentLevel === LevelName.SURVIVOR && '🌱'}
            {currentLevel === LevelName.CURIOUS && '🔭'}
            {currentLevel === LevelName.COURAGEOUS && '🦁'}
            {currentLevel === LevelName.CONNECTED && '💜'}
          </div>
          <div>
            <div className="font-bold">{currentLevel}</div>
            <div className="text-sm opacity-75">{xpInCycle} / 500 XP</div>
          </div>
        </div>
        {canPrestige && (
          <button 
            onClick={() => setShowPrestigeModal(true)}
            className="px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-sm font-bold flex items-center gap-1 hover:bg-yellow-300 transition-colors"
          >
            <Star size={14} /> Prestige
          </button>
        )}
      </div>

      {/* Survival Mode Toggle */}
      <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
        <div className="flex items-center gap-3">
          <Heart className={state.settings.survivalMode ? 'text-red-500' : 'text-gray-400'} size={20} />
          <div>
            <div className="font-medium text-gray-700">Survival Mode</div>
            <div className="text-xs text-gray-500">Reduces daily basics to essentials</div>
          </div>
        </div>
        <button
          onClick={handleToggleSurvivalMode}
          className={`w-12 h-6 rounded-full transition-colors ${state.settings.survivalMode ? 'bg-red-500' : 'bg-gray-300'}`}
        >
          <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${state.settings.survivalMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
        </button>
      </div>

      {/* Compassion Quote */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100">
        <p className="text-purple-800 italic text-center">
          {compassionMsg || COMPASSION_QUOTES[Math.floor(Math.random() * COMPASSION_QUOTES.length)]}
        </p>
        <button
          onClick={handleGenerateCompassion}
          disabled={isGeneratingAi}
          className="mt-3 mx-auto flex items-center gap-2 text-purple-600 text-sm hover:text-purple-800 disabled:opacity-50"
        >
          <RefreshCw size={14} className={isGeneratingAi ? 'animate-spin' : ''} />
          {isGeneratingAi ? 'Generating...' : 'New message'}
        </button>
      </div>

      {/* Daily Basics */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-700">Daily Basics</h2>
          <button
            onClick={() => setIsEditingBasics(!isEditingBasics)}
            className="text-gray-400 hover:text-gray-600 p-2"
          >
            <Edit2 size={18} />
          </button>
        </div>

        {currentBasics.map((task, index) => (
          <TaskRow
            key={task.id}
            task={task}
            index={index}
            isChecked={todayTasks.includes(task.id)}
            onToggle={() => handleTaskToggle(task.id, todayStr, task.xpValue)}
            onDelete={isEditingBasics && !state.settings.survivalMode ? () => handleDeleteBasicTask(task.id) : undefined}
            onReorder={isEditingBasics && !state.settings.survivalMode ? handleReorderBasics : undefined}
            listId="basics"
          />
        ))}

        {isEditingBasics && !state.settings.survivalMode && (
          <div className="flex gap-2 mt-4">
            <input
              type="text"
              value={newBasicTask}
              onChange={(e) => setNewBasicTask(e.target.value)}
              placeholder="Add custom task..."
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300"
              onKeyDown={(e) => e.key === 'Enter' && handleAddBasicTask()}
            />
            <button
              onClick={handleAddBasicTask}
              className="px-4 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
        )}
      </div>

      {/* AI Task Suggestions */}
      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
        <button
          onClick={handleSuggestTasks}
          disabled={isSuggestingTasks}
          className="w-full flex items-center justify-center gap-2 text-blue-700 font-medium disabled:opacity-50"
        >
          <Sparkles size={18} className={isSuggestingTasks ? 'animate-pulse' : ''} />
          {isSuggestingTasks ? 'Thinking...' : "I don't know what to do"}
        </button>
        
        {suggestedTasks.length > 0 && (
          <div className="mt-4 space-y-2">
            {suggestedTasks.map((task, i) => (
              <div key={i} className="flex items-center gap-2 text-blue-800 text-sm">
                <ChevronRight size={14} />
                {task}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderWeeklyTab = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Weekly Focus</h1>

      {/* Focus Tasks */}
      <div>
        <h2 className="text-lg font-bold text-gray-700 mb-4">Focus Tasks (+2 XP each)</h2>
        
        {state.focusTasks.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No focus tasks yet. Add one below!</p>
        ) : (
          state.focusTasks.map((task, index) => (
            <TaskRow
              key={task.id}
              task={task}
              index={index}
              isChecked={todayTasks.includes(task.id)}
              onToggle={() => handleTaskToggle(task.id, todayStr, task.xpValue)}
              onDelete={() => handleDeleteFocusTask(task.id)}
              listId="focus"
            />
          ))
        )}

        <div className="flex gap-2 mt-4">
          <input
            type="text"
            value={newFocusTask}
            onChange={(e) => setNewFocusTask(e.target.value)}
            placeholder="Add focus task..."
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
            onKeyDown={(e) => e.key === 'Enter' && handleAddFocusTask()}
          />
          <button
            onClick={handleAddFocusTask}
            className="px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Wins */}
      <div>
        <h2 className="text-lg font-bold text-gray-700 mb-4">Wins This Week 🎉</h2>
        
        {state.wins.filter(w => {
          const winDate = new Date(w.date);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return winDate >= weekAgo;
        }).length === 0 ? (
          <p className="text-gray-400 text-center py-8">Record your wins below!</p>
        ) : (
          <div className="space-y-3">
            {state.wins.filter(w => {
              const winDate = new Date(w.date);
              const weekAgo = new Date();
              weekAgo.setDate(weekAgo.getDate() - 7);
              return winDate >= weekAgo;
            }).map(win => (
              <div key={win.id} className="bg-green-50 p-4 rounded-xl border border-green-100 flex justify-between items-start">
                <div>
                  <p className="text-green-800">{win.text}</p>
                  <p className="text-green-600 text-xs mt-1">{win.date}</p>
                </div>
                <button
                  onClick={() => handleDeleteWin(win.id)}
                  className="text-green-400 hover:text-red-500 p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderProgressTab = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Your Progress</h1>

      {/* XP Staircase */}
      <XpStaircase totalXp={state.totalXp} prestigeLevel={state.prestigeLevel || 0} />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
          <div className="text-3xl font-bold text-purple-600">{state.totalXp}</div>
          <div className="text-gray-500 text-sm">Lifetime XP</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
          <div className="text-3xl font-bold text-blue-600">{Object.keys(state.dailyHistory).length}</div>
          <div className="text-gray-500 text-sm">Days Active</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
          <div className="text-3xl font-bold text-green-600">{state.wins.length}</div>
          <div className="text-gray-500 text-sm">Wins Logged</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
          <div className="text-3xl font-bold text-orange-600">{state.checkIns.length}</div>
          <div className="text-gray-500 text-sm">Parts Check-ins</div>
        </div>
      </div>

      {/* Badges */}
      <div>
        <h2 className="text-lg font-bold text-gray-700 mb-4">Badges</h2>
        <div className="grid grid-cols-4 gap-3">
          {BADGES.map(badge => {
            const isUnlocked = state.badges.includes(badge.id);
            return (
              <button
                key={badge.id}
                onClick={() => setViewingBadge(badge)}
                className={`aspect-square rounded-xl flex items-center justify-center text-3xl transition-all ${
                  isUnlocked 
                    ? 'bg-yellow-50 border-2 border-yellow-300 hover:scale-105' 
                    : 'bg-gray-100 opacity-50 grayscale'
                }`}
              >
                {badge.icon}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderJournalTab = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Journal</h1>

      {/* Mode Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setJournalMode('text')}
          className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${
            journalMode === 'text' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          <FileText size={18} /> Text
        </button>
        <button
          onClick={() => setJournalMode('voice')}
          className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${
            journalMode === 'voice' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          <Mic size={18} /> Voice
        </button>
        <button
          onClick={() => setJournalMode('photo')}
          className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${
            journalMode === 'photo' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          <Camera size={18} /> Photo
        </button>
      </div>

      {/* Input Area */}
      {journalMode === 'text' && (
        <textarea
          value={journalText}
          onChange={(e) => setJournalText(e.target.value)}
          placeholder="What's on your mind? What went well today?"
          className="w-full h-40 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
        />
      )}

      {journalMode === 'voice' && (
        <div className="bg-gray-50 p-8 rounded-xl text-center">
          {isRecording ? (
            <button
              onClick={stopRecording}
              className="w-20 h-20 rounded-full bg-red-500 text-white flex items-center justify-center mx-auto animate-pulse"
            >
              <MicOff size={32} />
            </button>
          ) : (
            <button
              onClick={startRecording}
              className="w-20 h-20 rounded-full bg-purple-500 text-white flex items-center justify-center mx-auto hover:bg-purple-600 transition-colors"
            >
              <Mic size={32} />
            </button>
          )}
          <p className="mt-4 text-gray-500">
            {isRecording ? 'Recording... Tap to stop' : 'Tap to record'}
          </p>
          {mediaData && journalMode === 'voice' && (
            <audio src={mediaData} controls className="mt-4 mx-auto" />
          )}
        </div>
      )}

      {journalMode === 'photo' && (
        <div className="bg-gray-50 p-8 rounded-xl text-center">
          {mediaData ? (
            <div>
              <img src={mediaData} alt="Captured" className="max-h-64 mx-auto rounded-lg" />
              <button
                onClick={() => setMediaData(undefined)}
                className="mt-4 text-gray-500 hover:text-red-500"
              >
                Remove photo
              </button>
            </div>
          ) : (
            <button
              onClick={takePhoto}
              className="w-20 h-20 rounded-full bg-purple-500 text-white flex items-center justify-center mx-auto hover:bg-purple-600 transition-colors"
            >
              <Camera size={32} />
            </button>
          )}
          <p className="mt-4 text-gray-500">
            {mediaData ? 'Photo captured' : 'Tap to take a photo'}
          </p>
        </div>
      )}

      {/* Optional text with media */}
      {journalMode !== 'text' && (
        <input
          type="text"
          value={journalText}
          onChange={(e) => setJournalText(e.target.value)}
          placeholder="Add a caption (optional)"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300"
        />
      )}

      {/* Save Button */}
      <button
        onClick={handleAddWin}
        disabled={!journalText.trim() && !mediaData}
        className="w-full py-4 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Save Entry (+1 XP)
      </button>

      {/* Recent Entries */}
      <div>
        <h2 className="text-lg font-bold text-gray-700 mb-4">Recent Entries</h2>
        {state.wins.slice(0, 5).map(win => (
          <div key={win.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-3">
            {win.mediaData && win.type === 'photo' && (
              <img src={win.mediaData} alt="" className="w-full h-32 object-cover rounded-lg mb-3" />
            )}
            {win.mediaData && win.type === 'voice' && (
              <audio src={win.mediaData} controls className="w-full mb-3" />
            )}
            <p className="text-gray-700">{win.text}</p>
            <p className="text-gray-400 text-xs mt-2">{win.date}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPartsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Parts Work</h1>
        <button
          onClick={() => setShowLibrary(true)}
          className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
        >
          <Book size={20} />
        </button>
      </div>

      {/* Parts List */}
      <div>
        <h2 className="text-lg font-bold text-gray-700 mb-4">Your Parts</h2>
        <div className="space-y-3">
          {state.parts.map(part => (
            <button
              key={part.id}
              onClick={() => setSelectedPartId(selectedPartId === part.id ? null : part.id)}
              className={`w-full p-4 rounded-xl text-left transition-all ${
                selectedPartId === part.id 
                  ? 'bg-purple-100 border-2 border-purple-300' 
                  : 'bg-white border border-gray-100 hover:border-purple-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-gray-800">{part.name}</div>
                  <div className="text-sm text-gray-500 capitalize">{part.role}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  part.role === 'manager' ? 'bg-blue-100 text-blue-700' :
                  part.role === 'firefighter' ? 'bg-red-100 text-red-700' :
                  part.role === 'exile' ? 'bg-purple-100 text-purple-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {part.role}
                </span>
              </div>
              {part.description && (
                <p className="text-gray-600 text-sm mt-2">{part.description}</p>
              )}
            </button>
          ))}
        </div>

        {/* Add Part */}
        {isAddingPart ? (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-3">
            <input
              type="text"
              value={newPartName}
              onChange={(e) => setNewPartName(e.target.value)}
              placeholder="Part name (e.g., The Worrier)"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
            <select
              value={newPartRole}
              onChange={(e) => setNewPartRole(e.target.value as Part['role'])}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
              <option value="unknown">Unknown role</option>
              <option value="manager">Manager</option>
              <option value="firefighter">Firefighter</option>
              <option value="exile">Exile</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => setIsAddingPart(false)}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPart}
                className="flex-1 py-3 bg-purple-500 text-white rounded-xl font-medium"
              >
                Add Part
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingPart(true)}
            className="w-full mt-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-purple-300 hover:text-purple-500 transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Add a Part
          </button>
        )}
      </div>

      {/* Check-in Form */}
      {selectedPartId && (
        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 space-y-4">
          <h3 className="font-bold text-purple-800">Check in with {state.parts.find(p => p.id === selectedPartId)?.name}</h3>
          
          <div>
            <label className="text-sm text-purple-700">How intense is this part right now?</label>
            <input
              type="range"
              min="1"
              max="10"
              value={partIntensity}
              onChange={(e) => setPartIntensity(Number(e.target.value))}
              className="w-full mt-2"
            />
            <div className="flex justify-between text-xs text-purple-600">
              <span>Barely there</span>
              <span>{partIntensity}/10</span>
              <span>Very strong</span>
            </div>
          </div>

          <textarea
            value={partCheckInNote}
            onChange={(e) => setPartCheckInNote(e.target.value)}
            placeholder="What does this part want you to know?"
            className="w-full h-24 px-4 py-3 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
          />

          <button
            onClick={handlePartsCheckIn}
            className="w-full py-3 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-600 transition-colors"
          >
            Complete Check-in (+2 XP)
          </button>
        </div>
      )}

      {/* Recent Check-ins */}
      {state.checkIns.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-700 mb-4">Recent Check-ins</h2>
          {state.checkIns.slice(0, 3).map(checkIn => {
            const part = state.parts.find(p => checkIn.activeParts.includes(p.id));
            return (
              <div key={checkIn.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-3">
                <div className="flex justify-between items-start">
                  <div className="font-medium text-gray-800">{part?.name || 'Unknown Part'}</div>
                  <span className="text-xs text-gray-500">{checkIn.date}</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">Intensity: {checkIn.intensity}/10</div>
                {checkIn.notes && <p className="text-gray-600 mt-2 text-sm">{checkIn.notes}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Settings</h1>

      {/* Name */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
        <input
          type="text"
          value={state.settings.name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="What should I call you?"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300"
        />
      </div>

      {/* Template */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
        <div className="space-y-2">
          {['Standard', 'ADHD Support', 'Grief Journey'].map(template => (
            <button
              key={template}
              onClick={() => handleTemplateChange(template)}
              className={`w-full p-3 rounded-xl text-left transition-colors ${
                state.activeTemplate === template 
                  ? 'bg-purple-100 border-2 border-purple-300' 
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="font-medium">{template}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Body Battery */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-gray-700">Body Battery</h3>
            <p className="text-sm text-gray-500">Track sleep and movement</p>
          </div>
          <button
            onClick={() => setShowWearableHelp(true)}
            className="text-blue-500 hover:text-blue-700"
          >
            <Info size={20} />
          </button>
        </div>
      </div>

      {/* Learning Library */}
      <button
        onClick={() => setShowLibrary(true)}
        className="w-full bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center justify-between hover:bg-blue-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Book className="text-blue-500" size={24} />
          <div className="text-left">
            <div className="font-medium text-blue-800">Learning Library</div>
            <div className="text-sm text-blue-600">Learn about IFS and self-compassion</div>
          </div>
        </div>
        <ChevronRight className="text-blue-400" size={20} />
      </button>

      {/* Crisis Resources */}
      <button
        onClick={() => setShowCrisisModal(true)}
        className="w-full bg-red-50 p-4 rounded-xl border border-red-100 flex items-center justify-between hover:bg-red-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className="text-red-500" size={24} />
          <div className="text-left">
            <div className="font-medium text-red-800">Crisis Resources</div>
            <div className="text-sm text-red-600">Get help if you're struggling</div>
          </div>
        </div>
        <ChevronRight className="text-red-400" size={20} />
      </button>

      {/* Data Management */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-3">
        <h3 className="font-medium text-gray-700">Data</h3>
        <button
          onClick={handleExportData}
          className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
        >
          <Download size={18} /> Export Data
        </button>
        <button
          onClick={handleResetData}
          className="w-full py-3 bg-red-100 text-red-700 rounded-xl font-medium hover:bg-red-200 transition-colors"
        >
          Reset All Data
        </button>
      </div>

      {/* Disclaimer */}
      <div className="bg-gray-50 p-4 rounded-xl text-center">
        <p className="text-xs text-gray-500 leading-relaxed">
          This app is for self-reflection and motivation, not therapy or crisis intervention. 
          If you're struggling, please reach out to a mental health professional.
        </p>
      </div>
    </div>
  );

  // --- MAIN RENDER ---

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Main Content */}
      <div className="max-w-lg mx-auto px-4 py-6">
        {activeTab === 'daily' && renderDailyTab()}
        {activeTab === 'weekly' && renderWeeklyTab()}
        {activeTab === 'progress' && renderProgressTab()}
        {activeTab === 'journal' && renderJournalTab()}
        {activeTab === 'parts' && renderPartsTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 safe-area-pb">
        <div className="max-w-lg mx-auto flex justify-around">
          {[
            { id: 'daily', icon: Home, label: 'Daily' },
            { id: 'weekly', icon: Calendar, label: 'Weekly' },
            { id: 'progress', icon: Trophy, label: 'Progress' },
            { id: 'journal', icon: BookOpen, label: 'Journal' },
            { id: 'parts', icon: BrainCircuit, label: 'Parts' },
            { id: 'settings', icon: SettingsIcon, label: 'Settings' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex flex-col items-center py-2 px-3 rounded-xl transition-colors ${
                activeTab === tab.id 
                  ? 'text-purple-600 bg-purple-50' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <tab.icon size={20} />
              <span className="text-xs mt-1 font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Modals */}
      {viewingBadge && (
        <BadgeModal 
          badge={viewingBadge} 
          onClose={() => setViewingBadge(null)} 
          isUnlocked={state.badges.includes(viewingBadge.id)}
        />
      )}
      {showLibrary && <LibraryModal onClose={() => setShowLibrary(false)} />}
      {showWearableHelp && <WearableModal onClose={() => setShowWearableHelp(false)} />}
      {showCrisisModal && <CrisisModal onClose={() => setShowCrisisModal(false)} />}
      {showPrestigeModal && (
        <PrestigeModal 
          onClose={() => setShowPrestigeModal(false)} 
          onPrestige={handlePrestige}
          totalXp={state.totalXp}
        />
      )}

      {/* Confetti & Toast */}
      <Confetti active={showConfetti} />
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
};

export default App;
