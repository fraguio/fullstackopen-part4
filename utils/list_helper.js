const _ = require("lodash");

const dummy = (blogs) => {
  return 1;
};

const totalLikes = (blogs) => {
  const reducer = (accumulator, blog) => {
    return accumulator + blog.likes;
  };

  return blogs.length === 0 ? 0 : blogs.reduce(reducer, 0);
};

const favoriteBlog = (blogs) => {
  if (blogs.length === 0) {
    return null;
  }

  const favorite = blogs.reduce(
    (prev, current) => (current.likes > prev.likes ? current : prev),
    blogs[0]
  );

  return {
    title: favorite.title,
    author: favorite.author,
    likes: favorite.likes,
  };
};

const mostBlogs = (blogs) => {
  if (blogs.length === 0) {
    return null;
  }

  const countByAuthor = _.countBy(blogs, "author");

  const blogsByAuthor = Object.entries(countByAuthor).map(
    ([author, blogs]) => ({
      author,
      blogs,
    })
  );

  return _.maxBy(blogsByAuthor, "blogs");
};

const mostLikes = (blogs) => {
  if (blogs.length === 0) {
    return null;
  }

  const blogsGroupByAuthor = _.groupBy(blogs, "author");
  const likesByAuthor = Object.entries(blogsGroupByAuthor).map(
    ([author, blogs]) => ({
      author,
      likes: blogs.reduce((sum, blog) => sum + blog.likes, 0),
    })
  );

  return _.maxBy(likesByAuthor, "likes");
};

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes,
};
