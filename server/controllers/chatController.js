import {
  getCompleteAnalysis,
  explainSimply,
  answerQuestion
} from '../services/geminiService.js';

// Get AI analysis of article
export const analyzeArticle = async (req, res) => {
  try {
    const { title, content, description } = req.body;
    
    // Use content if available, otherwise use description
    const articleText = content || description;
    
    if (!title || !articleText) {
      return res.status(400).json({
        success: false,
        message: 'Title and content/description are required'
      });
    }
    
    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        success: false,
        message: 'AI service is not configured. Please add GEMINI_API_KEY to .env file.'
      });
    }
    
    const analysis = await getCompleteAnalysis(title, articleText, description || '');
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Error in analyzeArticle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze article',
      error: error.message
    });
  }
};

// Handle follow-up questions
export const askQuestion = async (req, res) => {
  try {
    const { title, content, description, question, type } = req.body;
    
    // Use content if available, otherwise use description
    const articleText = content || description;
    
    if (!title || !articleText || !question) {
      return res.status(400).json({
        success: false,
        message: 'Title, content/description, and question are required'
      });
    }
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        success: false,
        message: 'AI service is not configured'
      });
    }
    
    let answer;
    
    // Handle predefined question types
    if (type === 'simple') {
      answer = await explainSimply(title, articleText);
    } else {
      answer = await answerQuestion(title, articleText, question);
    }
    
    res.json({
      success: true,
      data: {
        question,
        answer
      }
    });
  } catch (error) {
    console.error('Error in askQuestion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to answer question',
      error: error.message
    });
  }
};
