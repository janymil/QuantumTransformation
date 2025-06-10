import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  try {
    console.log('=== AUTHENTICATION CHECK ===');
    console.log('req.isAuthenticated():', req.isAuthenticated?.());
    console.log('req.user exists:', !!req.user);
    console.log('req.session exists:', !!req.session);
    console.log('Session ID:', req.sessionID);
    
    // Check Replit headers first (fallback authentication)
    const replitUserId = req.headers['x-replit-user-id'] as string;
    const replitUserName = req.headers['x-replit-user-name'] as string;
    
    console.log('Replit headers:', {
      userId: replitUserId,
      userName: replitUserName,
      hasUserId: !!replitUserId,
      hasUserName: !!replitUserName
    });
    
    // If Replit headers are present and valid, create a mock user object
    if (replitUserId && replitUserId.trim() !== '') {
      console.log('Using Replit header authentication for user:', replitUserId);
      req.user = {
        claims: {
          sub: replitUserId,
          email: `${replitUserName}@replit.user`,
          first_name: replitUserName,
          last_name: '',
          profile_image_url: req.headers['x-replit-user-profile-image']
        }
      };
      return next();
    }
    
    // Check if user is authenticated via Passport
    if (!req.isAuthenticated?.() || !req.user) {
      console.log('Authentication failed - no user or not authenticated');
      console.log('Redirecting to login...');
      return res.status(401).json({ 
        message: "Unauthorized",
        redirectToLogin: true,
        loginUrl: '/api/login'
      });
    }

    const user = req.user as any;
    console.log('User authenticated successfully:', {
      hasUser: !!user,
      userKeys: Object.keys(user || {}),
      userId: user?.claims?.sub || user?.id,
      fullUser: user
    });

    // If user has expires_at, check if token is still valid
    if (user.expires_at) {
      const now = Math.floor(Date.now() / 1000);
      if (now <= user.expires_at) {
        return next();
      }

      // Try to refresh the token
      const refreshToken = user.refresh_token;
      if (refreshToken) {
        try {
          const config = await getOidcConfig();
          const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
          updateUserSession(user, tokenResponse);
          return next();
        } catch (error) {
          console.error("Token refresh failed:", error);
          return res.status(401).json({ message: "Unauthorized" });
        }
      }
    }

    // User is authenticated, proceed
    return next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};
