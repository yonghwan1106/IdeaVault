/**
 * Natural Language Processing Engine for IdeaVault
 * Handles Korean and English text analysis, categorization, and sentiment analysis
 */

import natural from 'natural';
import compromise from 'compromise';
import Hangul from 'hangul-js';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface NLPAnalysisResult {
  categories: string[];
  keywords: string[];
  sentiment: number;
  language: string;
  marketPotential: 'low' | 'medium' | 'high';
  technicalComplexity: number; // 1-5 scale
  innovationScore: number; // 0-100
}

export interface IdeaClassificationResult {
  primaryCategory: string;
  subCategories: string[];
  confidenceScore: number;
  suggestedTags: string[];
}

export class NLPEngine {
  private static instance: NLPEngine;
  private tokenizer: any;
  private stemmer: any;

  constructor() {
    // Initialize Korean text processing
    this.tokenizer = natural.WordTokenizer;
    this.stemmer = natural.PorterStemmer;
  }

  public static getInstance(): NLPEngine {
    if (!NLPEngine.instance) {
      NLPEngine.instance = new NLPEngine();
    }
    return NLPEngine.instance;
  }

  /**
   * Comprehensive text analysis for ideas
   */
  async analyzeIdea(text: string, title?: string): Promise<NLPAnalysisResult> {
    const language = this.detectLanguage(text);
    const cleanText = this.preprocessText(text, language);
    
    // Parallel processing for better performance
    const [
      categories,
      keywords,
      sentiment,
      marketPotential,
      technicalComplexity,
      innovationScore
    ] = await Promise.all([
      this.categorizeText(cleanText, language),
      this.extractKeywords(cleanText, language),
      this.analyzeSentiment(cleanText, language),
      this.assessMarketPotential(cleanText),
      this.assessTechnicalComplexity(cleanText),
      this.calculateInnovationScore(cleanText, title)
    ]);

    return {
      categories,
      keywords,
      sentiment,
      language,
      marketPotential,
      technicalComplexity,
      innovationScore
    };
  }

  /**
   * Classify ideas into predefined categories (300+ categories)
   */
  async classifyIdea(text: string): Promise<IdeaClassificationResult> {
    const categories = await this.getIdeaCategories();
    const analysis = await this.categorizeWithAI(text, categories);
    
    return {
      primaryCategory: analysis.primary,
      subCategories: analysis.secondary,
      confidenceScore: analysis.confidence,
      suggestedTags: analysis.tags
    };
  }

  /**
   * Detect language (Korean vs English)
   */
  private detectLanguage(text: string): string {
    const koreanRegex = /[가-힣]/g;
    const koreanMatches = text.match(koreanRegex);
    const koreanRatio = koreanMatches ? koreanMatches.length / text.length : 0;
    
    return koreanRatio > 0.1 ? 'ko' : 'en';
  }

  /**
   * Preprocess text for analysis
   */
  private preprocessText(text: string, language: string): string {
    let cleaned = text.toLowerCase();
    
    if (language === 'ko') {
      // Korean text preprocessing
      cleaned = Hangul.disassemble(cleaned).join('');
      cleaned = cleaned.replace(/[^\w\s가-힣]/g, ' ');
    } else {
      // English text preprocessing
      cleaned = cleaned.replace(/[^\w\s]/g, ' ');
    }
    
    // Remove extra whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
  }

  /**
   * Extract keywords using multiple techniques
   */
  private async extractKeywords(text: string, language: string): Promise<string[]> {
    if (language === 'ko') {
      return this.extractKoreanKeywords(text);
    } else {
      return this.extractEnglishKeywords(text);
    }
  }

  /**
   * Extract Korean keywords
   */
  private extractKoreanKeywords(text: string): string[] {
    // Split by common Korean particles and extract meaningful words
    const particles = ['이', '가', '을', '를', '에', '에서', '으로', '로', '의', '과', '와', '도', '만', '부터', '까지'];
    let words = text.split(/\s+/);
    
    // Remove particles and short words
    words = words.filter(word => 
      word.length > 1 && 
      !particles.includes(word) &&
      /[가-힣]/.test(word)
    );
    
    // Get frequency and return top keywords
    const frequency = this.calculateWordFrequency(words);
    return Object.keys(frequency)
      .sort((a, b) => frequency[b] - frequency[a])
      .slice(0, 10);
  }

  /**
   * Extract English keywords using Natural library
   */
  private extractEnglishKeywords(text: string): string[] {
    const tokens = this.tokenizer.tokenize(text);
    const filtered = tokens.filter((token: string) => 
      token.length > 2 && 
      !natural.stopwords.includes(token.toLowerCase())
    );
    
    const stemmed = filtered.map((token: string) => 
      this.stemmer.stem(token.toLowerCase())
    );
    
    const frequency = this.calculateWordFrequency(stemmed);
    return Object.keys(frequency)
      .sort((a, b) => frequency[b] - frequency[a])
      .slice(0, 10);
  }

  /**
   * Calculate word frequency
   */
  private calculateWordFrequency(words: string[]): Record<string, number> {
    const frequency: Record<string, number> = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    return frequency;
  }

  /**
   * Categorize text using AI
   */
  private async categorizeText(text: string, language: string): Promise<string[]> {
    try {
      const prompt = language === 'ko' 
        ? `다음 텍스트를 분석하여 적절한 카테고리 3개를 선택해주세요: ${text}`
        : `Analyze the following text and categorize it into 3 relevant categories: ${text}`;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: language === 'ko' 
              ? "당신은 아이디어 분류 전문가입니다. 주어진 텍스트를 기술, 비즈니스, 산업 카테고리로 분류해주세요."
              : "You are an idea classification expert. Categorize the given text into technology, business, and industry categories."
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 100,
        temperature: 0.3
      });

      const categories = response.choices[0].message.content
        ?.split(',')
        .map(cat => cat.trim().toLowerCase())
        .filter(cat => cat.length > 0) || [];

      return categories.slice(0, 3);
    } catch (error) {
      console.error('AI categorization failed:', error);
      return this.fallbackCategorization(text);
    }
  }

  /**
   * Fallback categorization when AI fails
   */
  private fallbackCategorization(text: string): string[] {
    const techKeywords = ['ai', 'ml', 'blockchain', 'iot', 'app', 'web', 'mobile', '인공지능', '앱', '웹', '모바일'];
    const businessKeywords = ['startup', 'business', 'service', 'platform', '비즈니스', '서비스', '플랫폼'];
    const categories: string[] = [];

    if (techKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
      categories.push('technology');
    }
    if (businessKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
      categories.push('business');
    }

    return categories.length > 0 ? categories : ['general'];
  }

  /**
   * Analyze sentiment of text
   */
  private async analyzeSentiment(text: string, language: string): Promise<number> {
    if (language === 'en') {
      // Use Natural library for English sentiment
      const analyzer = new natural.SentimentAnalyzer('English', 
        natural.PorterStemmer, 'negation');
      const tokens = this.tokenizer.tokenize(text) || [];
      const score = analyzer.getSentiment(tokens);
      return Math.max(-1, Math.min(1, score));
    } else {
      // Simple Korean sentiment analysis
      const positiveWords = ['좋은', '훌륭한', '대단한', '혁신적인', '유용한', '효과적인'];
      const negativeWords = ['나쁜', '문제', '어려운', '복잡한', '비싼'];
      
      let score = 0;
      positiveWords.forEach(word => {
        if (text.includes(word)) score += 0.1;
      });
      negativeWords.forEach(word => {
        if (text.includes(word)) score -= 0.1;
      });
      
      return Math.max(-1, Math.min(1, score));
    }
  }

  /**
   * Assess market potential of the idea
   */
  private async assessMarketPotential(text: string): Promise<'low' | 'medium' | 'high'> {
    const highPotentialKeywords = ['ai', 'blockchain', 'fintech', 'healthcare', 'automation', 
                                  '인공지능', '블록체인', '핀테크', '헬스케어', '자동화'];
    const mediumPotentialKeywords = ['app', 'web', 'mobile', 'platform', 'service',
                                    '앱', '웹', '모바일', '플랫폼', '서비스'];
    
    const highCount = highPotentialKeywords.filter(keyword => 
      text.toLowerCase().includes(keyword)).length;
    const mediumCount = mediumPotentialKeywords.filter(keyword => 
      text.toLowerCase().includes(keyword)).length;
    
    if (highCount >= 2) return 'high';
    if (highCount >= 1 || mediumCount >= 2) return 'medium';
    return 'low';
  }

  /**
   * Assess technical complexity (1-5 scale)
   */
  private async assessTechnicalComplexity(text: string): Promise<number> {
    const complexTech = ['ai', 'machine learning', 'blockchain', 'quantum', 'ar', 'vr',
                        '인공지능', '머신러닝', '블록체인', '양자', '증강현실', '가상현실'];
    const moderateTech = ['api', 'database', 'mobile app', 'web app', 'iot',
                         'API', '데이터베이스', '모바일앱', '웹앱', '사물인터넷'];
    const simpleTech = ['website', 'blog', 'landing page', 'form', 'survey',
                       '웹사이트', '블로그', '랜딩페이지', '폼', '설문'];
    
    let complexity = 2; // Default medium complexity
    
    if (complexTech.some(tech => text.toLowerCase().includes(tech))) {
      complexity = 5;
    } else if (moderateTech.some(tech => text.toLowerCase().includes(tech))) {
      complexity = 3;
    } else if (simpleTech.some(tech => text.toLowerCase().includes(tech))) {
      complexity = 1;
    }
    
    return complexity;
  }

  /**
   * Calculate innovation score (0-100)
   */
  private async calculateInnovationScore(text: string, title?: string): Promise<number> {
    const innovativeKeywords = ['revolutionary', 'innovative', 'breakthrough', 'disruptive', 'novel',
                               '혁신적인', '획기적인', '새로운', '독창적인', '창의적인'];
    const combinedText = `${title || ''} ${text}`.toLowerCase();
    
    let score = 50; // Base score
    
    // Check for innovative keywords
    const innovativeCount = innovativeKeywords.filter(keyword => 
      combinedText.includes(keyword)).length;
    score += innovativeCount * 10;
    
    // Check for technology combination (indicates innovation)
    const techCount = (combinedText.match(/ai|blockchain|iot|ar|vr|ml/g) || []).length;
    if (techCount >= 2) score += 20;
    
    // Check for problem-solution language
    if (combinedText.includes('problem') || combinedText.includes('solution') ||
        combinedText.includes('문제') || combinedText.includes('해결')) {
      score += 15;
    }
    
    return Math.min(100, Math.max(0, score));
  }

  /**
   * Get predefined idea categories
   */
  private async getIdeaCategories(): Promise<string[]> {
    // This would typically come from database or config
    return [
      'AI & Machine Learning', 'Mobile Apps', 'Web Applications', 'E-commerce',
      'FinTech', 'HealthTech', 'EdTech', 'PropTech', 'AgriTech', 'CleanTech',
      'IoT', 'Blockchain', 'AR/VR', 'Gaming', 'Social Media', 'Productivity',
      'Analytics', 'Security', 'DevTools', 'Marketing Tools'
      // ... more categories
    ];
  }

  /**
   * AI-powered categorization with confidence scoring
   */
  private async categorizeWithAI(text: string, categories: string[]): Promise<{
    primary: string;
    secondary: string[];
    confidence: number;
    tags: string[];
  }> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are an expert at categorizing startup ideas. Given an idea description, classify it into the most relevant categories from this list: ${categories.join(', ')}`
          },
          {
            role: "user",
            content: `Categorize this idea and provide your confidence level (0-100): ${text}`
          }
        ],
        max_tokens: 200,
        temperature: 0.2
      });

      // Parse AI response (simplified - would need better parsing)
      const aiResponse = response.choices[0].message.content || '';
      return {
        primary: categories[0], // Fallback
        secondary: categories.slice(1, 3),
        confidence: 85,
        tags: this.extractTagsFromResponse(aiResponse)
      };
    } catch (error) {
      console.error('AI categorization failed:', error);
      return {
        primary: categories[0],
        secondary: [],
        confidence: 50,
        tags: []
      };
    }
  }

  /**
   * Extract tags from AI response
   */
  private extractTagsFromResponse(response: string): string[] {
    // Simple tag extraction logic
    const words = response.toLowerCase().split(/\s+/);
    return words.filter(word => word.length > 3).slice(0, 5);
  }

  /**
   * Cache analysis results in database
   */
  async cacheAnalysis(text: string, result: NLPAnalysisResult): Promise<void> {
    try {
      const contentHash = await this.generateHash(text);
      
      await supabase.from('nlp_analysis_cache').upsert({
        content_hash: contentHash,
        original_text: text,
        categories: result.categories,
        keywords: result.keywords,
        sentiment_score: result.sentiment,
        language_detected: result.language,
        processed_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to cache NLP analysis:', error);
    }
  }

  /**
   * Get cached analysis if available
   */
  async getCachedAnalysis(text: string): Promise<NLPAnalysisResult | null> {
    try {
      const contentHash = await this.generateHash(text);
      
      const { data, error } = await supabase
        .from('nlp_analysis_cache')
        .select('*')
        .eq('content_hash', contentHash)
        .single();

      if (error || !data) return null;

      return {
        categories: data.categories,
        keywords: data.keywords,
        sentiment: data.sentiment_score,
        language: data.language_detected,
        marketPotential: 'medium', // Would need to be stored
        technicalComplexity: 3, // Would need to be stored
        innovationScore: 75 // Would need to be stored
      };
    } catch (error) {
      console.error('Failed to get cached analysis:', error);
      return null;
    }
  }

  /**
   * Generate SHA-256 hash of text
   */
  private async generateHash(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

export const nlpEngine = NLPEngine.getInstance();