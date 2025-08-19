import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles.css";

const MUSCLE_GROUPS = [
  "Quadriceps","Glutes","Hamstrings","Latissimus Dorsi","Biceps",
  "Pectorals","Triceps","Deltoids","Back","Rear Deltoids",
  "Abdominals","Erector Spinae","Hip Abductors","Inner Thighs",
  "Cardio (Full Body indirectly)","Cardio (Legs, Core, Arms)"
];

function NFCReader() {
  const [description, setDescription] = useState("");
  const [uuid, setUuid] = useState("");
  const [error, setError] = useState("");
  const [tagInfo, setTagInfo] = useState(null);
  const [machine_name, setMachineName] = useState("");
  const [isNewTag, setIsNewTag] = useState(false);
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState([]);
  const [gymMachines, setGymMachines] = useState([]);

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const response = await axios.get("/machines");
        setGymMachines(response.data);
      } catch (error) {
        console.error("Error fetching gym machines:", error);
      }
    };
    fetchMachines();
  }, []);

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
        ndef.onreadingerror = () => setError("Failed to read NFC tag.");
      } catch (err) {
        setError(`Error: ${err.message}`);
      }
    } else {
      setError("Web NFC is not supported on this device/browser.");
    }
  };

  const fetchTagInfo = async (uuid) => {
    try {
      const res = await fetch(`/nfc/${uuid}`);
      if (res.status === 404) {
        setTagInfo(null);
        setMachineName("");
        setDescription("");
        setIsNewTag(true);
        setSelectedMuscleGroups([]);
        setError("");
        return;
      }
      if (!res.ok) throw new Error("Error fetching tag info");

      const data = await res.json();
      setTagInfo(data);
      setMachineName(data.machineName || "");
      setSelectedMuscleGroups(data.muscle_groups || []);
      setDescription(data.description || "");
      setIsNewTag(false);
      setError("");
    } catch (err) {
      setError(err.message);
      setTagInfo(null);
      setIsNewTag(false);
    }
  };

  const saveExtraInfo = async () => {
    if (!uuid) {
      setUuid("04:19:be:52:9e:73:81");
      await fetchTagInfo("04:19:be:52:9e:73:81");
    }
    if (!uuid) return setError("No UUID to save — please scan a tag first.");

    try {
      const method = isNewTag ? "POST" : "PUT";
      const res = await fetch(`/nfc/${uuid}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extraInfo: machine_name,
          muscleGroups: selectedMuscleGroups,
          ...(isNewTag && { registeredAt: new Date(), owner: "Unknown" }),
        }),
      });
      if (!res.ok) throw new Error("Failed to save description");
      fetchTagInfo(uuid);
      setIsNewTag(false);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleMuscleGroupTag = (tag) => {
    setSelectedMuscleGroups(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="nfc-reader">
      <h1>NFC Reader</h1>
      <button className="start-btn" onClick={readNfc}>Start</button>

      {uuid && <p>UUID: {uuid}</p>}

      {tagInfo && (
        <div className="tag-info">
          <h3>Tag Info</h3>
          <p>Description: {description}</p>
          <p>Registered At: {new Date(tagInfo.registeredAt).toLocaleString()}</p>
        </div>
      )}

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <select value={machine_name} onChange={(e) => setMachineName(e.target.value)}>
          <option value="" disabled>Select a machine</option>
          {gymMachines.map((machine) => (
            <option key={machine} value={machine}>{machine}</option>
          ))}
        </select>
        <button className="save-btn" onClick={saveExtraInfo}>Save</button>
      </div>

      {error && <p className="error">Error: {error}</p>}

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
    </div>
  );
}

export default NFCReader;
