import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";

const hotelSchema: Schema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      name: { type: SchemaType.STRING },
      location: { type: SchemaType.STRING },
      price: { type: SchemaType.STRING, description: "Price per night with currency" },
      rating: { type: SchemaType.STRING },
      description: { type: SchemaType.STRING },
      amenities: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      image_keyword: { type: SchemaType.STRING, description: "A keyword for a hotel photo (e.g., 'modern-suite')" }
    },
    required: ["name", "location", "price", "rating", "description", "amenities", "image_keyword"]
  }
};

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export const getHotels = async (destination: string, checkIn: string, checkOut: string, guests: number) => {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash",
    generationConfig: { responseMimeType: "application/json", responseSchema: hotelSchema }
  });

  const prompt = `Search for 5 real hotels in ${destination} for ${guests} guests from ${checkIn} to ${checkOut}.`;
  
  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
};