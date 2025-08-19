import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";


function CurrentSessionGrid({
  sets,
  setSets,
  sessionStartTime,
}) {
  const [isResting, setIsResting] = useState(false);
  const [restTime, setRestTime] = useState(0);
  const [durationTime, setDurationTime] = useState(0);
  const [lastActionTime, setLastActionTime] = useState(
    sessionStartTime ? new Date(sessionStartTime) : new Date()
  );

  useEffect(() => {
    if (sessionStartTime) {
      setLastActionTime(new Date(sessionStartTime));
    }
  }, [sessionStartTime]);
    useEffect(() => {
    if (sessionStartTime) {
        setLastActionTime(new Date(sessionStartTime));
        setDurationTime(0); // ✅ reset duration timer
        setRestTime(0);     // (optional) also reset rest timer if you want a full reset
        setIsResting(false); // (optional) reset resting state too
    }
    }, [sessionStartTime]);
  // Timer for rest time
  useEffect(() => {
    if (!isResting) return;

    const restTimer = setInterval(() => {
      setRestTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(restTimer);
  }, [isResting]);

  // Timer for duration
  useEffect(() => {
    if (isResting) return;

    const elapsed = setInterval(() => {
      setDurationTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(elapsed);
  }, [isResting]);


const handleDeleteSet = (index) => {
  Swal.fire({
    title: "Delete Set?",
    text: "Are you sure you want to delete this set?",
    icon: "warning",
    width: "250px", 
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, delete it!",
  }).then((result) => {
    if (result.isConfirmed) {
      setSets((prevSets) => prevSets.filter((_, i) => i !== index));

      Swal.fire({
        title: "Deleted!",
        text: "Your set has been removed.",
        icon: "success",
        width: "200px",
        timer: 1500,
        showConfirmButton: false,
      });
    }
  });
};

  const handleChange = (index, field, value) => {
    const newSets = [...sets];
    newSets[index][field] = value;
    setSets(newSets);
  };

  const stopRestAndAddSet = () => {
    const now = Date.now();
    const pauseSec = restTime;
    const durationSec = durationTime;

    setSets((prevSets) => [
      ...prevSets,
      {
        weight: prevSets[prevSets.length - 1]?.weight || 0,
        repetition: prevSets[prevSets.length - 1]?.repetition || 0,
        duration: durationSec,
        pause: pauseSec,
      },
    ]);

    setRestTime(0);
    setLastActionTime(now);
    setIsResting(false);
  };

  const formatDuration = (seconds) => {
    if (!seconds && seconds !== 0) return "";
    if (seconds < 60) return seconds;

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleToggleRest = () => {
    const now = new Date();
    setLastActionTime(now);

    if (isResting) {
      if (sets.length > 0) {
        const pauseSec = Math.floor((now - lastActionTime) / 1000);
        handleChange(sets.length - 1, "pause", pauseSec);
      }
      stopRestAndAddSet();
      setIsResting(false);
      setRestTime(0);
    } else {
      if (sets.length > 0) {
        const durationSec = Math.floor((now - lastActionTime) / 1000);
        handleChange(sets.length - 1, "duration", durationSec);
      }
      setIsResting(true);
      setDurationTime(0);
    }
  };

  return (
    <div className="exercise-input">
      {/* Column headers */}
      <div
        className="set-row header-row"
        style={{ display: "flex", gap: "8px", alignItems: "center" }}
      >
        <span className="set-header" style={{ width: "60px" }}></span>
        <span className="column-header" style={{ width: "60px" }}>
          Weight (kg)
        </span>
        <span className="column-header" style={{ width: "60px" }}>
          Reps
        </span>
        <span className="column-header" style={{ width: "60px" }}>
          Duration
        </span>
        <span className="column-header" style={{ width: "60px" }}>
          Pause
        </span>
      </div>

      {/* Set rows */}
      {sets.map((set, index) => {
  const isCurrentSet = index === sets.length - 1;
  return (
    <div
      className="set-row"
      key={index}
      style={{ display: "flex", alignItems: "center", gap: "8px" }}
    >
      <span className="set-label" style={{ width: "60px" }}>
        Set {index + 1}
      </span>

      <input
        type="number"
        value={set.weight}
        onChange={(e) => handleChange(index, "weight", e.target.value)}
        style={{ width: "60px" }}
      />

      <input
        type="number"
        value={set.repetition}
        onChange={(e) => handleChange(index, "repetition", e.target.value)}
        style={{ width: "60px" }}
      />

      <span style={{ width: "60px", textAlign: "center" }}>
        {!isCurrentSet || isResting
          ? formatDuration(set.duration)
          : formatDuration(durationTime)}
      </span>

      <span style={{ width: "60px", textAlign: "center" }}>
        {!isCurrentSet
          ? formatDuration(set.pause)
          : isResting
          ? formatDuration(restTime)
          : ""}
      </span>

      {/* Delete button */}
       {/* Show delete button only if there’s more than one set */}
      {sets.length > 1 && (
        <button
          onClick={() => handleDeleteSet(index)}
          style={{
           
            color: "white",
            border: "none",
            padding: "4px 8px",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          ✕
        </button>
        )}
    </div>
  );
})}


      {/* Rest control */}
      <div
        className="rest-controls"
        style={{
          marginTop: "12px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <button className="start-btn" onClick={handleToggleRest}>
          {isResting ? "Stop Rest" : "Start Rest"}
        </button>
      </div>
    </div>
  );
}

export default CurrentSessionGrid;
