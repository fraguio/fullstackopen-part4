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

test("unique identifier property of blog posts is called id", async () => {
  const response = await api.get("/api/blogs");
  const blog = response.body[0];
  assert.ok(blog.id);
  assert.strictEqual(blog._id, undefined);
});

test("POST to /api/blogs creates a new blog", async () => {
  const newBlog = {
    title: "My third blog",
    author: "Author 1",
    url: "http://bloglist.com/my-third-blog",
    likes: 5,
  };

  await api
    .post("/api/blogs")
    .send(newBlog)
    .expect(201)
    .expect("Content-Type", /application\/json/);

  const blogs = await Blog.find({});
  assert.strictEqual(blogs.length, initialBlogs.length + 1);
  assert.ok(blogs.some((b) => b.title === "My third blog"));
});

test("likes property takes the value 0 by default when it is not provided", async () => {
  const newBlog = {
    title: "My fourth blog",
    author: "Author 4",
    url: "http://bloglist.com/my-fourth-blog",
  };

  const response = await api
    .post("/api/blogs")
    .send(newBlog)
    .expect(201)
    .expect("Content-Type", /application\/json/);
  assert.deepStrictEqual(response.body.likes, 0);
});

after(async () => {
  await mongoose.connection.close();
});
