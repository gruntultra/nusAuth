// ./src/auth-routes.js

const express = require("express");
const passport = require("@passport-next/passport");

const router = express.Router();

router.get("/login", passport.authenticate("nusnet", {
  scope: "nickname",
}), function(req, res){ res.redirect("/")});

router.get("/auth/nusnet/return", passport.authenticate('nusnet', { failureRedirect: '/login' }),
  function(req, res) {
    console.log(res),
    res.redirect('/');
  });

router.get("/callback", (req, res, next) => {
  passport.authenticate("nusnet",  (err, user) => {
    if (err) return next(err);
    if (!user) return res.redirect("/login");
    req.logIn(user, (err) => {
      if (err) return next(err);
      res.redirect("/");
    });
  })(req, res, next);
});

router.get("/logout", (req, res) => {
  req.logout();
  res.redirect('/');
});

module.exports = router;