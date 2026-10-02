require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function extractTicket() {
  const customerMessage =
    "Hey, my order #1042 arrived yesterday, but the left ear of my Sony headphones is broken. Can I get a refund?";
  const prompt = `Extract the details from this message into JSON with these keys:
- orderId (string)
- product (string)
- issue (string)
- requestType (string, e.g. refund, return, repair)
Customer message: "${customerMessage}"`;

    const response = await ai.models.generateContent({
        model:"gemini-3.5-flash-lite",
        contents:prompt,
        config:{
            responseMimeType:"application/json"
        }
    })

    const ticket = JSON.parse(response.text)

    console.log(ticket)
}
extractTicket()
