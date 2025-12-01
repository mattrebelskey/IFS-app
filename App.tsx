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
  Camera,
  Share,
  Activity,
  Download,
  MessageSquarePlus,
  Sparkles,
  X,
  Edit2,
  Printer,
  FileText,
  AlertTriangle,
  Info,
  Book,
  Watch,
  GripVertical,
  Check
} from 'lucide-react';
import { 
  AppState, 
  LevelName, 
  XP_THRESHOLDS, 
  WinEntry, 
  Part,
  PartsCheckIn,
  JournalType,
  HealthLog,
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
import { generateCompassionMessage, suggestHabitStack, suggestTasks } from './services/geminiService';

// --- HELPER COMPONENTS ---

const XpStaircase: React.FC<{ totalXp: number }> = ({ totalXp }) => {
  const blocks = Array.from({ length: 500 }, (_, i) => i + 1);
  
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-700">Journey Progress</h3>
        <span className="text-sm text-gray-500 font-mono">{totalXp} / 500 XP</span>
      </div>
      <div className="grid grid-cols-10 sm:grid-cols-20 gap-1 h-64 overflow-y-auto pr-2 custom-scrollbar">
        {blocks.map((num) => {
          let bgClass = 'bg-gray-100';
          if (num <= totalXp) {
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

  // Touch / Swipe Handlers
  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    // Only allow sliding left for delete
    if (diff < 0 && onDelete) {
      setDragOffset(diff);
    }
  };

  const onTouchEnd = () => {
    isDragging.current = false;
    // Threshold to trigger delete
    if (dragOffset < -100 && onDelete) {
       if(window.confirm("Delete this task?")) {
         onDelete?.();
       }
    }
    setDragOffset(0);
  };

  // HTML5 DnD Handlers
  const handleDragStart = (e: React.DragEvent) => {
      if (onReorder) {
        e.dataTransfer.setData('index', index.toString());
        e.dataTransfer.setData('listId', listId); // Prevent cross-list dropping
        e.dataTransfer.effectAllowed = 'move';
      }
  };
  const handleDragOver = (e: React.DragEvent) => {
      if (onReorder) e.preventDefault(); // Necessary to allow dropping
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
       {/* Delete Background Layer */}
       <div className="absolute inset-0 bg-red-500 rounded-xl flex items-center justify-end px-6">
          <Trash2 className="text-white w-6 h-6" />
       </div>

       {/* Foreground Content */}
       <div 
          className={`relative bg-white rounded-xl transition-transform duration-100 ${dragOffset === 0 ? 'transition-all' : ''}`}
          style={{ transform: `translateX(${dragOffset}px)` }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
       >
          <div className={`flex items-center gap-2 p-4 border-2 rounded-xl transition-all duration-200 ${isChecked ? 'border-green-500 bg-green-50 text-green-900' : 'border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
             
             {/* Drag Handle - Always visible */}
             {onReorder && (
               <div 
                 draggable 
                 onDragStart={handleDragStart}
                 onMouseDown={(e) => e.stopPropagation()} // Prevent parent click
                 className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 mr-1 flex flex-col justify-center h-full py-2 px-1"
               >
                  <GripVertical size={20} />
               </div>
             )}
             
             {/* Main Click Area */}
             <button onClick={onToggle} className="flex-1 flex items-center text-left outline-none">
                <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center transition-all flex-shrink-0 ${isChecked ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                    {isChecked && <CheckCircle2 className="w-4 h-4 text-white animate-check-pop" />}
                </div>
                <span className={`font-medium text-lg ${isChecked ? 'line-through opacity-60' : ''}`}>{task.text}</span>
             </button>
             
             {/* Delete Button (Fallback/Desktop) */}
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
          
          {/* Filter Buttons */}
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

// --- MAIN APP ---

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(loadState);
  
  // Migrating old state if necessary
  useEffect(() => {
    setState(prev => ({
      ...prev,
      parts: prev.parts || DEFAULT_PARTS,
      checkIns: prev.checkIns || [],
      healthLogs: prev.healthLogs || {},
      habitStacks: prev.habitStacks || [],
      customBasics: prev.customBasics || DEFAULT_DAILY_BASICS,
      activeTemplate: prev.activeTemplate || "Standard"
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
  
  // Basics Editing
  const [isEditingBasics, setIsEditingBasics] = useState(false);
  const [newBasicTask, setNewBasicTask] = useState('');

  // Journal State
  const [journalText, setJournalText] = useState('');
  const [journalMode, setJournalMode] = useState<JournalType>('text');
  const [mediaData, setMediaData] = useState<string | undefined>(undefined);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Parts State
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [partCheckInNote, setPartCheckInNote] = useState('');
  const [partIntensity, setPartIntensity] = useState(5);
  const [isAddingPart, setIsAddingPart] = useState(false);
  const [newPartName, setNewPartName] = useState('');
  const [newPartRole, setNewPartRole] = useState<Part['role']>('unknown');

  // Other
  const [habitSuggestion, setHabitSuggestion] = useState<string | null>(null);
  const [newFocusTask, setNewFocusTask] = useState('');
  const [suggestedTasks, setSuggestedTasks] = useState<string[]>([]);
  const [showExportMenu, setShowExportMenu] = useState(false);

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
      return { ...prev, dailyHistory: newHistory, totalXp: new