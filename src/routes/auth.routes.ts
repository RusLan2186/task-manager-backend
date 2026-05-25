import express from "express";
import { getMe,  loginUser, logout, oauthCallback, registerUser, verifyEmailController } from "../controllers/auth.controller";

import passport from "passport";
import { authenticate } from "../middleware/auth.middleware";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", authenticate, getMe);
router.post("/logout", authenticate, logout);



router.post("/verify-email", verifyEmailController);

router.get("/google/callback", 
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  oauthCallback 
);

router.get("/google", passport.authenticate("google", { scope: ["email", "profile"] }));


router.get("/github", passport.authenticate("github", { scope: ["user:email"] }));

router.get("/github/callback",
  passport.authenticate("github", { session: false, failureRedirect: "/login" }),
  oauthCallback 
);

export { router };
