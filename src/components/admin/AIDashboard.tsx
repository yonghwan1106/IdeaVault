'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
} from 'recharts';
import {
  Brain,
  TrendingUp,
  Activity,
  Zap,
  Database,
  GitBranch,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  DollarSign,
} from 'lucide-react';

interface AIDashboardProps {
  className?: string;
}

interface AIMetrics {
  predictionAccuracy: number;
  matchingScore: number;
  dataProcessed: number;
  activeModels: number;
  apiCalls: number;
  successRate: number;
}

interface MarketTrend {
  keyword: string;
  volume: number;
  trend: 'rising' | 'falling' | 'stable';
  growth: number;
}

interface PredictionResult {
  ideaTitle: string;
  predictedScore: number;
  actualOutcome?: number;
  accuracy?: number;
  date: string;
}

interface DataCollectionStatus {
  source: string;
  status: 'active' | 'error' | 'paused';
  lastSync: string;
  recordsCollected: number;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

export default function AIDashboard({ className }: AIDashboardProps) {
  const [metrics, setMetrics] = useState<AIMetrics>({
    predictionAccuracy: 0,
    matchingScore: 0,
    dataProcessed: 0,
    activeModels: 0,
    apiCalls: 0,
    successRate: 0,
  });
  
  const [marketTrends, setMarketTrends] = useState<MarketTrend[]>([]);
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [dataStatus, setDataStatus] = useState<DataCollectionStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    
    // Set up real-time updates
    const interval = setInterval(() => {
      loadMetrics();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadMetrics(),
        loadMarketTrends(),
        loadPredictions(),
        loadDataStatus(),
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      const response = await fetch('/api/admin/ai-metrics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Failed to load AI metrics:', error);
      // Mock data for development
      setMetrics({
        predictionAccuracy: 78.5,
        matchingScore: 85.2,
        dataProcessed: 15420,
        activeModels: 4,
        apiCalls: 2340,
        successRate: 94.2,
      });
    }
  };

  const loadMarketTrends = async () => {
    try {
      const response = await fetch('/api/admin/market-trends');
      if (response.ok) {
        const data = await response.json();
        setMarketTrends(data);
      }
    } catch (error) {
      console.error('Failed to load market trends:', error);
      // Mock data
      setMarketTrends([
        { keyword: 'AI 스타트업', volume: 15400, trend: 'rising', growth: 12.5 },
        { keyword: '핀테크', volume: 12800, trend: 'stable', growth: 2.1 },
        { keyword: 'SaaS', volume: 18900, trend: 'rising', growth: 8.7 },
        { keyword: '이커머스', volume: 9200, trend: 'falling', growth: -3.2 },
        { keyword: 'IoT', volume: 7600, trend: 'rising', growth: 15.3 },
      ]);
    }
  };

  const loadPredictions = async () => {
    try {
      const response = await fetch('/api/admin/prediction-history');
      if (response.ok) {
        const data = await response.json();
        setPredictions(data);
      }
    } catch (error) {
      console.error('Failed to load predictions:', error);
      // Mock data
      setPredictions([
        { ideaTitle: 'AI 채팅봇 플랫폼', predictedScore: 78, actualOutcome: 82, accuracy: 95, date: '2024-01-15' },
        { ideaTitle: '모바일 결제 앱', predictedScore: 65, actualOutcome: 59, accuracy: 91, date: '2024-01-14' },
        { ideaTitle: '헬스케어 SaaS', predictedScore: 85, actualOutcome: 88, accuracy: 96, date: '2024-01-13' },
        { ideaTitle: '물류 최적화 툴', predictedScore: 72, actualOutcome: 75, accuracy: 96, date: '2024-01-12' },
        { ideaTitle: '교육 플랫폼', predictedScore: 68, actualOutcome: 71, accuracy: 96, date: '2024-01-11' },
      ]);
    }
  };

  const loadDataStatus = async () => {
    try {
      const response = await fetch('/api/admin/data-sources');
      if (response.ok) {
        const data = await response.json();
        setDataStatus(data);
      }
    } catch (error) {
      console.error('Failed to load data status:', error);
      // Mock data
      setDataStatus([
        { source: 'GitHub Trending', status: 'active', lastSync: '2024-01-15T10:30:00Z', recordsCollected: 1250 },
        { source: 'Product Hunt', status: 'active', lastSync: '2024-01-15T09:15:00Z', recordsCollected: 890 },
        { source: 'Reddit Tech', status: 'active', lastSync: '2024-01-15T11:00:00Z', recordsCollected: 2340 },
        { source: 'Naver Trends', status: 'error', lastSync: '2024-01-14T22:30:00Z', recordsCollected: 567 },
        { source: 'HackerNews', status: 'active', lastSync: '2024-01-15T10:45:00Z', recordsCollected: 1890 },
      ]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'falling': return <TrendingUp className="h-4 w-4 text-red-500 transform rotate-180" />;
      default: return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const predictionChartData = predictions.map(p => ({
    name: p.ideaTitle.slice(0, 10) + '...',
    predicted: p.predictedScore,
    actual: p.actualOutcome || 0,
    accuracy: p.accuracy || 0,
  }));

  const trendChartData = marketTrends.map(t => ({
    name: t.keyword,
    volume: t.volume,
    growth: t.growth,
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Systems Dashboard</h1>
          <p className="text-gray-600 mt-1">
            딥테크 AI 기능 모니터링 및 성능 분석
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={loadDashboardData} variant="outline">
            <Activity className="h-4 w-4 mr-2" />
            새로고침
          </Button>
          <Button>
            <Database className="h-4 w-4 mr-2" />
            데이터 수집 시작
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">예측 정확도</CardTitle>
            <Brain className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.predictionAccuracy.toFixed(1)}%</div>
            <p className="text-xs text-gray-600">성공 예측 시스템</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI 매칭 점수</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.matchingScore.toFixed(1)}%</div>
            <p className="text-xs text-gray-600">개발자-아이디어 매칭</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">처리된 데이터</CardTitle>
            <Database className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.dataProcessed)}</div>
            <p className="text-xs text-gray-600">오늘 수집된 레코드</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API 성공률</CardTitle>
            <Zap className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.successRate.toFixed(1)}%</div>
            <p className="text-xs text-gray-600">{formatNumber(metrics.apiCalls)} 호출</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prediction Accuracy Chart */}
        <Card>
          <CardHeader>
            <CardTitle>예측 정확도 추이</CardTitle>
            <CardDescription>
              AI 예측 모델의 성능 분석
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={predictionChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#8884d8"
                  strokeWidth={2}
                  name="예측값"
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  name="실제값"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Market Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle>시장 트렌드 분석</CardTitle>
            <CardDescription>
              실시간 키워드 볼륨 및 성장률
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trendChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="volume" fill="#8884d8" name="검색량" />
                <Bar dataKey="growth" fill="#82ca9d" name="성장률 (%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Data Sources Status */}
      <Card>
        <CardHeader>
          <CardTitle>데이터 수집 현황</CardTitle>
          <CardDescription>
            외부 데이터 소스 연결 상태 및 수집 통계
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dataStatus.map((source, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <GitBranch className="h-5 w-5 text-gray-500" />
                    <span className="font-medium">{source.source}</span>
                  </div>
                  <Badge className={getStatusColor(source.status)}>
                    {source.status === 'active' ? '활성' : 
                     source.status === 'error' ? '오류' : '중지'}
                  </Badge>
                </div>
                <div className="text-right text-sm text-gray-600">
                  <div>수집: {formatNumber(source.recordsCollected)}건</div>
                  <div>마지막 동기화: {formatDate(source.lastSync)}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Market Trends List */}
      <Card>
        <CardHeader>
          <CardTitle>주요 시장 트렌드</CardTitle>
          <CardDescription>
            AI 분석 기반 실시간 트렌드 키워드
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {marketTrends.map((trend, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  {getTrendIcon(trend.trend)}
                  <div>
                    <span className="font-medium">{trend.keyword}</span>
                    <div className="text-sm text-gray-600">
                      검색량: {formatNumber(trend.volume)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${\n                    trend.growth > 0 ? 'text-green-600' :\n                    trend.growth < 0 ? 'text-red-600' : 'text-gray-600'\n                  }`}>
                    {trend.growth > 0 ? '+' : ''}{trend.growth.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">성장률</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Predictions */}
      <Card>
        <CardHeader>
          <CardTitle>최근 AI 예측 결과</CardTitle>
          <CardDescription>
            성공 예측 시스템의 최근 분석 결과
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {predictions.map((prediction, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {prediction.accuracy && prediction.accuracy > 90 ? 
                      <CheckCircle className="h-5 w-5 text-green-500" /> :
                      <Clock className="h-5 w-5 text-yellow-500" />
                    }
                    <div>
                      <span className="font-medium">{prediction.ideaTitle}</span>
                      <div className="text-sm text-gray-600">
                        {formatDate(prediction.date)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm">
                    예측: <span className="font-medium">{prediction.predictedScore}점</span>
                    {prediction.actualOutcome && (
                      <span className="ml-2">
                        실제: <span className="font-medium">{prediction.actualOutcome}점</span>
                      </span>
                    )}
                  </div>
                  {prediction.accuracy && (
                    <div className="text-xs text-gray-500">
                      정확도: {prediction.accuracy}%
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}