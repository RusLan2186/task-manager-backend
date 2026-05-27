import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { router as authRoutes } from "./routes/auth.routes";
import { router as projectsRoutes } from "./routes/project.routes";
import { router as taskRoutes } from "./routes/task.routes";
import { router as commentRoutes } from "./routes/comment.routes";
import { router as userRoutes } from "./routes/user.routes";
import { router as memberRoutes } from "./routes/member.routes";

import passport from "./lib/passport";

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://task-manager-frontend-ten-weld.vercel.app",
    ],
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(passport.initialize());
app.use("/auth", authRoutes);

app.use("/tasks/:taskId/comments", commentRoutes);
app.use("/projects/:projectId/tasks", taskRoutes);
app.use("/projects", projectsRoutes);
app.use("/users", userRoutes);
app.use("/projects/:projectId/members", memberRoutes);

const PORT = Number(process.env.PORT) || 3000;

app.get("/", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
