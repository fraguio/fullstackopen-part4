const { test, beforeEach, after } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const Blog = require("../models/blog");

const api = supertest(app);

const initialBlogs = [
  {
    title: "My first blog",
    author: "Author 1",
    url: "http://bloglist.com/my-first-blog",
    likes: 5,
  },
  {
    title: "My second blog",
    author: "Author 2",
    url: "http://bloglist.com/my-second-blog",
    likes: 3,
  },
];

beforeEach(async () => {
  await Blog.deleteMany({});
  await Blog.insertMany(initialBlogs);
});

test("blogs are returned in JSON format and with the correct quantity", async () => {
  const response = await api
    .get("/api/blogs")
    .expect(200)
    .expect("Content-Type", /application\/json/);

  assert.strictEqual(response.body.length, initialBlogs.length);
});

after(async () => {
  await mongoose.connection.close();
});
