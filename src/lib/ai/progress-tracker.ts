/**
 * Development Progress Tracking System for IdeaVault
 * Monitors GitHub activity, analyzes development patterns, and provides AI-powered insights
 */

import { Octokit } from '@octokit/rest';
import { createClient } from '@supabase/supabase-js';
import { nlpEngine } from './nlp-engine';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface DevelopmentProgress {
  userId: string;
  projectId: string;
  overallProgress: number; // 0-100
  currentPhase: 'planning' | 'development' | 'testing' | 'deployment' | 'completed';
  milestones: Milestone[];
  metrics: DevelopmentMetrics;
  insights: ProgressInsight[];
  recommendations: string[];
  estimatedCompletion: Date;
  riskFactors: RiskFactor[];
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  targetDate: Date;
  completedDate?: Date;
  progress: number; // 0-100
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  dependencies: string[];
  commits: GitHubCommit[];
}

export interface DevelopmentMetrics {
  commitsCount: number;
  linesOfCode: number;
  filesModified: number;
  testsWritten: number;
  bugsFixed: number;
  featuresCompleted: number;
  codeQualityScore: number;
  velocityTrend: 'improving' | 'stable' | 'declining';
  timeSpent: number; // hours
  productivityScore: number; // 0-100
}

export interface ProgressInsight {
  type: 'achievement' | 'warning' | 'suggestion' | 'milestone';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  actionRequired: boolean;
  timestamp: Date;
}

export interface RiskFactor {
  type: 'schedule' | 'technical' | 'quality' | 'scope';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
  mitigation: string;
  probability: number; // 0-100
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author: string;
  date: Date;
  additions: number;
  deletions: number;
  changedFiles: string[];
}

export interface ProjectAnalysis {
  techStack: string[];
  architecture: string;
  complexity: number; // 1-5
  bestPractices: {
    hasTests: boolean;
    hasDocumentation: boolean;
    hasCI: boolean;
    followsConventions: boolean;
  };
  codeHealth: {
    duplicateCode: number;
    testCoverage: number;
    technicalDebt: number;
  };
}

export class ProgressTracker {
  private static instance: ProgressTracker;
  private octokit: Octokit | null = null;

  public static getInstance(): ProgressTracker {
    if (!ProgressTracker.instance) {
      ProgressTracker.instance = new ProgressTracker();
    }
    return ProgressTracker.instance;
  }

  constructor() {
    if (process.env.GITHUB_TOKEN) {
      this.octokit = new Octokit({
        auth: process.env.GITHUB_TOKEN,
      });
    }
  }

  /**
   * Track development progress for a user's project
   */
  async trackProgress(
    userId: string,
    projectId: string,
    githubRepo?: string
  ): Promise<DevelopmentProgress> {
    console.log(`Tracking progress for user ${userId}, project ${projectId}`);

    // Get existing progress data
    const existingProgress = await this.getExistingProgress(userId, projectId);
    
    // Analyze GitHub activity if repo is provided
    let githubData: GitHubCommit[] = [];
    let projectAnalysis: ProjectAnalysis | null = null;
    
    if (githubRepo && this.octokit) {
      try {
        githubData = await this.analyzeGitHubActivity(githubRepo);
        projectAnalysis = await this.analyzeProject(githubRepo);
      } catch (error) {
        console.error('GitHub analysis failed:', error);
      }
    }

    // Calculate current metrics
    const metrics = this.calculateMetrics(githubData, projectAnalysis, existingProgress);
    
    // Generate milestones if none exist
    let milestones = existingProgress?.milestones || [];
    if (milestones.length === 0) {
      milestones = await this.generateMilestones(projectId, projectAnalysis);
    } else {
      // Update existing milestones with new data
      milestones = await this.updateMilestones(milestones, githubData);
    }

    // Calculate overall progress
    const overallProgress = this.calculateOverallProgress(milestones, metrics);
    
    // Determine current phase
    const currentPhase = this.determineCurrentPhase(milestones, metrics);
    
    // Generate insights
    const insights = await this.generateInsights(metrics, milestones, githubData);
    
    // Generate recommendations
    const recommendations = await this.generateRecommendations(metrics, insights, projectAnalysis);
    
    // Estimate completion date
    const estimatedCompletion = this.estimateCompletion(milestones, metrics);
    
    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(metrics, milestones, projectAnalysis);

    const progress: DevelopmentProgress = {
      userId,
      projectId,
      overallProgress,
      currentPhase,
      milestones,
      metrics,
      insights,
      recommendations,
      estimatedCompletion,
      riskFactors
    };

    // Save progress to database
    await this.saveProgress(progress);

    return progress;
  }

  /**
   * Analyze GitHub repository activity
   */
  private async analyzeGitHubActivity(repoUrl: string): Promise<GitHubCommit[]> {
    if (!this.octokit) {
      throw new Error('GitHub token not configured');
    }

    // Parse repository URL to get owner and repo
    const repoMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!repoMatch) {
      throw new Error('Invalid GitHub repository URL');
    }

    const [, owner, repo] = repoMatch;

    try {
      // Get recent commits (last 100)
      const { data: commits } = await this.octokit.rest.repos.listCommits({
        owner,
        repo,
        per_page: 100
      });

      const gitHubCommits: GitHubCommit[] = [];

      for (const commit of commits) {
        // Get detailed commit info
        const { data: commitDetail } = await this.octokit.rest.repos.getCommit({
          owner,
          repo,
          ref: commit.sha
        });

        gitHubCommits.push({
          sha: commit.sha,
          message: commit.commit.message,
          author: commit.commit.author?.name || 'Unknown',
          date: new Date(commit.commit.author?.date || Date.now()),
          additions: commitDetail.stats?.additions || 0,
          deletions: commitDetail.stats?.deletions || 0,
          changedFiles: commitDetail.files?.map((f: any) => f.filename) || []
        });
      }

      return gitHubCommits;
    } catch (error) {
      console.error('GitHub API error:', error);
      return [];
    }
  }

  /**
   * Analyze project structure and characteristics
   */
  private async analyzeProject(repoUrl: string): Promise<ProjectAnalysis> {
    if (!this.octokit) {
      throw new Error('GitHub token not configured');
    }

    const repoMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!repoMatch) {
      throw new Error('Invalid GitHub repository URL');
    }

    const [, owner, repo] = repoMatch;

    try {
      // Get repository contents
      const { data: contents } = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path: ''
      });

      if (!Array.isArray(contents)) {
        throw new Error('Unable to read repository contents');
      }

      const analysis: ProjectAnalysis = {
        techStack: [],
        architecture: 'unknown',
        complexity: 3,
        bestPractices: {
          hasTests: false,
          hasDocumentation: false,
          hasCI: false,
          followsConventions: false
        },
        codeHealth: {
          duplicateCode: 0,
          testCoverage: 0,
          technicalDebt: 50
        }
      };

      // Analyze files to determine tech stack and best practices
      for (const item of contents) {
        if (item.type === 'file') {
          const fileName = item.name.toLowerCase();
          
          // Detect tech stack
          if (fileName === 'package.json') {
            analysis.techStack.push('Node.js');
            analysis.architecture = 'javascript';
          } else if (fileName === 'requirements.txt' || fileName === 'pyproject.toml') {
            analysis.techStack.push('Python');
            analysis.architecture = 'python';
          } else if (fileName === 'composer.json') {
            analysis.techStack.push('PHP');
            analysis.architecture = 'php';
          } else if (fileName === 'cargo.toml') {
            analysis.techStack.push('Rust');
            analysis.architecture = 'rust';
          }

          // Check for best practices
          if (fileName.includes('test') || fileName.includes('spec')) {
            analysis.bestPractices.hasTests = true;
          }
          if (fileName === 'readme.md' || fileName === 'readme.txt') {
            analysis.bestPractices.hasDocumentation = true;
          }
          if (fileName.includes('github/workflows') || fileName === '.travis.yml' || fileName === 'jenkinsfile') {
            analysis.bestPractices.hasCI = true;
          }
        }
      }

      // Calculate complexity based on file count and structure
      analysis.complexity = Math.min(5, Math.max(1, Math.floor(contents.length / 10)));

      return analysis;
    } catch (error) {
      console.error('Project analysis error:', error);
      return {
        techStack: [],
        architecture: 'unknown',
        complexity: 3,
        bestPractices: {
          hasTests: false,
          hasDocumentation: false,
          hasCI: false,
          followsConventions: false
        },
        codeHealth: {
          duplicateCode: 0,
          testCoverage: 0,
          technicalDebt: 50
        }
      };
    }
  }

  /**
   * Calculate development metrics
   */
  private calculateMetrics(
    githubData: GitHubCommit[],
    projectAnalysis: ProjectAnalysis | null,
    existingProgress: DevelopmentProgress | null
  ): DevelopmentMetrics {
    const commits = githubData.length;
    const linesOfCode = githubData.reduce((total, commit) => 
      total + commit.additions, 0);
    const filesModified = new Set(
      githubData.flatMap(commit => commit.changedFiles)
    ).size;

    // Estimate other metrics
    const testsWritten = githubData.filter(commit => 
      commit.changedFiles.some(file => file.includes('test') || file.includes('spec'))
    ).length;

    const bugsFixed = githubData.filter(commit => 
      /fix|bug|issue/i.test(commit.message)
    ).length;

    const featuresCompleted = githubData.filter(commit => 
      /feat|feature|add/i.test(commit.message)
    ).length;

    // Calculate code quality score
    let codeQualityScore = 70; // Base score
    if (projectAnalysis?.bestPractices.hasTests) codeQualityScore += 10;
    if (projectAnalysis?.bestPractices.hasDocumentation) codeQualityScore += 10;
    if (projectAnalysis?.bestPractices.hasCI) codeQualityScore += 10;

    // Calculate velocity trend
    const recentCommits = githubData.filter(commit => 
      Date.now() - commit.date.getTime() < 7 * 24 * 60 * 60 * 1000 // Last 7 days
    ).length;
    const olderCommits = githubData.filter(commit => {
      const daysDiff = (Date.now() - commit.date.getTime()) / (24 * 60 * 60 * 1000);
      return daysDiff >= 7 && daysDiff < 14; // 7-14 days ago
    }).length;

    let velocityTrend: 'improving' | 'stable' | 'declining' = 'stable';
    if (recentCommits > olderCommits * 1.2) velocityTrend = 'improving';
    else if (recentCommits < olderCommits * 0.8) velocityTrend = 'declining';

    // Estimate time spent (rough calculation)
    const timeSpent = commits * 2; // Assume 2 hours per commit on average

    // Calculate productivity score
    const productivityScore = Math.min(100, 
      (commits * 10) + (featuresCompleted * 15) + (testsWritten * 5)
    );

    return {
      commitsCount: commits,
      linesOfCode,
      filesModified,
      testsWritten,
      bugsFixed,
      featuresCompleted,
      codeQualityScore,
      velocityTrend,
      timeSpent,
      productivityScore
    };
  }

  /**
   * Generate project milestones using AI
   */
  private async generateMilestones(
    projectId: string,
    projectAnalysis: ProjectAnalysis | null
  ): Promise<Milestone[]> {
    // Get project details from database
    const { data: idea } = await supabase
      .from('ideas')
      .select('title, description, implementation_difficulty')
      .eq('id', projectId)
      .single();

    if (!idea) {
      return this.getDefaultMilestones();
    }

    // Use AI to generate contextual milestones
    const milestones = await this.generateAIMilestones(idea, projectAnalysis);
    
    return milestones.map((milestone, index) => ({
      id: crypto.randomUUID(),
      name: milestone.name,
      description: milestone.description,
      targetDate: new Date(Date.now() + (index + 1) * 14 * 24 * 60 * 60 * 1000), // 2 weeks apart
      progress: 0,
      status: 'pending' as const,
      dependencies: milestone.dependencies || [],
      commits: []
    }));
  }

  /**
   * Generate AI-powered milestones
   */
  private async generateAIMilestones(
    idea: any,
    projectAnalysis: ProjectAnalysis | null
  ): Promise<any[]> {
    // Simplified milestone generation - in production, use OpenAI
    const defaultMilestones = [
      {
        name: 'Project Setup',
        description: 'Initialize project structure and dependencies',
        dependencies: []
      },
      {
        name: 'Core Features',
        description: 'Implement main functionality',
        dependencies: ['Project Setup']
      },
      {
        name: 'Testing & Quality',
        description: 'Write tests and improve code quality',
        dependencies: ['Core Features']
      },
      {
        name: 'Deployment',
        description: 'Deploy to production environment',
        dependencies: ['Testing & Quality']
      }
    ];

    return defaultMilestones;
  }

  /**
   * Update milestones with GitHub commit data
   */
  private async updateMilestones(
    milestones: Milestone[],
    githubData: GitHubCommit[]
  ): Promise<Milestone[]> {
    return milestones.map(milestone => {
      // Find commits related to this milestone
      const relatedCommits = githubData.filter(commit =>
        this.isCommitRelatedToMilestone(commit, milestone)
      );

      // Update milestone progress based on commits
      let progress = milestone.progress;
      if (relatedCommits.length > 0) {
        progress = Math.min(100, progress + (relatedCommits.length * 10));
      }

      // Update status based on progress
      let status = milestone.status;
      if (progress >= 100) status = 'completed';
      else if (progress > 0) status = 'in_progress';

      return {
        ...milestone,
        progress,
        status,
        commits: relatedCommits,
        completedDate: status === 'completed' ? new Date() : milestone.completedDate
      };
    });
  }

  /**
   * Check if commit is related to milestone
   */
  private isCommitRelatedToMilestone(commit: GitHubCommit, milestone: Milestone): boolean {
    const milestoneKeywords = milestone.name.toLowerCase().split(' ');
    const commitMessage = commit.message.toLowerCase();
    
    return milestoneKeywords.some(keyword => commitMessage.includes(keyword));
  }

  /**
   * Calculate overall progress
   */
  private calculateOverallProgress(milestones: Milestone[], metrics: DevelopmentMetrics): number {
    if (milestones.length === 0) {
      return Math.min(100, metrics.productivityScore);
    }

    const totalProgress = milestones.reduce((sum, milestone) => sum + milestone.progress, 0);
    return Math.round(totalProgress / milestones.length);
  }

  /**
   * Determine current development phase
   */
  private determineCurrentPhase(
    milestones: Milestone[],
    metrics: DevelopmentMetrics
  ): 'planning' | 'development' | 'testing' | 'deployment' | 'completed' {
    if (metrics.commitsCount === 0) return 'planning';
    
    const completedMilestones = milestones.filter(m => m.status === 'completed').length;
    const totalMilestones = milestones.length;
    
    if (completedMilestones === totalMilestones) return 'completed';
    if (completedMilestones >= totalMilestones * 0.8) return 'deployment';
    if (completedMilestones >= totalMilestones * 0.6) return 'testing';
    return 'development';
  }

  /**
   * Generate progress insights
   */
  private async generateInsights(
    metrics: DevelopmentMetrics,
    milestones: Milestone[],
    githubData: GitHubCommit[]
  ): Promise<ProgressInsight[]> {
    const insights: ProgressInsight[] = [];

    // Velocity insights
    if (metrics.velocityTrend === 'improving') {
      insights.push({
        type: 'achievement',
        title: 'Development Velocity Increasing',
        description: 'Your development speed has improved recently. Keep up the great work!',
        impact: 'high',
        actionRequired: false,
        timestamp: new Date()
      });
    } else if (metrics.velocityTrend === 'declining') {
      insights.push({
        type: 'warning',
        title: 'Development Velocity Declining',
        description: 'Your development speed has slowed down. Consider reviewing your workflow.',
        impact: 'medium',
        actionRequired: true,
        timestamp: new Date()
      });
    }

    // Code quality insights
    if (metrics.codeQualityScore < 60) {
      insights.push({
        type: 'warning',
        title: 'Low Code Quality Score',
        description: 'Consider adding tests, documentation, and following best practices.',
        impact: 'high',
        actionRequired: true,
        timestamp: new Date()
      });
    }

    // Testing insights
    if (metrics.testsWritten === 0 && metrics.commitsCount > 10) {
      insights.push({
        type: 'suggestion',
        title: 'No Tests Detected',
        description: 'Consider adding automated tests to improve code reliability.',
        impact: 'medium',
        actionRequired: false,
        timestamp: new Date()
      });
    }

    return insights;
  }

  /**
   * Generate AI-powered recommendations
   */
  private async generateRecommendations(
    metrics: DevelopmentMetrics,
    insights: ProgressInsight[],
    projectAnalysis: ProjectAnalysis | null
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // Based on metrics
    if (metrics.velocityTrend === 'declining') {
      recommendations.push('Consider breaking down large tasks into smaller, manageable pieces');
      recommendations.push('Review your development environment for potential bottlenecks');
    }

    if (metrics.testsWritten === 0) {
      recommendations.push('Start adding unit tests for critical functionality');
      recommendations.push('Set up a testing framework appropriate for your tech stack');
    }

    if (metrics.codeQualityScore < 70) {
      recommendations.push('Implement code review processes');
      recommendations.push('Use linting tools to maintain code standards');
      recommendations.push('Add documentation for complex functions and modules');
    }

    // Based on project analysis
    if (projectAnalysis && !projectAnalysis.bestPractices.hasCI) {
      recommendations.push('Set up continuous integration to automate testing and deployment');
    }

    if (projectAnalysis && projectAnalysis.complexity >= 4) {
      recommendations.push('Consider refactoring complex components into smaller modules');
      recommendations.push('Document the architecture and design decisions');
    }

    return recommendations;
  }

  /**
   * Estimate project completion date
   */
  private estimateCompletion(milestones: Milestone[], metrics: DevelopmentMetrics): Date {
    const incompleteMilestones = milestones.filter(m => m.status !== 'completed');
    
    if (incompleteMilestones.length === 0) {
      return new Date(); // Already completed
    }

    // Calculate average completion rate
    const completedMilestones = milestones.filter(m => m.status === 'completed');
    const avgCompletionDays = completedMilestones.length > 0 ? 14 : 21; // Default to 3 weeks per milestone

    // Adjust based on current velocity
    let adjustmentFactor = 1;
    if (metrics.velocityTrend === 'improving') adjustmentFactor = 0.8;
    else if (metrics.velocityTrend === 'declining') adjustmentFactor = 1.3;

    const estimatedDays = incompleteMilestones.length * avgCompletionDays * adjustmentFactor;
    return new Date(Date.now() + estimatedDays * 24 * 60 * 60 * 1000);
  }

  /**
   * Identify project risk factors
   */
  private identifyRiskFactors(
    metrics: DevelopmentMetrics,
    milestones: Milestone[],
    projectAnalysis: ProjectAnalysis | null
  ): RiskFactor[] {
    const risks: RiskFactor[] = [];

    // Schedule risks
    const overdueMilestones = milestones.filter(m => 
      m.targetDate < new Date() && m.status !== 'completed'
    );
    
    if (overdueMilestones.length > 0) {
      risks.push({
        type: 'schedule',
        severity: overdueMilestones.length > 2 ? 'high' : 'medium',
        description: `${overdueMilestones.length} milestone(s) are overdue`,
        impact: 'Project timeline may be delayed',
        mitigation: 'Re-evaluate scope and priorities, consider resource allocation',
        probability: 80
      });
    }

    // Technical risks
    if (metrics.codeQualityScore < 50) {
      risks.push({
        type: 'technical',
        severity: 'high',
        description: 'Low code quality score indicates potential technical debt',
        impact: 'Future development may slow down significantly',
        mitigation: 'Implement code review process and refactoring sprints',
        probability: 70
      });
    }

    // Quality risks
    if (metrics.testsWritten === 0 && metrics.commitsCount > 20) {
      risks.push({
        type: 'quality',
        severity: 'medium',
        description: 'No automated tests in a mature project',
        impact: 'Higher risk of bugs and regressions',
        mitigation: 'Implement comprehensive test suite',
        probability: 60
      });
    }

    return risks;
  }

  /**
   * Helper methods
   */
  private async getExistingProgress(userId: string, projectId: string): Promise<DevelopmentProgress | null> {
    // This would typically fetch from database
    return null;
  }

  private async saveProgress(progress: DevelopmentProgress): Promise<void> {
    try {
      // Save to database - simplified implementation
      console.log('Saving progress for', progress.projectId);
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }

  private getDefaultMilestones(): Milestone[] {
    return [
      {
        id: crypto.randomUUID(),
        name: 'Project Initialization',
        description: 'Set up development environment and project structure',
        targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        progress: 0,
        status: 'pending',
        dependencies: [],
        commits: []
      },
      {
        id: crypto.randomUUID(),
        name: 'Core Development',
        description: 'Implement main features and functionality',
        targetDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        progress: 0,
        status: 'pending',
        dependencies: ['Project Initialization'],
        commits: []
      },
      {
        id: crypto.randomUUID(),
        name: 'Testing & Polish',
        description: 'Add tests, fix bugs, and improve user experience',
        targetDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
        progress: 0,
        status: 'pending',
        dependencies: ['Core Development'],
        commits: []
      },
      {
        id: crypto.randomUUID(),
        name: 'Deployment',
        description: 'Deploy to production and monitor performance',
        targetDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000),
        progress: 0,
        status: 'pending',
        dependencies: ['Testing & Polish'],
        commits: []
      }
    ];
  }
}

export const progressTracker = ProgressTracker.getInstance();