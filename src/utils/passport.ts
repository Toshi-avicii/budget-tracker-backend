import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import config from "../config/";

passport.use(
  new GoogleStrategy(
    {
      clientID: config.googleId,
      clientSecret: config.googleSecret,
      callbackURL: `${config.backendUrl}/auth/google/callback`,
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done
    ) => {
      const user = {
        id: profile.id,
        name: profile.displayName,
        email: profile.emails?.[0].value,
        picture: profile.photos?.[0].value,
        isSignedUpWithGoogle: true
      };

      return done(null, user);
    }
  )
);
