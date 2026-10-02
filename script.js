/**
 * ============================================================================
 * ADHAM PLANNER | مخطط أدهم
 * Personal Productivity + Study Planner for Computer Science Student
 * Clean, Modular, and Robust Vanilla JavaScript Engine
 * ============================================================================
 */

'use strict';

/* ==========================================================================
   CONSTANTS & METADATA
   ========================================================================== */

const DAYS_NAMES_AR = [
  'الأحد',    // 0
  'الاثنين',   // 1
  'الثلاثاء',  // 2
  'الأربعاء',  // 3
  'الخميس',   // 4
  'الجمعة',   // 5
  'السبت'     // 6
];

const MONTHS_NAMES_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const CATEGORIES_DEF = {
  prayer:  { id: 'prayer',  name: 'الصلاة',   icon: '🕌', badgeClass: 'bg-prayer' },
  adhkar:  { id: 'adhkar',  name: 'الأذكار',  icon: '🤲', badgeClass: 'bg-adhkar' },
  quran:   { id: 'quran',   name: 'القرآن',   icon: '📖', badgeClass: 'bg-quran' },
  study:   { id: 'study',   name: 'المذاكرة', icon: '📚', badgeClass: 'bg-study' },
  college: { id: 'college', name: 'الكلية',   icon: '🎓', badgeClass: 'bg-college' },
  general: { id: 'general', name: 'عام',      icon: '✨', badgeClass: 'bg-general' }
};

const DEFAULT_SUBJECTS = [
  { id: 'cs2', name: 'برمجة حاسب 2', code: 'CS201', sessions: 0, totalMinutes: 0, lastStudied: null, color: '#6366f1', targetHours: 14 },
  { id: 'db',  name: 'قواعد البيانات', code: 'CS202', sessions: 0, totalMinutes: 0, lastStudied: null, color: '#3b82f6', targetHours: 12 },
  { id: 'la',  name: 'جبر خطي',       code: 'MATH201', sessions: 0, totalMinutes: 0, lastStudied: null, color: '#10b981', targetHours: 10 },
  { id: 'mm',  name: 'نظم الوسائط المتعددة', code: 'CS203', sessions: 0, totalMinutes: 0, lastStudied: null, color: '#f59e0b', targetHours: 10 },
  { id: 'toc', name: 'نظرية الحاسبات', code: 'CS204', sessions: 0, totalMinutes: 0, lastStudied: null, color: '#ec4899', targetHours: 12 }
];

const COLLEGE_DESCRIPTIONS = {
  6: 'سكشنان (8:00 - 12:00) ثم العودة للمنزل',
  0: 'محاضرة برمجة حاسب 2 (10:00 - 12:00)',
  1: 'محاضرة قواعد البيانات (1:00 - 3:00)',
  2: 'جبر خطي (12:00 - 3:00) + سكشن (3:00 - 4:00)',
  3: 'محاضرة نظم الوسائط المتعددة (10:00 - 12:00)',
  4: 'محاضرة نظرية الحاسبات (11:00 - 3:00)',
  5: 'لا توجد كلية - يوم المذاكرة والمراجعة الشاملة 🚀'
};

function getCollegeDescription(dayIdx) {
  if (appState.settings && appState.settings.collegeDescriptions && appState.settings.collegeDescriptions[dayIdx]) {
    return appState.settings.collegeDescriptions[dayIdx];
  }
  return COLLEGE_DESCRIPTIONS[dayIdx] || 'جدول دراسي';
}

function saveCollegeDescription(dayIdx, text) {
  if (!appState.settings) appState.settings = {};
  if (!appState.settings.collegeDescriptions) {
    appState.settings.collegeDescriptions = {};
  }
  appState.settings.collegeDescriptions[dayIdx] = text;
  saveData(STORAGE_KEYS.SETTINGS);
}

/* ==========================================================================
   APP STATE
   ========================================================================== */

let currentOpenDayDetailsIndex = null;

let appState = {
  theme: 'dark',
  activeView: 'home',
  selectedDayIndex: null, // null means auto-detect current today
  taskFilter: 'all',      // 'all' | 'pending' | 'completed'
  settings: {
    userName: 'أدهم',
    bedTime: '22:00',
    notificationsEnabled: false,
    collegeDescriptions: {},
    prayers: {
      fajr: '06:00',
      dhuhr: '13:30',
      asr: '17:00',
      maghrib: '19:00',
      isha: '20:30'
    }
  },
  subjects: JSON.parse(JSON.stringify(DEFAULT_SUBJECTS)),
  daysData: {}, // Keyed by YYYY-MM-DD
  streak: {
    currentStreak: 0,
    longestStreak: 0,
    lastMetDate: null,
    history: []
  },
  pomodoro: {
    mode: 'study', // 'study' | 'break' | 'longBreak'
    duration: 25 * 60,
    remaining: 25 * 60,
    isRunning: false,
    timerInterval: null,
    selectedSubject: ''
  }
};

/* ==========================================================================
   STORAGE ENGINE (LocalStorage)
   ========================================================================== */

const STORAGE_KEYS = {
  SETTINGS: 'adham_settings_v1',
  THEME: 'adham_theme_v1',
  SUBJECTS: 'adham_subjects_v1',
  DAYS_DATA: 'adham_days_data_v1',
  STREAK: 'adham_streak_v1',
  POMO_LOG: 'adham_pomo_log_v1'
};

function loadData() {
  try {
    // Theme
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    if (savedTheme) appState.theme = savedTheme;

    // Settings
    const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (savedSettings) {
      appState.settings = Object.assign(appState.settings, JSON.parse(savedSettings));
    }

    // Subjects
    const savedSubjects = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
    if (savedSubjects) {
      appState.subjects = JSON.parse(savedSubjects);
    }

    // Days Data
    const savedDays = localStorage.getItem(STORAGE_KEYS.DAYS_DATA);
    if (savedDays) {
      appState.daysData = JSON.parse(savedDays);
    }

    // Streak
    const savedStreak = localStorage.getItem(STORAGE_KEYS.STREAK);
    if (savedStreak) {
      appState.streak = JSON.parse(savedStreak);
    }
  } catch (error) {
    console.error('Error loading data from LocalStorage:', error);
    showToast('تعذر استرجاع بعض البيانات من المتصفح', 'warn');
  }
}

function saveData(key) {
  try {
    if (!key || key === STORAGE_KEYS.THEME) {
      localStorage.setItem(STORAGE_KEYS.THEME, appState.theme);
    }
    if (!key || key === STORAGE_KEYS.SETTINGS) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(appState.settings));
    }
    if (!key || key === STORAGE_KEYS.SUBJECTS) {
      localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(appState.subjects));
    }
    if (!key || key === STORAGE_KEYS.DAYS_DATA) {
      localStorage.setItem(STORAGE_KEYS.DAYS_DATA, JSON.stringify(appState.daysData));
    }
    if (!key || key === STORAGE_KEYS.STREAK) {
      localStorage.setItem(STORAGE_KEYS.STREAK, JSON.stringify(appState.streak));
    }
  } catch (error) {
    console.error('Error saving data to LocalStorage:', error);
    showToast('خطأ في حفظ البيانات', 'warn');
  }
}

/* ==========================================================================
   DATE & TIME UTILITIES
   ========================================================================== */

/**
 * Returns formatted date string 'YYYY-MM-DD'
 */
function getDateKey(dateObj = new Date()) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns Arabic formatted date string, e.g. "السبت 2 أكتوبر 2026"
 */
function formatArabicDate(dateObj = new Date()) {
  const dayName = DAYS_NAMES_AR[dateObj.getDay()];
  const dayNum = dateObj.getDate();
  const monthName = MONTHS_NAMES_AR[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  return `${dayName} ${dayNum} ${monthName} ${year}`;
}

/**
 * Returns current day of week (0 to 6)
 */
function getCurrentDayIndex() {
  return new Date().getDay();
}

/**
 * Resolves which day index is currently displayed (auto today or user chosen)
 */
function getActiveDayIndex() {
  if (appState.selectedDayIndex !== null && appState.selectedDayIndex !== 'today') {
    return parseInt(appState.selectedDayIndex, 10);
  }
  return getCurrentDayIndex();
}

/**
 * Returns the date key corresponding to a given day index for the current week.
 * The week starts on Friday (5) and ends on Thursday (4).
 */
function getDateKeyForDayOfWeek(targetDayOfWeek) {
  const today = new Date();
  const currentDay = today.getDay(); // 0: Sun ... 5: Fri, 6: Sat
  
  // Calculate how many days have passed since the Friday of the current cycle
  const daysSinceFriday = (currentDay - 5 + 7) % 7;
  const fridayDate = new Date(today);
  fridayDate.setDate(today.getDate() - daysSinceFriday);

  // Calculate the target day's offset from Friday
  const offsetFromFriday = (targetDayOfWeek - 5 + 7) % 7;
  const targetDate = new Date(fridayDate);
  targetDate.setDate(fridayDate.getDate() + offsetFromFriday);

  return getDateKey(targetDate);
}

/**
 * Formats seconds into MM:SS
 */
function formatTimeMMSS(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/* ==========================================================================
   DAILY TASKS GENERATION (SMART CS SCHEDULE ENGINE)
   ========================================================================== */

/**
 * Generates initial default tasks tailored specifically to Adham's day
 */
function generateDefaultTasksForDay(dayIndex) {
  const tasks = [];
  let idCounter = 1;
  const mk = (time, title, category, extra = {}) => ({
    id: `task_${dayIndex}_${idCounter++}_${Date.now()}`,
    time,
    title,
    category,
    completed: false,
    isDefault: true,
    ...extra
  });

  // Base Morning Anchor (Core Prayer + Adhkar + Quran)
  tasks.push(mk('05:30', 'صلاة الفجر في وقتها', 'prayer'));
  tasks.push(mk('06:00', 'أذكار الصباح كاملة', 'adhkar'));
  tasks.push(mk('06:20', 'حفظ القرآن الكريم', 'quran', { quranType: 'memo' }));

  // Day-Specific Academic & Study Schedules
  switch (dayIndex) {
    case 6: // السبت (Saturday)
      tasks.push(mk('07:00', 'الخروج للكلية ووقت الطريق', 'college'));
      tasks.push(mk('08:00', 'السكشن الأول بالكلية', 'college'));
      tasks.push(mk('10:00', 'السكشن الثاني بالكلية', 'college'));
      tasks.push(mk('12:00', 'الوصول إلى البيت والراحة', 'college'));
      tasks.push(mk('13:00', 'صلاة الظهر', 'prayer'));
      tasks.push(mk('13:30', 'مذاكرة وتطبيق: برمجة حاسب 2', 'study', { subjectId: 'cs2' }));
      break;

    case 0: // الأحد (Sunday)
      tasks.push(mk('08:30', 'الخروج للكلية (ساعة ونصف قبل المحاضرة)', 'college'));
      tasks.push(mk('10:00', 'محاضرة: برمجة حاسب 2 (10:00 - 12:00)', 'college'));
      tasks.push(mk('12:00', 'طريق العودة للمنزل (ساعة)', 'college'));
      tasks.push(mk('13:00', 'صلاة الظهر', 'prayer'));
      tasks.push(mk('13:30', 'مذاكرة ومراجعة: برمجة حاسب 2', 'study', { subjectId: 'cs2' }));
      break;

    case 1: // الاثنين (Monday)
      tasks.push(mk('08:30', 'مذاكرة خفيفة ومراجعة قبل الكلية', 'study'));
      tasks.push(mk('11:30', 'الخروج للكلية (ساعة ونصف قبل المحاضرة)', 'college'));
      tasks.push(mk('13:00', 'محاضرة: قواعد البيانات (1:00 - 3:00)', 'college'));
      tasks.push(mk('13:00', 'صلاة الظهر', 'prayer'));
      tasks.push(mk('15:00', 'طريق العودة للمنزل (ساعة)', 'college'));
      break;

    case 2: // الثلاثاء (Tuesday - يوم مزدحم)
      tasks.push(mk('10:30', 'الخروج للكلية (ساعة ونصف قبل المحاضرة)', 'college'));
      tasks.push(mk('12:00', 'محاضرة: جبر خطي (12:00 - 3:00)', 'college'));
      tasks.push(mk('13:00', 'صلاة الظهر', 'prayer'));
      tasks.push(mk('15:00', 'سكشن: جبر خطي (3:00 - 4:00)', 'college'));
      tasks.push(mk('16:00', 'طريق العودة للمنزل (ساعة)', 'college'));
      break;

    case 3: // الأربعاء (Wednesday)
      tasks.push(mk('08:30', 'الخروج للكلية (ساعة ونصف قبل المحاضرة)', 'college'));
      tasks.push(mk('10:00', 'محاضرة: نظم الوسائط المتعددة (10:00 - 12:00)', 'college'));
      tasks.push(mk('12:00', 'طريق العودة للمنزل (ساعة)', 'college'));
      tasks.push(mk('13:00', 'صلاة الظهر', 'prayer'));
      tasks.push(mk('13:30', 'مذاكرة ومراجعة: نظم الوسائط المتعددة', 'study', { subjectId: 'mm' }));
      break;

    case 4: // الخميس (Thursday)
      tasks.push(mk('09:30', 'الخروج للكلية (ساعة ونصف قبل المحاضرة)', 'college'));
      tasks.push(mk('11:00', 'محاضرة: نظرية الحاسبات (11:00 - 3:00)', 'college'));
      tasks.push(mk('13:00', 'صلاة الظهر', 'prayer'));
      tasks.push(mk('15:00', 'طريق العودة للمنزل (ساعة)', 'college'));
      break;

    case 5: // الجمعة (Friday - يوم المذاكرة الأكبر، لا كلية)
      tasks.push(mk('07:30', 'جلسة مذاكرة 1: برمجة حاسب 2', 'study', { subjectId: 'cs2' }));
      tasks.push(mk('09:45', 'جلسة مذاكرة 2: قواعد البيانات', 'study', { subjectId: 'db' }));
      tasks.push(mk('11:30', 'الاستعداد لصلاة الجمعة وأداؤها', 'prayer'));
      tasks.push(mk('13:45', 'جلسة مذاكرة 3: جبر خطي', 'study', { subjectId: 'la' }));
      break;
  }

  // Base Afternoon & Evening Anchor (Asr, Lunch, Adhkar, Maghrib, Quran Revision, Isha, Prayer, Sleep)
  tasks.push(mk('16:30', 'صلاة العصر', 'prayer'));
  tasks.push(mk('17:00', 'وجبة الغداء + أذكار المساء', 'adhkar'));

  // On Friday: Afternoon study sessions 4 & 5
  if (dayIndex === 5) {
    tasks.push(mk('17:45', 'جلسة مذاكرة 4: نظم الوسائط المتعددة', 'study', { subjectId: 'mm' }));
  }

  tasks.push(mk('18:30', 'صلاة المغرب', 'prayer'));
  tasks.push(mk('19:00', 'مراجعة القرآن الكريم وتثبيته', 'quran', { quranType: 'rev' }));
  tasks.push(mk('20:00', 'صلاة العشاء', 'prayer'));

  if (dayIndex === 5) {
    tasks.push(mk('20:30', 'جلسة مذاكرة 5 خفيفة: نظرية الحاسبات وتخطيط الأسبوع', 'study', { subjectId: 'toc' }));
    tasks.push(mk('21:30', 'ساعة صلاة ووتر ودعاء', 'prayer'));
  } else {
    tasks.push(mk('20:30', 'ساعة صلاة وقيام ليل', 'prayer'));
  }

  tasks.push(mk('22:00', 'وقت النوم والاستعداد للراحة 🌙', 'general'));

  return tasks;
}

/**
 * Gets or initializes data for a given date key
 */
function getDayRecord(dateKey, dayIndex = null) {
  if (!appState.daysData[dateKey]) {
    const resolvedDayIndex = dayIndex !== null ? dayIndex : new Date(dateKey).getDay();
    appState.daysData[dateKey] = {
      date: dateKey,
      dayOfWeek: resolvedDayIndex,
      tasks: generateDefaultTasksForDay(resolvedDayIndex),
      quran: {
        memo: false,
        memoNotes: '',
        rev: false,
        revNotes: ''
      },
      dailyScorePercent: 0,
      targetMet: false
    };
    saveData(STORAGE_KEYS.DAYS_DATA);
  }
  return appState.daysData[dateKey];
}

/* ==============================================
   AUDIO FEEDBACK (Web Audio API Synthesizer)
   ============================================== */

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.1) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // Audio might fail if user hasn't interacted yet
  }
}

function playCompletionChime() {
  playTone(523.25, 'triangle', 0.15, 0.12); // C5
  setTimeout(() => playTone(659.25, 'triangle', 0.2, 0.12), 120); // E5
  setTimeout(() => playTone(783.99, 'triangle', 0.35, 0.15), 240); // G5
}

function playPomoFinishAlarm() {
  playTone(880, 'sine', 0.2, 0.2);
  setTimeout(() => playTone(880, 'sine', 0.2, 0.2), 250);
  setTimeout(() => playTone(1174.66, 'triangle', 0.5, 0.25), 500);
}

/* ==============================================
   CONFETTI CELEBRATION EFFECT (Lightweight Canvas)
   ============================================== */

function triggerConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const pieces = [];
  const colors = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];

  for (let i = 0; i < 110; i++) {
    pieces.push({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height * 0.5,
      size: Math.random() * 8 + 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 4 + 3,
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 8
    });
  }

  let animationFrame;
  let startTime = Date.now();

  function renderConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const elapsed = Date.now() - startTime;

    pieces.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.vRot;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    });

    if (elapsed < 3500) {
      animationFrame = requestAnimationFrame(renderConfetti);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(animationFrame);
    }
  }

  renderConfetti();
}

/* ==============================================
   TOAST NOTIFICATION COMPONENT
   ============================================== */

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'warn') icon = '⚠️';

  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

/* ==============================================
   UI RENDERING: HOME PAGE & TASKS
   ============================================== */

function renderHomePage() {
  const activeDayIndex = getActiveDayIndex();
  const dateKey = getDateKeyForDayOfWeek(activeDayIndex);
  const dayRecord = getDayRecord(dateKey, activeDayIndex);

  // 1. Hero Greeting & Date
  const heroGreeting = document.getElementById('hero-greeting');
  const heroDayBadge = document.getElementById('hero-day-badge');
  const tasksDayName = document.getElementById('tasks-day-name');
  const collegeStatusDesc = document.getElementById('college-status-desc');

  const now = new Date();
  const currentHour = now.getHours();
  const isMorning = currentHour < 12;
  const greetingWord = isMorning ? 'صباح الخير' : 'مساء الخير';
  const userName = appState.settings.userName || 'أدهم';

  if (heroGreeting) heroGreeting.textContent = `${greetingWord} يا ${userName} 👋`;
  if (heroDayBadge) heroDayBadge.textContent = DAYS_NAMES_AR[activeDayIndex];
  if (tasksDayName) tasksDayName.textContent = DAYS_NAMES_AR[activeDayIndex];

  // College description for today
  if (collegeStatusDesc) {
    collegeStatusDesc.textContent = getCollegeDescription(activeDayIndex);
  }

  // 2. Quran Routine Checkboxes Sync
  const qMemoCheck = document.getElementById('quran-memo-check');
  const qMemoNotes = document.getElementById('quran-memo-notes');
  const qRevCheck = document.getElementById('quran-rev-check');
  const qRevNotes = document.getElementById('quran-rev-notes');
  const quranStatusBadge = document.getElementById('quran-status-badge');
  const qMemoIndicator = document.getElementById('quran-memo-indicator');
  const qRevIndicator = document.getElementById('quran-rev-indicator');

  if (dayRecord.quran) {
    if (qMemoCheck) qMemoCheck.checked = !!dayRecord.quran.memo;
    if (qMemoNotes) qMemoNotes.value = dayRecord.quran.memoNotes || '';
    if (qRevCheck) qRevCheck.checked = !!dayRecord.quran.rev;
    if (qRevNotes) qRevNotes.value = dayRecord.quran.revNotes || '';

    if (qMemoIndicator) {
      qMemoIndicator.textContent = dayRecord.quran.memo ? 'تم الحفظ ✔' : 'لم يتم';
      qMemoIndicator.classList.toggle('done', !!dayRecord.quran.memo);
    }
    if (qRevIndicator) {
      qRevIndicator.textContent = dayRecord.quran.rev ? 'تمت المراجعة ✔' : 'لم يتم';
      qRevIndicator.classList.toggle('done', !!dayRecord.quran.rev);
    }

    const quranDoneCount = (dayRecord.quran.memo ? 1 : 0) + (dayRecord.quran.rev ? 1 : 0);
    if (quranStatusBadge) {
      quranStatusBadge.textContent = `${quranDoneCount} من 2 مكتمل`;
    }
  }

  // 3. Render Tasks
  renderTaskList(dayRecord);

  // 4. Update Progress & Category Counters
  updateProgress(dayRecord);
}

function renderTaskList(dayRecord) {
  const taskListEl = document.getElementById('task-list');
  const emptyStateEl = document.getElementById('task-empty-state');
  const tasksCounterBadge = document.getElementById('tasks-counter-badge');
  const allCompletedBanner = document.getElementById('all-completed-banner');

  if (!taskListEl) return;

  taskListEl.innerHTML = '';
  const filter = appState.taskFilter;

  // Filter tasks
  const filteredTasks = dayRecord.tasks.filter(task => {
    if (filter === 'pending') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true; // 'all'
  });

  if (tasksCounterBadge) {
    tasksCounterBadge.textContent = `${dayRecord.tasks.length} مهام`;
  }

  if (filteredTasks.length === 0) {
    if (emptyStateEl) emptyStateEl.classList.remove('hidden');
  } else {
    if (emptyStateEl) emptyStateEl.classList.add('hidden');

    filteredTasks.forEach(task => {
      const cat = CATEGORIES_DEF[task.category] || CATEGORIES_DEF.general;
      const taskItem = document.createElement('div');
      taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
      taskItem.dataset.id = task.id;

      taskItem.innerHTML = `
        <div class="task-right-content">
          <input type="checkbox" class="custom-checkbox task-check" ${task.completed ? 'checked' : ''} aria-label="تحديد المهمة">
          <span class="task-time-badge">${task.time || '--:--'}</span>
          <div class="task-details">
            <span class="task-title">${task.title}</span>
            <div class="task-meta-row">
              <span class="task-cat-badge ${cat.badgeClass}">${cat.icon} ${cat.name}</span>
            </div>
          </div>
        </div>

        <div class="task-actions">
          <button class="task-action-btn edit-task-btn" title="تعديل المهمة" aria-label="تعديل">✏️</button>
          <button class="task-action-btn delete-btn delete-task-btn" title="حذف المهمة" aria-label="حذف">🗑️</button>
        </div>
      `;

      // Event: Checkbox toggle
      const checkEl = taskItem.querySelector('.task-check');
      checkEl.addEventListener('change', () => {
        toggleTaskCompletion(task.id, checkEl.checked);
      });

      // Event: Edit task
      const editBtn = taskItem.querySelector('.edit-task-btn');
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditTaskModal(task);
      });

      // Event: Delete task
      const delBtn = taskItem.querySelector('.delete-task-btn');
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        confirmDeleteTask(task.id);
      });

      taskListEl.appendChild(taskItem);
    });
  }

  // Check if all tasks are completed
  const total = dayRecord.tasks.length;
  const completed = dayRecord.tasks.filter(t => t.completed).length;
  const is100Percent = total > 0 && completed === total;

  if (allCompletedBanner) {
    allCompletedBanner.classList.toggle('hidden', !is100Percent);
  }
}

/* ==============================================
   PROGRESS & METRICS ENGINE
   ============================================== */

function updateProgress(dayRecord) {
  const total = dayRecord.tasks.length;
  const completed = dayRecord.tasks.filter(t => t.completed).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  // 1. Hero Circular Progress
  const percentEl = document.getElementById('home-progress-percent');
  const fractionEl = document.getElementById('home-progress-fraction');
  const ringEl = document.getElementById('home-progress-ring');
  const scoreBadge = document.getElementById('home-score-badge');

  if (percentEl) percentEl.textContent = `${percent}%`;
  if (fractionEl) fractionEl.textContent = `${completed} من ${total}`;

  // Animate SVG ring (Circumference: 2 * pi * 52 = 326.72)
  if (ringEl) {
    const circumference = 326.72;
    const offset = circumference - (percent / 100) * circumference;
    ringEl.style.strokeDashoffset = offset;
  }

  // Daily Score motivational tier
  if (scoreBadge) {
    if (percent >= 90) {
      scoreBadge.textContent = '🔥 يوم ممتاز';
      scoreBadge.style.color = '#34d399';
    } else if (percent >= 70) {
      scoreBadge.textContent = '💪 يوم جيد';
      scoreBadge.style.color = '#60a5fa';
    } else if (percent >= 50) {
      scoreBadge.textContent = '👍 بداية جيدة';
      scoreBadge.style.color = '#fbbf24';
    } else {
      scoreBadge.textContent = 'غدًا أفضل 🌱';
      scoreBadge.style.color = '#94a3b8';
    }
  }

  // 2. Category Targets Breakdown
  const catSummaryEl = document.getElementById('categories-completed-summary');
  let completedCategoriesCount = 0;

  ['prayer', 'adhkar', 'quran', 'study', 'college'].forEach(catId => {
    const catTasks = dayRecord.tasks.filter(t => t.category === catId);
    const catTotal = catTasks.length;
    const catDone = catTasks.filter(t => t.completed).length;
    const catPct = catTotal > 0 ? Math.round((catDone / catTotal) * 100) : (catTotal === 0 ? 100 : 0);

    const countEl = document.getElementById(`cat-${catId}-count`);
    const pctEl = document.getElementById(`cat-${catId}-pct`);
    const fillEl = document.getElementById(`cat-${catId}-fill`);

    if (countEl) countEl.textContent = `${catDone} من ${catTotal}`;
    if (pctEl) pctEl.textContent = `${catPct}%`;
    if (fillEl) fillEl.style.width = `${catPct}%`;

    if (catTotal > 0 && catDone === catTotal) {
      completedCategoriesCount++;
    }
  });

  if (catSummaryEl) {
    catSummaryEl.textContent = `${completedCategoriesCount} من 5 فئات مكتملة`;
  }

  // Record daily metrics in day record
  dayRecord.dailyScorePercent = percent;
  dayRecord.targetMet = percent >= 80;

  saveData(STORAGE_KEYS.DAYS_DATA);

  // Update streak if today is the active day
  const isActualToday = (getActiveDayIndex() === getCurrentDayIndex());
  if (isActualToday) {
    updateStreak(dayRecord);
  }
}

/* ==============================================
   STREAK SYSTEM
   ============================================= */

function updateStreak(todayRecord) {
  const dateKey = todayRecord.date;
  const isTargetAchieved = todayRecord.targetMet || todayRecord.dailyScorePercent >= 80;

  if (isTargetAchieved) {
    if (!appState.streak.history.includes(dateKey)) {
      appState.streak.history.push(dateKey);
      appState.streak.currentStreak += 1;
      if (appState.streak.currentStreak > appState.streak.longestStreak) {
        appState.streak.longestStreak = appState.streak.currentStreak;
      }
      appState.streak.lastMetDate = dateKey;
      saveData(STORAGE_KEYS.STREAK);
    }
  }

  // Update UI Streak Badges
  renderStreakUI();
}

function renderStreakUI() {
  const current = appState.streak.currentStreak || 0;
  const longest = appState.streak.longestStreak || current;

  // Header pill
  const headerNum = document.getElementById('header-streak-num');
  if (headerNum) headerNum.textContent = current;

  // Sidebar badge
  const sidebarCount = document.getElementById('sidebar-streak-count');
  if (sidebarCount) sidebarCount.textContent = `${current} أيام`;

  // Stats view
  const statsStreak = document.getElementById('stats-current-streak');
  const statsLongest = document.getElementById('stats-longest-streak-sub');
  if (statsStreak) statsStreak.textContent = `${current} أيام`;
  if (statsLongest) statsLongest.textContent = `أطول سلسلة: ${longest} أيام`;

  // Weekly view
  const weeklyLongest = document.getElementById('weekly-longest-streak');
  if (weeklyLongest) weeklyLongest.textContent = longest;

  // Milestones (7, 14, 30, 60, 90)
  [7, 14, 30, 60, 90].forEach(milestoneDays => {
    const el = document.getElementById(`milestone-${milestoneDays}`);
    if (el) {
      const isReached = longest >= milestoneDays;
      el.classList.toggle('unlocked', isReached);
      const statusText = el.querySelector('.m-status');
      if (statusText) {
        statusText.textContent = isReached ? 'تم تحقيقه 🎉' : (current > 0 ? `${current} / ${milestoneDays}` : 'مغلق');
      }
    }
  });
}

/* ==============================================
   TASK MANAGEMENT (Add, Toggle, Edit, Delete)
   ============================================= */

function toggleTaskCompletion(taskId, isChecked) {
  const activeDayIndex = getActiveDayIndex();
  const dateKey = getDateKeyForDayOfWeek(activeDayIndex);
  const dayRecord = getDayRecord(dateKey, activeDayIndex);

  const task = dayRecord.tasks.find(t => t.id === taskId);
  if (!task) return;

  task.completed = isChecked;

  // Sound feedback
  if (isChecked) {
    playCompletionChime();
  } else {
    playTone(300, 'sine', 0.1);
  }

  // Check if this task was a Quran memo / rev task to sync with Quran banner
  if (task.quranType === 'memo' && dayRecord.quran) {
    dayRecord.quran.memo = isChecked;
  } else if (task.quranType === 'rev' && dayRecord.quran) {
    dayRecord.quran.rev = isChecked;
  }

  // Update DOM item state
  const taskItem = document.querySelector(`.task-item[data-id="${taskId}"]`);
  if (taskItem) {
    taskItem.classList.toggle('completed', isChecked);
  }

  // Check if 100% finished
  const total = dayRecord.tasks.length;
  const completed = dayRecord.tasks.filter(t => t.completed).length;

  updateProgress(dayRecord);

  if (isChecked && completed === total && total > 0) {
    triggerConfetti();
    openCelebrationModal();
  }

  renderHomePage();
}

function openAddTaskModal(preselectedDay = null) {
  const modal = document.getElementById('task-modal');
  const title = document.getElementById('task-modal-title');
  const form = document.getElementById('task-form');

  if (!modal || !form) return;

  title.textContent = 'إضافة مهمة جديدة';
  form.reset();
  document.getElementById('task-id').value = '';
  document.getElementById('task-time-input').value = '14:00';

  const daySelect = document.getElementById('task-day-select');
  if (daySelect) {
    if (preselectedDay !== null && preselectedDay !== undefined) {
      daySelect.value = String(preselectedDay);
    } else {
      daySelect.value = 'current';
    }
  }

  modal.classList.remove('hidden');
  document.getElementById('task-name-input').focus();
}

function openEditTaskModal(task, preselectedDay = null) {
  const modal = document.getElementById('task-modal');
  const title = document.getElementById('task-modal-title');

  if (!modal) return;

  title.textContent = 'تعديل المهمة';
  document.getElementById('task-id').value = task.id;
  document.getElementById('task-name-input').value = task.title;
  document.getElementById('task-time-input').value = task.time || '12:00';
  document.getElementById('task-category-select').value = task.category || 'general';

  const daySelect = document.getElementById('task-day-select');
  if (daySelect) {
    if (preselectedDay !== null && preselectedDay !== undefined) {
      daySelect.value = String(preselectedDay);
    } else {
      daySelect.value = 'current';
    }
  }

  modal.classList.remove('hidden');
}

function closeTaskModal() {
  const modal = document.getElementById('task-modal');
  if (modal) modal.classList.add('hidden');
}

function handleTaskFormSubmit(e) {
  e.preventDefault();

  const taskId = document.getElementById('task-id').value;
  const title = document.getElementById('task-name-input').value.trim();
  const time = document.getElementById('task-time-input').value;
  const category = document.getElementById('task-category-select').value;
  const chosenDayVal = document.getElementById('task-day-select').value;

  if (!title) {
    showToast('يرجى إدخال اسم المهمة', 'warn');
    return;
  }

  let targetDayIndex = getActiveDayIndex();
  if (chosenDayVal !== 'current') {
    targetDayIndex = parseInt(chosenDayVal, 10);
  }

  const dateKey = getDateKeyForDayOfWeek(targetDayIndex);
  const dayRecord = getDayRecord(dateKey, targetDayIndex);

  if (taskId) {
    // Edit existing task
    const task = dayRecord.tasks.find(t => t.id === taskId);
    if (task) {
      task.title = title;
      task.time = time;
      task.category = category;
      showToast('تم تحديث المهمة بنجاح ✏️', 'success');
    }
  } else {
    // Add new task
    const newTask = {
      id: `custom_${Date.now()}`,
      title,
      time,
      category,
      completed: false,
      isDefault: false
    };
    dayRecord.tasks.push(newTask);
    // Sort tasks chronologically
    dayRecord.tasks.sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));
    showToast(`تمت إضافة المهمة ليوم ${DAYS_NAMES_AR[targetDayIndex]} 🎯`, 'success');
  }

  saveData(STORAGE_KEYS.DAYS_DATA);
  closeTaskModal();
  renderHomePage();
  renderWeeklyView();

  // If day details modal is currently open, refresh it immediately!
  const dayModal = document.getElementById('day-details-modal');
  if (dayModal && !dayModal.classList.contains('hidden') && currentOpenDayDetailsIndex !== null) {
    const dKey = getDateKeyForDayOfWeek(currentOpenDayDetailsIndex);
    openDayDetailsModal(currentOpenDayDetailsIndex, dKey);
  }
}

function confirmDeleteTask(taskId) {
  openConfirmModal('هل أنت متأكد من حذف هذه المهمة من جدول اليوم؟', () => {
    const activeDayIndex = getActiveDayIndex();
    const dateKey = getDateKeyForDayOfWeek(activeDayIndex);
    const dayRecord = getDayRecord(dateKey, activeDayIndex);

    dayRecord.tasks = dayRecord.tasks.filter(t => t.id !== taskId);
    saveData(STORAGE_KEYS.DAYS_DATA);
    showToast('تم حذف المهمة', 'info');
    renderHomePage();
  });
}

function resetTodaySchedule() {
  openConfirmModal('هل ترغب في إعادة ضبط مهام اليوم لجدول الكلية والمستهدفات الافتراضية؟', () => {
    const activeDayIndex = getActiveDayIndex();
    const dateKey = getDateKeyForDayOfWeek(activeDayIndex);

    appState.daysData[dateKey] = {
      date: dateKey,
      dayOfWeek: activeDayIndex,
      tasks: generateDefaultTasksForDay(activeDayIndex),
      quran: { memo: false, memoNotes: '', rev: false, revNotes: '' },
      dailyScorePercent: 0,
      targetMet: false
    };

    saveData(STORAGE_KEYS.DAYS_DATA);
    showToast('تمت إعادة ضبط مهام اليوم بنجاح 🔄', 'success');
    renderHomePage();
  });
}

/* ==============================================
   VIEW 2: WEEKLY GOALS & SCHEDULE
   ============================================== */

function renderWeeklyView() {
  const daysGrid = document.getElementById('weekly-days-grid');
  if (!daysGrid) return;

  daysGrid.innerHTML = '';

  let totalWeeklyTasks = 0;
  let totalWeeklyCompleted = 0;
  let targetDaysCount = 0;
  let estimatedWeeklyStudyHours = 0;

  // Order from Friday (5) through Thursday (4)
  const orderedDays = [5, 6, 0, 1, 2, 3, 4];
  const currentActualDay = getCurrentDayIndex();

  orderedDays.forEach(dayIdx => {
    const dateKey = getDateKeyForDayOfWeek(dayIdx);
    const dayRecord = getDayRecord(dateKey, dayIdx);

    const total = dayRecord.tasks.length;
    const completed = dayRecord.tasks.filter(t => t.completed).length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const isToday = (dayIdx === currentActualDay);
    const collegeDesc = getCollegeDescription(dayIdx);

    totalWeeklyTasks += total;
    totalWeeklyCompleted += completed;
    if (pct >= 80) targetDaysCount++;

    // Calculate approximate study hours from tasks
    const studyTasksCount = dayRecord.tasks.filter(t => t.category === 'study').length;
    estimatedWeeklyStudyHours += (studyTasksCount * 1.5); // Approx 1.5h per session

    // Create Day Card
    const dayCard = document.createElement('div');
    dayCard.className = `day-card ${isToday ? 'is-today' : ''}`;
    dayCard.dataset.dayIndex = dayIdx;

    // Mini previews (first 3 tasks)
    const previewItems = dayRecord.tasks.slice(0, 3).map(t => `
      <div class="mini-preview-item ${t.completed ? 'done' : ''}">
        <span class="mini-preview-dot"></span>
        <span>${t.title}</span>
      </div>
    `).join('');

    dayCard.innerHTML = `
      <div class="day-card-header">
        <div class="day-name-tag">
          <span class="day-name">${DAYS_NAMES_AR[dayIdx]}</span>
          ${isToday ? '<span class="today-pill">اليوم</span>' : ''}
        </div>
        <span class="day-college-summary" title="${collegeDesc}">
          ${collegeDesc}
        </span>
      </div>

      <div class="day-tasks-mini-preview">
        ${previewItems || '<span style="font-size:0.75rem; color:var(--text-dim);">لا توجد مهام</span>'}
      </div>

      <div class="day-card-footer">
        <div class="day-card-stats">
          <span class="day-tasks-count">${completed} من ${total} مهام</span>
          <span class="day-percent">${pct}%</span>
        </div>
        <div class="day-progress-bar">
          <div class="day-progress-fill" style="width: ${pct}%"></div>
        </div>

        <div class="day-card-actions">
          <button class="btn btn-secondary btn-sm day-card-add-btn" title="إضافة مهمة جديدة ليوم ${DAYS_NAMES_AR[dayIdx]}">➕ إضافة هدف</button>
          <button class="btn btn-primary btn-sm day-card-manage-btn" title="إدارة وتعديل أهداف ${DAYS_NAMES_AR[dayIdx]}">إدارة وتعديل ⚙️</button>
        </div>
      </div>
    `;

    // Click on card background -> open details modal
    dayCard.addEventListener('click', (e) => {
      if (e.target.closest('.day-card-add-btn') || e.target.closest('.day-card-manage-btn')) return;
      openDayDetailsModal(dayIdx, dateKey);
    });

    // Quick add button on card
    const addBtnOnCard = dayCard.querySelector('.day-card-add-btn');
    if (addBtnOnCard) {
      addBtnOnCard.addEventListener('click', (e) => {
        e.stopPropagation();
        openAddTaskModal(dayIdx);
      });
    }

    // Manage button on card
    const manageBtnOnCard = dayCard.querySelector('.day-card-manage-btn');
    if (manageBtnOnCard) {
      manageBtnOnCard.addEventListener('click', (e) => {
        e.stopPropagation();
        openDayDetailsModal(dayIdx, dateKey);
      });
    }

    daysGrid.appendChild(dayCard);
  });

  // Weekly KPIs Summary
  const weeklyTotalTasksEl = document.getElementById('weekly-total-tasks');
  const weeklyCompletedTasksEl = document.getElementById('weekly-completed-tasks');
  const weeklyRateEl = document.getElementById('weekly-completion-rate');
  const weeklyTargetDaysEl = document.getElementById('weekly-target-days');
  const weeklyStudyHoursEl = document.getElementById('weekly-study-hours');

  if (weeklyTotalTasksEl) weeklyTotalTasksEl.textContent = totalWeeklyTasks;
  if (weeklyCompletedTasksEl) weeklyCompletedTasksEl.textContent = totalWeeklyCompleted;
  
  const weeklyAvgPct = totalWeeklyTasks > 0 ? Math.round((totalWeeklyCompleted / totalWeeklyTasks) * 100) : 0;
  if (weeklyRateEl) weeklyRateEl.textContent = `${weeklyAvgPct}%`;
  if (weeklyTargetDaysEl) weeklyTargetDaysEl.textContent = `${targetDaysCount} من 7`;
  if (weeklyStudyHoursEl) weeklyStudyHoursEl.textContent = `${Math.round(estimatedWeeklyStudyHours)} س`;
}

function openCollegeNoteModal(dayIdx) {
  const modal = document.getElementById('college-note-modal');
  const input = document.getElementById('college-note-input');
  const dayHidden = document.getElementById('college-note-day-idx');
  const title = document.getElementById('college-note-modal-title');

  if (!modal || !input) return;

  title.textContent = `تعديل جدول / ملاحظة يوم ${DAYS_NAMES_AR[dayIdx]}`;
  dayHidden.value = String(dayIdx);
  input.value = getCollegeDescription(dayIdx);

  modal.classList.remove('hidden');
  input.focus();
}

function closeCollegeNoteModal() {
  const modal = document.getElementById('college-note-modal');
  if (modal) modal.classList.add('hidden');
}

function openDayDetailsModal(dayIdx, dateKey) {
  currentOpenDayDetailsIndex = dayIdx;
  const modal = document.getElementById('day-details-modal');
  const title = document.getElementById('day-modal-title');
  const subtitle = document.getElementById('day-modal-subtitle');
  const body = document.getElementById('day-modal-body');
  const switchBtn = document.getElementById('day-modal-switch-btn');

  if (!modal || !body) return;

  const dayRecord = getDayRecord(dateKey, dayIdx);
  const total = dayRecord.tasks.length;
  const completed = dayRecord.tasks.filter(t => t.completed).length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const collegeDesc = getCollegeDescription(dayIdx);

  title.textContent = `🎯 أهداف وجدول يوم ${DAYS_NAMES_AR[dayIdx]}`;
  subtitle.textContent = `تحكم كامل في مهام ومستهدفات اليوم • ${completed} من ${total} مهام مكتملة (${pct}%)`;

  body.innerHTML = `
    <!-- Day College Banner -->
    <div class="day-college-banner">
      <div class="day-college-banner-info">
        <span style="font-size: 1.5rem;">🎓</span>
        <div class="day-college-banner-text">
          <strong>جدول الكلية / التركيز الدراسي:</strong>
          <span>${collegeDesc}</span>
        </div>
      </div>
      <button class="btn btn-secondary btn-sm" id="edit-college-desc-btn" title="تعديل جدول الكلية أو الملاحظة">
        ✏️ تعديل الجدول
      </button>
    </div>

    <!-- Management Toolbar -->
    <div class="day-modal-toolbar">
      <div class="day-modal-actions-right">
        <button class="btn btn-primary btn-sm" id="day-modal-add-task-btn">
          ➕ إضافة مهمة لهذا اليوم
        </button>
        <button class="btn btn-secondary btn-sm" id="day-modal-reset-btn" title="إعادة تعيين مهام هذا اليوم للوضع الافتراضي">
          🔄 استعادة الافتراضي
        </button>
      </div>
      <span class="badge" style="font-size:0.85rem; font-weight:700;">
        ${completed} من ${total} مكتمل (${pct}%)
      </span>
    </div>

    <!-- Progress Bar -->
    <div style="margin-bottom: 1.25rem;">
      <div class="progress-bar-bg" style="height: 8px;">
        <div class="progress-bar-fill fill-study" style="width: ${pct}%"></div>
      </div>
    </div>

    <!-- Tasks List Container -->
    <div class="day-modal-tasks-list" style="max-height: 50vh; overflow-y: auto; display: flex; flex-direction: column; gap: 0.6rem;">
      ${total === 0 ? `
        <div class="empty-state" style="padding: 2rem 1rem;">
          <span class="empty-state-icon">📋</span>
          <p class="empty-state-title">لا توجد مهام مسجلة ليوم ${DAYS_NAMES_AR[dayIdx]}</p>
          <p class="empty-state-subtitle">اضغط على زر "إضافة مهمة لهذا اليوم" بالأعلى لإضافة أهداف جديدة.</p>
        </div>
      ` : ''}
    </div>
  `;

  const tasksListContainer = body.querySelector('.day-modal-tasks-list');
  if (tasksListContainer && total > 0) {
    dayRecord.tasks.forEach(task => {
      const cat = CATEGORIES_DEF[task.category] || CATEGORIES_DEF.general;
      const taskEl = document.createElement('div');
      taskEl.className = `task-item ${task.completed ? 'completed' : ''}`;
      taskEl.dataset.id = task.id;

      taskEl.innerHTML = `
        <div class="task-right-content">
          <input type="checkbox" class="custom-checkbox day-modal-check" ${task.completed ? 'checked' : ''} aria-label="تحديد المهمة">
          <span class="task-time-badge">${task.time || '--:--'}</span>
          <div class="task-details">
            <span class="task-title">${task.title}</span>
            <div class="task-meta-row">
              <span class="task-cat-badge ${cat.badgeClass}">${cat.icon} ${cat.name}</span>
            </div>
          </div>
        </div>

        <div class="task-actions">
          <button class="task-action-btn day-modal-edit-btn" title="تعديل المهمة">✏️</button>
          <button class="task-action-btn delete-btn day-modal-delete-btn" title="حذف المهمة">🗑️</button>
        </div>
      `;

      // Checkbox event
      const chk = taskEl.querySelector('.day-modal-check');
      chk.addEventListener('change', () => {
        task.completed = chk.checked;
        if (chk.checked) playCompletionChime();
        else playTone(300, 'sine', 0.1);

        if (task.quranType === 'memo' && dayRecord.quran) dayRecord.quran.memo = chk.checked;
        if (task.quranType === 'rev' && dayRecord.quran) dayRecord.quran.rev = chk.checked;

        updateProgress(dayRecord);
        saveData(STORAGE_KEYS.DAYS_DATA);
        renderWeeklyView();
        renderHomePage();
        openDayDetailsModal(dayIdx, dateKey);
      });

      // Edit event
      const editBtn = taskEl.querySelector('.day-modal-edit-btn');
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditTaskModal(task, dayIdx);
      });

      // Delete event
      const delBtn = taskEl.querySelector('.day-modal-delete-btn');
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openConfirmModal(`هل أنت متأكد من حذف مهمة "${task.title}" من يوم ${DAYS_NAMES_AR[dayIdx]}؟`, () => {
          dayRecord.tasks = dayRecord.tasks.filter(t => t.id !== task.id);
          saveData(STORAGE_KEYS.DAYS_DATA);
          showToast('تم حذف المهمة بنجاح 🗑️', 'info');
          renderWeeklyView();
          renderHomePage();
          openDayDetailsModal(dayIdx, dateKey);
        });
      });

      tasksListContainer.appendChild(taskEl);
    });
  }

  // Hook toolbar buttons
  const addBtn = body.querySelector('#day-modal-add-task-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      openAddTaskModal(dayIdx);
    });
  }

  const editCollegeBtn = body.querySelector('#edit-college-desc-btn');
  if (editCollegeBtn) {
    editCollegeBtn.addEventListener('click', () => {
      openCollegeNoteModal(dayIdx);
    });
  }

  const resetDayBtn = body.querySelector('#day-modal-reset-btn');
  if (resetDayBtn) {
    resetDayBtn.addEventListener('click', () => {
      openConfirmModal(`هل تريد استعادة الجدول الافتراضي ليوم ${DAYS_NAMES_AR[dayIdx]}؟ سيتم إعادة تعيين كافة المهام لهذا اليوم.`, () => {
        dayRecord.tasks = generateDefaultTasksForDay(dayIdx);
        dayRecord.quran = { memo: false, memoNotes: '', rev: false, revNotes: '' };
        dayRecord.dailyScorePercent = 0;
        dayRecord.targetMet = false;
        saveData(STORAGE_KEYS.DAYS_DATA);
        showToast(`تمت استعادة الجدول الافتراضي ليوم ${DAYS_NAMES_AR[dayIdx]} 🔄`, 'success');
        renderWeeklyView();
        renderHomePage();
        openDayDetailsModal(dayIdx, dateKey);
      });
    });
  }

  // Switch to Home button
  if (switchBtn) {
    switchBtn.onclick = () => {
      appState.selectedDayIndex = dayIdx;
      const daySelectDropdown = document.getElementById('day-select-view');
      if (daySelectDropdown) daySelectDropdown.value = String(dayIdx);
      modal.classList.add('hidden');
      switchView('home');
      renderHomePage();
      showToast(`تم التبديل إلى أهداف يوم ${DAYS_NAMES_AR[dayIdx]}`, 'info');
    };
  }

  modal.classList.remove('hidden');
}

/* ==============================================
   VIEW 3: SUBJECTS & POMODORO TIMER
   ============================================== */

function renderSubjectsView() {
  const container = document.getElementById('subjects-cards-grid');
  if (!container) return;

  container.innerHTML = '';

  appState.subjects.forEach(subj => {
    const hours = (subj.totalMinutes / 60).toFixed(1);
    const targetHours = subj.targetHours || 12;
    const progressPct = Math.min(100, Math.round((hours / targetHours) * 100));

    const card = document.createElement('div');
    card.className = 'subject-card card';
    card.style.borderTop = `4px solid ${subj.color}`;

    card.innerHTML = `
      <div class="subject-header">
        <div>
          <span class="subject-code">${subj.code}</span>
          <h3 class="subject-title">${subj.name}</h3>
        </div>
      </div>

      <div class="subject-stats-list">
        <div class="subject-stat-row">
          <span class="subject-stat-label">جلسات المذاكرة:</span>
          <strong class="subject-stat-value">${subj.sessions || 0} جلسة</strong>
        </div>
        <div class="subject-stat-row">
          <span class="subject-stat-label">إجمالي وقت المذاكرة:</span>
          <strong class="subject-stat-value">${hours} ساعة (${subj.totalMinutes || 0} دقيقة)</strong>
        </div>
        <div class="subject-stat-row">
          <span class="subject-stat-label">آخر مذاكرة:</span>
          <span class="subject-stat-value" style="font-size: 0.8rem; color: var(--text-dim);">
            ${subj.lastStudied ? subj.lastStudied : 'لم تبدأ بعد'}
          </span>
        </div>
      </div>

      <div class="subject-progress-area">
        <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom: 0.25rem;">
          <span style="color:var(--text-muted);">المستهدف: ${targetHours} س</span>
          <strong>${progressPct}%</strong>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width: ${progressPct}%; background-color: ${subj.color};"></div>
        </div>
      </div>

      <button class="btn btn-secondary btn-sm subject-btn-start" data-subject-id="${subj.id}">
        ⏱️ ابدأ بومودورو لهذه المادة
      </button>
    `;

    // Quick action: start pomodoro for this subject
    const startBtn = card.querySelector('.subject-btn-start');
    startBtn.addEventListener('click', () => {
      selectSubjectForPomodoro(subj.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    container.appendChild(card);
  });
}

function selectSubjectForPomodoro(subjectId) {
  const selectEl = document.getElementById('pomo-subject-select');
  const labelEl = document.getElementById('pomo-current-subject-label');

  if (selectEl) selectEl.value = subjectId;
  appState.pomodoro.selectedSubject = subjectId;

  const subj = appState.subjects.find(s => s.id === subjectId);
  if (labelEl) {
    labelEl.textContent = subj ? `المادة: ${subj.name}` : 'اختر مادة للبدء';
  }
}

/* --- Pomodoro Logic --- */

function initPomodoroEngine() {
  const startBtn = document.getElementById('pomo-start-btn');
  const resetBtn = document.getElementById('pomo-reset-btn');
  const skipBtn = document.getElementById('pomo-skip-btn');
  const subjectSelect = document.getElementById('pomo-subject-select');
  const modeBtns = document.querySelectorAll('.pomo-mode-btn');

  if (startBtn) startBtn.addEventListener('click', togglePomodoroTimer);
  if (resetBtn) resetBtn.addEventListener('click', resetPomodoroTimer);
  if (skipBtn) skipBtn.addEventListener('click', skipPomodoroTimer);

  if (subjectSelect) {
    subjectSelect.addEventListener('change', (e) => {
      selectSubjectForPomodoro(e.target.value);
    });
  }

  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.dataset.mode;
      setPomodoroMode(mode);
    });
  });

  updatePomodoroDisplay();
}

function setPomodoroMode(mode) {
  appState.pomodoro.mode = mode;
  pausePomodoroTimer();

  if (mode === 'study') {
    appState.pomodoro.duration = 25 * 60;
  } else if (mode === 'break') {
    appState.pomodoro.duration = 5 * 60;
  } else if (mode === 'longBreak') {
    appState.pomodoro.duration = 15 * 60;
  }

  appState.pomodoro.remaining = appState.pomodoro.duration;
  updatePomodoroDisplay();
}

function togglePomodoroTimer() {
  if (appState.pomodoro.isRunning) {
    pausePomodoroTimer();
  } else {
    startPomodoroTimer();
  }
}

function startPomodoroTimer() {
  // If in study mode and no subject selected, warn gently
  if (appState.pomodoro.mode === 'study' && !appState.pomodoro.selectedSubject) {
    showToast('اختر مادة لتسجيل وقت المذاكرة لها 💡', 'warn');
  }

  appState.pomodoro.isRunning = true;
  updatePomodoroButtonsUI();

  if (appState.pomodoro.timerInterval) clearInterval(appState.pomodoro.timerInterval);

  appState.pomodoro.timerInterval = setInterval(() => {
    appState.pomodoro.remaining -= 1;

    if (appState.pomodoro.remaining <= 0) {
      clearInterval(appState.pomodoro.timerInterval);
      appState.pomodoro.isRunning = false;
      onPomodoroCompleted();
    }

    updatePomodoroDisplay();
  }, 1000);
}

function pausePomodoroTimer() {
  appState.pomodoro.isRunning = false;
  if (appState.pomodoro.timerInterval) {
    clearInterval(appState.pomodoro.timerInterval);
  }
  updatePomodoroButtonsUI();
}

function resetPomodoroTimer() {
  pausePomodoroTimer();
  appState.pomodoro.remaining = appState.pomodoro.duration;
  updatePomodoroDisplay();
}

function skipPomodoroTimer() {
  pausePomodoroTimer();
  if (appState.pomodoro.mode === 'study') {
    setPomodoroMode('break');
  } else {
    setPomodoroMode('study');
  }
  showToast('تم الانتقال للفترة التالية', 'info');
}

function updatePomodoroButtonsUI() {
  const icon = document.getElementById('pomo-play-icon');
  const text = document.getElementById('pomo-start-text');

  if (icon && text) {
    if (appState.pomodoro.isRunning) {
      icon.textContent = '⏸';
      text.textContent = 'إيقاف مؤقت';
    } else {
      icon.textContent = '▶';
      text.textContent = 'ابدأ الجلسة';
    }
  }
}

function updatePomodoroDisplay() {
  const display = document.getElementById('pomo-timer-display');
  const svgBar = document.getElementById('pomo-svg-bar');

  if (display) {
    display.textContent = formatTimeMMSS(appState.pomodoro.remaining);
  }

  if (svgBar) {
    // Circle circumference for r=95 is 2 * pi * 95 = 596.9
    const circumference = 596.9;
    const progress = (appState.pomodoro.duration - appState.pomodoro.remaining) / appState.pomodoro.duration;
    const offset = circumference - progress * circumference;
    svgBar.style.strokeDashoffset = offset;
  }
}

function onPomodoroCompleted() {
  playPomoFinishAlarm();
  triggerConfetti();

  const mode = appState.pomodoro.mode;
  const minutesAdded = Math.round(appState.pomodoro.duration / 60);

  if (mode === 'study') {
    const subjId = appState.pomodoro.selectedSubject;
    const subj = appState.subjects.find(s => s.id === subjId);

    if (subj) {
      subj.sessions = (subj.sessions || 0) + 1;
      subj.totalMinutes = (subj.totalMinutes || 0) + minutesAdded;
      subj.lastStudied = formatArabicDate(new Date());
      saveData(STORAGE_KEYS.SUBJECTS);

      showToast(`🎉 أحسنت! أتممت 25 دقيقة مذاكرة في [${subj.name}].`, 'success');
      sendBrowserNotification('انتهت جلسة المذاكرة! ⏱️', `أحسنت يا أدهم! تم تسجيل 25 دقيقة في ${subj.name}.`);
    } else {
      showToast(`🎉 انتهت جلسة التركيز (${minutesAdded} دقيقة). خذ استراحة قصيرة!`, 'success');
    }

    // Switch to break
    setPomodoroMode('break');
  } else {
    showToast('انتهت الاستراحة! لنعد إلى المذاكرة بتركيز ونشاط 🚀', 'info');
    sendBrowserNotification('انتهت الاستراحة ☕', 'حان وقت العودة لجلسة مذاكرة جديدة!');
    setPomodoroMode('study');
  }

  renderSubjectsView();
  calculateAndRenderStatistics();
}

/* ==============================================
   VIEW 4: STATISTICS & CHARTS ENGINE
   ============================================== */

function calculateAndRenderStatistics() {
  // 1. Today's rate
  const activeDayIndex = getActiveDayIndex();
  const todayKey = getDateKeyForDayOfWeek(activeDayIndex);
  const todayRecord = getDayRecord(todayKey, activeDayIndex);

  const todayTotal = todayRecord.tasks.length;
  const todayDone = todayRecord.tasks.filter(t => t.completed).length;
  const todayRate = todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0;

  const statsTodayRate = document.getElementById('stats-today-rate');
  const statsTodaySub = document.getElementById('stats-today-sub');
  if (statsTodayRate) statsTodayRate.textContent = `${todayRate}%`;
  if (statsTodaySub) statsTodaySub.textContent = `${todayDone} من ${todayTotal} مهام`;

  // 2. All time tasks completed vs missed
  let totalTasksAllTime = 0;
  let totalCompletedAllTime = 0;

  Object.values(appState.daysData).forEach(record => {
    if (record && record.tasks) {
      totalTasksAllTime += record.tasks.length;
      totalCompletedAllTime += record.tasks.filter(t => t.completed).length;
    }
  });

  const totalMissed = Math.max(0, totalTasksAllTime - totalCompletedAllTime);

  const statsTotalCompleted = document.getElementById('stats-total-completed');
  const statsTotalMissed = document.getElementById('stats-total-missed');
  if (statsTotalCompleted) statsTotalCompleted.textContent = totalCompletedAllTime;
  if (statsTotalMissed) statsTotalMissed.textContent = totalMissed;

  // 3. Total study time across all subjects
  let totalStudyMinutes = 0;
  appState.subjects.forEach(s => {
    totalStudyMinutes += (s.totalMinutes || 0);
  });
  const totalHours = Math.floor(totalStudyMinutes / 60);
  const remainingMins = totalStudyMinutes % 60;
  const statsTotalStudyTime = document.getElementById('stats-total-study-time');
  if (statsTotalStudyTime) {
    statsTotalStudyTime.textContent = `${totalHours} س ${remainingMins} د`;
  }

  // 4. Most & Least Studied Subject
  let sortedSubjs = [...appState.subjects].sort((a, b) => (b.totalMinutes || 0) - (a.totalMinutes || 0));
  const mostStudied = sortedSubjs[0];
  const leastStudied = sortedSubjs[sortedSubjs.length - 1];

  const mostEl = document.getElementById('stats-most-studied');
  const leastEl = document.getElementById('stats-least-studied');

  if (mostEl) mostEl.textContent = mostStudied ? `${mostStudied.name} (${(mostStudied.totalMinutes/60).toFixed(1)} س)` : '-';
  if (leastEl) leastEl.textContent = leastStudied ? `${leastStudied.name} (${(leastStudied.totalMinutes/60).toFixed(1)} س)` : '-';

  // 5. Weekly Bar Chart (7 days)
  renderWeeklyBarChart();

  // 6. Subject Distribution Bars
  renderSubjectDistributionBars();
}

function renderWeeklyBarChart() {
  const chartContainer = document.getElementById('weekly-bar-chart');
  if (!chartContainer) return;

  chartContainer.innerHTML = '';

  // Order from Friday (5) through Thursday (4)
  const orderedDays = [5, 6, 0, 1, 2, 3, 4];
  const currentActualDay = getCurrentDayIndex();

  let weeklySum = 0;

  orderedDays.forEach(dayIdx => {
    const dateKey = getDateKeyForDayOfWeek(dayIdx);
    const dayRecord = getDayRecord(dateKey, dayIdx);
    const total = dayRecord.tasks.length;
    const completed = dayRecord.tasks.filter(t => t.completed).length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    weeklySum += pct;

    const col = document.createElement('div');
    col.className = 'chart-bar-col';

    const isToday = (dayIdx === currentActualDay);
    const barHeight = Math.max(8, Math.round(pct * 1.5)); // max ~150px

    col.innerHTML = `
      <span class="chart-bar-val">${pct}%</span>
      <div class="chart-bar-pillar" style="height: ${barHeight}px; ${isToday ? 'background: linear-gradient(180deg, #10b981, #06b6d4);' : ''}"></div>
      <span class="chart-bar-label" style="${isToday ? 'color: var(--primary); font-weight:800;' : ''}">${DAYS_NAMES_AR[dayIdx].slice(0, 3)}</span>
    `;

    chartContainer.appendChild(col);
  });

  const weeklyAverage = Math.round(weeklySum / 7);
  const statsWeeklyRate = document.getElementById('stats-weekly-rate');
  if (statsWeeklyRate) statsWeeklyRate.textContent = `${weeklyAverage}%`;
}

function renderSubjectDistributionBars() {
  const container = document.getElementById('subject-distribution-bars');
  if (!container) return;

  container.innerHTML = '';

  const maxMinutes = Math.max(1, ...appState.subjects.map(s => s.totalMinutes || 0));

  appState.subjects.forEach(subj => {
    const mins = subj.totalMinutes || 0;
    const hours = (mins / 60).toFixed(1);
    const pct = Math.max(5, Math.round((mins / maxMinutes) * 100));

    const item = document.createElement('div');
    item.className = 'subj-dist-item';

    item.innerHTML = `
      <div class="subj-dist-info">
        <span class="subj-dist-name">${subj.name}</span>
        <span class="subj-dist-time">${hours} ساعة (${subj.sessions || 0} جلسة)</span>
      </div>
      <div class="progress-bar-bg" style="height: 7px;">
        <div class="progress-bar-fill" style="width: ${pct}%; background-color: ${subj.color};"></div>
      </div>
    `;

    container.appendChild(item);
  });
}

/* ==============================================
   VIEW 5: SETTINGS & BACKUP ENGINE
   ============================================== */

function initSettingsEngine() {
  // Theme Buttons
  const darkBtn = document.getElementById('theme-btn-dark');
  const lightBtn = document.getElementById('theme-btn-light');
  if (darkBtn) darkBtn.addEventListener('click', () => setTheme('dark'));
  if (lightBtn) lightBtn.addEventListener('click', () => setTheme('light'));

  // User Name
  const userNameInput = document.getElementById('setting-user-name');
  if (userNameInput) {
    userNameInput.value = appState.settings.userName;
    userNameInput.addEventListener('change', (e) => {
      appState.settings.userName = e.target.value.trim() || 'أدهم';
      saveData(STORAGE_KEYS.SETTINGS);
      renderHomePage();
      showToast('تم تحديث اسم المستخدم', 'success');
    });
  }

  // Bedtime
  const bedtimeInput = document.getElementById('setting-bedtime');
  if (bedtimeInput) {
    bedtimeInput.value = appState.settings.bedTime;
    bedtimeInput.addEventListener('change', (e) => {
      appState.settings.bedTime = e.target.value;
      saveData(STORAGE_KEYS.SETTINGS);
      showToast('تم تحديث موعد النوم', 'success');
    });
  }

  // Notifications Toggle
  const notifToggle = document.getElementById('setting-notifications-toggle');
  if (notifToggle) {
    notifToggle.checked = appState.settings.notificationsEnabled;
    notifToggle.addEventListener('change', (e) => {
      handleNotificationsToggle(e.target.checked);
    });
  }

  // Save Prayers
  const savePrayersBtn = document.getElementById('save-prayers-btn');
  if (savePrayersBtn) {
    savePrayersBtn.addEventListener('click', () => {
      appState.settings.prayers.fajr = document.getElementById('prayer-fajr').value;
      appState.settings.prayers.dhuhr = document.getElementById('prayer-dhuhr').value;
      appState.settings.prayers.asr = document.getElementById('prayer-asr').value;
      appState.settings.prayers.maghrib = document.getElementById('prayer-maghrib').value;
      appState.settings.prayers.isha = document.getElementById('prayer-isha').value;
      saveData(STORAGE_KEYS.SETTINGS);
      showToast('تم حفظ مواعيد الصلاة الجديدة بنجاح 🕌', 'success');
    });
  }

  // Reset Today Button
  const resetTodayBtn = document.getElementById('reset-today-btn');
  if (resetTodayBtn) {
    resetTodayBtn.addEventListener('click', resetTodaySchedule);
  }

  // Export Data JSON
  const exportBtn = document.getElementById('export-data-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportUserDataJSON);
  }

  // Import Data JSON
  const importFile = document.getElementById('import-data-file');
  if (importFile) {
    importFile.addEventListener('change', importUserDataJSON);
  }

  // Reset All (Factory Reset)
  const resetAllBtn = document.getElementById('reset-all-btn');
  if (resetAllBtn) {
    resetAllBtn.addEventListener('click', factoryResetAllData);
  }
}

function setTheme(theme) {
  appState.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  saveData(STORAGE_KEYS.THEME);

  // Update theme toggle buttons
  const darkBtn = document.getElementById('theme-btn-dark');
  const lightBtn = document.getElementById('theme-btn-light');
  const themeIcon = document.getElementById('theme-icon');

  if (darkBtn && lightBtn) {
    darkBtn.classList.toggle('active', theme === 'dark');
    lightBtn.classList.toggle('active', theme === 'light');
  }

  if (themeIcon) {
    themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
  }
}

function handleNotificationsToggle(enabled) {
  if (enabled && 'Notification' in window) {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        appState.settings.notificationsEnabled = true;
        saveData(STORAGE_KEYS.SETTINGS);
        showToast('تم تفعيل إشعارات المتصفح بنجاح 🔔', 'success');
      } else {
        appState.settings.notificationsEnabled = false;
        saveData(STORAGE_KEYS.SETTINGS);
        document.getElementById('setting-notifications-toggle').checked = false;
        showToast('تم رفض إذن الإشعارات من المتصفح', 'warn');
      }
    });
  } else {
    appState.settings.notificationsEnabled = false;
    saveData(STORAGE_KEYS.SETTINGS);
    showToast('تم إيقاف الإشعارات', 'info');
  }
}

function sendBrowserNotification(title, body) {
  if (appState.settings.notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚡</text></svg>'
    });
  }
}

function exportUserDataJSON() {
  const exportPayload = {
    appName: 'Adham Planner',
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    settings: appState.settings,
    theme: appState.theme,
    subjects: appState.subjects,
    daysData: appState.daysData,
    streak: appState.streak
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `adham_planner_backup_${getDateKey()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();

  showToast('تم تنزيل النسخة الاحتياطية بنجاح 📥', 'success');
}

function importUserDataJSON(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (imported.settings) appState.settings = imported.settings;
      if (imported.theme) setTheme(imported.theme);
      if (imported.subjects) appState.subjects = imported.subjects;
      if (imported.daysData) appState.daysData = imported.daysData;
      if (imported.streak) appState.streak = imported.streak;

      saveData();
      showToast('تمت استعادة البيانات بنجاح! 🚀', 'success');

      renderHomePage();
      renderWeeklyView();
      renderSubjectsView();
      calculateAndRenderStatistics();
    } catch (err) {
      console.error(err);
      showToast('ملف النسخة الاحتياطية غير صالح', 'warn');
    }
  };
  reader.readAsText(file);
}

function factoryResetAllData() {
  openConfirmModal('⚠️ تحذير: سيتم حذف جميع المهام والإحصائيات وساعات المذاكرة بشكل دائم. هل تريد المتابعة؟', () => {
    localStorage.clear();
    appState.subjects = JSON.parse(JSON.stringify(DEFAULT_SUBJECTS));
    appState.daysData = {};
    appState.streak = { currentStreak: 0, longestStreak: 0, lastMetDate: null, history: [] };
    saveData();

    showToast('تم مسح جميع البيانات وإعادة تعيين التطبيق', 'info');
    setTimeout(() => window.location.reload(), 800);
  });
}

/* ==============================================
   VIEW NAVIGATION & ROUTING
   ============================================== */

function switchView(viewName) {
  appState.activeView = viewName;

  // View sections
  document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
  const targetSection = document.getElementById(`view-${viewName}`);
  if (targetSection) targetSection.classList.add('active');

  // Sidebar Nav Items
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });

  // Mobile Bottom Nav Items
  document.querySelectorAll('.bottom-nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });

  // Update Page Title in Header
  const pageTitle = document.getElementById('page-title');
  const titleMap = {
    home: 'الرئيسية',
    weekly: 'الجدول الأسبوعي',
    subjects: 'المواد والمؤقت',
    statistics: 'الإحصائيات الشاملة',
    settings: 'الإعدادات'
  };
  if (pageTitle) pageTitle.textContent = titleMap[viewName] || 'مخطط أدهم';

  // Render view-specific data
  if (viewName === 'home') renderHomePage();
  if (viewName === 'weekly') renderWeeklyView();
  if (viewName === 'subjects') renderSubjectsView();
  if (viewName === 'statistics') calculateAndRenderStatistics();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ==============================================
   MODALS SYSTEM (Generic & Confirm)
   ============================================== */

let onConfirmCallback = null;

function openConfirmModal(message, callback) {
  const modal = document.getElementById('confirm-modal');
  const msgEl = document.getElementById('confirm-message');
  if (modal && msgEl) {
    msgEl.textContent = message;
    onConfirmCallback = callback;
    modal.classList.remove('hidden');
  }
}

function closeConfirmModal() {
  const modal = document.getElementById('confirm-modal');
  if (modal) modal.classList.add('hidden');
  onConfirmCallback = null;
}

function openCelebrationModal() {
  const modal = document.getElementById('celebration-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeCelebrationModal() {
  const modal = document.getElementById('celebration-modal');
  if (modal) modal.classList.add('hidden');
}

/* ==============================================
   EVENT LISTENERS & BINDINGS
   ============================================== */

function setupEventListeners() {
  // Navigation: Sidebar
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  // Navigation: Bottom Nav (Mobile)
  document.querySelectorAll('.bottom-nav-item').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  // Day Selector Dropdown (in Header)
  const daySelectView = document.getElementById('day-select-view');
  if (daySelectView) {
    daySelectView.addEventListener('change', (e) => {
      appState.selectedDayIndex = e.target.value === 'today' ? null : parseInt(e.target.value, 10);
      renderHomePage();
      if (appState.activeView === 'weekly') renderWeeklyView();
      showToast(`عرض مستهدفات يوم: ${DAYS_NAMES_AR[getActiveDayIndex()]}`, 'info');
    });
  }

  // Filter Tabs in Home Page
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      appState.taskFilter = btn.dataset.filter;
      const activeDay = getActiveDayIndex();
      const dateKey = getDateKeyForDayOfWeek(activeDay);
      renderTaskList(getDayRecord(dateKey, activeDay));
    });
  });

  // Add Task Button
  const openAddBtn = document.getElementById('open-add-task-modal-btn');
  if (openAddBtn) openAddBtn.addEventListener('click', openAddTaskModal);

  // Task Form & Modal Close
  const taskForm = document.getElementById('task-form');
  if (taskForm) taskForm.addEventListener('submit', handleTaskFormSubmit);

  const taskCloseBtn = document.getElementById('task-modal-close');
  const taskCancelBtn = document.getElementById('task-modal-cancel');
  if (taskCloseBtn) taskCloseBtn.addEventListener('click', closeTaskModal);
  if (taskCancelBtn) taskCancelBtn.addEventListener('click', closeTaskModal);

  // Day Details Modal Close
  const dayModalClose = document.getElementById('day-modal-close');
  const dayModalCloseBtn = document.getElementById('day-modal-close-btn');
  if (dayModalClose) dayModalClose.addEventListener('click', () => {
    document.getElementById('day-details-modal').classList.add('hidden');
    currentOpenDayDetailsIndex = null;
  });
  if (dayModalCloseBtn) dayModalCloseBtn.addEventListener('click', () => {
    document.getElementById('day-details-modal').classList.add('hidden');
    currentOpenDayDetailsIndex = null;
  });

  // College Note Modal Buttons
  const noteClose = document.getElementById('college-note-close');
  const noteCancel = document.getElementById('college-note-cancel');
  const noteSave = document.getElementById('college-note-save');

  if (noteClose) noteClose.addEventListener('click', closeCollegeNoteModal);
  if (noteCancel) noteCancel.addEventListener('click', closeCollegeNoteModal);
  if (noteSave) {
    noteSave.addEventListener('click', () => {
      const dayHidden = document.getElementById('college-note-day-idx');
      const dayIdx = parseInt(dayHidden.value, 10);
      const val = document.getElementById('college-note-input').value.trim();
      if (!val) {
        showToast('يرجى كتابة ملاحظة أو اسم المحاضرة', 'warn');
        return;
      }
      saveCollegeDescription(dayIdx, val);
      closeCollegeNoteModal();
      showToast(`تم حفظ جدول وملاحظة يوم ${DAYS_NAMES_AR[dayIdx]} بنجاح 🎓`, 'success');
      renderWeeklyView();
      renderHomePage();
      if (currentOpenDayDetailsIndex === dayIdx) {
        const dKey = getDateKeyForDayOfWeek(dayIdx);
        openDayDetailsModal(dayIdx, dKey);
      }
    });
  }

  // Weekly Add Task Button in view-weekly header
  const weeklyAddBtn = document.getElementById('weekly-add-task-btn');
  if (weeklyAddBtn) {
    weeklyAddBtn.addEventListener('click', () => {
      openAddTaskModal();
    });
  }

  // Confirm Modal Buttons
  const confirmClose = document.getElementById('confirm-close');
  const confirmCancel = document.getElementById('confirm-cancel-btn');
  const confirmOk = document.getElementById('confirm-ok-btn');

  if (confirmClose) confirmClose.addEventListener('click', closeConfirmModal);
  if (confirmCancel) confirmCancel.addEventListener('click', closeConfirmModal);
  if (confirmOk) confirmOk.addEventListener('click', () => {
    if (onConfirmCallback) onConfirmCallback();
    closeConfirmModal();
  });

  // Celebration Modal Close
  const celCloseBtn = document.getElementById('celebration-close-btn');
  if (celCloseBtn) celCloseBtn.addEventListener('click', closeCelebrationModal);

  // Theme Toggle Button (Header)
  const themeToggleHeader = document.getElementById('theme-toggle-btn');
  if (themeToggleHeader) {
    themeToggleHeader.addEventListener('click', () => {
      setTheme(appState.theme === 'dark' ? 'light' : 'dark');
    });
  }

  // Header Notifications Button
  const notifHeaderBtn = document.getElementById('notifications-btn');
  if (notifHeaderBtn) {
    notifHeaderBtn.addEventListener('click', () => {
      const newState = !appState.settings.notificationsEnabled;
      handleNotificationsToggle(newState);
      const notifToggle = document.getElementById('setting-notifications-toggle');
      if (notifToggle) notifToggle.checked = newState;
    });
  }

  // Quran Routine Checkboxes & Inputs in Home
  const qMemoCheck = document.getElementById('quran-memo-check');
  const qMemoNotes = document.getElementById('quran-memo-notes');
  const qRevCheck = document.getElementById('quran-rev-check');
  const qRevNotes = document.getElementById('quran-rev-notes');

  const updateQuranState = () => {
    const activeDay = getActiveDayIndex();
    const dateKey = getDateKeyForDayOfWeek(activeDay);
    const dayRecord = getDayRecord(dateKey, activeDay);

    dayRecord.quran.memo = qMemoCheck.checked;
    dayRecord.quran.memoNotes = qMemoNotes.value.trim();
    dayRecord.quran.rev = qRevCheck.checked;
    dayRecord.quran.revNotes = qRevNotes.value.trim();

    // Synchronize corresponding task items if present
    const memoTask = dayRecord.tasks.find(t => t.quranType === 'memo');
    if (memoTask) memoTask.completed = qMemoCheck.checked;

    const revTask = dayRecord.tasks.find(t => t.quranType === 'rev');
    if (revTask) revTask.completed = qRevCheck.checked;

    saveData(STORAGE_KEYS.DAYS_DATA);
    renderHomePage();
  };

  if (qMemoCheck) qMemoCheck.addEventListener('change', updateQuranState);
  if (qMemoNotes) qMemoNotes.addEventListener('blur', updateQuranState);
  if (qRevCheck) qRevCheck.addEventListener('change', updateQuranState);
  if (qRevNotes) qRevNotes.addEventListener('blur', updateQuranState);

  // Close modals on overlay backdrop click
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
  });
}

/* ==============================================
   INITIALIZATION
   ============================================== */

function initializeApp() {
  console.log('⚡ Initializing Adham Planner...');

  // 1. Load data from LocalStorage
  loadData();

  // 2. Set Theme
  setTheme(appState.theme || 'dark');

  // 3. Set Current Date Header
  const dateBadgeText = document.getElementById('current-date-text');
  if (dateBadgeText) {
    dateBadgeText.textContent = formatArabicDate(new Date());
  }

  // 4. Ensure today's record exists
  const todayKey = getDateKey();
  getDayRecord(todayKey, getCurrentDayIndex());

  // 5. Setup event listeners
  setupEventListeners();

  // 6. Setup Pomodoro & Settings
  initPomodoroEngine();
  initSettingsEngine();

  // 7. Render initial views
  renderStreakUI();
  switchView('home');

  console.log('✅ Adham Planner Ready!');
}

// Start app once DOM content is loaded
document.addEventListener('DOMContentLoaded', initializeApp);
