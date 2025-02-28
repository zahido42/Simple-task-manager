const { useState, useEffect } = React;
const { Clock, Plus, Check, Trash2, Edit, Play, Pause, Save } = lucideReact;

const SimpleTimeboxingApp = () => {
  // Basic state
  const [tasks, setTasks] = useState([]);
  const [view, setView] = useState('list');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Form state
  const [taskName, setTaskName] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskEstTime, setTaskEstTime] = useState(30);
  
  // Edit state
  const [editingId, setEditingId] = useState(null);
  
  // Load saved tasks from localStorage when app starts
  useEffect(() => {
    const savedTasks = localStorage.getItem('timeboxTasks');
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch (error) {
        console.error('Error loading saved tasks:', error);
      }
    }
  }, []);
  
  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('timeboxTasks', JSON.stringify(tasks));
  }, [tasks]);
  
  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);
  
  // Add a new task
  const addTask = () => {
    if (!taskName) return;
    
    const newTask = {
      id: Date.now(),
      name: taskName,
      priority: taskPriority,
      estimatedTime: taskEstTime,
      actualTime: 0,
      status: 'Pending',
      timer: {
        running: false,
        startTime: null,
        elapsed: 0
      },
      scheduledHour: null
    };
    
    setTasks([...tasks, newTask]);
    setTaskName('');
    setTaskPriority('Medium');
    setTaskEstTime(30);
  };
  
  // Start timer for a task
  const startTimer = (id) => {
    setTasks(
      tasks.map(task => {
        // Stop any currently running timers
        if (task.timer.running) {
          return {
            ...task, 
            timer: { ...task.timer, running: false }
          };
        }
        
        // Start the selected timer
        if (task.id === id) {
          return {
            ...task,
            status: 'In Progress',
            timer: {
              ...task.timer,
              running: true,
              startTime: Date.now()
            }
          };
        }
        
        return task;
      })
    );
  };
  
  // Pause timer for a task
  const pauseTimer = (id) => {
    setTasks(
      tasks.map(task => {
        if (task.id === id) {
          // Calculate elapsed time
          const now = Date.now();
          const elapsed = task.timer.elapsed + (now - task.timer.startTime);
          return {
            ...task,
            timer: {
              ...task.timer,
              running: false,
              elapsed
            },
            actualTime: Math.round(elapsed / 60000) // Convert to minutes
          };
        }
        return task;
      })
    );
  };
  
  // Complete a task
  const completeTask = (id) => {
    setTasks(
      tasks.map(task => {
        if (task.id === id) {
          // Stop timer if running
          if (task.timer.running) {
            const now = Date.now();
            const elapsed = task.timer.elapsed + (now - task.timer.startTime);
            return {
              ...task,
              status: 'Completed',
              timer: {
                ...task.timer,
                running: false,
                elapsed
              },
              actualTime: Math.round(elapsed / 60000)
            };
          }
          return { ...task, status: 'Completed' };
        }
        return task;
      })
    );
  };
  
  // Delete a task
  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };
  
  // Edit a task
  const startEditing = (task) => {
    setEditingId(task.id);
    setTaskName(task.name);
    setTaskPriority(task.priority);
    setTaskEstTime(task.estimatedTime);
  };
  
  // Save edited task
  const saveEdit = () => {
    setTasks(
      tasks.map(task => {
        if (task.id === editingId) {
          return {
            ...task,
            name: taskName,
            priority: taskPriority,
            estimatedTime: taskEstTime
          };
        }
        return task;
      })
    );
    
    setEditingId(null);
    setTaskName('');
    setTaskPriority('Medium');
    setTaskEstTime(30);
  };
  
  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setTaskName('');
    setTaskPriority('Medium');
    setTaskEstTime(30);
  };
  
  // Helper function to format time
  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };
  
  // Get color based on priority
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 border-red-500';
      case 'Medium':
        return 'bg-yellow-100 border-yellow-500';
      case 'Low':
        return 'bg-green-100 border-green-500';
      default:
        return 'bg-gray-100 border-gray-500';
    }
  };
  
  // Get current hour
  const getCurrentHour = () => {
    return currentTime.getHours();
  };
  
  // Format hour for display
  const formatHour = (hour) => {
    return hour === 0 || hour === 24 ? '12 AM' : 
           hour === 12 ? '12 PM' : 
           hour < 12 ? `${hour} AM` : 
           `${hour - 12} PM`;
  };
  
  // Generate 24 hours starting from current
  const generateTimeline = () => {
    const currentHour = getCurrentHour();
    const hours = [];
    
    for (let i = 0; i < 24; i++) {
      const hour = (currentHour + i) % 24;
      hours.push(hour);
    }
    
    return hours;
  };
  
  // Tasks for a specific hour
  const getTasksForHour = (hour) => {
    return tasks.filter(task => 
      task.status !== 'Completed' && 
      task.scheduledHour === hour
    );
  };
  
  // Is current hour
  const isCurrentHour = (hour) => {
    return hour === getCurrentHour();
  };
  
  // Get unscheduled tasks
  const getUnscheduledTasks = () => {
    return tasks.filter(task => 
      task.status !== 'Completed' && 
      task.scheduledHour === null
    );
  };
  
  // Handle drag & drop
  const [draggingTask, setDraggingTask] = useState(null);
  const [activeHour, setActiveHour] = useState(null);
  
  const handleDragStart = (task) => {
    setDraggingTask(task);
  };
  
  const handleDragOverHour = (hour) => {
    if (hour >= getCurrentHour()) {
      setActiveHour(hour);
    }
  };
  
  const handleDropOnHour = (hour) => {
    if (hour >= getCurrentHour() && draggingTask) {
      setTasks(
        tasks.map(task => {
          if (task.id === draggingTask.id) {
            return {
              ...task,
              scheduledHour: hour
            };
          }
          return task;
        })
      );
      
      setDraggingTask(null);
      setActiveHour(null);
    }
  };
  
  // Clear task scheduling
  const clearTaskSchedule = (taskId) => {
    setTasks(
      tasks.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            scheduledHour: null
          };
        }
        return task;
      })
    );
  };
  
  // Calculate overall stats
  const getStats = () => {
    const completed = tasks.filter(task => task.status === 'Completed');
    
    const totalEstimated = tasks.reduce((sum, task) => sum + task.estimatedTime, 0);
    const totalActual = completed.reduce((sum, task) => sum + task.actualTime, 0);
    
    return {
      completed: completed.length,
      totalEstimated,
      totalActual
    };
  };
  
  const stats = getStats();
  
  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-center mb-2">TimeBox Task Manager</h1>
        
        <div className="flex justify-center space-x-4 mb-4">
          <button onClick={() => setView('list')} className={`px-4 py-2 rounded ${view === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
            Tasks
          </button>
          <button onClick={() => setView('chart')} className={`px-4 py-2 rounded ${view === 'chart' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
            Time Chart
          </button>
          <button onClick={() => setView('stats')} className={`px-4 py-2 rounded ${view === 'stats' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
            Stats
          </button>
        </div>
      </div>

      {view === 'list' && (
        <>
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="text-lg font-semibold mb-3">{editingId ? 'Edit Task' : 'Add New Task'}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Task Name</label>
                <input
                  type="text"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Enter task name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Estimated Time (minutes)</label>
                <input
                  type="number"
                  value={taskEstTime}
                  onChange={(e) => setTaskEstTime(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded"
                  min="5"
                  step="5"
                />
              </div>
              
              <div className="col-span-2 text-center">
                {editingId ? (
                  <div className="flex justify-center space-x-2">
                    <button
                      onClick={saveEdit}
                      className="flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded"
                    >
                      <Save size={18} className="mr-1" /> Save Changes
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex items-center justify-center px-4 py-2 bg-gray-300 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={addTask}
                    className="flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded mx-auto"
                    disabled={!taskName}
                  >
                    <Plus size={18} className="mr-1" /> Add Task
                  </button>
                )}
              </div>
            </div>
          </div>

          {tasks.length > 0 ? (
            <div className="bg-white rounded-lg shadow">
              <h2 className="text-lg font-semibold p-4 border-b">My Tasks</h2>
              <ul className="divide-y divide-gray-200">
                {tasks.map(task => (
                  <li key={task.id} className={`p-4 ${task.status === 'Completed' ? 'bg-gray-50' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${
                          task.status === 'Completed' ? 'bg-green-500' : 
                          task.status === 'In Progress' ? 'bg-blue-500' : 
                          'bg-gray-500'
                        }`}></div>
                        <span className={`font-medium ${task.status === 'Completed' ? 'line-through text-gray-500' : ''}`}>
                          {task.name}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                          task.priority === 'High' ? 'bg-red-100 text-red-800' :
                          task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {task.priority}
                        </span>
                        
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock size={16} className="mr-1" />
                          <span>Est: {formatTime(task.estimatedTime)}</span>
                        </div>
                        
                        {task.actualTime > 0 && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock size={16} className="mr-1" />
                            <span>Actual: {formatTime(task.actualTime)}</span>
                          </div>
                        )}
                        
                        {task.scheduledHour !== null && (
                          <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Scheduled: {formatHour(task.scheduledHour)}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-2 flex justify-between items-center">
                      <div className="flex space-x-2">
                        {task.status !== 'Completed' && (
                          task.timer.running ? (
                            <button
                              onClick={() => pauseTimer(task.id)}
                              className="flex items-center text-sm px-2 py-1 bg-gray-200 rounded"
                            >
                              <Pause size={16} className="mr-1" /> Pause
                            </button>
                          ) : (
                            <button
                              onClick={() => startTimer(task.id)}
                              className="flex items-center text-sm px-2 py-1 bg-blue-500 text-white rounded"
                            >
                              <Play size={16} className="mr-1" /> Start
                            </button>
                          )
                        )}
                        
                        {task.status !== 'Completed' && (
                          <button
                            onClick={() => completeTask(task.id)}
                            className="flex items-center text-sm px-2 py-1 bg-green-500 text-white rounded"
                          >
                            <Check size={16} className="mr-1" /> Complete
                          </button>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        {task.status !== 'Completed' && (
                          <button
                            onClick={() => startEditing(task)}
                            className="flex items-center text-sm px-2 py-1 bg-gray-200 rounded"
                          >
                            <Edit size={16} className="mr-1" /> Edit
                          </button>
                        )}
                        
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="flex items-center text-sm px-2 py-1 bg-red-100 text-red-600 rounded"
                        >
                          <Trash2 size={16} className="mr-1" /> Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              <p>No tasks yet. Add your first task to get started!</p>
            </div>
          )}
        </>
      )}
      
      {view === 'chart' && (
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-2">24-Hour Time Chart</h2>
          <p className="text-sm text-gray-500 mb-4">Current time: {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
          
          <div className="flex mb-6">
            <div className="w-16 flex-shrink-0 border-r pr-2 font-medium">
              {generateTimeline().map(hour => (
                <div 
                  key={hour} 
                  className={`h-16 flex items-center justify-end ${
                    isCurrentHour(hour) ? 'text-blue-600 font-bold' : ''
                  }`}
                >
                  {formatHour(hour)}
                </div>
              ))}
            </div>
            
            <div className="flex-1 pl-2">
              {generateTimeline().map(hour => {
                const hourTasks = getTasksForHour(hour);
                
                return (
                  <div 
                    key={hour}
                    className={`h-16 border-b flex items-center ${
                      isCurrentHour(hour) ? 'bg-blue-50' : 
                      hour < getCurrentHour() ? 'bg-gray-100' : ''
                    } ${
                      activeHour === hour ? 'bg-blue-100' : ''
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      handleDragOverHour(hour);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleDropOnHour(hour);
                    }}
                  >
                    {hour < getCurrentHour() ? (
                      <div className="px-4 text-gray-400 italic">Past time</div>
                    ) : hourTasks.length === 0 ? (
                      <div className="px-4 text-gray-400">Drop task here</div>
                    ) : (
                      <div className="flex flex-wrap gap-2 p-1 w-full">
                        {hourTasks.map(task => (
                          <div
                            key={task.id}
                            className={`border-2 rounded p-1 flex items-center justify-between ${getPriorityColor(task.priority)} w-full`}
                          >
                            <div className="flex items-center">
                              <div className={`w-2 h-2 rounded-full mr-1 ${
                                task.timer.running ? 'bg-blue-500' : 'bg-gray-500'
                              }`}></div>
                              <span className="font-medium truncate">{task.name}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-xs">{formatTime(task.estimatedTime)}</span>
                              <button
                                onClick={() => clearTaskSchedule(task.id)}
                                className="ml-1 text-gray-500 hover:text-red-500"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="font-medium mb-2">Unscheduled Tasks</h3>
            <div className="border rounded p-4">
              <div className="flex flex-wrap gap-3">
                {getUnscheduledTasks().length === 0 ? (
                  <div className="w-full text-center p-4 text-gray-500">
                    All tasks scheduled! Add more tasks or complete existing ones.
                  </div>
                ) : (
                  getUnscheduledTasks().map(task => (
                    <div
                      key={task.id}
                      className={`border-2 rounded p-2 cursor-move ${getPriorityColor(task.priority)}`}
                      draggable
                      onDragStart={() => handleDragStart(task)}
                      style={{
                        width: '200px'
                      }}
                    >
                      <div className="flex flex-col">
                        <h3 className="font-medium truncate">{task.name}</h3>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs">{formatTime(task.estimatedTime)}</span>
                          <span className={`text-xs px-1 rounded ${
                            task.priority === 'High' ? 'bg-red-200 text-red-800' :
                            task.priority === 'Medium' ? 'bg-yellow-200 text-yellow-800' :
                            'bg-green-200 text-green-800'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                        {task.timer.running && (
                          <div className="text-xs bg-blue-500 text-white px-1 py-0.5 rounded mt-1 text-center">
                            In progress
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-500">
            <p>* Drag tasks from "Unscheduled Tasks" to the timeline</p>
            <p>* Tasks cannot be scheduled before the current time</p>
            <p>* Box color represents task priority</p>
          </div>
        </div>
      )}
      
      {view === 'stats' && (
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Task Statistics</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-sm text-blue-600 font-medium">Tasks Completed</p>
              <p className="text-3xl font-bold text-blue-700">{stats.completed}</p>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
              <p className="text-sm text-purple-600 font-medium">Est. Total Time</p>
              <p className="text-3xl font-bold text-purple-700">{formatTime(stats.totalEstimated)}</p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-sm text-green-600 font-medium">Actual Total Time</p>
              <p className="text-3xl font-bold text-green-700">{formatTime(stats.totalActual)}</p>
            </div>
          </div>
          
          <h3 className="font-medium mb-3">Time Estimation Insights</h3>
          
          {tasks.filter(task => task.status === 'Completed').length > 0 ? (
            <div className="border rounded p-6">
              <ul className="space-y-4">
                {tasks
                  .filter(task => task.status === 'Completed')
                  .map(task => {
                    const diff = task.estimatedTime - task.actualTime;
                    const accuracy = Math.round(100 - Math.min(Math.abs(diff) / task.estimatedTime * 100, 100));
                    
                    return (
                      <li key={task.id} className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">{task.name}</span>
                          <div className="text-sm text-gray-500">
                            Estimated: {formatTime(task.estimatedTime)} | 
                            Actual: {formatTime(task.actualTime)}
                          </div>
                        </div>
                        <div className={`text-sm font-medium ${
                          diff > 0 ? 'text-green-600' : 
                          diff < 0 ? 'text-red-600' : 
                          'text-gray-600'
                        }`}>
                          {diff > 0 ? `${formatTime(Math.abs(diff))} under` : 
                           diff < 0 ? `${formatTime(Math.abs(diff))} over` : 
                           'Exact match'} ({accuracy}% accurate)
                        </div>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ) : (
            <div className="text-center p-6 text-gray-500 border rounded">
              Complete tasks to see your time estimation accuracy.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SimpleTimeboxingApp;
ReactDOM.render(<SimpleTimeboxingApp />, document.getElementById('root'));
