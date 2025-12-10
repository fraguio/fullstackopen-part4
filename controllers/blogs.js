const blogsRouter = require("express").Router();
const Blog = require("../models/blog");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const getTokenFrom = (request) => {
  const authorization = request.get("authorization");
  if (authorization && authorization.startsWith("Bearer ")) {
    return authorization.replace("Bearer ", "");
  }
  return null;
};

blogsRouter.delete("/:id", async (request, response, next) => {
  try {
    const deleted = await Blog.findByIdAndDelete(request.params.id);
    if (deleted) {
      response.status(204).end();
    } else {
      response.status(404).end();
    }
  } catch (err) {
    next(err);
  }
});

blogsRouter.get("/", async (request, response, next) => {
  try {
    const blogs = await Blog.find({}).populate("user", {
      username: 1,
      name: 1,
    });
    response.status(200).json(blogs);
  } catch (error) {
    next(error);
  }
});

blogsRouter.post("/", async (request, response, next) => {
  try {
    const { title, author, url, likes } = request.body;

    const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET);
    if (!decodedToken.id) {
      return response.status(401).json({ error: "token invalid" });
    }
    let user = await User.findById(decodedToken.id);

    let blog = new Blog({
      title,
      author,
      url,
      likes: likes,
      user: user.id,
    });

    const newBlog = await blog.save();
    user.blogs = user.blogs.concat(newBlog.id);
    await user.save();

    response.status(201).location(`/api/blogs/${newBlog._id}`).json(newBlog);
  } catch (err) {
    next(err);
  }
});

blogsRouter.put("/:id", async (request, response, next) => {
  try {
    const updatedBlog = await Blog.findByIdAndUpdate(
      request.params.id,
      request.body,
      { new: true }
    );

    if (updatedBlog) {
      response.status(200).json(updatedBlog).end();
    } else {
      response.status(404).end();
    }
  } catch (error) {
    next(error);
  }
});

module.exports = blogsRouter;
