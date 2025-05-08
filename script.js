document.addEventListener('DOMContentLoaded', () => {
   // --- STATE ---
   let goals = [];
   let newHabitNames = {}; // { goalId: 'habit name string' } - not strictly needed as we read from DOM
   let expandedGoalId = null;
   let viewingHabitHistoryId = null;

   // --- DOM Elements ---
   const newGoalNameInput = document.getElementById('newGoalName');
   const newGoalTargetDaysInput = document.getElementById('newGoalTargetDays');
   const addGoalButton = document.getElementById('addGoalButton');
   const goalsListContainer = document.getElementById('goalsListContainer');
   const noGoalsMessage = document.getElementById('noGoalsMessage');
   const currentYearSpan = document.getElementById('currentYear');

   const goalItemTemplate = document.getElementById('goalItemTemplate');
   const habitItemTemplate = document.getElementById('habitItemTemplate');

   // --- ICONS (SVG Strings) ---
   // (Replace these with actual SVG content from Lucide)
   const ICONS = {
       TARGET: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
       PLUS: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
       TRASH: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`,
       CHEVRON_RIGHT: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,
       CHEVRON_DOWN: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
       CHECK_CIRCLE: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
       X_CIRCLE: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
       ZAP: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2z"/></svg>`,
       CALENDAR_DAYS: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>`,
       REPEAT: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2.1l4 4-4 4"/><path d="M3 12.2v-2a4 4 0 0 1 4-4h12.8M7 21.9l-4-4 4-4"/><path d="M21 11.8v2a4 4 0 0 1-4 4H4.2"/></svg>`,
   };

   function setIcons() {
       document.querySelectorAll('.icon-target').forEach(el => el.innerHTML = ICONS.TARGET);
       document.querySelectorAll('.icon-target-large').forEach(el => el.innerHTML = ICONS.TARGET); // Using same for now
       document.querySelectorAll('.icon-plus').forEach(el => el.innerHTML = ICONS.PLUS);
       document.querySelectorAll('.icon-plus-small').forEach(el => el.innerHTML = ICONS.PLUS);
       document.querySelectorAll('.icon-trash').forEach(el => el.innerHTML = ICONS.TRASH);
       document.querySelectorAll('.icon-trash-small').forEach(el => el.innerHTML = ICONS.TRASH);
       document.querySelectorAll('.icon-chevron-right').forEach(el => el.innerHTML = ICONS.CHEVRON_RIGHT);
       document.querySelectorAll('.icon-chevron-down').forEach(el => el.innerHTML = ICONS.CHEVRON_DOWN);
       document.querySelectorAll('.icon-check-circle').forEach(el => el.innerHTML = ICONS.CHECK_CIRCLE);
       document.querySelectorAll('.icon-x-circle').forEach(el => el.innerHTML = ICONS.X_CIRCLE);
       document.querySelectorAll('.icon-zap').forEach(el => el.innerHTML = ICONS.ZAP);
       document.querySelectorAll('.icon-calendar-days').forEach(el => el.innerHTML = ICONS.CALENDAR_DAYS);
       document.querySelectorAll('.icon-repeat').forEach(el => el.innerHTML = ICONS.REPEAT);
   }


   // --- Helper Functions ---
   const getTodayDateString = () => {
       const today = new Date();
       const year = today.getFullYear();
       const month = String(today.getMonth() + 1).padStart(2, '0');
       const day = String(today.getDate()).padStart(2, '0');
       return `${year}-${month}-${day}`;
   };

   const calculateStreak = (completedDates, todayString) => {
       if (!completedDates || completedDates.length === 0) return 0;

       const sortedDates = [...completedDates].sort((a, b) => new Date(b) - new Date(a));
       let currentStreak = 0;
       const today = new Date(todayString);
       today.setHours(0, 0, 0, 0);

       let lastDateInStreak = null;

       if (sortedDates[0] === todayString) {
           currentStreak = 1;
           lastDateInStreak = new Date(sortedDates[0]);
       } else {
           const yesterday = new Date(today);
           yesterday.setDate(today.getDate() - 1);
           if (sortedDates[0] === yesterday.toISOString().split('T')[0]) {
               currentStreak = 1;
               lastDateInStreak = new Date(sortedDates[0]);
           } else {
               return 0;
           }
       }
       if (lastDateInStreak) lastDateInStreak.setHours(0,0,0,0);


       for (let i = 1; i < sortedDates.length; i++) {
           const currentDate = new Date(sortedDates[i]);
           currentDate.setHours(0,0,0,0);
           
           const expectedPreviousDate = new Date(lastDateInStreak);
           expectedPreviousDate.setDate(lastDateInStreak.getDate() - 1);
           expectedPreviousDate.setHours(0,0,0,0);

           if (currentDate.getTime() === expectedPreviousDate.getTime()) {
               currentStreak++;
               lastDateInStreak = currentDate;
           } else {
               break;
           }
       }
       return currentStreak;
   };

   // --- Local Storage ---
   const loadGoalsFromLocalStorage = () => {
       console.log("Attempting to load goals from local storage...");
       try {
           const storedGoals = localStorage.getItem('goalsAppGoals');
           if (storedGoals) {
               const parsedGoals = JSON.parse(storedGoals);
               console.log("Loaded goals from storage:", parsedGoals);
               const todayStr = getTodayDateString();
               goals = parsedGoals.map(goal => {
                   const goalHabits = goal.habits || [];
                   const updatedHabits = goalHabits.map(habit => {
                       const habitCompletedDates = habit.completedDates || [];
                       const streak = calculateStreak(habitCompletedDates, todayStr);
                       return {
                           ...habit,
                           completedDates: habitCompletedDates,
                           streak: streak,
                           isCompletedToday: habitCompletedDates.includes(todayStr),
                       };
                   });
                   const uniqueCompletionDaysForGoal = new Set();
                   updatedHabits.forEach(h => {
                       (h.completedDates || []).forEach(d => uniqueCompletionDaysForGoal.add(d));
                   });
                   return {
                       ...goal,
                       habits: updatedHabits,
                       daysAchieved: uniqueCompletionDaysForGoal.size,
                       targetDays: parseInt(goal.targetDays, 10) || 0,
                   };
               });
               console.log("Processed and set goals state:", goals);
           } else {
               console.log("No goals found in local storage.");
               goals = [];
           }
       } catch (error) {
           console.error("Failed to load goals from local storage:", error);
           goals = [];
       }
   };

   const saveGoalsToLocalStorage = () => {
       if (goals.length > 0) {
           console.log("Saving goals to local storage:", goals);
           try {
               localStorage.setItem('goalsAppGoals', JSON.stringify(goals));
           } catch (error) {
               console.error("Failed to save goals to local storage:", error);
           }
       } else if (localStorage.getItem('goalsAppGoals')) {
           console.log("Clearing goals from local storage as goals array is empty.");
           localStorage.removeItem('goalsAppGoals');
       }
   };

   // --- Rendering Functions ---
   const renderGoals = () => {
       goalsListContainer.innerHTML = ''; // Clear previous goals

       if (goals.length === 0) {
           noGoalsMessage.style.display = 'block';
           const goalsTitle = document.querySelector('.goals-title');
           if (goalsTitle) goalsTitle.remove();
           return;
       }

       noGoalsMessage.style.display = 'none';
       if (!document.querySelector('.goals-title')) {
           const h2 = document.createElement('h2');
           h2.className = 'goals-title';
           h2.textContent = 'Your Goals';
           goalsListContainer.parentNode.insertBefore(h2, goalsListContainer);
       }


       goals.forEach(goal => {
           const goalElement = document.importNode(goalItemTemplate.content, true).firstElementChild;
           goalElement.dataset.goalId = goal.id;

           const goalNameEl = goalElement.querySelector('.goal-name');
           goalNameEl.textContent = goal.name;

           const goalProgressTextEl = goalElement.querySelector('.goal-progress-text');
           goalProgressTextEl.textContent = `${goal.daysAchieved} / ${goal.targetDays} days`;

           const progressBarEl = goalElement.querySelector('.goal-progress-bar');
           const progressPercentage = goal.targetDays > 0 ? Math.min(100, (goal.daysAchieved / goal.targetDays) * 100) : 0;
           progressBarEl.style.width = `${progressPercentage}%`;

           if (goal.daysAchieved >= goal.targetDays && goal.targetDays > 0) {
               goalNameEl.classList.add('completed');
               goalProgressTextEl.classList.add('completed');
               progressBarEl.classList.add('completed');
           }

           const expandToggle = goalElement.querySelector('.goal-expand-toggle');
           const chevronRight = expandToggle.querySelector('.icon-chevron-right');
           const chevronDown = expandToggle.querySelector('.icon-chevron-down');
           const goalDetailsDiv = goalElement.querySelector('.goal-details');

           if (expandedGoalId === goal.id) {
               goalDetailsDiv.style.display = 'block';
               chevronRight.style.display = 'none';
               chevronDown.style.display = 'inline-block';
               expandToggle.setAttribute('aria-label', 'Collapse goal');
               renderHabitsForGoal(goal, goalElement);
           } else {
               goalDetailsDiv.style.display = 'none';
               chevronRight.style.display = 'inline-block';
               chevronDown.style.display = 'none';
               expandToggle.setAttribute('aria-label', 'Expand goal');
           }
           
           goalElement.querySelector('.goal-name-placeholder').textContent = goal.name;

           goalsListContainer.appendChild(goalElement);
       });
       setIcons(); // Re-apply icons after rendering
   };

   const renderHabitsForGoal = (goal, goalElement) => {
       const habitListDiv = goalElement.querySelector('.habit-list');
       const noHabitsMsg = goalElement.querySelector('.no-habits-message');
       habitListDiv.innerHTML = ''; // Clear previous habits

       if (!goal.habits || goal.habits.length === 0) {
           noHabitsMsg.style.display = 'block';
           return;
       }
       noHabitsMsg.style.display = 'none';

       goal.habits.forEach(habit => {
           const habitElement = document.importNode(habitItemTemplate.content, true).firstElementChild;
           habitElement.dataset.habitId = habit.id;

           const habitNameEl = habitElement.querySelector('.habit-name');
           habitNameEl.textContent = habit.name;

           const toggleButton = habitElement.querySelector('.habit-toggle-completion');
           const xCircleIcon = toggleButton.querySelector('.icon-x-circle');
           const checkCircleIcon = toggleButton.querySelector('.icon-check-circle');

           if (habit.isCompletedToday) {
               toggleButton.classList.add('completed');
               habitNameEl.classList.add('completed');
               toggleButton.setAttribute('aria-label', 'Mark as incomplete');
               xCircleIcon.style.display = 'none';
               checkCircleIcon.style.display = 'inline-block';
           } else {
               toggleButton.classList.remove('completed');
               habitNameEl.classList.remove('completed');
               toggleButton.setAttribute('aria-label', 'Mark as complete');
               xCircleIcon.style.display = 'inline-block';
               checkCircleIcon.style.display = 'none';
           }

           habitElement.querySelector('.streak-count').textContent = habit.streak;

           const historyButton = habitElement.querySelector('.view-history-button .icon-repeat');
           const historyDetailsDiv = habitElement.querySelector('.habit-history-details');

           if (viewingHabitHistoryId === habit.id) {
               historyDetailsDiv.style.display = 'block';
               historyButton.classList.add('expanded');
               renderHabitHistory(habit, habitElement);
           } else {
               historyDetailsDiv.style.display = 'none';
               historyButton.classList.remove('expanded');
           }
           
           habitListDiv.appendChild(habitElement);
       });
   };

   const renderHabitHistory = (habit, habitElement) => {
       const historyDetailsDiv = habitElement.querySelector('.habit-history-details');
       historyDetailsDiv.querySelector('.habit-created-at').textContent = new Date(habit.createdAt).toLocaleDateString();
       historyDetailsDiv.querySelector('.habit-total-completions').textContent = (habit.completedDates || []).length;

       const historyListUl = historyDetailsDiv.querySelector('.history-list');
       const noCompletionsMsg = historyDetailsDiv.querySelector('.no-completions-message');
       historyListUl.innerHTML = '';

       const completedDates = habit.completedDates || [];
       if (completedDates.length > 0) {
           noCompletionsMsg.style.display = 'none';
           historyListUl.style.display = 'block';
           const todayStr = getTodayDateString();
           [...completedDates]
               .sort((a, b) => new Date(b) - new Date(a))
               .forEach(date => {
                   const li = document.createElement('li');
                   li.textContent = new Date(date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
                   if (date === todayStr) {
                       const todaySpan = document.createElement('span');
                       todaySpan.className = 'today-marker';
                       todaySpan.textContent = '(Today)';
                       li.appendChild(todaySpan);
                   }
                   historyListUl.appendChild(li);
               });
       } else {
           noCompletionsMsg.style.display = 'block';
           historyListUl.style.display = 'none';
       }
   };


   // --- Event Handlers ---
   const handleAddGoal = () => {
       const name = newGoalNameInput.value.trim();
       const targetDays = parseInt(newGoalTargetDaysInput.value, 10);

       if (name === '' || !targetDays || targetDays <= 0) {
           alert("Goal name cannot be empty and target days must be a positive number.");
           return;
       }

       const newGoal = {
           id: `goal_${Date.now()}`,
           name: name,
           targetDays: targetDays,
           habits: [],
           daysAchieved: 0,
           createdAt: getTodayDateString(),
       };
       console.log("Adding new goal:", newGoal);
       goals = [newGoal, ...goals]; // Add to the beginning
       
       newGoalNameInput.value = '';
       newGoalTargetDaysInput.value = '';
       
       saveGoalsToLocalStorage();
       renderGoals();
   };

   const handleDeleteGoal = (goalId) => {
       console.log("Attempting to delete goal with ID:", goalId);
       if (window.confirm("Are you sure you want to delete this goal and all its habits?")) {
           goals = goals.filter(goal => goal.id !== goalId);
           if (expandedGoalId === goalId) {
               expandedGoalId = null;
           }
           saveGoalsToLocalStorage();
           renderGoals();
       }
   };

   const handleToggleExpandGoal = (goalId) => {
       expandedGoalId = expandedGoalId === goalId ? null : goalId;
       viewingHabitHistoryId = null; // Close habit history when toggling goal
       renderGoals();
   };

   const handleAddHabitToGoal = (goalId, habitNameInput) => {
       const habitName = habitNameInput.value.trim();
       if (habitName === '') {
           alert("Habit name cannot be empty!");
           return;
       }
       const newHabit = {
           id: `habit_${Date.now()}`,
           name: habitName,
           completedDates: [],
           createdAt: getTodayDateString(),
           isCompletedToday: false,
           streak: 0,
       };
       
       goals = goals.map(goal => {
           if (goal.id === goalId) {
               return { ...goal, habits: [newHabit, ...(goal.habits || [])] };
           }
           return goal;
       });
       
       habitNameInput.value = ''; // Clear input
       saveGoalsToLocalStorage();
       renderGoals(); // Could optimize to re-render only the affected goal
   };

   const handleToggleHabitCompletion = (goalId, habitId) => {
       const todayStr = getTodayDateString();
       let goalChanged = false;

       goals = goals.map(goal => {
           if (goal.id === goalId) {
               let habitActuallyChanged = false;
               const updatedHabits = (goal.habits || []).map(habit => {
                   if (habit.id === habitId) {
                       habitActuallyChanged = true;
                       const completedDates = habit.completedDates || [];
                       let newCompletedDates;
                       let newIsCompletedToday;

                       if (completedDates.includes(todayStr)) {
                           newCompletedDates = completedDates.filter(date => date !== todayStr);
                           newIsCompletedToday = false;
                       } else {
                           newCompletedDates = [...completedDates, todayStr];
                           newIsCompletedToday = true;
                       }
                       const newStreak = calculateStreak(newCompletedDates, todayStr);
                       return { ...habit, completedDates: newCompletedDates, isCompletedToday: newIsCompletedToday, streak: newStreak };
                   }
                   return habit;
               });

               if (habitActuallyChanged) {
                   goalChanged = true;
                   const uniqueCompletionDaysForGoal = new Set();
                   updatedHabits.forEach(h => {
                       (h.completedDates || []).forEach(d => uniqueCompletionDaysForGoal.add(d));
                   });
                   return { ...goal, habits: updatedHabits, daysAchieved: uniqueCompletionDaysForGoal.size };
               }
           }
           return goal;
       });
       
       if (goalChanged) {
           saveGoalsToLocalStorage();
           renderGoals(); // Could optimize
       }
   };

   const handleDeleteHabitFromGoal = (goalId, habitId) => {
       if (window.confirm("Are you sure you want to delete this habit?")) {
           let goalChanged = false;
           goals = goals.map(goal => {
               if (goal.id === goalId) {
                   const originalHabitCount = (goal.habits || []).length;
                   const updatedHabits = (goal.habits || []).filter(habit => habit.id !== habitId);
                   
                   if (originalHabitCount !== updatedHabits.length) {
                       goalChanged = true;
                       const uniqueCompletionDaysForGoal = new Set();
                       updatedHabits.forEach(h => {
                           (h.completedDates || []).forEach(d => uniqueCompletionDaysForGoal.add(d));
                       });
                       return { ...goal, habits: updatedHabits, daysAchieved: uniqueCompletionDaysForGoal.size };
                   }
               }
               return goal;
           });

           if (goalChanged) {
               if (viewingHabitHistoryId === habitId) {
                   viewingHabitHistoryId = null;
               }
               saveGoalsToLocalStorage();
               renderGoals(); // Could optimize
           }
       }
   };

   const handleToggleHabitHistory = (habitId) => {
       viewingHabitHistoryId = viewingHabitHistoryId === habitId ? null : habitId;
       renderGoals(); // Re-render to show/hide history. Could optimize.
   };


   // --- Event Listeners Setup ---
   addGoalButton.addEventListener('click', handleAddGoal);
   newGoalNameInput.addEventListener('keypress', (e) => {
       if (e.key === 'Enter') handleAddGoal();
   });
   newGoalTargetDaysInput.addEventListener('keypress', (e) => {
       if (e.key === 'Enter') handleAddGoal();
   });


   // Event delegation for dynamic content
   goalsListContainer.addEventListener('click', (event) => {
       const target = event.target;
       const goalItem = target.closest('.goal-item');
       if (!goalItem) return;
       const goalId = goalItem.dataset.goalId;

       // Expand/Collapse Goal
       if (target.closest('.goal-expand-toggle')) {
           handleToggleExpandGoal(goalId);
       }
       // Delete Goal
       else if (target.closest('.delete-goal-button')) {
           handleDeleteGoal(goalId);
       }
       // Add Habit
       else if (target.closest('.add-habit-button')) {
           const habitNameInput = goalItem.querySelector('.new-habit-name');
           handleAddHabitToGoal(goalId, habitNameInput);
       }
       // Handle keypress for add habit input
       else if (target.classList.contains('new-habit-name') && event.type === 'keypress' && event.key === 'Enter') {
            const habitNameInput = target; // event.target is the input
            handleAddHabitToGoal(goalId, habitNameInput);
       }

       // Habit-specific actions
       const habitItem = target.closest('.habit-item');
       if (habitItem) {
           const habitId = habitItem.dataset.habitId;
           // Toggle Habit Completion
           if (target.closest('.habit-toggle-completion')) {
               handleToggleHabitCompletion(goalId, habitId);
           }
           // Delete Habit
           else if (target.closest('.delete-habit-button')) {
               handleDeleteHabitFromGoal(goalId, habitId);
           }
           // View Habit History
           else if (target.closest('.view-history-button')) {
               handleToggleHabitHistory(habitId);
           }
       }
   });
    // Add keypress listener for new habit name inputs using delegation too
   goalsListContainer.addEventListener('keypress', (event) => {
       const target = event.target;
       if (target.classList.contains('new-habit-name') && event.key === 'Enter') {
           const goalItem = target.closest('.goal-item');
           if (goalItem) {
               const goalId = goalItem.dataset.goalId;
               handleAddHabitToGoal(goalId, target); // target is the input
           }
       }
   });


   // --- Initial Load ---
   if (currentYearSpan) {
       currentYearSpan.textContent = new Date().getFullYear();
   }
   setIcons(); // Initial icon setup for static parts
   loadGoalsFromLocalStorage();
   renderGoals();
});