const express = require('express');
const dotenv = require('dotenv');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();
const app = express();
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'models/gemini-2.0-flash'});

const upload = multer({ dest: 'uploads/' });

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
}); 


app.post('/generate-text', async (req, res) => {
const { prompt } = req.body;
  try {
    const result = await model.generateContent([prompt]);
    const response = await result.response;
    res.json({ output: response.text()});
  } catch (error) {
    console.error('Error generating text:', error);
    res.status(500).json({ error: 'Failed to generate text' });
  } 
});

function imageGenerativePart(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  return {
    inlineData: {
      mimeType: 'image/jpeg', // Ganti sesuai tipe gambar (image/png jika PNG)
      data: base64Image,
    }
  };
}

app.post('/generate-from-image', upload.single('image'), async (req, res) => {
const prompt = req.body.prompt || 'Describe gambar ini';
  const image = imageGenerativePart(req.file.path);
  try {
    const result = await model.generateContent([prompt, image]);
    const response = await result.response;
    res.json({ output: response.text()});
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  } finally { 
     fs.unlinkSync(req.file.path); // Clean up the uploaded file
  }
});



app.post('/generate-from-document', upload.single('document'), async (req, res) => {
const filepath = req.file.path;
const buffer = fs.readFileSync(filepath);
const base64Data = buffer.toString('base64');
const mimeType = req.file.mimetype;

  try {
    const documentPart = {
      inlineData: {
        mimeType: mimeType,
        data: base64Data,
      }
    };
    const result = await model.generateContent(['Analisa dokumen ini', documentPart]);
    const response = await result.response;
    res.json({ output: response.text()});
  } catch (error) {
    console.error('Error generating dokumen:', error);
    res.status(500).json({ error: 'Failed to generate dokumen' });
  } finally { 
     fs.unlinkSync(req.file.path); // Clean up the uploaded file
  }
});

app.post('/generate-from-audio', upload.single('audio'), async (req, res) => {
const audioBuffer = fs.readFileSync(req.file.path);
const base64Audio = audioBuffer.toString('base64');
const audioPart = {
    inlineData: {
      mimeType: req.file.mimetype,
      data: base64Audio,
    } 
};

    try {
      const result = await model.generateContent(['Analisa audio ini', audioPart]);
      const response = await result.response;
      res.json({ output: response.text()});
    } catch (error) {
      console.error('Error generating audio:', error);
      res.status(500).json({ error: 'Failed to generate audio' });
    } finally {
        fs.unlinkSync(req.file.path); // Clean up the uploaded file
    }
});

