import { Request, Response, NextFunction } from 'express';
import { asyncErrorHandler } from '../middleware/error.middleware';
import Blog from '../models/blogModel';
import ErrorHandler from '../utils/errorHandler';

// -------------- List of Apis ------------------------
// 1.newBlog
// 2.getBlogs
// 3.getBlogsByCategory
// 4.getBlogById
// 5.updateBlog
// 6.deleteBlog


export const newBlog = asyncErrorHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { socialMediaUrl, thumbnailUrl, title, description, author, socialMediaType } = req.body;
  const { blogId } = req.query;

  console.log(req.body);

  const existingBlog = await Blog.findById(blogId);

  if (existingBlog) {
    if (title) existingBlog.title = title;
    if (thumbnailUrl) existingBlog.thumbnailUrl = thumbnailUrl;
    if (description) existingBlog.description = description;
    if (author) existingBlog.author = author;
    if (socialMediaUrl) existingBlog.socialMediaUrl = socialMediaUrl;
    if (socialMediaType) existingBlog.socialMediaType = socialMediaType;

    await existingBlog.save();
    return res.status(201).json({
      success: true,
      message: "Blog updated successfully",
      data: existingBlog,
    });
  } else {
    const blog = new Blog({
      socialMediaUrl,
      thumbnailUrl,
      title,
      description,
      author,
      socialMediaType
    });
    await blog.save();
    return res.status(201).json({
      success: true,
      message: "New blog created successfully",
      data: blog,
    });
  }
});

export const getBlogs = asyncErrorHandler(async (req: Request, res: Response, next: NextFunction) => {
  const blogs = await Blog.find();
  res.status(200).json({ success: true, data: blogs });
});

export const getBlogById = asyncErrorHandler(async (req: Request, res: Response, next: NextFunction) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) {
    return next(new ErrorHandler("Blog not found", 404));
  }
  res.status(200).json({ success: true, data: blog });
});

export const updateBlog = asyncErrorHandler(async (req: Request, res: Response, next: NextFunction) => {
  const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!blog) {
    return next(new ErrorHandler("Blog not found", 404));
  }
  res.status(200).json({ success: true, data: blog });
});

export const deleteBlog = asyncErrorHandler(async (req: Request, res: Response, next: NextFunction) => {
  const blog = await Blog.findByIdAndDelete(req.params.id);
  if (!blog) {
    return next(new ErrorHandler("Blog not found", 404));
  }
  res.status(200).json({ success: true, data: blog });
});
