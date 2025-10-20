import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Analyze sentiment of article
export const analyzeSentiment = async (text) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const prompt = `Analyze the sentiment of the following news article and respond with ONLY ONE WORD: either "Positive", "Negative", or "Neutral". Do not include any explanation or additional text.

Article:
${text.substring(0, 2000)}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const sentiment = response.text().trim();
    
    // Validate response
    const validSentiments = ['Positive', 'Negative', 'Neutral'];
    if (validSentiments.includes(sentiment)) {
      return sentiment;
    }
    
    // Fallback if response is not valid
    return 'Neutral';
  } catch (error) {
    console.error('Error analyzing sentiment:', error.message);
    return 'Neutral';
  }
};

// Generate summary of article
export const generateSummary = async (title, content) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const prompt = `Summarize the following news article in 3-4 concise sentences. Focus on the key facts and main points.

Title: ${title}

Content:
${content.substring(0, 3000)}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Error generating summary:', error.message);
    return 'Unable to generate summary at this time.';
  }
};

// Generate key points
export const generateKeyPoints = async (title, content) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const prompt = `Extract 4-5 key points from the following news article. Format as a bullet list.

Title: ${title}

Content:
${content.substring(0, 3000)}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Error generating key points:', error.message);
    return 'Unable to generate key points at this time.';
  }
};

// Explain in simple words
export const explainSimply = async (title, content) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const prompt = `Explain the following news article in simple, easy-to-understand language suitable for a general audience. Avoid jargon and technical terms.

Title: ${title}

Content:
${content.substring(0, 3000)}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Error explaining simply:', error.message);
    return 'Unable to generate simple explanation at this time.';
  }
};

// Answer custom question (can be about article or general topic)
export const answerQuestion = async (title, content, question) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const prompt = `You are a helpful AI assistant. Answer the following question: "${question}"

Context (News Article):
Title: ${title}
Content: ${content.substring(0, 2000)}

Instructions:
- If the question is about the article, answer based on the article content and also provide a detailed explanation of the topic asked
- If the question is about a general topic (like "What is API Gateway?"), provide a detailed explanation of that topic
- Provide clear, concise, and informative answers
- Use simple language that's easy to understand`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Error answering question:', error.message);
    return 'Unable to answer question at this time.';
  }
};

// Get complete analysis (sentiment + summary + key points)
export const getCompleteAnalysis = async (title, content, description) => {
  try {
    const fullText = `${title}\n\n${description}\n\n${content}`;
    
    // Run sentiment and summary in parallel
    const [sentiment, summary, keyPoints] = await Promise.all([
      analyzeSentiment(fullText),
      generateSummary(title, fullText),
      generateKeyPoints(title, fullText)
    ]);
    
    return {
      sentiment,
      summary,
      keyPoints,
      qa: [
        {
          question: "Explain in simple words",
          type: "simple"
        },
        {
          question: "What are the key points?",
          type: "keypoints",
          answer: keyPoints
        }
      ]
    };
  } catch (error) {
    console.error('Error in complete analysis:', error.message);
    throw error;
  }
};
