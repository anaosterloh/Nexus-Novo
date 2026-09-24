import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
import db, { initDb } from "./server/db";
import inventoryRoutes from "./server/routes/inventory";
import purchaseRequestRoutes from "./server/routes/purchaseRequests";
import salesRoutes from "./server/routes/sales";
import financeRoutes from "./server/routes/finance";
import purchaseOrderRoutes from "./server/routes/purchaseOrders";
import supplierRoutes from "./server/routes/suppliers";
import carrierRoutes from "./server/routes/carriers";
import equipmentRoutes from "./server/routes/equipments";
import entityRoutes from "./server/routes/entities";
import authRoutes from "./server/routes/auth";
import userRoutes from "./server/routes/users";
import auditRoutes from "./server/routes/audit";
import permissionRoutes from "./server/routes/permissions";
import settingsRoutes from "./server/routes/settings";
import notificationsRoutes from "./server/routes/notifications";

async function startServer() {
  // Initialize Database
  initDb();

  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer);
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", version: "2026.1.0" });
  });

  // Context Routes
  app.get("/api/context/companies", (req, res) => {
    const companies = db.prepare("SELECT * FROM companies WHERE status = 'active'").all();
    res.json(companies);
  });

  app.get("/api/context/branches/:companyId", (req, res) => {
    const branches = db.prepare("SELECT * FROM branches WHERE company_id = ? AND status = 'active'").all(req.params.companyId);
    res.json(branches);
  });

  // Register Module Routes
  app.use("/api/inventory", inventoryRoutes);
  app.use("/api/purchase-requests", purchaseRequestRoutes);
  app.use("/api/sales", salesRoutes);
  app.use("/api/finance", financeRoutes);
  app.use("/api/purchase-orders", purchaseOrderRoutes);
  app.use("/api/suppliers", supplierRoutes);
  app.use("/api/carriers", carrierRoutes);
  app.use("/api/equipments", equipmentRoutes);
  app.use("/api/entities", entityRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/audit", auditRoutes);
  app.use("/api/permissions", permissionRoutes);
  app.use("/api/settings", settingsRoutes);
  app.use("/api/notifications", notificationsRoutes);

  // Socket.io for Chat and Notifications
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    socket.on("disconnect", () => console.log("User disconnected"));
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

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Nexus ERP running on http://localhost:${PORT}`);
  });
}

startServer();
