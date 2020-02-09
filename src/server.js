// ./src/server.js

require("dotenv").config();
const express = require("express");
const http = require("http");
const next = require("next");
const session = require("express-session");
// 1 - importing dependencies
const passport = require("@passport-next/passport");
const NUSStrategy = require("passport-nus-openid").Strategy;
const uid = require('uid-safe');
const authRoutes = require("./auth-routes");
const thoughtsAPI = require("./thoughts-api");

const dev = process.env.NODE_ENV !== "production";
const app = next({
  dev,
  dir: "./src"
});
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  // 2 - add session management to Express
  const sessionConfig = {
    secret: uid.sync(18),
    cookie: {
      maxAge: 86400 * 1000 // 24 hours in milliseconds
    },
    resave: false,
    saveUninitialized: true
  };
  server.use(session(sessionConfig));

  // 3 - configuring Auth0Strategy
  const nusStrategy = new NUSStrategy(
    {
      returnURL: 'http://localhost:3000/auth/nusnet/return',
      realm: 'http://localhost:3000/'
    },
    function(accessToken, refreshToken, extraParams, profile, done) {
      return done(null, profile);
    }
  );

  // 4 - configuring Passport
  passport.use(nusStrategy);
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user));

  // 5 - adding Passport and authentication routes
  server.use(passport.initialize());
  server.use(passport.session());
  server.use(authRoutes);

  server.use(thoughtsAPI);

  // 6 - you are restricting access to some routes
  const restrictAccess = (req, res, next) => {
    if (!req.isAuthenticated()) return res.redirect("/login");
    next();
  };

  server.use("/profile", restrictAccess);
  server.use("/share-thought", restrictAccess);

  // handling everything else with Next.js
  server.get("*", handle);

  http.createServer(server).listen(process.env.PORT, () => {
    console.log(`listening on port ${process.env.PORT}`);
  });
});