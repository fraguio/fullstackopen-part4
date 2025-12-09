const bcrypt = require("bcrypt");
const usersRouter = require("express").Router();
const User = require("../models/user");

usersRouter.get("/", async (request, response, next) => {
  try {
    const users = await User.find({});
    response.status(200).json(users);
  } catch (error) {
    next(error);
  }
});

usersRouter.post("/", async (request, response, next) => {
  const { username, name, password } = request.body;

  if (!username || username.length < 3) {
    return response.status(400).json({
      error: "username must be at least 3 characters long",
    });
  }

  if (!password || password.length < 3) {
    return response.status(400).json({
      error: "password must be at least 3 characters long",
    });
  }

  try {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = new User({
      username,
      name,
      passwordHash,
    });

    const savedUser = await user.save();
    response.status(201).json(savedUser);
  } catch (error) {
    next(error);
  }
});

module.exports = usersRouter;
