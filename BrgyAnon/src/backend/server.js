const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

const app = express();
const PORT = 5000;

// 🔐 Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.applicationDefault(), // Or use serviceAccountKey.json
});

app.use(cors());
app.use(express.json());

// 🔐 Login endpoint: verify ID token from client
app.post("/api/login", async (req, res) => {
  const { token } = req.body;

  if (!token) return res.status(400).json({ error: "Missing token" });

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const { uid, email } = decoded;

    // Store login activity in Firestore
    await admin.firestore().collection("users").doc(uid).set(
      {
        email,
        userId: uid,
        lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    res.json({ message: "Login verified", userId: uid });
  } catch (err) {
    console.error("Token verification failed:", err);
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});
