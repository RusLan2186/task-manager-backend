import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "./prisma";
import { Strategy as GithubStrategy } from "passport-github2";
import type {
  Profile as GoogleProfile,
  VerifyCallback as GoogleVerifyCallback,
} from "passport-google-oauth20";
import type { Profile as GithubProfile } from "passport-github2";

type GithubVerifyCallback = (
  error: Error | null,
  user?: Express.User | false,
  info?: object,
) => void;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: GoogleProfile,
      done: GoogleVerifyCallback,
    ) => {
      try {
        const email = profile.emails?.[0].value;

        if (!email) {
          return done(new Error("No email provided by Google"));
        }
        const name = profile.displayName;
        const providerId = profile.id;

        const user = await prisma.user.upsert({
          where: { providerId },
          update: {
            name,
            email,
          },
          create: {
            providerId,
            name,
            email,
            provider: "GOOGLE",
            emailVerified: true,
          },
        });

        return done(null, user);
      } catch (err) {
        return done(err as Error);
      }
    },
  ),
);

passport.use(
  new GithubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      callbackURL: process.env.GITHUB_CALLBACK_URL!,
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: GithubProfile,
      done: GithubVerifyCallback,
    ) => {
      try {
        const email =
          profile.emails?.[0]?.value ?? `${profile.username}@github.com`;

        if (!email) {
          return done(new Error("No email provided by Google"));
        }
        const name = profile.displayName;
        const providerId = profile.id;

        const user = await prisma.user.upsert({
          where: { providerId },
          update: {
            name,
            email,
          },
          create: {
            providerId,
            name,
            email,
            provider: "GITHUB",
            emailVerified: true,
          },
        });

        return done(null, user);
      } catch (err) {
        return done(err as Error);
      }
    },
  ),
);

export default passport;
