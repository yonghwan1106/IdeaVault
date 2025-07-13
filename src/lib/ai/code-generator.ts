/**
 * AI Code Generation Engine for IdeaVault
 * Automatically generates MVP code, database schemas, and deployment instructions
 */

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { nlpEngine } from './nlp-engine';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface CodeGenerationRequest {
  ideaId: string;
  buyerId: string;
  title: string;
  description: string;
  targetFramework: 'nextjs' | 'react' | 'vue' | 'svelte';
  preferredLanguage: 'typescript' | 'javascript' | 'python';
  includeDatabase: boolean;
  includeAuth: boolean;
  includePayments: boolean;
  deploymentTarget: 'vercel' | 'netlify' | 'aws' | 'gcp' | 'docker';
}

export interface GeneratedCode {
  id: string;
  fileStructure: FileStructure;
  codeFiles: CodeFile[];
  databaseSchema?: string;
  apiEndpoints: APIEndpoint[];
  deploymentInstructions: string;
  dependencies: Dependency[];
  qualityScore: number;
  estimatedDevTime: string;
  nextSteps: string[];
}

export interface FileStructure {
  name: string;
  type: 'file' | 'directory';
  children?: FileStructure[];
  size?: number;
}

export interface CodeFile {
  path: string;
  content: string;
  language: string;
  description: string;
}

export interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  parameters?: Parameter[];
  responseFormat: string;
}

export interface Parameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface Dependency {
  name: string;
  version: string;
  type: 'production' | 'development';
  description: string;
}

export class CodeGenerationEngine {
  private static instance: CodeGenerationEngine;

  public static getInstance(): CodeGenerationEngine {
    if (!CodeGenerationEngine.instance) {
      CodeGenerationEngine.instance = new CodeGenerationEngine();
    }
    return CodeGenerationEngine.instance;
  }

  /**
   * Generate complete MVP code based on idea description
   */
  async generateMVPCode(request: CodeGenerationRequest): Promise<GeneratedCode> {
    console.log(`Generating MVP code for idea: ${request.title}`);

    // Analyze the idea to understand requirements
    const ideaAnalysis = await nlpEngine.analyzeIdea(request.description, request.title);
    
    // Generate different components in parallel
    const [
      fileStructure,
      codeFiles,
      databaseSchema,
      apiEndpoints,
      deploymentInstructions,
      dependencies
    ] = await Promise.all([
      this.generateFileStructure(request, ideaAnalysis),
      this.generateCodeFiles(request, ideaAnalysis),
      request.includeDatabase ? this.generateDatabaseSchema(request, ideaAnalysis) : undefined,
      this.generateAPIEndpoints(request, ideaAnalysis),
      this.generateDeploymentInstructions(request),
      this.generateDependencies(request, ideaAnalysis)
    ]);

    // Calculate quality score
    const qualityScore = this.calculateQualityScore(codeFiles, ideaAnalysis);

    // Estimate development time
    const estimatedDevTime = this.estimateDevTime(request, ideaAnalysis);

    // Generate next steps
    const nextSteps = this.generateNextSteps(request, ideaAnalysis);

    const generatedCode: GeneratedCode = {
      id: crypto.randomUUID(),
      fileStructure,
      codeFiles,
      databaseSchema,
      apiEndpoints,
      deploymentInstructions,
      dependencies,
      qualityScore,
      estimatedDevTime,
      nextSteps
    };

    // Save to database
    await this.saveGeneratedCode(request, generatedCode);

    return generatedCode;
  }

  /**
   * Generate file structure based on framework and requirements
   */
  private async generateFileStructure(
    request: CodeGenerationRequest,
    ideaAnalysis: any
  ): Promise<FileStructure> {
    const prompt = this.buildFileStructurePrompt(request, ideaAnalysis);
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert software architect. Generate a realistic file structure for the given project requirements. Return only valid JSON."
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.2
      });

      const structureText = response.choices[0].message.content;
      if (structureText) {
        try {
          return JSON.parse(structureText);
        } catch (parseError) {
          console.error('Failed to parse file structure JSON:', parseError);
        }
      }
    } catch (error) {
      console.error('AI file structure generation failed:', error);
    }

    // Fallback structure
    return this.getFallbackFileStructure(request);
  }

  /**
   * Generate actual code files
   */
  private async generateCodeFiles(
    request: CodeGenerationRequest,
    ideaAnalysis: any
  ): Promise<CodeFile[]> {
    const codeFiles: CodeFile[] = [];

    // Generate key files based on framework
    const filesToGenerate = this.getFilesToGenerate(request);

    for (const fileConfig of filesToGenerate) {
      try {
        const content = await this.generateFileContent(request, ideaAnalysis, fileConfig);
        codeFiles.push({
          path: fileConfig.path,
          content,
          language: fileConfig.language,
          description: fileConfig.description
        });
      } catch (error) {
        console.error(`Failed to generate ${fileConfig.path}:`, error);
        // Add placeholder content
        codeFiles.push({
          path: fileConfig.path,
          content: `// TODO: Implement ${fileConfig.description}\n// File generation failed, manual implementation required`,
          language: fileConfig.language,
          description: fileConfig.description
        });
      }
    }

    return codeFiles;
  }

  /**
   * Generate individual file content using AI
   */
  private async generateFileContent(
    request: CodeGenerationRequest,
    ideaAnalysis: any,
    fileConfig: { path: string; type: string; description: string; language: string }
  ): Promise<string> {
    const prompt = this.buildFileContentPrompt(request, ideaAnalysis, fileConfig);

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an expert ${request.preferredLanguage} developer. Generate production-ready code for ${request.targetFramework} applications. Follow best practices and include proper error handling.`
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 2000,
      temperature: 0.1
    });

    return response.choices[0].message.content || '// Content generation failed';
  }

  /**
   * Generate database schema
   */
  private async generateDatabaseSchema(
    request: CodeGenerationRequest,
    ideaAnalysis: any
  ): Promise<string> {
    const prompt = `
Generate a PostgreSQL database schema for this idea:
Title: ${request.title}
Description: ${request.description}

Requirements:
- Include all necessary tables for the core functionality
- Add proper relationships and constraints
- Include indexes for performance
- Add comments explaining each table and field
- Follow PostgreSQL best practices

Return only the SQL schema without explanations.
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a database architect expert. Generate clean, efficient PostgreSQL schemas."
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 1500,
        temperature: 0.1
      });

      return response.choices[0].message.content || '-- Schema generation failed';
    } catch (error) {
      console.error('Database schema generation failed:', error);
      return '-- Database schema generation failed, manual design required';
    }
  }

  /**
   * Generate API endpoints specification
   */
  private async generateAPIEndpoints(
    request: CodeGenerationRequest,
    ideaAnalysis: any
  ): Promise<APIEndpoint[]> {
    const prompt = `
Design REST API endpoints for this application:
Title: ${request.title}
Description: ${request.description}

Generate a list of necessary API endpoints with:
- HTTP method
- Path
- Description
- Parameters (if any)
- Response format

Return as JSON array.
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an API design expert. Generate RESTful API specifications as JSON arrays."
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.2
      });

      const endpointsText = response.choices[0].message.content;
      if (endpointsText) {
        try {
          return JSON.parse(endpointsText);
        } catch (parseError) {
          console.error('Failed to parse API endpoints JSON:', parseError);
        }
      }
    } catch (error) {
      console.error('API endpoints generation failed:', error);
    }

    // Fallback endpoints
    return this.getFallbackAPIEndpoints();
  }

  /**
   * Generate deployment instructions
   */
  private async generateDeploymentInstructions(
    request: CodeGenerationRequest
  ): Promise<string> {
    const platformInstructions = {
      vercel: 'Vercel deployment with automatic builds and serverless functions',
      netlify: 'Netlify deployment with continuous deployment from Git',
      aws: 'AWS deployment using EC2 and RDS',
      gcp: 'Google Cloud Platform deployment using App Engine',
      docker: 'Docker containerization for any cloud provider'
    };

    const prompt = `
Generate step-by-step deployment instructions for ${request.targetFramework} application on ${request.deploymentTarget}.

Requirements:
- Include environment variables setup
- Database configuration (if needed)
- Domain and SSL setup
- Monitoring and logging setup
- Performance optimization tips

Format as markdown with clear sections.
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a DevOps expert. Generate comprehensive deployment guides."
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 1500,
        temperature: 0.1
      });

      return response.choices[0].message.content || 'Deployment instructions generation failed';
    } catch (error) {
      console.error('Deployment instructions generation failed:', error);
      return `# Deployment Instructions\n\nDeployment guide generation failed. Please refer to ${platformInstructions[request.deploymentTarget]} documentation.`;
    }
  }

  /**
   * Generate dependencies list
   */
  private async generateDependencies(
    request: CodeGenerationRequest,
    ideaAnalysis: any
  ): Promise<Dependency[]> {
    const baseDependencies = this.getBaseDependencies(request);
    
    // Add AI-suggested dependencies based on idea analysis
    const additionalDeps = await this.suggestAdditionalDependencies(request, ideaAnalysis);
    
    return [...baseDependencies, ...additionalDeps];
  }

  /**
   * Calculate code quality score
   */
  private calculateQualityScore(codeFiles: CodeFile[], ideaAnalysis: any): number {
    let score = 70; // Base score

    // Check for best practices
    const hasErrorHandling = codeFiles.some(file => 
      file.content.includes('try') || file.content.includes('catch') || file.content.includes('error')
    );
    if (hasErrorHandling) score += 10;

    // Check for TypeScript usage
    const hasTypeScript = codeFiles.some(file => file.language === 'typescript');
    if (hasTypeScript) score += 5;

    // Check for tests
    const hasTests = codeFiles.some(file => 
      file.path.includes('test') || file.path.includes('spec')
    );
    if (hasTests) score += 10;

    // Check for documentation
    const hasDocumentation = codeFiles.some(file => 
      file.content.includes('/**') || file.content.includes('///')
    );
    if (hasDocumentation) score += 5;

    return Math.min(100, score);
  }

  /**
   * Estimate development time
   */
  private estimateDevTime(request: CodeGenerationRequest, ideaAnalysis: any): string {
    let baseDays = 14; // 2 weeks base

    // Adjust based on complexity
    if (ideaAnalysis.technicalComplexity >= 4) baseDays += 7;
    if (request.includeDatabase) baseDays += 3;
    if (request.includeAuth) baseDays += 2;
    if (request.includePayments) baseDays += 3;

    const weeks = Math.ceil(baseDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''}`;
  }

  /**
   * Generate next steps recommendations
   */
  private generateNextSteps(request: CodeGenerationRequest, ideaAnalysis: any): string[] {
    const steps = [
      'Review and understand the generated code structure',
      'Set up the development environment with required dependencies',
      'Configure environment variables and database connections'
    ];

    if (request.includeDatabase) {
      steps.push('Create and migrate the database schema');
    }

    if (request.includeAuth) {
      steps.push('Configure authentication providers and test user flows');
    }

    if (request.includePayments) {
      steps.push('Set up payment gateway test accounts and webhooks');
    }

    steps.push(
      'Implement core business logic and customize UI components',
      'Add comprehensive error handling and validation',
      'Write unit and integration tests',
      'Set up monitoring and analytics',
      'Deploy to staging environment for testing',
      'Conduct user acceptance testing',
      'Deploy to production and monitor performance'
    );

    return steps;
  }

  /**
   * Build prompts for various generation tasks
   */
  private buildFileStructurePrompt(request: CodeGenerationRequest, ideaAnalysis: any): string {
    return `
Generate a complete file structure for a ${request.targetFramework} application:

Project: ${request.title}
Description: ${request.description}
Language: ${request.preferredLanguage}
Include Database: ${request.includeDatabase}
Include Auth: ${request.includeAuth}
Include Payments: ${request.includePayments}

Return as nested JSON with this format:
{
  "name": "project-root",
  "type": "directory",
  "children": [...]
}

Include all necessary files and folders for a production-ready application.
    `;
  }

  private buildFileContentPrompt(
    request: CodeGenerationRequest,
    ideaAnalysis: any,
    fileConfig: any
  ): string {
    return `
Generate ${fileConfig.language} code for: ${fileConfig.path}

Project Context:
- Title: ${request.title}
- Description: ${request.description}
- Framework: ${request.targetFramework}
- File Purpose: ${fileConfig.description}

Requirements:
- Production-ready code with error handling
- Follow ${request.targetFramework} best practices
- Include proper TypeScript types (if applicable)
- Add helpful comments
- Implement core functionality for this file

Return only the code content without markdown formatting.
    `;
  }

  /**
   * Helper methods for fallback and base configurations
   */
  private getFallbackFileStructure(request: CodeGenerationRequest): FileStructure {
    return {
      name: request.title.toLowerCase().replace(/\s+/g, '-'),
      type: 'directory',
      children: [
        { name: 'src', type: 'directory' },
        { name: 'public', type: 'directory' },
        { name: 'package.json', type: 'file' },
        { name: 'README.md', type: 'file' }
      ]
    };
  }

  private getFilesToGenerate(request: CodeGenerationRequest) {
    const baseFiles = [
      {
        path: 'package.json',
        type: 'config',
        description: 'Project dependencies and scripts',
        language: 'json'
      },
      {
        path: 'README.md',
        type: 'documentation',
        description: 'Project documentation',
        language: 'markdown'
      }
    ];

    if (request.targetFramework === 'nextjs') {
      baseFiles.push(
        {
          path: 'src/app/page.tsx',
          type: 'component',
          description: 'Main page component',
          language: 'typescript'
        },
        {
          path: 'src/app/layout.tsx',
          type: 'component',
          description: 'Root layout component',
          language: 'typescript'
        }
      );
    }

    return baseFiles;
  }

  private getFallbackAPIEndpoints(): APIEndpoint[] {
    return [
      {
        method: 'GET',
        path: '/api/health',
        description: 'Health check endpoint',
        responseFormat: '{ "status": "ok" }'
      }
    ];
  }

  private getBaseDependencies(request: CodeGenerationRequest): Dependency[] {
    const deps: Dependency[] = [];

    if (request.targetFramework === 'nextjs') {
      deps.push(
        { name: 'next', version: '^14.0.0', type: 'production', description: 'Next.js framework' },
        { name: 'react', version: '^18.0.0', type: 'production', description: 'React library' },
        { name: 'react-dom', version: '^18.0.0', type: 'production', description: 'React DOM' }
      );
    }

    if (request.preferredLanguage === 'typescript') {
      deps.push(
        { name: 'typescript', version: '^5.0.0', type: 'development', description: 'TypeScript compiler' },
        { name: '@types/node', version: '^20.0.0', type: 'development', description: 'Node.js type definitions' }
      );
    }

    return deps;
  }

  private async suggestAdditionalDependencies(
    request: CodeGenerationRequest,
    ideaAnalysis: any
  ): Promise<Dependency[]> {
    // Simple rule-based suggestions
    const additional: Dependency[] = [];

    if (request.includeDatabase) {
      additional.push({
        name: '@supabase/supabase-js',
        version: '^2.0.0',
        type: 'production',
        description: 'Supabase client'
      });
    }

    if (request.includeAuth) {
      additional.push({
        name: 'next-auth',
        version: '^4.0.0',
        type: 'production',
        description: 'Authentication library'
      });
    }

    if (request.includePayments) {
      additional.push({
        name: 'stripe',
        version: '^14.0.0',
        type: 'production',
        description: 'Stripe payment processing'
      });
    }

    return additional;
  }

  /**
   * Save generated code to database
   */
  private async saveGeneratedCode(
    request: CodeGenerationRequest,
    generatedCode: GeneratedCode
  ): Promise<void> {
    try {
      const { error } = await supabase.from('generated_code').insert({
        idea_id: request.ideaId,
        buyer_id: request.buyerId,
        code_type: 'mvp',
        programming_language: request.preferredLanguage,
        framework: request.targetFramework,
        code_content: JSON.stringify(generatedCode.codeFiles),
        file_structure: generatedCode.fileStructure,
        dependencies: generatedCode.dependencies,
        deployment_instructions: generatedCode.deploymentInstructions,
        quality_score: generatedCode.qualityScore
      });

      if (error) {
        console.error('Failed to save generated code:', error);
      }
    } catch (error) {
      console.error('Error saving generated code:', error);
    }
  }

  /**
   * Get previously generated code
   */
  async getGeneratedCode(ideaId: string, buyerId: string): Promise<GeneratedCode | null> {
    try {
      const { data, error } = await supabase
        .from('generated_code')
        .select('*')
        .eq('idea_id', ideaId)
        .eq('buyer_id', buyerId)
        .eq('code_type', 'mvp')
        .order('generated_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        fileStructure: data.file_structure,
        codeFiles: JSON.parse(data.code_content || '{}'),
        databaseSchema: data.database_schema,
        apiEndpoints: [],
        deploymentInstructions: data.deployment_instructions || '',
        dependencies: data.dependencies || [],
        qualityScore: data.quality_score || 0,
        estimatedDevTime: '2-3 weeks',
        nextSteps: []
      };
    } catch (error) {
      console.error('Error retrieving generated code:', error);
      return null;
    }
  }
}

export const codeGenerator = CodeGenerationEngine.getInstance();