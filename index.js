import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, CheckCircle, XCircle, Zap, CalendarDays, Repeat, Target, ChevronDown, ChevronRight } from 'lucide-react';

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const App = () => {
  // State for goals: array of goal objects
  const [goals, setGoals] = useState([]);
  // State for the input field for new goal name
  const [newGoalName, setNewGoalName] = useState('');
  // State for the input field for new goal target days
  const [newGoalTargetDays, setNewGoalTargetDays] = useState('');
  // State for managing input for new habits within each goal { goalId: 'habit name' }
  const [newHabitNames, setNewHabitNames] = useState({});
  // State to manage which goal's habits are shown
  const [expandedGoalId, setExpandedGoalId] = useState(null);
  // State to manage which habit's history is shown
  const [viewingHabitHistoryId, setViewingHabitHistoryId] = useState(null); // Stores habit.id

  // --- Streak Calculation ---
  // Memoized function to calculate streak. Stable due to empty dependency array.
  const calculateStreak = useCallback((completedDates, todayString) => {
    if (!completedDates || completedDates.length === 0) return 0;
    
    const sortedDates = [...completedDates].sort((a, b) => new Date(b) - new Date(a));
    let currentStreak = 0;
    const today = new Date(todayString);
    today.setHours(0, 0, 0, 0);

    let lastDateInStreak = null;

    // Check if completed today
    if (sortedDates[0] === todayString) { 
      currentStreak = 1;
      lastDateInStreak = new Date(sortedDates[0]);
    } else { // Not completed today, check if completed yesterday
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      if (sortedDates[0] === yesterday.toISOString().split('T')[0]) {
        currentStreak = 1;
        lastDateInStreak = new Date(sortedDates[0]);
      } else {
        return 0; // Streak is 0 if not completed today or yesterday
      }
    }
    lastDateInStreak.setHours(0,0,0,0); // Normalize time for comparison

    // Iterate through the rest of the sorted dates to count consecutive days
    for (let i = 1; i < sortedDates.length; i++) {
      const currentDate = new Date(sortedDates[i]);
      currentDate.setHours(0,0,0,0); // Normalize time
      
      const expectedPreviousDate = new Date(lastDateInStreak);
      expectedPreviousDate.setDate(lastDateInStreak.getDate() - 1); // Expected date is one day before the last date in streak
      expectedPreviousDate.setHours(0,0,0,0); // Normalize time

      if (currentDate.getTime() === expectedPreviousDate.getTime()) {
        currentStreak++;
        lastDateInStreak = currentDate; // Update last date in streak
      } else {
        break; // Streak broken
      }
    }
    return currentStreak;
  }, []);


  // --- Local Storage Effects ---
  useEffect(() => {
    console.log("Attempting to load goals from local storage...");
    try {
      const storedGoals = localStorage.getItem('goalsAppGoals');
      if (storedGoals) {
        const parsedGoals = JSON.parse(storedGoals);
        console.log("Loaded goals from storage:", parsedGoals);
        const todayStr = getTodayDateString();
        const updatedGoals = parsedGoals.map(goal => {
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
        setGoals(updatedGoals);
        console.log("Processed and set goals state:", updatedGoals);
      } else {
        console.log("No goals found in local storage.");
      }
    } catch (error) {
      console.error("Failed to load goals from local storage:", error);
      setGoals([]); // Reset to empty array on error
    }
  }, [calculateStreak]); // calculateStreak is stable due to useCallback([])

  useEffect(() => {
    // Avoid saving an empty goals array if it was initially empty and nothing changed.
    // Only save if goals array has content, or if it becomes empty after having content.
    if (goals.length > 0) { 
        console.log("Saving goals to local storage:", goals);
        try {
            localStorage.setItem('goalsAppGoals', JSON.stringify(goals));
        } catch (error) {
            console.error("Failed to save goals to local storage:", error);
        }
    } else if (localStorage.getItem('goalsAppGoals')) { 
        // This condition means goals is empty, but there was something in localStorage.
        // This handles the case where all goals are deleted.
        console.log("Clearing goals from local storage as goals array is empty.");
        localStorage.removeItem('goalsAppGoals');
    }
  }, [goals]);

  // --- Goal Management Functions ---
  const addGoal = () => {
    if (newGoalName.trim() === '' || !newGoalTargetDays || parseInt(newGoalTargetDays, 10) <= 0) {
      alert("Goal name cannot be empty and target days must be a positive number.");
      return;
    }
    const newGoal = {
      id: `goal_${Date.now()}`,
      name: newGoalName.trim(),
      targetDays: parseInt(newGoalTargetDays, 10),
      habits: [], // Initialize with an empty array of habits
      daysAchieved: 0,
      createdAt: getTodayDateString(),
    };
    console.log("Adding new goal:", newGoal);
    setGoals(prevGoals => [newGoal, ...prevGoals]);
    setNewGoalName('');
    setNewGoalTargetDays('');
  };

  const deleteGoal = (goalId) => {
    console.log("Attempting to delete goal with ID:", goalId);
    if (window.confirm("Are you sure you want to delete this goal and all its habits?")) {
      console.log("User confirmed deletion for goal ID:", goalId);
      setGoals(prevGoals => {
        const newGoals = prevGoals.filter(goal => goal.id !== goalId);
        console.log("Previous goals count:", prevGoals.length, "New goals count:", newGoals.length);
        return newGoals;
      });
      if (expandedGoalId === goalId) { // If the deleted goal was expanded, collapse it
        setExpandedGoalId(null);
      }
    } else {
      console.log("User cancelled deletion for goal ID:", goalId);
    }
  };

  const toggleExpandGoal = (goalId) => {
    setExpandedGoalId(prevId => (prevId === goalId ? null : goalId));
    setViewingHabitHistoryId(null); // Close any open habit history when toggling goal
  };

  // --- Habit Management Functions ---
  const addHabitToGoal = (goalId) => {
    const habitName = (newHabitNames[goalId] || '').trim();
    if (habitName === '') {
      alert("Habit name cannot be empty!");
      return;
    }
    const newHabit = {
      id: `habit_${Date.now()}`,
      name: habitName,
      completedDates: [], // Initialize with empty array
      createdAt: getTodayDateString(),
      isCompletedToday: false,
      streak: 0,
    };
    console.log("Adding new habit:", newHabit, "to goal ID:", goalId);
    setGoals(prevGoals => prevGoals.map(goal => {
      if (goal.id === goalId) {
        // Add new habit to the beginning of the habits array for this goal
        return { ...goal, habits: [newHabit, ...(goal.habits || [])] };
      }
      return goal;
    }));
    setNewHabitNames(prev => ({ ...prev, [goalId]: '' })); // Clear input for that goal
  };

  const toggleHabitCompletion = (goalId, habitId) => {
    const todayStr = getTodayDateString();
    console.log("Toggling completion for habit ID:", habitId, "in goal ID:", goalId);
    setGoals(prevGoals => prevGoals.map(goal => {
      if (goal.id === goalId) {
        let habitChanged = false;
        const updatedHabits = (goal.habits || []).map(habit => {
          if (habit.id === habitId) {
            habitChanged = true;
            const completedDates = habit.completedDates || [];
            let newCompletedDates;
            let newIsCompletedToday;

            if (completedDates.includes(todayStr)) { // If already completed, unmark
              newCompletedDates = completedDates.filter(date => date !== todayStr);
              newIsCompletedToday = false;
            } else { // If not completed, mark as completed
              newCompletedDates = [...completedDates, todayStr];
              newIsCompletedToday = true;
            }
            const newStreak = calculateStreak(newCompletedDates, todayStr);
            return { ...habit, completedDates: newCompletedDates, isCompletedToday: newIsCompletedToday, streak: newStreak };
          }
          return habit;
        });

        if (habitChanged) {
          // Recalculate daysAchieved for the goal based on unique completion days of its habits
          const uniqueCompletionDaysForGoal = new Set();
          updatedHabits.forEach(h => {
            (h.completedDates || []).forEach(d => uniqueCompletionDaysForGoal.add(d));
          });
          console.log("Goal ID:", goalId, "updated daysAchieved to:", uniqueCompletionDaysForGoal.size);
          return { ...goal, habits: updatedHabits, daysAchieved: uniqueCompletionDaysForGoal.size };
        }
      }
      return goal;
    }));
  };

  const deleteHabitFromGoal = (goalId, habitId) => {
    console.log("Attempting to delete habit ID:", habitId, "from goal ID:", goalId);
    if (window.confirm("Are you sure you want to delete this habit?")) {
      console.log("User confirmed deletion for habit ID:", habitId);
      setGoals(prevGoals => prevGoals.map(goal => {
        if (goal.id === goalId) {
          const originalHabitCount = (goal.habits || []).length;
          const updatedHabits = (goal.habits || []).filter(habit => habit.id !== habitId);
          console.log("Goal ID:", goalId, "- Previous habit count:", originalHabitCount, "New habit count:", updatedHabits.length);
          
          // Recalculate daysAchieved for the goal
          const uniqueCompletionDaysForGoal = new Set();
          updatedHabits.forEach(h => {
            (h.completedDates || []).forEach(d => uniqueCompletionDaysForGoal.add(d));
          });
          console.log("Goal ID:", goalId, "recalculated daysAchieved to:", uniqueCompletionDaysForGoal.size, "after deleting habit.");
          return { ...goal, habits: updatedHabits, daysAchieved: uniqueCompletionDaysForGoal.size };
        }
        return goal;
      }));
      if (viewingHabitHistoryId === habitId) { // If the deleted habit's history was open, close it
        setViewingHabitHistoryId(null);
      }
    } else {
      console.log("User cancelled deletion for habit ID:", habitId);
    }
  };
  
  const handleNewHabitNameChange = (goalId, value) => {
    setNewHabitNames(prev => ({ ...prev, [goalId]: value }));
  };

  const toggleHabitHistory = (habitId) => {
    setViewingHabitHistoryId(prevId => (prevId === habitId ? null : habitId));
  };

  // --- JSX Structure ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 sm:p-6 md:p-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-pink-500">
            Goal-Oriented Habit Tracker
          </h1>
          <p className="text-slate-400 mt-2 text-lg">Define your goals, build your habits, achieve success.</p>
        </header>

        {/* Add Goal Form */}
        <div className="mb-10 p-6 bg-slate-800 rounded-xl shadow-2xl">
          <h2 className="text-2xl font-semibold mb-4 text-violet-400 flex items-center gap-2"><Target size={28}/> Add New Goal</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <input
              type="text"
              value={newGoalName}
              onChange={(e) => setNewGoalName(e.target.value)}
              placeholder="e.g., Learn a new language"
              className="sm:col-span-2 p-3 bg-slate-700 text-white rounded-lg border-2 border-slate-600 focus:border-violet-500 focus:ring-violet-500 outline-none transition-colors"
            />
            <input
              type="number"
              value={newGoalTargetDays}
              onChange={(e) => setNewGoalTargetDays(e.target.value)}
              placeholder="Target Days (e.g., 90)"
              min="1"
              className="p-3 bg-slate-700 text-white rounded-lg border-2 border-slate-600 focus:border-violet-500 focus:ring-violet-500 outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              onClick={addGoal}
              className="sm:col-span-3 mt-2 sm:mt-0 flex items-center justify-center gap-2 p-3 bg-violet-500 hover:bg-violet-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105"
            >
              <Plus size={20} />
              Create Goal
            </button>
          </div>
        </div>

        {/* Goal List */}
        {goals.length === 0 && (
          <div className="text-center p-10 bg-slate-800 rounded-xl shadow-xl">
            <Target size={48} className="mx-auto text-slate-500 mb-4" />
            <h2 className="text-2xl font-semibold text-slate-300">No goals yet!</h2>
            <p className="text-slate-400 mt-2">Define your first goal above to get started.</p>
          </div>
        )}

        {goals.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold mb-6 text-pink-400 px-1">Your Goals</h2>
            {goals.map(goal => (
              <div key={goal.id} className="bg-slate-800 rounded-xl shadow-lg transition-all hover:shadow-2xl overflow-hidden">
                {/* Goal Header */}
                <div className="p-5 border-b border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => toggleExpandGoal(goal.id)} className="p-1 text-slate-400 hover:text-pink-400" aria-label={expandedGoalId === goal.id ? "Collapse goal" : "Expand goal"}>
                            {expandedGoalId === goal.id ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
                        </button>
                        <h3 className={`text-xl font-semibold ${goal.daysAchieved >= goal.targetDays && goal.targetDays > 0 ? 'text-green-400' : 'text-slate-100'}`}>{goal.name}</h3>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-sm font-medium px-3 py-1 rounded-full ${goal.daysAchieved >= goal.targetDays && goal.targetDays > 0 ? 'bg-green-500/20 text-green-300' : 'bg-pink-500/20 text-pink-300'}`}>
                        {goal.daysAchieved} / {goal.targetDays} days
                      </span>
                      <button
                        onClick={() => deleteGoal(goal.id)}
                        className="p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-full transition-colors"
                        aria-label="Delete goal"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                   <div className="mt-2 pl-10"> {/* Indent progress bar slightly */}
                        <div className="w-full bg-slate-700 rounded-full h-2.5">
                        <div
                            className={`bg-gradient-to-r h-2.5 rounded-full transition-all duration-500 ease-out ${goal.daysAchieved >= goal.targetDays && goal.targetDays > 0 ? 'from-green-500 to-emerald-500' : 'from-violet-500 to-pink-500'}`}
                            style={{ width: `${goal.targetDays > 0 ? Math.min(100, (goal.daysAchieved / goal.targetDays) * 100) : 0}%` }}
                        ></div>
                        </div>
                    </div>
                </div>

                {/* Expanded Goal View: Habits and Add Habit Form */}
                {expandedGoalId === goal.id && (
                  <div className="p-5 bg-slate-800/50">
                    {/* Add Habit to this Goal Form */}
                    <div className="mb-6 p-4 bg-slate-700/50 rounded-lg">
                      <h4 className="text-md font-semibold mb-2 text-pink-400">Add Habit to "{goal.name}"</h4>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={newHabitNames[goal.id] || ''}
                          onChange={(e) => handleNewHabitNameChange(goal.id, e.target.value)}
                          placeholder="e.g., Practice for 15 mins"
                          className="flex-grow p-2.5 bg-slate-600 text-white rounded-md border border-slate-500 focus:border-pink-500 focus:ring-pink-500 outline-none transition-colors"
                        />
                        <button
                          onClick={() => addHabitToGoal(goal.id)}
                          className="flex items-center justify-center gap-1.5 p-2.5 bg-pink-500 hover:bg-pink-600 text-white font-medium rounded-md shadow hover:shadow-md transition-all text-sm"
                        >
                          <Plus size={18} /> Add Habit
                        </button>
                      </div>
                    </div>
                    
                    {/* Habit List for this Goal */}
                    {goal.habits && goal.habits.length > 0 ? (
                      <div className="space-y-3">
                        {goal.habits.map(habit => (
                          <div key={habit.id} className="bg-slate-700 p-4 rounded-lg shadow">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => toggleHabitCompletion(goal.id, habit.id)}
                                  className={`p-1.5 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 ${
                                    habit.isCompletedToday
                                      ? 'bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-400'
                                      : 'bg-slate-600 hover:bg-slate-500 focus:ring-slate-400'
                                  }`}
                                  aria-label={habit.isCompletedToday ? "Mark as incomplete" : "Mark as complete"}
                                >
                                  {habit.isCompletedToday ? <CheckCircle size={20} className="text-white" /> : <XCircle size={20} className="text-slate-300"/>}
                                </button>
                                <span className={`text-md ${habit.isCompletedToday ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                                  {habit.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 text-xs text-amber-400" title="Current Streak">
                                  <Zap size={16} />
                                  <span>{habit.streak}</span>
                                </div>
                                <button
                                  onClick={() => toggleHabitHistory(habit.id)}
                                  className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-600 rounded-full transition-colors"
                                  aria-label="Show completion history"
                                >
                                  <Repeat size={18} className={`transition-transform duration-300 ${viewingHabitHistoryId === habit.id ? 'rotate-180' : ''}`} />
                                </button>
                                <button
                                  onClick={() => deleteHabitFromGoal(goal.id, habit.id)}
                                  className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-500/20 rounded-full transition-colors"
                                  aria-label="Delete habit"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>
                            {/* Expanded habit history view */}
                            {viewingHabitHistoryId === habit.id && (
                              <div className="mt-3 pt-3 border-t border-slate-600">
                                <p className="text-xs text-slate-400 mb-1">Created: {new Date(habit.createdAt).toLocaleDateString()}</p>
                                <p className="text-xs text-slate-400 mb-2">Total completions: {(habit.completedDates || []).length}</p>
                                {(habit.completedDates || []).length > 0 ? (
                                  <div className="max-h-28 overflow-y-auto p-2 bg-slate-600/50 rounded-md text-xs">
                                    <ul className="list-disc list-inside pl-1 space-y-0.5">
                                      {(habit.completedDates || [])
                                        .slice() // Create a copy before sorting
                                        .sort((a, b) => new Date(b) - new Date(a)) // Sort most recent first
                                        .map(date => (
                                          <li key={date} className="text-slate-300">
                                            {new Date(date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                            {date === getTodayDateString() && <span className="ml-1 text-emerald-300 text-xxs">(Today)</span>}
                                          </li>
                                        ))}
                                    </ul>
                                  </div>
                                ) : (
                                  <p className="text-xs text-slate-500 italic">No completions yet.</p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <CalendarDays size={32} className="mx-auto text-slate-500 mb-2" />
                        <p className="text-slate-400">No habits added to this goal yet.</p>
                        <p className="text-xs text-slate-500">Use the form above to add the first habit.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        <footer className="mt-16 mb-8 text-center text-slate-500 text-sm">
            <p>&copy; {new Date().getFullYear()} Goal-Oriented Habit Tracker. Make progress every day!</p>
        </footer>
      </div>
    </div>
  );
};

export default App;

