import React, { useState, useEffect, useRef } from 'react';
import {
  Home,
  Trophy,
  BookOpen,
  Settings as SettingsIcon,
  CheckCircle2,
  Plus,
  Trash2,
  Heart,
  BrainCircuit,
  Sparkles,
  X,
  GripVertical
} from 'lucide-react';
import {
  AppState,
  LevelName,
  WinEntry,
  Part,
  PartsCheckIn,
  Badge,
  TaskItem
} from './types';
import {
  DEFAULT_DAILY_BASICS,
  SURVIVAL_MODE_BASICS,
  COMPASSION_QUOTES,
  BADGES,
  DEFAULT_PARTS,
  ADHD_TEMPLATE,
  GRIEF_TEMPLATE,
  LIBRARY_CONTENT
} from './constants';
import { saveState, loadState, calculateLevel } from './services/storageService';
import { generateCompassionMessage } from './services/geminiService';

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
              <BookOpen className="text-blue-500" /> Learning Library
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

// --- MAIN APP ---

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(loadState);

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
  const [viewingBadge, setViewingBadge] = useState<Badge | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);

  const [isEditingBasics, setIsEditingBasics] = useState(false);
  const [newBasicTask, setNewBasicTask] = useState('');

  const [journalText, setJournalText] = useState('');
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [partCheckInNote, setPartCheckInNote] = useState('');
  const [partIntensity, setPartIntensity] = useState(5);
  const [isAddingPart, setIsAddingPart] = useState(false);
  const [newPartName, setNewPartName] = useState('');
  const [newPartRole, setNewPartRole] = useState<Part['role']>('unknown');

  const [newFocusTask, setNewFocusTask] = useState('');

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  useEffect(() => {
    saveState(state);
  }, [state]);

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

  const showToast = (msg: string) => setToastMessage(msg);

  const handleTaskToggle = (taskId: string, dateStr: string, xpValue: number) => {
    const dayTasks = state.dailyHistory[dateStr] || [];
    const isCompleted = dayTasks.includes(taskId);

    setState(prev => {
      const dayTasks = prev.dailyHistory[dateStr] || [];
      const isCompleted = dayTasks.includes(taskId);
      const newHistory = isCompleted
        ? { ...prev.dailyHistory, [dateStr]: dayTasks.filter(id => id !== taskId) }
        : { ...prev.dailyHistory, [dateStr]: [...dayTasks, taskId] };

      const xpChange = isCompleted ? -xpValue : xpValue;
      const newXp = Math.max(0, prev.totalXp + xpChange);
      const newLevel = calculateLevel(newXp);

      return { ...prev, dailyHistory: newHistory, totalXp: newXp, currentLevel: newLevel };
    });
    showToast(isCompleted ? 'Task unchecked' : `+${xpValue} XP earned!`);
  };

  const handleAddBasicTask = () => {
    if (!newBasicTask.trim()) return;
    const newTask: TaskItem = {
      id: `basic_custom_${Date.now()}`,
      text: newBasicTask,
      category: 'basic',
      xpValue: 1
    };
    setState(prev => ({
      ...prev,
      customBasics: [...(prev.customBasics || DEFAULT_DAILY_BASICS), newTask]
    }));
    setNewBasicTask('');
    showToast('Basic task added!');
  };

  const handleAddFocusTask = () => {
    if (!newFocusTask.trim()) return;
    const newTask: TaskItem = {
      id: `focus_${Date.now()}`,
      text: newFocusTask,
      category: 'focus',
      xpValue: 1
    };
    setState(prev => ({
      ...prev,
      focusTasks: [...prev.focusTasks, newTask]
    }));
    setNewFocusTask('');
    showToast('Focus task added!');
  };

  const handleDeleteFocusTask = (taskId: string) => {
    if (window.confirm('Delete this focus task?')) {
      setState(prev => ({
        ...prev,
        focusTasks: prev.focusTasks.filter(t => t.id !== taskId)
      }));
      showToast('Focus task deleted');
    }
  };

  const handleSaveJournal = () => {
    if (!journalText.trim()) return;
    const newWin: WinEntry = {
      id: `win_${Date.now()}`,
      date: getTodayStr(),
      text: journalText,
      type: 'text'
    };
    setState(prev => ({
      ...prev,
      wins: [newWin, ...prev.wins],
      totalXp: prev.totalXp + 2,
      currentLevel: calculateLevel(prev.totalXp + 2)
    }));
    setJournalText('');
    showToast('+2 XP for journaling!');
  };

  const handleSavePartCheckIn = () => {
    if (!selectedPartId) return;
    const newCheckIn: PartsCheckIn = {
      id: `checkin_${Date.now()}`,
      date: getTodayStr(),
      activeParts: [selectedPartId],
      notes: partCheckInNote,
      intensity: partIntensity
    };
    setState(prev => ({
      ...prev,
      checkIns: [newCheckIn, ...prev.checkIns],
      totalXp: prev.totalXp + 2,
      currentLevel: calculateLevel(prev.totalXp + 2)
    }));
    setSelectedPartId(null);
    setPartCheckInNote('');
    setPartIntensity(5);
    showToast('+2 XP for parts check-in!');
  };

  const handleAddPart = () => {
    if (!newPartName.trim()) return;
    const newPart: Part = {
      id: `part_${Date.now()}`,
      name: newPartName,
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

  const handleGenerateCompassion = async () => {
    setIsGeneratingAi(true);
    try {
      const msg = await generateCompassionMessage(state);
      setCompassionMsg(msg);
    } catch (error) {
      setCompassionMsg(COMPASSION_QUOTES[Math.floor(Math.random() * COMPASSION_QUOTES.length)]);
    }
    setIsGeneratingAi(false);
  };

  const handleApplyTemplate = (templateName: string) => {
    if (templateName === 'ADHD Support') {
      setState(prev => ({
        ...prev,
        customBasics: ADHD_TEMPLATE.basics,
        focusTasks: ADHD_TEMPLATE.focus,
        activeTemplate: templateName
      }));
    } else if (templateName === 'Grief Journey') {
      setState(prev => ({
        ...prev,
        customBasics: GRIEF_TEMPLATE.basics,
        focusTasks: GRIEF_TEMPLATE.focus,
        activeTemplate: templateName
      }));
    } else {
      setState(prev => ({
        ...prev,
        customBasics: DEFAULT_DAILY_BASICS,
        focusTasks: [],
        activeTemplate: 'Standard'
      }));
    }
    showToast(`${templateName} template applied!`);
  };

  const todayStr = getTodayStr();
  const todayTasks = state.dailyHistory[todayStr] || [];
  const currentBasics = state.settings.survivalMode ? SURVIVAL_MODE_BASICS : (state.customBasics || DEFAULT_DAILY_BASICS);

  const currentLevel = calculateLevel(state.totalXp);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pb-20">
      <Confetti active={showConfetti} />
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      {viewingBadge && (
        <BadgeModal
          badge={viewingBadge}
          onClose={() => setViewingBadge(null)}
          isUnlocked={state.badges.includes(viewingBadge.id)}
        />
      )}

      {showLibrary && <LibraryModal onClose={() => setShowLibrary(false)} />}

      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-2xl font-bold text-gray-800">Healing Journey</h1>
            <button
              onClick={() => setShowLibrary(true)}
              className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-600"
            >
              <BookOpen size={20} />
            </button>
          </div>
          <p className="text-sm text-gray-500">Welcome, {state.settings.name}</p>
          <div className="mt-4 flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500">Level</p>
              <p className="text-lg font-bold text-purple-600">{currentLevel}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total XP</p>
              <p className="text-lg font-bold text-purple-600">{state.totalXp} / 500</p>
            </div>
          </div>
        </div>

        {activeTab === 'daily' && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Daily Basics</h2>
            <div className="space-y-2 mb-6">
              {currentBasics.map((task, idx) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  index={idx}
                  isChecked={todayTasks.includes(task.id)}
                  onToggle={() => handleTaskToggle(task.id, todayStr, task.xpValue)}
                  listId="daily-basics"
                />
              ))}
            </div>

            <h2 className="text-xl font-bold text-gray-800 mb-4">Focus Tasks</h2>
            <div className="space-y-2 mb-4">
              {state.focusTasks.map((task, idx) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  index={idx}
                  isChecked={todayTasks.includes(task.id)}
                  onToggle={() => handleTaskToggle(task.id, todayStr, task.xpValue)}
                  onDelete={() => handleDeleteFocusTask(task.id)}
                  listId="focus-tasks"
                />
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newFocusTask}
                onChange={e => setNewFocusTask(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleAddFocusTask()}
                placeholder="Add a focus task..."
                className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none"
              />
              <button
                onClick={handleAddFocusTask}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-bold"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <div>
            <XpStaircase totalXp={state.totalXp} />

            <h2 className="text-xl font-bold text-gray-800 mb-4">Badges</h2>
            <div className="grid grid-cols-3 gap-4">
              {BADGES.map(badge => {
                const isUnlocked = state.badges.includes(badge.id);
                return (
                  <button
                    key={badge.id}
                    onClick={() => setViewingBadge(badge)}
                    className={`p-4 rounded-xl text-center ${
                      isUnlocked ? 'bg-green-100 border-2 border-green-500' : 'bg-gray-100 border-2 border-gray-300'
                    }`}
                  >
                    <div className="text-4xl mb-2">{badge.icon}</div>
                    <p className="text-xs font-bold text-gray-700">{badge.name}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'journal' && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Daily Win Journal (+2 XP)</h2>
            <textarea
              value={journalText}
              onChange={e => setJournalText(e.target.value)}
              placeholder="What went well today? Even small wins count..."
              className="w-full h-32 px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none resize-none"
            />
            <button
              onClick={handleSaveJournal}
              className="w-full mt-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-bold"
            >
              Save Win
            </button>

            <h3 className="text-lg font-bold text-gray-800 mt-8 mb-4">Past Wins</h3>
            <div className="space-y-4">
              {state.wins.slice(0, 10).map(win => (
                <div key={win.id} className="bg-white p-4 rounded-xl border border-gray-200">
                  <p className="text-sm text-gray-500 mb-1">{win.date}</p>
                  <p className="text-gray-800">{win.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'parts' && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Parts Check-In (+2 XP)</h2>

            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">Which part is active?</label>
              <select
                value={selectedPartId || ''}
                onChange={e => setSelectedPartId(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none"
              >
                <option value="">Select a part...</option>
                {state.parts.map(part => (
                  <option key={part.id} value={part.id}>{part.name} ({part.role})</option>
                ))}
              </select>
            </div>

            {selectedPartId && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Intensity (1-10)</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={partIntensity}
                    onChange={e => setPartIntensity(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-center text-lg font-bold text-purple-600">{partIntensity}</p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={partCheckInNote}
                    onChange={e => setPartCheckInNote(e.target.value)}
                    placeholder="What is this part trying to tell you?"
                    className="w-full h-24 px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none resize-none"
                  />
                </div>

                <button
                  onClick={handleSavePartCheckIn}
                  className="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-bold"
                >
                  Save Check-In
                </button>
              </>
            )}

            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">My Parts</h3>
                <button
                  onClick={() => setIsAddingPart(!isAddingPart)}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-sm"
                >
                  {isAddingPart ? 'Cancel' : 'Add Part'}
                </button>
              </div>

              {isAddingPart && (
                <div className="bg-white p-4 rounded-xl border border-gray-200 mb-4">
                  <input
                    type="text"
                    value={newPartName}
                    onChange={e => setNewPartName(e.target.value)}
                    placeholder="Part name..."
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none mb-2"
                  />
                  <select
                    value={newPartRole}
                    onChange={e => setNewPartRole(e.target.value as Part['role'])}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none mb-2"
                  >
                    <option value="unknown">Unknown</option>
                    <option value="manager">Manager</option>
                    <option value="firefighter">Firefighter</option>
                    <option value="exile">Exile</option>
                  </select>
                  <button
                    onClick={handleAddPart}
                    className="w-full py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-bold"
                  >
                    Add
                  </button>
                </div>
              )}

              <div className="space-y-2">
                {state.parts.map(part => (
                  <div key={part.id} className="bg-white p-4 rounded-xl border border-gray-200">
                    <p className="font-bold text-gray-800">{part.name}</p>
                    <p className="text-sm text-gray-600 capitalize">{part.role}</p>
                    {part.description && <p className="text-sm text-gray-500 mt-1">{part.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Settings</h2>

            <div className="bg-white p-4 rounded-xl mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">Your Name</label>
              <input
                type="text"
                value={state.settings.name}
                onChange={e => setState(prev => ({
                  ...prev,
                  settings: { ...prev.settings, name: e.target.value }
                }))}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none"
              />
            </div>

            <div className="bg-white p-4 rounded-xl mb-4">
              <label className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-700">Survival Mode</span>
                <input
                  type="checkbox"
                  checked={state.settings.survivalMode}
                  onChange={e => setState(prev => ({
                    ...prev,
                    settings: { ...prev.settings, survivalMode: e.target.checked }
                  }))}
                  className="w-6 h-6"
                />
              </label>
              <p className="text-xs text-gray-500 mt-2">Simplify daily tasks when you're struggling</p>
            </div>

            <div className="bg-white p-4 rounded-xl mb-4">
              <h3 className="text-sm font-bold text-gray-700 mb-2">Templates</h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleApplyTemplate('Standard')}
                  className={`w-full py-2 px-4 rounded-xl font-bold ${
                    state.activeTemplate === 'Standard'
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Standard
                </button>
                <button
                  onClick={() => handleApplyTemplate('ADHD Support')}
                  className={`w-full py-2 px-4 rounded-xl font-bold ${
                    state.activeTemplate === 'ADHD Support'
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  ADHD Support
                </button>
                <button
                  onClick={() => handleApplyTemplate('Grief Journey')}
                  className={`w-full py-2 px-4 rounded-xl font-bold ${
                    state.activeTemplate === 'Grief Journey'
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Grief Journey
                </button>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl mb-4">
              <button
                onClick={handleGenerateCompassion}
                disabled={isGeneratingAi}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <Sparkles size={20} />
                {isGeneratingAi ? 'Generating...' : 'AI Compassion Message'}
              </button>
              {compassionMsg && (
                <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <p className="text-sm text-purple-900 italic">{compassionMsg}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-3 flex justify-around">
          <button
            onClick={() => setActiveTab('daily')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'daily' ? 'text-purple-600' : 'text-gray-400'}`}
          >
            <Home size={24} />
            <span className="text-xs font-bold">Daily</span>
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'progress' ? 'text-purple-600' : 'text-gray-400'}`}
          >
            <Trophy size={24} />
            <span className="text-xs font-bold">Progress</span>
          </button>
          <button
            onClick={() => setActiveTab('journal')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'journal' ? 'text-purple-600' : 'text-gray-400'}`}
          >
            <Heart size={24} />
            <span className="text-xs font-bold">Journal</span>
          </button>
          <button
            onClick={() => setActiveTab('parts')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'parts' ? 'text-purple-600' : 'text-gray-400'}`}
          >
            <BrainCircuit size={24} />
            <span className="text-xs font-bold">Parts</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'settings' ? 'text-purple-600' : 'text-gray-400'}`}
          >
            <SettingsIcon size={24} />
            <span className="text-xs font-bold">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;
