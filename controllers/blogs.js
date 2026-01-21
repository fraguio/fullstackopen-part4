const blogsRouter = require("express").Router();
const Blog = require("../models/blog");

blogsRouter.delete("/:id", async (request, response, next) => {
  try {
    if (!request.user) {
      return response.status(401).json({ error: "unauthorized" });
    }

    const blog = await Blog.findById(request.params.id);

    if (!blog) {
      return response.status(404).end();
    }

    if (blog.user.toString() !== request.user.id) {
      return response.status(401).json({ error: "unauthorized" });
    }

    await blog.deleteOne();
    const user = request.user;
    user.blogs = user.blogs.filter(
      (blogId) => blogId.toString() !== request.params.id.toString(),
    );
    await user.save();
    response.status(204).end();
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
    if (!request.user) {
      return response.status(401).json({ error: "unauthorized" });
    }

    const { title, author, url, likes } = request.body;

    const user = request.user;

    let blog = new Blog({
      title,
      author,
      url,
      likes: likes,
      user: user.id,
    });

    const newBlog = await blog.save();
    await newBlog.populate("user", { username: 1, name: 1 });
    user.blogs = user.blogs.concat(newBlog.id);
    await user.save();

    response.status(201).location(`/api/blogs/${newBlog._id}`).json(newBlog);
  } catch (err) {
    next(err);
  }
});

blogsRouter.post("/:id/comments", async (request, response, next) => {
  try {
    const { comment } = request.body;

    if (!comment) {
      return response.status(400).json({ error: "comment content is missing" });
    }

    // Buscamos el blog y actualizamos el array 'comments' usando el operador $push de MongoDB
    // { new: true } devuelve el documento actualizado en lugar del original
    const updatedBlog = await Blog.findByIdAndUpdate(
      request.params.id,
      { $push: { comments: comment } },
      { new: true, runValidators: true },
    ).populate("user", { username: 1, name: 1 });

    if (!updatedBlog) {
      return response.status(404).json({ error: "blog not found" });
    }

    response.status(201).json(updatedBlog);
  } catch (err) {
    next(err);
  }
});

blogsRouter.put("/:id", async (request, response, next) => {
  try {
    const updatedBlog = await Blog.findByIdAndUpdate(
      request.params.id,
      request.body,
      { new: true, runValidators: true, context: "query" },
    ).populate("user", { username: 1, name: 1 });
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
