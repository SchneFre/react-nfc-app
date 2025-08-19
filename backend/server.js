// server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

// const NfcTag = require("./backend/models/NFCtags");
import NfcTag from "./models/NFCtags";
import GymMachine from "./models/Gymmachine";


dotenv.config();


const app = express();
app.use(cors());
app.use(express.json());

import sessionRoutes from "./sessions.js";
app.use("/sessions", sessionRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Atlas connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));










  

// API route to get tag info by UUID
app.get("/nfc/:uuid", async (req, res) => {
  try {
    console.log("------------------ GET Tag ------------------ ")
    const tag = await NfcTag.findOne({ RFID_uuid: req.params.uuid });
    if (!tag) return res.status(404).json({ error: "Tag not found" });
        
    
    const machine = await GymMachine.findById({_id:tag.machineID});
    
    const tagWithMachine = {
        RFID_uuid: tag.RFID_uuid,
        registeredAt: tag.registeredAt,
        machineID: tag.machineID,        
        machineName: machine.machine_name,
        muscle_groups: machine.muscle_groups,
        exercise_type: machine.exercise_type,
        description: machine.description
      };
    
    res.json(tagWithMachine);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// API route to get tag info by UUID
app.get("/nfc/user/:uuid", async (req, res) => {
  try {
    const tag = await NfcTag.findOne({ RFID_uuid: req.params.uuid });
    if (!tag) return res.status(404).json({ error: "Tag not found" });
        
    console.log(tag.machineID)
    const machine = await GymMachine.findById({_id:tag.machineID});
    
    const tagWithMachine = {
        RFID_uuid: tag.RFID_uuid,
        registeredAt: tag.registeredAt,
        machineID: tag.machineID,        
        machineName: machine.machine_name,
        muscle_groups: machine.muscle_groups,
        exercise_type: machine.exercise_type,
        description: machine.description
      };
    console.log(tagWithMachine)
    res.json(tagWithMachine);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// CREATE a new RFID-tag
app.post("/nfc/:uuid", async (req, res) => {
  try {
    console.log("------------------ POST ------------------" + req.params.uuid)
    console.log("req.params.uuid:" + req.params.uuid)
    const machines = await GymMachine.findOne({ machine_name: req.body.extraInfo });
    const newTag = new NfcTag({
      RFID_uuid: req.params.uuid,
      machineID: machines._id,      
      registeredAt: req.body.registeredAt || new Date(),
    });
    
    await newTag.save();    
    res.json(newTag);
    
  } catch (err) {
    console.log( err.message )
    res.status(500).json({ error: err.message });
  }
});

// UPDATE existing tag
app.put("/nfc/:uuid", async (req, res) => {
  try {
    console.log("------------------ PUT ------------------" + req.params.uuid)
    const machines = await GymMachine.findOne({ machine_name: req.body.extraInfo });
    console.log(machines)
    const updateData = {
      machineID: machines._id,      
      registeredAt: req.body.registeredAt || new Date()     
    };

    const updatedTag = await NfcTag.findOneAndUpdate(
      { RFID_uuid: req.params.uuid },
      { $set: updateData },
      { new: true, runValidators: true } // runValidators ensures schema rules are enforced
    );

    if (!updatedTag) return res.status(404).json({ error: "Tag not found" });

    res.json(updatedTag);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



















app.get("/machines", async (req, res) => {
  try {
    
    const machines = await GymMachine.find({}, { machine_name: 1, _id: 0 });
   
    const machineNames = machines.map((m) => m.machine_name);
    res.json(machineNames);
  } catch (err) {
    console.error("Error fetching machines:", err); // <-- log the actual error
    res.status(500).json({ error: err.message });
  }
});

app.get("/machines/:machinename", async (req, res) => {
  try {
    console.log("req.params.machinename:" + req.params.machinename)
    
  } catch (err) {
    console.error("Error fetching machines:", err); // <-- log the actual error
    res.status(500).json({ error: err.message });
  }
});




// Start server
const PORT = process.env.BACKEND_PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
