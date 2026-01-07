"use client";

import { useEffect, useState } from "react";

interface Task {
  date: string;
  taskName: string;
  completed: boolean;
}

const STORAGE_KEY = 'pending_tasks';

export function useTaskSync() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      syncPendingTasks();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const savePendingTask = (task: Task) => {
    const pending = getPendingTasks();
    // Update of voeg toe
    const index = pending.findIndex(
      t => t.date === task.date && t.taskName === task.taskName
    );
    
    if (index >= 0) {
      pending[index] = task;
    } else {
      pending.push(task);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
  };

  const getPendingTasks = (): Task[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const syncPendingTasks = async () => {
    const pending = getPendingTasks();
    if (pending.length === 0) return;

    try {
      const response = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: pending }),
      });

      if (response.ok) {
        localStorage.removeItem(STORAGE_KEY);
        console.log('Synced', pending.length, 'tasks');
      }
    } catch (error) {
      console.error('Failed to sync tasks:', error);
    }
  };

  const saveTask = async (task: Task) => {
    // Altijd lokaal opslaan
    saveToLocalStorage(task);
    savePendingTask(task);

    // Probeer direct te synchroniseren als online
    if (isOnline) {
      try {
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(task),
        });

        if (response.ok) {
          // Verwijder uit pending als succesvol gesynchroniseerd
          const pending = getPendingTasks();
          const filtered = pending.filter(
            t => !(t.date === task.date && t.taskName === task.taskName)
          );
          localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        }
      } catch (error) {
        console.error('Failed to save task:', error);
        // Blijft in pending tasks staan
      }
    }
  };

  const loadTasks = async (date: string): Promise<{ [key: string]: boolean }> => {
    const tasks: { [key: string]: boolean } = {};

    // Probeer eerst van server te laden als online
    if (isOnline) {
      try {
        const response = await fetch(`/api/tasks?date=${date}`);
        if (response.ok) {
          const data = await response.json();
          // Update localStorage met server data
          data.forEach((task: Task) => {
            tasks[task.taskName] = task.completed;
            saveToLocalStorage(task);
          });
          return tasks;
        }
      } catch (error) {
        console.error('Failed to load tasks from server:', error);
        // Valt terug op localStorage
      }
    }

    // Als offline of server failed, gebruik localStorage
    const allTasks = getAllTasksFromLocalStorage();
    allTasks
      .filter(t => t.date === date)
      .forEach(t => {
        tasks[t.taskName] = t.completed;
      });

    return tasks;
  };

  const getAllTasksFromLocalStorage = (): Task[] => {
    try {
      const stored = localStorage.getItem('all_tasks');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const saveToLocalStorage = (task: Task) => {
    const allTasks = getAllTasksFromLocalStorage();
    const index = allTasks.findIndex(
      t => t.date === task.date && t.taskName === task.taskName
    );
    
    if (index >= 0) {
      allTasks[index] = task;
    } else {
      allTasks.push(task);
    }

    localStorage.setItem('all_tasks', JSON.stringify(allTasks));
  };

  return {
    isOnline,
    saveTask,
    loadTasks,
    syncPendingTasks,
    getPendingTasks,
  };
}
