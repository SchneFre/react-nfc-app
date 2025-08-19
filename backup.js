import React, { useState } from "react";


const MUSCLE_GROUPS = [
    "Chest",
    "Back",
    "Shoulders",
    "Biceps",
    "Triceps",
    "Forearms",
    "Abdominals",
    "Obliques",
    "Quadriceps",
    "Hamstrings",
    "Glutes",
    "Calves",
]
function App() {
  const [uuid, setUuid] = useState("");
  const [error, setError] = useState("");
  const [tagInfo, setTagInfo] = useState(null);
  const [newExtraInfo, setNewExtraInfo] = useState("");
  const [isNewTag, setIsNewTag] = useState(false);
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState([]);


//  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const readNfc = async () => {
    if ("NDEFReader" in window) {
      try {
        const ndef = new window.NDEFReader();
        await ndef.scan();

        ndef.onreading = async (event) => {
          const { serialNumber } = event;
          setUuid(serialNumber);
          await fetchTagInfo(serialNumber);
        };

        ndef.onreadingerror = () => {
          setError("Failed to read NFC tag.");
        };
      } catch (err) {
        setError(`Error: ${err.message}`);
      }
    } else {
      setError("Web NFC is not supported on this device/browser.");
    }
  };

  const fetchTagInfo = async (uuid) => {
    try {
      //const res = await fetch(`${API_URL}/nfc/${uuid}`);
      const res = await fetch(`/nfc/${uuid}`);
      console.log(res)
      if (res.status === 404) {
        // Tag does not exist — prepare for new entry
        setTagInfo(null);
        setNewExtraInfo("");
        setIsNewTag(true);
        setSelectedMuscleGroups([] );
        setError("");
        return;
      }
      if (!res.ok) throw new Error("Error fetching tag info");

      const data = await res.json();
      setTagInfo(data);
      setNewExtraInfo(data.extraInfo || "");
      setSelectedMuscleGroups(data.muscleGroups || [] );
      setIsNewTag(false);
      setError("");
    } catch (err) {
      setError(err.message);
      setTagInfo(null);
      setIsNewTag(false);
    }
  };

  const saveExtraInfo = async () => {
    //setUuid("04:19:be:52:9e:73:81");
    //setIsNewTag(true);
    
    if(!uuid){
      setUuid("04:19:be:52:9e:73:81");
    }
    
    if (!uuid) return setError("No UUID to save — please scan a tag first.");
    
   

    try {
      const method = isNewTag ? "POST" : "PUT";

      // const res = await fetch(`${API_URL}/nfc/${uuid}`, {
      const res = await fetch(`/nfc/${uuid}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extraInfo: newExtraInfo,
          muscleGroups: selectedMuscleGroups,
          ...(isNewTag && { registeredAt: new Date(), owner: "Unknown" }),
        }),
      });
      
      console.log("newExtraInfo: " + newExtraInfo)
      console.log("method: " + method)

      console.log(JSON.stringify({
          extraInfo: newExtraInfo,
          muscleGroups: selectedMuscleGroups,
          ...(isNewTag && { registeredAt: new Date(), owner: "Unknown" }),
        }))

      console.log(res)

      if (!res.ok) throw new Error("Failed to save description");

      // const savedTag = await res.json();
      // console.log(savedTag)

      // setTagInfo(savedTag);
      setIsNewTag(false);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };



  // Function to toggle tag selection
  const toggleMuscleGroupTag = (tag) => {
    setSelectedMuscleGroups(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)  // Remove if already selected
        : [...prev, tag]               // Add if not selected
    );
  };
  return (
<div style={{
  maxWidth: "450px",
  margin: "2rem auto",
  padding: "2rem",
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  backgroundColor: "#f9f9f9",
  borderRadius: "12px",
  boxShadow: "0 8px 20px rgba(0,0,0,0.1)"
}}>
  <h1 style={{ textAlign: "center", color: "#333", marginBottom: "1.5rem" }}>NFC Reader</h1>

  {/* Scan button */}
  <button
    onClick={readNfc}
    style={{
      display: "block",
      width: "100%",
      padding: "0.75rem",
      backgroundColor: "#4CAF50",
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: "bold",
      marginBottom: "1rem",
      transition: "background-color 0.3s"
    }}
    onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#45a049"}
    onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#4CAF50"}
  >
    Start
  </button>

  {/* Show UUID */}
  {uuid && <p style={{ color: "#555", marginBottom: "1rem" }}><strong>UUID:</strong> {uuid}</p>}

  {/* Show tag info if exists */}
  {tagInfo && (
    <div style={{
      marginTop: "1rem",
      padding: "1rem",
      backgroundColor: "#fff",
      borderRadius: "10px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
    }}>
      <h3 style={{ marginBottom: "0.5rem", color: "#333" }}>Tag Info</h3>
      <p style={{ margin: "0.25rem 0" }}><strong>Gym:</strong> {tagInfo.owner}</p>
      <p style={{ margin: "0.25rem 0" }}>
        <strong>Registered At:</strong> {new Date(tagInfo.registeredAt).toLocaleString()}
      </p>
    </div>
  )}

  {/* Extra Info input and Save button */}
  <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.5rem" }}>
    <input
      type="text"
      value={newExtraInfo}
      onChange={(e) => setNewExtraInfo(e.target.value)}
      placeholder="Enter machine Name"
      style={{
        flex: 1,
        padding: "0.5rem 0.75rem",
        borderRadius: "8px",
        border: "1px solid #ccc",
        outline: "none",
        transition: "border-color 0.3s"
      }}
      onFocus={(e) => e.currentTarget.style.borderColor = "#4CAF50"}
      onBlur={(e) => e.currentTarget.style.borderColor = "#ccc"}
    />
    <button
      onClick={saveExtraInfo}
      style={{
        padding: "0.5rem 1rem",
        backgroundColor: "#2196F3",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "bold",
        transition: "background-color 0.3s"
      }}
      onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#1976D2"}
      onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#2196F3"}
    >
      Save
    </button>
  </div>

  {/* Error display */}
  {error && (
    <p style={{ color: "red", marginTop: "1rem" }}>
      <strong>Error:</strong> {error}
    </p>
  )}

  {/* Selectable tags for Muscle Groups */}
  <div style={{ marginTop: "2rem" }}>
    <h3 style={{ color: "#333", marginBottom: "0.5rem" }}>Muscle Groups</h3>
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
      {MUSCLE_GROUPS.map((tag) => (
        <span
          key={tag}
          onClick={() => toggleMuscleGroupTag(tag)}
          style={{
            padding: "0.4rem 0.8rem",
            borderRadius: "20px",
            border: selectedMuscleGroups.includes(tag) ? "2px solid #4CAF50" : "2px solid #ccc",
            backgroundColor: selectedMuscleGroups.includes(tag) ? "#E8F5E9" : "#f1f1f1",
            color: "#333",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          {tag}
        </span>
      ))}
    </div>
  </div>
</div>


  );
}

export default App;
