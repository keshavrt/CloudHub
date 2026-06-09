const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY || '';
console.log('API Key length:', apiKey.length);
if (!apiKey) {
  console.error('No GEMINI_API_KEY found!');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function test() {
  try {
    console.log('Testing generateContent with model "gemini-1.5-flash"...');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('Say hello.');
    console.log('Success with gemini-1.5-flash:', result.response.text());
  } catch (err) {
    console.error('Error with gemini-1.5-flash:', err.message);
  }

  try {
    console.log('Testing generateContent with model "gemini-2.5-flash"...');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent('Say hello.');
    console.log('Success with gemini-2.5-flash:', result.response.text());
  } catch (err) {
    console.error('Error with gemini-2.5-flash:', err.message);
  }

  try {
    console.log('Testing generateContent with model "gemini-1.5-pro"...');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const result = await model.generateContent('Say hello.');
    console.log('Success with gemini-1.5-pro:', result.response.text());
  } catch (err) {
    console.error('Error with gemini-1.5-pro:', err.message);
  }
}

test();
