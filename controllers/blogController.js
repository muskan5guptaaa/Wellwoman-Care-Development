const Blog = require("../models/blogModel");
const Doctor=require("../models/doctorsModel")

const createBlog = async (req, res) => {
  const { title, content, tags } = req.body;
  const doctorId = req.doctorId; // Assuming doctorId is extracted from the token middleware

  try {
    const blog = new Blog({
      title,
      content,
      tags,
      doctorId,
    });

    await blog.save();

    res.status(201).json({
      success: true,
      message: "Blog created successfully",
      data: blog,
    });
  } catch (error) {
    console.error("Error creating blog:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create blog",
      error: error.message,
    });
  }
};

const getBlogsByDoctor = async (req, res) => {
    const doctorId = req.params.doctorId; // Doctor ID from URL
  
    try {
      const blogs = await Blog.find({ doctorId });
      res.status(200).json({
        success: true,
        message: "Blogs retrieved successfully",
        data: blogs,
      });
    } catch (error) {
      console.error("Error retrieving doctor's blogs:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve blogs",
        error: error.message,
      });
    }
  };
  
module.exports={
    createBlog,
    getBlogsByDoctor
}