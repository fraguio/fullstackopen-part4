const blogsRouter = require("express").Router();
const Blog = require("../models/blog");
const User = require("../models/user");

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

    let blog = new Blog({
      title,
      author,
      url,
      likes: likes,
    });

    let user = undefined;
    const usersInDb = await User.find({});

    if (usersInDb && usersInDb.length > 0) {
      user = usersInDb[0];
      blog.user = user.id;
    }

    const newBlog = await blog.save();
    if (user) {
      user.blogs = user.blogs.concat(newBlog.id);
      await user.save();
    }

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
