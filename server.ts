import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("lfyhub.db");

// Initialize Database
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      blood_group TEXT NOT NULL,
      phone TEXT UNIQUE,
      profile_photo TEXT,
      total_donations INTEGER DEFAULT 0,
      availability INTEGER DEFAULT 1,
      latitude REAL,
      longitude REAL,
      last_donation_date TEXT
    );
  `);
  
  // Ensure phone is unique (for older databases)
  try {
    // First, remove any existing duplicates to allow index creation
    db.exec(`
      DELETE FROM users 
      WHERE id NOT IN (
        SELECT MIN(id) 
        FROM users 
        GROUP BY phone
      ) AND phone IS NOT NULL;
    `);
    db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone ON users(phone);");
  } catch (e) {
    console.log("Unique index on phone could not be created (likely already exists):", e);
  }

  // Ensure last_donation_date column exists (for older databases)
  const tableInfo = db.prepare("PRAGMA table_info(users)").all() as any[];
  const hasLastDonationDate = tableInfo.some(col => col.name === 'last_donation_date');
  if (!hasLastDonationDate) {
    try {
      db.exec("ALTER TABLE users ADD COLUMN last_donation_date TEXT;");
      console.log("Added last_donation_date column to users table");
    } catch (e) {
      console.error("Error adding last_donation_date column:", e);
    }
  }
  db.exec(`
    CREATE TABLE IF NOT EXISTS blood_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requester_id INTEGER NOT NULL,
      blood_group TEXT NOT NULL,
      hospital_name TEXT,
      latitude REAL,
      longitude REAL,
      is_emergency INTEGER DEFAULT 0,
      status TEXT DEFAULT 'open',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(requester_id) REFERENCES users(id)
    );
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL, -- 'emergency', 'eligibility', 'info'
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      related_id INTEGER, -- e.g., request_id
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS donations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      donation_date TEXT NOT NULL,
      hospital_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_users_blood_availability ON users(blood_group, availability);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_users_availability ON users(availability);`);
  console.log("Database initialized successfully");
} catch (err) {
  console.error("Database initialization error:", err);
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  const PORT = 3000;

  app.use(express.json());

  // Socket.io Logic
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join", (userId) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined their private room`);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // Helper to broadcast stats
  const broadcastStats = () => {
    try {
      const total = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
      const available = db.prepare("SELECT COUNT(*) as count FROM users WHERE availability = 1").get() as { count: number };
      io.emit("stats_update", {
        total: total?.count || 0,
        available: available?.count || 0
      });
    } catch (err) {
      console.error("Broadcast stats error:", err);
    }
  };

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Auth Routes
  app.post("/api/auth/signup", (req, res) => {
    const { name, email, password, blood_group, phone } = req.body;
    try {
      const stmt = db.prepare(
        "INSERT INTO users (name, email, password, blood_group, phone) VALUES (?, ?, ?, ?, ?)"
      );
      const result = stmt.run(name, email, password, blood_group, phone);
      broadcastStats(); // Update stats immediately after new donor joins
      res.json({ id: result.lastInsertRowid, name, email, blood_group, phone, availability: 1, total_donations: 0 });
    } catch (error: any) {
      if (error.message.includes("UNIQUE constraint failed: users.email")) {
        res.status(400).json({ error: "This email is already registered. Please login instead." });
      } else if (error.message.includes("UNIQUE constraint failed: users.phone")) {
        res.status(400).json({ error: "This phone number is already registered. Please login instead." });
      } else {
        res.status(400).json({ error: "Signup failed. Please check your details." });
      }
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    try {
      const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password) as any;
      if (user) {
        res.json(user);
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/forgot-password", (req, res) => {
    const { email, phone, newPassword } = req.body;
    try {
      const user = db.prepare("SELECT * FROM users WHERE email = ? AND phone = ?").get(email, phone) as any;
      if (!user) {
        return res.status(404).json({ error: "User not found with these details" });
      }
      db.prepare("UPDATE users SET password = ? WHERE id = ?").run(newPassword, user.id);
      res.json({ success: true, message: "Password updated successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // User Routes
  app.get("/api/users/search", (req, res) => {
    const { blood_group, current_user_id } = req.query;
    const users = db.prepare(
      "SELECT id, name, phone, blood_group, total_donations, latitude, longitude FROM users WHERE blood_group = ? AND availability = 1 AND id != ?"
    ).all(blood_group, current_user_id);
    res.json(users);
  });

  app.post("/api/users/update-location", (req, res) => {
    const { id, latitude, longitude } = req.body;
    db.prepare("UPDATE users SET latitude = ?, longitude = ? WHERE id = ?").run(latitude, longitude, id);
    res.json({ success: true });
  });

  app.post("/api/users/toggle-availability", (req, res) => {
    const { id, availability } = req.body;
    db.prepare("UPDATE users SET availability = ? WHERE id = ?").run(availability ? 1 : 0, id);
    broadcastStats();
    res.json({ success: true });
  });

  app.post("/api/users/update-donation", (req, res) => {
    const { id, last_donation_date, hospital_name } = req.body;
    try {
      db.prepare("UPDATE users SET last_donation_date = ?, total_donations = total_donations + 1 WHERE id = ?").run(last_donation_date, id);
      db.prepare("INSERT INTO donations (user_id, donation_date, hospital_name) VALUES (?, ?, ?)").run(id, last_donation_date, hospital_name || 'Nearby Hospital');
      broadcastStats();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/users/:id/donations", (req, res) => {
    try {
      const donations = db.prepare("SELECT * FROM donations WHERE user_id = ? ORDER BY donation_date DESC").all(req.params.id);
      res.json(donations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Notification Routes
  app.get("/api/notifications", (req, res) => {
    const { user_id } = req.query;
    
    // Check for eligibility and auto-generate notification
    try {
      const user = db.prepare("SELECT last_donation_date FROM users WHERE id = ?").get(user_id) as any;
      if (user && user.last_donation_date) {
        const lastDate = new Date(user.last_donation_date);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays >= 90) {
          const existing = db.prepare(
            "SELECT id FROM notifications WHERE user_id = ? AND type = 'eligibility' AND is_read = 0"
          ).get(user_id);
          
          if (!existing) {
            db.prepare(
              "INSERT INTO notifications (user_id, type, title, message) VALUES (?, 'eligibility', ?, ?)"
            ).run(user_id, "🎉 You are eligible!", "It's been 90 days since your last donation. You can save lives again!");
          }
        }
      }
    } catch (e) {
      console.error("Eligibility check error", e);
    }

    const notifications = db.prepare(
      "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20"
    ).all(user_id);
    res.json(notifications);
  });

  app.post("/api/notifications/read", (req, res) => {
    const { id } = req.body;
    db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Request Routes
  app.post("/api/requests/create", (req, res) => {
    const { requester_id, blood_group, hospital_name, latitude, longitude, is_emergency } = req.body;
    try {
      const result = db.prepare(
        "INSERT INTO blood_requests (requester_id, blood_group, hospital_name, latitude, longitude, is_emergency) VALUES (?, ?, ?, ?, ?, ?)"
      ).run(requester_id, blood_group, hospital_name, latitude, longitude, is_emergency ? 1 : 0);
      
      const requestId = result.lastInsertRowid;

      // Broadcast notifications to matching donors
      if (is_emergency) {
        const donors = db.prepare(
          "SELECT id FROM users WHERE blood_group = ? AND availability = 1 AND id != ?"
        ).all(blood_group, requester_id) as { id: number }[];

        const notifyStmt = db.prepare(
          "INSERT INTO notifications (user_id, type, title, message, related_id) VALUES (?, 'emergency', ?, ?, ?)"
        );

        donors.forEach(donor => {
          const title = "🚨 EMERGENCY REQUEST";
          const message = `Urgent ${blood_group} needed at ${hospital_name || 'nearby hospital'}.`;
          
          notifyStmt.run(donor.id, title, message, requestId);
          
          // Real-time socket notification
          io.to(`user_${donor.id}`).emit("new_notification", {
            type: 'emergency',
            title,
            message,
            related_id: requestId,
            created_at: new Date().toISOString(),
            is_read: 0
          });
        });
      }

      res.json({ success: true, id: requestId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/users/:id", (req, res) => {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
    res.json(user);
  });

  app.get("/api/stats", (req, res) => {
    try {
      const total = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
      const available = db.prepare("SELECT COUNT(*) as count FROM users WHERE availability = 1").get() as { count: number };
      res.json({
        total: total?.count || 0,
        available: available?.count || 0
      });
    } catch (err) {
      console.error("Stats API error:", err);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
