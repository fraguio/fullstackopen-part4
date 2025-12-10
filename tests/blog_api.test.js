const { describe, test, beforeEach, after } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const Blog = require("../models/blog");
const User = require("../models/user");
const bcrypt = require("bcrypt");

const api = supertest(app);

let token = "";
let authHeader = "";
let userId = "";

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

describe("4.23: fix blog tests after token auth implementation", () => {
  beforeEach(async () => {
    await Blog.deleteMany({});
    await User.deleteMany({});

    const passwordHash = await bcrypt.hash("password", 10);
    const user = new User({ username: "testuser", passwordHash });
    const savedUser = await user.save();
    userId = savedUser._id.toString();

    const loginRes = await api
      .post("/api/login")
      .send({ username: "testuser", password: "password" });
    token = loginRes.body.token;
    authHeader = `Bearer ${token}`;

    const blogsWithUser = initialBlogs.map((b) => ({ ...b, user: userId }));
    await Blog.insertMany(blogsWithUser);
  });

  test("blogs are returned in JSON format and with the correct quantity", async () => {
    const response = await api
      .get("/api/blogs")
      .set("Authorization", authHeader)
      .expect(200);
    assert.strictEqual(response.body.length, initialBlogs.length);
  });

  test("unique identifier property of blog posts is called id", async () => {
    const response = await api
      .get("/api/blogs")
      .set("Authorization", authHeader);
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
      .set("Authorization", authHeader)
      .send(newBlog)
      .expect(201);

    const blogs = await Blog.find({});
    assert.strictEqual(blogs.length, initialBlogs.length + 1);
    assert.ok(blogs.some((b) => b.title === newBlog.title));
  });

  test("likes property takes the value 0 by default when it is not provided", async () => {
    const newBlog = {
      title: "My fourth blog",
      author: "Author 4",
      url: "http://bloglist.com/my-fourth-blog",
    };

    const response = await api
      .post("/api/blogs")
      .set("Authorization", authHeader)
      .send(newBlog)
      .expect(201);
    assert.strictEqual(response.body.likes, 0);
  });

  test("title and url properties are required.", async () => {
    await api
      .post("/api/blogs")
      .set("Authorization", authHeader)
      .send({ author: "Author 5", url: "http://bloglist.com/my-fifth-blog" })
      .expect(400);
    await api
      .post("/api/blogs")
      .set("Authorization", authHeader)
      .send({ title: "My fifth blog", author: "Author 5" })
      .expect(400);
  });

  test("deleting an existing blog", async () => {
    const blogs = await Blog.find({});
    const blogToDelete = blogs[0];

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set("Authorization", authHeader)
      .expect(204);

    const undeleted = await Blog.find({});
    assert.strictEqual(undeleted.length, blogs.length - 1);
  });

  test("updating likes of an existing blog", async () => {
    const blogs = await Blog.find({});
    const blogToUpdate = blogs[0];
    const newLikes = 7;

    const response = await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .set("Authorization", authHeader)
      .send({ likes: newLikes })
      .expect(200);
    assert.strictEqual(response.body.likes, newLikes);
  });

  test("adding a blog fails with 401 if no token is provided", async () => {
    const newBlog = {
      title: "Unauthorized blog",
      author: "No Token",
      url: "http://bloglist.com/no-token",
    };
    await api.post("/api/blogs").send(newBlog).expect(401);
  });

  after(async () => {
    await mongoose.connection.close();
  });
});
