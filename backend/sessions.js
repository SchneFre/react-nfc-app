// const express = require("express");

const router = express.Router();
//const Session = require("./models/Sessions");
// const NfcTag = require("./models/NFCtags");
// const mongoose = require("mongoose");
import mongoose from "mongoose";
import express from "express";
import NfcTag from "./models/NFCtags";
import Session from "./models/Sessions";
import GymMachine from "./models/Gymmachine";
import { startOfDay } from 'date-fns';


// POST /session
router.post("/", async (req, res) => {
  try {
    console.log("--------------- POST SESSION --------------- ")
    const { session_id, user_id, start_datetime, duration_min, machine_id, set } = req.body;


    if (!session_id || !user_id || !machine_id || !set || !set.weight || !set.repetition) {
        console.log("Missing required fields")
        return res.status(400).json({ message: "Missing required fields" });
    }
    console.log("No Fields missing")
    // Find the session by session_id
    let session = await Session.findOne({ session_id: session_id });
    console.log("session_id: " + session_id)
    console.log("start_datetime: " + session.start_datetime )
    if (session) {
       console.log("Found existing session")
      // Check if machine already exists in the session
      const machineWorkout = session.machine_workouts.find(
        (mw) => mw.machine_id.toString() === machine_id
      );

      if (machineWorkout) {
        // Append the set to the existing machine
        machineWorkout.sets.push(set);
      } else {
        // Add a new machine workout with the set
        session.machine_workouts.push({
          machine_id,
          sets: [set],
        });
      }

      await session.save();
      return res.status(200).json({ message: "Set appended to existing session", session });
    } else {
      // Create a new session
      console.log("creating new session")
      const newSession = new Session({
        session_id,
        user_id,
        start_datetime: start_datetime || new Date(),
        duration_min: duration_min || 0,
        machine_workouts: [
          {
            machine_id,
            sets: [set],
          },
        ],
      });
        console.log("saving new session")
      await newSession.save();
      return res.status(201).json({ message: "Session created and set added", session: newSession });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
});




router.get("/", (req, res) => {
    console.log("test")
  
});



router.get("/init/nfc/:uuid", async (req, res) => {
  console.log("---------- GET previousSession ----------");
  const { uuid } = req.params;
  const { user_id } = req.query;

 console.log("UUID:", uuid);
 console.log("User ID:", user_id);

  const tag = await NfcTag.findOne({ RFID_uuid: uuid });
  if (!tag) return res.status(404).json({ error: "Tag not found" });

  const strMachineID = String(tag.machineID);
  const gymmachine = await GymMachine.findById({ _id: tag.machineID });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  let machineWorkout;
  let previousSessionData = null;

  // --- Previous session lookup ---
  // load previous session at that machine
  const previousSession = await Session.findOne({
    user_id: user_id,
    "machine_workouts.machine_id": strMachineID,
    start_datetime: { $lt: todayStart } // exclude today
  }).sort({ start_datetime: -1 });
  let weights, reps, maxWeight, avgReps;

  if (previousSession) {
    machineWorkout = previousSession.machine_workouts.find(
      (mw) => mw.machine_id === strMachineID
    );
    weights = machineWorkout.sets.map((s) => s.weight ?? 0);
    reps = machineWorkout.sets.map((s) => s.repetition ?? 0);
    maxWeight = Math.max(...weights);
    avgReps = Math.round(reps.reduce((sum, r) => sum + r, 0) / reps.length);

    previousSessionData = {
      start_datetime: previousSession.start_datetime,
      duration: previousSession.duration_min,
      machineWorkout
    };
  }

  // --- Current session lookup ---
  // load session today - independent of machine
  let currentSession = await Session.findOne({
    user_id: user_id,
    // "machine_workouts.machine_id": strMachineID,
    start_datetime: { $gte: todayStart, $lte: todayEnd }
  }).sort({ start_datetime: -1 });

  if (!currentSession) {
    // New session object
    currentSession = new Session({
      session_id: new mongoose.Types.ObjectId().toString(), 
      user_id: user_id,
      start_datetime: new Date(),
      duration_min: 0,
      machine_workouts: [
        {
          machine_id: strMachineID,
          sets: {
                weight: maxWeight,
                repetition: avgReps,
                duration: 0,
                pause: 0
                }
        }
      ]
    });

    // ✅ Save new session in MongoDB
    await currentSession.save();
    // console.log("Created and saved new currentSession:", currentSession);
  } else {
     let machineInSession = currentSession.machine_workouts.find(
      (mw) => mw.machine_id === strMachineID
    );

    if (!machineInSession) {
      // Add machine with initial set
      currentSession.machine_workouts.push({
        machine_id: strMachineID,
        sets: [
          {
            weight: maxWeight,
            repetition: avgReps,
            duration: 0,
            pause: 0
          }
        ]
      });

      await currentSession.save();
    } else if (machineInSession.sets.length === 0) {
      // Initialize sets if empty
      machineInSession.sets.push({
        weight: maxWeight,
        repetition: avgReps,
        duration: 0,
        pause: 0
      });

      await currentSession.save();
    }
  }
  
  const sessionObject = {
    gymmachine: gymmachine,
    previousSession: previousSessionData || null,
    currentSession: currentSession
  };
  console.log(sessionObject)
  res.json(sessionObject);
});



// POST /sessions/postset
router.post("/postset", async (req, res) => {
  try {

    console.log("---------- POST postset ----------");
    const { user_id, session_id, machine_id, sets } = req.body;

    if (!user_id || !session_id || !machine_id || !sets) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Find the session
    const session = await Session.findOne({ user_id, session_id });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Find the machine workout within that session
    const machineIndex = session.machine_workouts.findIndex(
      (mw) => mw.machine_id === machine_id
    );

    if (machineIndex === -1) {
      // Machine workout not found, create a new one
      console.log("---------- Machine workout not found, create a new one ----------");
      session.machine_workouts.push({
        machine_id,
        sets: sets.map((s) => ({
            weight: s.weight ?? 0,
            repetition: s.repetition ?? 0,
            duration: s.duration ?? 0,
            pause: s.pause ?? 0,
        })),
      });
    } else {
      // Overwrite existing sets
      console.log("---------- Overwrite existing sets  ----------");
      session.machine_workouts[machineIndex].sets = sets.map((s) => ({
            weight: s.weight ?? 0,
            repetition: s.repetition ?? 0,
            duration: s.duration ?? 0,
            pause: s.pause ?? 0,
      }))
      
      ;
    }
    console.log(session)
    
    // Calculate duration in minutes
    const now = new Date();
    const durationMs = now - session.start_datetime; // difference in ms
    const durationMin = Math.floor(durationMs / 1000 / 60); // convert to minutes
    // Update the session
    session.duration_min = durationMin;

    await session.save();

    return res.status(200).json({ message: "Sets updated", session });
  } catch (error) {
    console.error("Error updating sets:", error);
    return res.status(500).json({ message: "Server error", error });
  }
});

// GET /sessions/getsets?user_id=...&session_id=...&machine_id=...
router.get("/getsets", async (req, res) => {
  try {
    const { user_id, session_id, machine_id } = req.query;

    if (!user_id || !session_id || !machine_id) {
      return res.status(400).json({ message: "Missing required query parameters" });
    }

    // Find the session
    const session = await Session.findOne({ user_id, session_id });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Find the machine workout within the session
    const machineWorkout = session.machine_workouts.find(
      (mw) => mw.machine_id === machine_id
    );

    if (!machineWorkout) {
      return res.status(404).json({ message: "Machine workout not found" });
    }

    return res.status(200).json({ sets: machineWorkout.sets });
  } catch (error) {
    console.error("Error fetching sets:", error);
    return res.status(500).json({ message: "Server error", error });
  }
});

/*
router.get("/init/nfc/:uuid", async (req, res) => {
    console.log("---------- GET previousSession ----------")
    const { uuid } = req.params ;
    const { user_id } = req.query; // <-- here

    console.log("UUID:", uuid);
    console.log("User ID:", user_id);

    const tag = await NfcTag.findOne({ RFID_uuid: uuid });
    console.log("tag:", tag);

    if( tag == null) return res.status(404).json({ error: "Tag not found" });
    if (!tag) return res.status(404).json({ error: "Tag not found" });
    

    const strMachineID =  String(tag.machineID)  

    const gymmachine = await GymMachine.findById({_id:tag.machineID});


    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    console.log("strMachineID:", strMachineID);
    let machineWorkout;
    let previousSessionData = null;
    const previousSession = await Session.findOne({
         user_id: user_id,
        "machine_workouts.machine_id": strMachineID,
        start_datetime: { $lt: todayStart } // exclude sessions from today
        }).sort({ start_datetime: -1 });
    
        if (previousSession) {
        // Find the specific machine in this session
            machineWorkout = previousSession.machine_workouts.find(
            mw => mw.machine_id === strMachineID
        );
        // Include start_datetime of the previous session
        previousSessionData = {
            start_datetime: previousSession.start_datetime,
            duration: previousSession.duration_min,
            machineWorkout
        };

        } else {
        console.log("No previous session found");
        }
    console.log(previousSession)
    let currentSession = await Session.findOne({
         user_id: user_id,
        "machine_workouts.machine_id": strMachineID,
         start_datetime: { $gte: todayStart, $lte: todayEnd } // only today
        }).sort({ start_datetime: -1 });
    if (currentSession == null){
        // New session object
        currentSession = new Session({
            session_id: new mongoose.Types.ObjectId().toString(), // or use a UUID
            user_id: user_id,
            start_datetime: new Date(),
            duration_min: 0,
            machine_workouts: [
            {
                machine_id: strMachineID,
                sets: []
            }
            ]
        });
    }
    const sessionObject = {
            gymmachine: gymmachine,
            previousSession: previousSessionData || null,
            currentSession: currentSession
            };
    console.log(sessionObject)

    res.json(sessionObject);
});
*/


// module.exports = router;
export default router;

