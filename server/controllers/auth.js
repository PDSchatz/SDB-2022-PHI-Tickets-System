const router = require("express").Router();
const bcrypt = require("bcryptjs");
const { User, asrUser, reqUser } = require("../models/base-user");
const SALT = process.env.SALT || 10;
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.SECRET_KEY;
const KEY_EXPIRATION = process.env.KEY_EXPIRATION;
const session = require("../middlewares/session");
const mongoose = require("mongoose")

// create/modify/delete assessor user
router
  .route("/asr")
  // session middleware verifies token
  .post([session], async (req, res, next) => {
    // if user is not admin, returns forbidden status
    if (!req.user.isAdmin) {
      res.status(403).json({
        status: "Forbidden-asr",
      });
    } else {
      const { firstName, lastName, email, password } = req.body;
      try {
        if (!firstName || !lastName || !email || !password) {
          throw new Error("Insufficient data");
        } else {
          const newUser = new asrUser({
            firstName,
            lastName,
            email,
            password: bcrypt.hashSync(password, parseInt(SALT)),
          });
          req.body.isAdmin ? (newUser.isAdmin = true) : null;

          await newUser.save();
          res.status(201).json({
            status: "user created",
            newUser,
          });
        }
      } catch (err) {
        // pass error to error-handling middleware at the bottom
        next(err);
      }
    }
  })
  .put([session], async (req, res, next) => {
    try {
      if(!req.user.isAdmin){
        throw new Error('user is not a super admin')
      } else {
        const { _id } = req.body;
        let userToModify = await asrUser.findOne({ _id });
        if (!userToModify) {
          throw new Error("no user with that ID exists");
        } else {
          // loop through request body
          for (field in req.body) {
            // only update fields that exist in the request
            if (field === "password") {
              userToModify[field] = bcrypt.hashSync(
                req.body[field],
                parseInt(SALT)
              );
            } else {
              userToModify[field] = req.body[field];
            }
          }
          await userToModify.save();
          res.status(202).json({
            status: "user updated",
            userToModify,
          });
        }
      }
    } catch (err) {
      // pass error to error-handling middleware at the bottom
      next(err);
    }
  })
  .delete([session], async (req,res,next) => {
    try {
      if(!req.user.isAdmin){
        throw new Error("user must be an admin")
      } else {
        const { _id } = req.body
        let userToDelete = await asrUser.findById(_id);
        if(!userToDelete){
          throw new Error("could not find a user with that ID")
        } else {
          //TODO: front-end should include deletion validation (IE: "are you sure you want to delete this user? This action is not reverisble")
          await userToDelete.delete()
          res.status(200).json({
            status: "user has been deleted"
          })
        }
      }
    } catch (error) {
      next(error)
    }
  })

// create/modify/delete requestor user
router
  .route("/req")
  // session middleware verifies token
  .post([session], async (req, res, next) => {
    if (!req.user.isManager) {
      // if user making request is not a manager, send forbidden status
      res.status(403).json({
        status: "Forbidden",
      });
    } else {
      const { firstName, lastName, email, role, password } = req.body;
      try {
        if (!firstName || !lastName || !email || !role || !password) {
          throw new Error("Insufficient data");
        } else {
          const newUser = new reqUser({
            firstName,
            lastName,
            email,
            role,
            password: bcrypt.hashSync(password, parseInt(SALT)),
          });
          req.body.isManager ? (newUser.isManager = true) : null;

          try {
            await newUser.save();
            res.status(201).json({
              status: "user created",
              newUser,
            });
          } catch (error) {
            const missingData = Object.keys(error.errors);
            throw new Error(
              `you are missing the following data: ${[...missingData]}`
            );
          }
        }
      } catch (err) {
        // pass error to error-handling middleware at the bottom
        next(err);
      }
    }
  })
  .put([session], async (req, res, next) => {
    try {
      const { _id } = req.body;
      if(!req.user.isManager){
        throw new Error('User is not a manager')
      } else {
        let userToModify = await reqUser.findOne({ _id });
        if (!userToModify) {
          throw new Error("no user with that ID exists");
        } else {
          // loop through req body
          for (field in req.body) {
            // only update fields included in req body
            if (field === "password") {
              userToModify[field] = bcrypt.hashSync(
                req.body[field],
                parseInt(SALT)
              );
            } else {
              userToModify[field] = req.body[field];
            }
          }
          try {
            await userToModify.save();
            res.status(202).json({
              status: "user updated",
              userToModify,
            });
          } catch (error) {
            //if the error is a validation error, change the error message to include the missing fields
            if(error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.ValidatorError) {
              const missingData = Object.keys(error.errors);
              throw new Error(
                `user could not be updated because: you are missing the following data: ${[
                  ...missingData,
                ]}`
              );
            } else {
              // generic error
              // TODO: research how mongoose constructs error to create better error handling message
              throw new Error(`something went wrong while updating user`)
            }
          }
        }
      }
    } catch (err) {
      // pass error to error-handling middleware at the bottom
      
      next(err);
    }
  })
  .delete([session], async (req, res, next) => {
    try {
      if(!req.user.isManager){
        throw new Error("user must be a manager")
      } else {
        const { _id } = req.body
        let userToDelete = await reqUser.findOne({ _id });
        if(!userToDelete){
          throw new Error("could not find a user with that ID")
        } else {
          //TODO: front-end should include deletion validation (IE: "are you sure you want to delete this user? This action is not reverisble")
          await userToDelete.delete()
          res.status(200).json({
            status: "user has been deleted"
          })
        }
      }
    } catch (error) {
      next(error)
    }
  })

// login for assessor and requestor users
router.route("/login").post(async (req, res, next) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      throw new Error("both email & password are required");
    } else {
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error("no user with that email can be found");
      } else {
        const verifyPW = await bcrypt.compare(password, user.password);
        if (!verifyPW) {
          const badPW = new Error("incorrect password!");
          badPW.status = 403;
          throw badPW;
        } else {
          const token = jwt.sign(
            {
              _id: user._id,
              email: user.email,
            },
            SECRET_KEY,
            {
              expiresIn: KEY_EXPIRATION,
            }
          );
          res.status(200).json({
            status: "logged in",
            token,
            user,
          });
        }
      }
    }
  } catch (error) {
    if (error.status) {
      res.status(error.status).json({
        status: error.message,
      });
    } else {
      // pass error to error-handling middleware at the bottom
      next(error);
    }
  }
});

// universal error handler
// any error thrown above goes through this
router.use((err, req, res, next) => {
  console.log(err);
  res.status(500).json({
    status: err.message,
  });
});
module.exports = router;