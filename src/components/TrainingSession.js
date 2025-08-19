import React, { useState } from "react";
import "../styles.css";
import PreviousSessionGrid from "./PreviousSessionGrid";
import CurrentSessionGrid from "./CurrentSessionGrid";
import AddSetButton from "./ButtonSaveSetInDB";

const MUSCLE_GROUPS = [
  "Quadriceps","Glutes","Hamstrings","Latissimus Dorsi","Biceps",
  "Pectorals","Triceps","Deltoids","Back","Rear Deltoids",
  "Abdominals","Erector Spinae","Hip Abductors","Inner Thighs",
  "Cardio (Full Body indirectly)","Cardio (Legs, Core, Arms)"
];

function NFCReader() {
  const [uuid, setUuid] = useState("");
  const [error, setError] = useState("");
  const [machine_name, setMachineName] = useState("");
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState([]);
  const [previousSession, setPreviousSession] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [sessionResponse, setSessionResponse]= useState(null);
  const [sets, setSets] = useState([{ weight: "", repetition: "", duration: 0, pause: null }]);
  const [sessionStartTime, setSessionStartTime] = useState(Date.now());

  // NEW: Logging state
  const [logs, setLogs] = useState([]);

  const log = (message) => {
    console.log(message); // optional for desktop debugging
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const initializeSession = async () => {
    const user_id = "user_1";

    if (!("NDEFReader" in window)) {
      const msg = "Web NFC is not supported on this device/browser.";
      setError(msg);
      log(msg);
      return;
    }

    try {
      const ndef = new window.NDEFReader();
      await ndef.scan();
      log("NFC scan initialized");

      ndef.onreading = async (event) => {
        const { serialNumber } = event;
        setUuid(serialNumber);
        setMachineName("serialNumber: " + serialNumber);        
        log(`NFC tag read: ${serialNumber}`);

        try {
          log(`NFC tag read: ${serialNumber}`);
          const fetchURL = `/sessions/init/nfc/${serialNumber}?user_id=${user_id}`
          log(`fetchURL: ${fetchURL}`);
          const res = await fetch(fetchURL);
          if (!res.ok) throw new Error("Failed to fetch previous session");
        
          const data = await res.json();
          // Log backend messages if present
          if (data.logs && Array.isArray(data.logs)) {
             data.logs.forEach(msg => log(`Backend: ${msg}`));
          }

          log(`Session data received: ${JSON.stringify(data)}`);

          setPreviousSession(data.previousSession);
          setCurrentSession(data.currentSession);
          setSessionResponse(data);

          setMachineName(data.gymmachine.machine_name);
          setSelectedMuscleGroups(data.gymmachine.muscle_groups);

          const machineWorkout = data.currentSession.machine_workouts.find(
            (mw) => mw.machine_id === data.gymmachine._id
          );

          if (machineWorkout?.sets && Array.isArray(machineWorkout.sets)) {
            setSets(machineWorkout.sets);
            log("Loaded existing sets from current session");
          } else {
            setSets([{ weight: "", repetition: "", duration: 0, pause: null }]);
            log("Initialized empty set array");
          }

          setSessionStartTime(Date.now());
          setError("");
        } catch (err) {
          const msg = `Error fetching session data: ${err.message}`;
          setError(msg);
          log(msg);
        }
      };

      ndef.onreadingerror = () => {
        const msg = "Failed to read NFC tag.";
        setError(msg);
        log(msg);
      };
    } catch (err) {
      const msg = `Error initializing NFC: ${err.message}`;
      setError(msg);
      log(msg);
    }
  };

  const toggleMuscleGroupTag = (tag) => {
    setSelectedMuscleGroups(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
    log(`Toggled muscle group: ${tag}`);
  };

  return (
    <div className="nfc-reader">
      <h1>{machine_name}</h1>

      {!uuid && (
        <button className="start-btn" onClick={initializeSession}>
          Start Session & Activate NFC
        </button>
      )}

      {error && <p className="error">Error: {error}</p>}

      {uuid && (
        <>
          {currentSession && (
            <CurrentSessionGrid
              sets={sets}  
              setSets={setSets}
              sessionStartTime={sessionStartTime}
            />
          )}

          {previousSession && (
            <PreviousSessionGrid previousSession={previousSession} />
          )}

          {sessionResponse && (
            <div className="tag-info">         
              <p>session_id: {sessionResponse.currentSession.session_id}</p>
              <p>muscle_groups: {sessionResponse.gymmachine.muscle_groups}</p>
              <p>gymmachine._id: {sessionResponse.gymmachine._id}</p>
            </div>
          )}
              
          <div className="muscle-groups">
            <h3>Muscle Groups</h3>
            {MUSCLE_GROUPS.map((tag) => (
              <span
                key={tag}
                onClick={() => toggleMuscleGroupTag(tag)}
                className={selectedMuscleGroups.includes(tag) ? "selected" : ""}
              >
                {tag}
              </span>
            ))}
          </div>

          {sessionResponse && (             
            <div>                
              <AddSetButton
                user_id={"user_1"}
                sessionId={sessionResponse.currentSession.session_id}
                machineId={sessionResponse.gymmachine._id}
                sets={sets}
                onSetAdded={(updated) => {
                  log(`Set added: ${JSON.stringify(updated)}`);
                }}
              />                
            </div>
          )}
        </>
      )}

      {/* NEW: Display logs at the bottom */}
      <div className="log-container" style={{marginTop:"20px", maxHeight:"200px", overflowY:"auto", background:"#f0f0f0", padding:"10px", fontSize:"12px"}}>
        <h4>Logs</h4>
        {logs.map((entry, idx) => (
          <div key={idx}>{entry}</div>
        ))}
      </div>
    </div>
  );
}

export default NFCReader;
