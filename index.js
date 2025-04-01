import "dotenv/config";
import express from "express";
import multer from "multer";
import cors from "cors";
import cloudinary from "cloudinary";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// Set up Multer for image uploads
const upload = multer({ storage: multer.memoryStorage() });

// 📌 Upload image to Cloudinary
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    cloudinary.uploader.upload_stream({ resource_type: "image" }, (error, result) => {
      if (error) return res.status(500).json({ error });
      res.json({ imageUrl: result.secure_url });
    }).end(req.file.buffer);
  } catch (err) {
    res.status(500).json({ error: "Upload failed!" });
  }
});

// 📌 Generate Ghibli-style Image using Replicate API
app.post("/generate-ghibli", async (req, res) => {
  try {
    const { imageUrl } = req.body;

    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "stable-diffusion-ghibli-model-id",
        input: { image: imageUrl },
      }),
    });

    const data = await response.json();
    res.json({ generatedImageUrl: data.output });
  } catch (err) {
    res.status(500).json({ error: "Ghibli image generation failed!" });
  }
});

// 📌 Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 