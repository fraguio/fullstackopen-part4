const { describe, test, beforeEach, after } = require("node:test");
const app = require("../app");
const assert = require("node:assert");
const bcrypt = require("bcrypt");
const helper = require("../utils/users_helper");
const mongoose = require("mongoose");
const supertest = require("supertest");
const User = require("../models/user");

const api = supertest(app);

describe("when there is initially one user in db", () => {
  beforeEach(async () => {
    await User.deleteMany({});

    const passwordHash = await bcrypt.hash("sekret", 10);
    const user = new User({ username: "root", passwordHash });

    await user.save();
  });

  test("creation succeeds with a fresh username", async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: "artohellas",
      name: "Arto Hellas",
      password: "artohellas",
    };

    await api
      .post("/api/users")
      .send(newUser)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const usersAtEnd = await helper.usersInDb();
    assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1);

    const usernames = usersAtEnd.map((u) => u.username);
    assert(usernames.includes(newUser.username));
  });

  test("creation fails with proper statuscode and message if username already taken", async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: "root",
      name: "Superuser",
      password: "salainen",
    };

    const result = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    const usersAtEnd = await helper.usersInDb();
    assert(result.body.error.includes("expected `username` to be unique"));

    assert.strictEqual(usersAtEnd.length, usersAtStart.length);
  });

  test("creation fails with the correct status code and message if the username is less than 3 characters long.", async () => {
    const newUser = {
      username: "ar",
      name: "Arto Hellas",
      password: "artohellas",
    };

    const result = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    assert(
      result.body.error.includes("username must be at least 3 characters long")
    );
  });

  test("creation fails with the correct status code and message if the password is less than 3 characters long.", async () => {
    const newUser = {
      username: "arto",
      name: "Arto Hellas",
      password: "12",
    };

    const result = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    assert(
      result.body.error.includes("password must be at least 3 characters long")
    );
  });

  after(async () => {
    await mongoose.connection.close();
  });
});
