// PreviousSessionGrid.jsx
import React from "react";

function PreviousSessionGrid({ previousSession }) {
  if (!previousSession || !previousSession.machineWorkout) {
    return <p className="text-sm text-gray-500">No previous session found</p>;
  }

  const { start_datetime, duration, machineWorkout } = previousSession;
  const sessionDate = new Date(start_datetime); 
  const today = new Date();
  const diffTime = today - sessionDate; // difference in milliseconds
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); // convert to days  

  
  const formatDuration = (mins) => {
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="exercise-input max-w-sm mx-auto mt-4">
      {/* Session info */}
      <div className="mb-1 text-sm">
        
        <p className="font-semibold">
        Previous Session: {sessionDate.toLocaleDateString()}{" "}
        ({diffDays} {diffDays === 1 ? "day" : "days"} ago)
        </p>
        {duration && (
          <p className="text-gray-600">
            Duration: {formatDuration(duration)}
          </p>
        )}
      </div>

      {/* Column headers */}
      <div className="set-row header-row grid grid-cols-3 gap-1 text-xs font-semibold bg-gray-100 p-1 rounded text-center">
        <span className="set-header"></span>
        <span className="column-header">Weight (kg)</span>
        <span className="column-header">Reps</span>
      </div>

      {/* Set rows */}
      {machineWorkout.sets.map((set, index) => (
        <div
          className="set-row grid grid-cols-3 gap-1 text-sm py-0.5 border-b border-gray-200 text-center"
          key={index}
        >
          <span className="set-label">Set {index + 1}</span>
          <span className="set-value">{set.weight}</span>
          <span className="set-value">{set.repetition}</span>
        </div>
      ))}
    </div>
  );
}

export default PreviousSessionGrid;
