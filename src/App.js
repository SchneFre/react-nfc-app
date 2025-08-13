import React, { useState } from "react";

function App() {
  const [uuid, setUuid] = useState("");
  const [error, setError] = useState("");

  const readNfc = async () => {
    if ("NDEFReader" in window) {
      try {
        const ndef = new window.NDEFReader();
        //const ndef = new NDEFReader();
        await ndef.scan();

        ndef.onreading = (event) => {
          const { serialNumber } = event;
          setUuid(serialNumber);
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

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>NFC Reader</h1>
      <button onClick={readNfc} style={{ padding: "0.5rem 1rem" }}>
        Scan NFC Chip
      </button>
      {uuid && (
        <p>
          <strong>UUID:</strong> {uuid}
        </p>
      )}
      {error && (
        <p style={{ color: "red" }}>
          <strong>Error:</strong> {error}
        </p>
      )}
    </div>
  );
}

export default App;
