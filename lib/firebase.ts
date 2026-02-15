"use client"

import { initializeApp, getApps, getApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyAi116lCTh__qOFh3fR_5oeSwpHjmJPXfA",
  authDomain: "energy-system-8834c.firebaseapp.com",
  projectId: "energy-system-8834c",
  storageBucket: "energy-system-8834c.firebasestorage.app",
  messagingSenderId: "245123915964",
  appId: "1:245123915964:web:39b7d33d3e1027293370b9",
  measurementId: "G-YZDK0DR1FF"
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()

export const db = getFirestore(app)
