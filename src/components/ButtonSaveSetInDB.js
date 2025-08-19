import React, { useState } from "react";
import axios from "axios";

function AddSetButton({ user_id, sessionId, machineId, sets, onSetAdded }) {
  const [loading, setLoading] = useState(false);

  const handleAddSet = async () => {
    if (!sessionId || !machineId || !sets.length) {
      alert("Missing session, machine, or set data.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`/sessions/postset`,
        {
        user_id:user_id,
        session_id: sessionId,
        machine_id: machineId,
        sets: sets,
      });

      if (onSetAdded) {
        onSetAdded(response.data); // send updated session/sets to parent
      }
    } catch (error) {
      console.error("Error adding set:", error);
      alert("Failed to add set. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleAddSet}
      disabled={loading}
      style={{
        background: loading ? "#aaa" : "#4caf50",
        color: "white",
        border: "none",
        padding: "8px 16px",
        borderRadius: "6px",
        cursor: loading ? "not-allowed" : "pointer",
        marginTop: "12px",
      }}
    >
      {loading ? "Saving..." : "Save Sets"}
    </button>
  );
}

export default AddSetButton;
