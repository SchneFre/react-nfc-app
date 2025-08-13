import React, { useEffect, useState } from "react";

function App() {
  const [nfcData, setNfcData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if ("NDEFReader" in window) {
      const ndef = new window.NDEFReader();
      // const ndef = new NDEFReader();

      const startScanning = async () => {
        try {
          await ndef.scan();
          console.log("NFC scanning started...");

          ndef.onreading = (event) => {
            const tagData = event.message.records.map((record) => {
              const textDecoder = new TextDecoder(record.encoding || "utf-8");
              return textDecoder.decode(record.data);
            }).join(", ");

            setNfcData(tagData);
            console.log("NFC tag read:", tagData);
          };
        } catch (err) {
          setError(err.message);
          console.error("NFC scanning failed:", err);
        }
      };

      startScanning();
    } else {
      setError("Web NFC is not supported on this device/browser.");
    }
  }, []);

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>React NFC Reader</h1>
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      {nfcData ? (
        <p>NFC Tag Data: {nfcData}</p>
      ) : (
        <p>Bring an NFC tag close to your phone to read it.</p>
      )}
    </div>
  );
}

export default App;
