const blogsRouter = require("express").Router();
const Blog = require("../models/blog");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

blogsRouter.delete("/:id", async (request, response, next) => {
  try {
    const blog = await Blog.findById(request.params.id);
    if (blog) {
      const decodedToken = jwt.verify(request.token, process.env.SECRET);
      if (blog.user.toString() === decodedToken.id.toString()) {
        await blog.deleteOne();
        const user = await User.findById(decodedToken.id.toString());
        user.blogs = user.blogs.filter(
          (blogId) => blogId.toString() !== request.params.id.toString()
        );
        await user.save();
        response.status(204).end();
      } else {
        response
          .status(401)
          .json({ error: "user not authorized to delete this blog" });
      }
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

    const decodedToken = jwt.verify(request.token, process.env.SECRET);
    if (!decodedToken.id) {
      return response.status(401).json({ error: "token invalid" });
    }

    const user = await User.findById(decodedToken.id);

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
