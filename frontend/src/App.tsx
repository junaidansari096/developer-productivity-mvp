import { BrowserRouter as Router, Routes, Route, Link, useParams, useLocation } from 'react-router-dom';
import { useState, useEffect, createContext, useContext } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LayoutDashboard, Users, Activity, Target, GitPullRequest, Bug, Settings, Bell, Search, ChevronRight, Zap } from 'lucide-react';

const AppContext = createContext<any>(null);

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    const API_URL = import.meta.env.PROD ? '' : 'http://localhost:3001';
    fetch(`${API_URL}/api/team/metrics`)
      .then(r => r.json())
      .then(data => {
        const issues = data.filter((m: any) => m.signal !== 'On Track' || m.isFlagged);
        setAlerts(issues);
      });
  }, []);

  return (
    <AppContext.Provider value={{ searchQuery, setSearchQuery, alerts }}>
      <Router>
        <div className="flex h-screen bg-background overflow-hidden font-sans selection:bg-primary/20">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Topbar />
            <main className="flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-900/50 p-6 md:p-8">
              <Routes>
                <Route path="/" element={<DeveloperList />} />
                <Route path="/developer/:id" element={<DeveloperDashboard />} />
                <Route path="/manager" element={<ManagerSummary />} />
              </Routes>
            </main>
          </div>
        </div>
      </Router>
    </AppContext.Provider>
  );
}

const Topbar = () => {
  const { searchQuery, setSearchQuery, alerts } = useContext(AppContext);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <div className="h-16 glass-panel border-b px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center bg-slate-100/50 dark:bg-slate-800/50 rounded-full px-4 py-2 border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all w-64 md:w-96">
        <Search className="h-4 w-4 text-slate-400 mr-2" />
        <input 
          type="text" 
          placeholder="Search developers, teams..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent border-none outline-none text-sm w-full text-slate-700 dark:text-slate-300 placeholder:text-slate-400"
        />
      </div>
      <div className="flex items-center space-x-4">
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500"
          >
            <Bell className="h-5 w-5" />
            {alerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive border-2 border-white dark:border-slate-900"></span>
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
              <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <h3 className="font-semibold text-sm text-slate-800 dark:text-white">Notifications</h3>
                <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">{alerts.length} new</span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-500">No new notifications</div>
                ) : (
                  alerts.map((alert: any, idx: number) => (
                    <Link 
                      key={idx} 
                      to={`/developer/${alert.developer.developer_id}`}
                      onClick={() => setShowNotifications(false)}
                      className="block p-3 border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex items-start">
                        <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 mr-3 ${alert.isFlagged ? 'bg-rose-500' : 'bg-amber-500'}`}></div>
                        <div>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{alert.developer.developer_name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {alert.isFlagged ? 'Manually flagged for review' : `System alert: ${alert.signal}`}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm border-2 border-white dark:border-slate-800 cursor-pointer hover:opacity-90 transition-opacity">
          JD
        </div>
      </div>
    </div>
  );
}

const Sidebar = () => {
  const location = useLocation();
  
  const NavItem = ({ to, icon: Icon, label }: any) => {
    const isActive = location.pathname === to;
    return (
      <Link 
        to={to} 
        className={`flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-all duration-200 group
          ${isActive 
            ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground' 
            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
          }`}
      >
        <div className="flex items-center space-x-3">
          <Icon className={`h-5 w-5 transition-colors ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
          <span>{label}</span>
        </div>
        {isActive && <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>}
      </Link>
    );
  };

  return (
    <div className="w-64 glass-panel border-r hidden md:flex flex-col z-30">
      <div className="flex items-center space-x-2.5 font-bold text-xl text-slate-900 dark:text-white h-16 px-6 border-b border-transparent">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-md shadow-primary/20 text-white">
          <Activity className="h-5 w-5" />
        </div>
        <span className="tracking-tight">DevMetrics<span className="text-primary">.</span></span>
      </div>
      <div className="p-4 flex-1 flex flex-col space-y-8 mt-4">
        <div>
          <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Overview</p>
          <nav className="space-y-1">
            <NavItem to="/manager" icon={LayoutDashboard} label="Team Summary" />
            <NavItem to="/" icon={Users} label="Developer Directory" />
          </nav>
        </div>
        <div className="mt-auto">
          <button onClick={() => alert('Settings coming soon!')} className="w-full flex items-center space-x-3 px-3 py-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl font-medium transition-colors">
            <Settings className="h-5 w-5 text-slate-400" />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const DeveloperList = () => {
  const [developers, setDevelopers] = useState<any[]>([]);
  const { searchQuery } = useContext(AppContext);

  useEffect(() => {
    const API_URL = import.meta.env.PROD ? '' : 'http://localhost:3001';
    fetch(`${API_URL}/api/developers`)
      .then(r => r.json())
      .then(setDevelopers);
  }, []);

  const filteredDevs = developers.filter(dev => 
    dev.developer_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    dev.team_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-1">Developer Directory</h1>
        <p className="text-slate-500 dark:text-slate-400">Select a developer to view their personalized productivity insights.</p>
      </div>
      {filteredDevs.length === 0 ? (
        <div className="text-center py-12 text-slate-500">No developers match your search.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredDevs.map(dev => (
          <Link key={dev.developer_id} to={`/developer/${dev.developer_id}`} className="premium-card p-5 group flex flex-col cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 text-primary flex items-center justify-center font-bold text-lg ring-1 ring-inset ring-primary/10">
                {dev.developer_name.split(' ').map((n: string) => n[0]).join('')}
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary transition-colors transform group-hover:translate-x-1 duration-300" />
            </div>
            <div className="relative z-10">
              <h2 className="font-semibold text-lg text-slate-900 dark:text-white group-hover:text-primary transition-colors">{dev.developer_name}</h2>
              <div className="flex items-center mt-1 space-x-2 text-sm text-slate-500 dark:text-slate-400">
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-medium">{dev.team_name}</span>
                <span>•</span>
                <span>{dev.level}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      )}
    </div>
  );
};

const MetricCard = ({ title, value, subtitle, icon: Icon, trend, className = "" }: any) => (
  <div className={`premium-card p-6 ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h3>
      <div className="p-2.5 bg-primary/5 dark:bg-primary/10 rounded-xl text-primary">
        <Icon className="h-4 w-4" />
      </div>
    </div>
    <div className="flex items-baseline space-x-2">
      <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</span>
      {subtitle && <span className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</span>}
    </div>
    {trend && (
      <div className="mt-3 flex items-center text-sm">
        <span className={`font-medium ${trend.positive ? 'text-emerald-500' : 'text-rose-500'}`}>
          {trend.value}
        </span>
        <span className="text-slate-400 ml-1.5">{trend.label}</span>
      </div>
    )}
  </div>
);

const InterpretationCard = ({ data }: { data: any }) => {
  if (!data || data.length === 0) return null;
  const latest = data[data.length - 1];
  
  let insight = "Metrics appear stable with no major red flags.";
  let action = "Keep up the consistent work.";
  let status = "good";

  if (latest.bugRate > 15) {
    insight = `Bug rate is high (${latest.bugRate}%). High output might be coming at the cost of quality.`;
    action = "Focus on writing tests for edge cases and improving code review rigor.";
    status = "warning";
  } else if (latest.cycleTime > 5) {
    insight = `Cycle time is elevated (${latest.cycleTime} days). Issues are taking longer than normal to resolve.`;
    action = "Break down Jira tickets into smaller, more manageable tasks.";
    status = "warning";
  } else if (latest.leadTime > 4) {
    insight = `Lead time for changes is high (${latest.leadTime} days). Code is merged but waiting long to be deployed.`;
    action = "Check if QA or deployment pipelines are bottlenecking delivery.";
    status = "warning";
  } else {
    insight = "Excellent delivery cadence. Low cycle time and minimal bugs.";
    action = "Consider mentoring team members or taking on more complex architectural tasks.";
    status = "good";
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 shadow-lg border ${
      status === 'good' 
        ? 'bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-400/30' 
        : 'bg-gradient-to-br from-indigo-500 to-violet-600 border-indigo-400/30'
    }`}>
      <div className="absolute -right-10 -top-10 opacity-10">
        <Zap className="h-48 w-48 text-white" />
      </div>
      <div className="relative z-10 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-white animate-pulse"></div>
            <h3 className="font-semibold tracking-wide uppercase text-xs text-white/80">AI generated insight</h3>
          </div>
          <p className="text-xl md:text-2xl font-semibold leading-tight mb-2 text-white">{insight}</p>
        </div>
        <div className="md:w-1/3 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
          <h4 className="font-medium text-white/70 text-xs uppercase tracking-wider mb-1.5">Suggested Action</h4>
          <p className="text-sm text-white/90 font-medium">{action}</p>
        </div>
      </div>
    </div>
  );
};

const DeveloperDashboard = () => {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const API_URL = import.meta.env.PROD ? '' : 'http://localhost:3001';
    fetch(`${API_URL}/api/developer/${id}/metrics`)
      .then(r => r.json())
      .then(setData);
  }, [id]);

  if (!data) return <div className="p-8 flex items-center justify-center h-[60vh]"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;

  const { developer, metrics } = data;
  const latestMetrics = metrics[metrics.length - 1] || {};

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-100 to-purple-100 text-primary flex items-center justify-center font-bold text-2xl shadow-sm border border-white">
            {developer.developer_name.split(' ').map((n: string) => n[0]).join('')}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{developer.developer_name}</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium flex items-center space-x-2 mt-1">
              <span>{developer.level}</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">{developer.team_name}</span>
            </p>
          </div>
        </div>
      </div>

      <InterpretationCard data={metrics} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard title="Lead Time" value={latestMetrics.leadTime || 0} subtitle="days avg" icon={Activity} />
        <MetricCard title="Cycle Time" value={latestMetrics.cycleTime || 0} subtitle="days avg" icon={Target} />
        <MetricCard title="Bug Rate" value={`${latestMetrics.bugRate || 0}%`} subtitle="of PRs" icon={Bug} />
        <MetricCard title="PR Throughput" value={latestMetrics.prThroughput || 0} subtitle="merged" icon={GitPullRequest} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="premium-card p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-primary" /> Delivery Speed Trends
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              {metrics.length === 1 ? (
                <BarChart data={metrics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip cursor={{fill: 'rgba(0,0,0,0.04)'}} contentStyle={{borderRadius: '0.75rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                  <Legend wrapperStyle={{paddingTop: '20px'}} />
                  <Bar name="Lead Time (days)" dataKey="leadTime" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  <Bar name="Cycle Time (days)" dataKey="cycleTime" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              ) : (
                <LineChart data={metrics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} padding={{ left: 20, right: 20 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip contentStyle={{borderRadius: '0.75rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                  <Legend wrapperStyle={{paddingTop: '20px'}} />
                  <Line type="monotone" name="Lead Time (days)" dataKey="leadTime" stroke="#4f46e5" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6, strokeWidth: 0}} />
                  <Line type="monotone" name="Cycle Time (days)" dataKey="cycleTime" stroke="#8b5cf6" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6, strokeWidth: 0}} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        <div className="premium-card p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center">
            <Target className="h-5 w-5 mr-2 text-primary" /> Output & Quality
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip cursor={{fill: 'rgba(0,0,0,0.04)'}} contentStyle={{borderRadius: '0.75rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Legend wrapperStyle={{paddingTop: '20px'}} />
                <Bar yAxisId="left" name="PR Throughput" dataKey="prThroughput" fill="#0ea5e9" radius={[6, 6, 0, 0]} maxBarSize={40} />
                <Bar yAxisId="left" name="Bugs Found" dataKey="bugsFound" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={40} />
                {metrics.length === 1 ? (
                   <Bar yAxisId="right" name="Bug Rate (%)" dataKey="bugRate" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={40} />
                ) : (
                   <Line yAxisId="right" type="monotone" name="Bug Rate (%)" dataKey="bugRate" stroke="#f59e0b" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const ManagerSummary = () => {
  const [teamMetrics, setTeamMetrics] = useState<any[]>([]);
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());
  const { searchQuery } = useContext(AppContext);

  useEffect(() => {
    const API_URL = import.meta.env.PROD ? '' : 'http://localhost:3001';
    fetch(`${API_URL}/api/team/metrics`)
      .then(r => r.json())
      .then(data => {
        setTeamMetrics(data);
        const initialFlags = new Set<string>();
        data.forEach((m: any) => {
          if (m.isFlagged) initialFlags.add(m.developer.developer_id);
        });
        setFlaggedIds(initialFlags);
      });
  }, []);

  const toggleFlag = async (id: string) => {
    try {
      const API_URL = import.meta.env.PROD ? '' : 'http://localhost:3001';
      const res = await fetch(`${API_URL}/api/developer/${id}/flag`, { method: 'POST' });
      const data = await res.json();
      setFlaggedIds(prev => {
        const next = new Set(prev);
        if (data.isFlagged) next.add(id);
        else next.delete(id);
        return next;
      });
    } catch (e) {
      console.error('Failed to toggle flag', e);
    }
  };

  const exportToCSV = () => {
    if (teamMetrics.length === 0) return;
    const headers = ['Developer', 'Level', 'Team', 'Latest Month', 'Lead Time (days)', 'Cycle Time (days)', 'Bug Rate (%)', 'AI Signal', 'Flagged'];
    const rows = teamMetrics.map(m => [
      `"${m.developer.developer_name}"`,
      `"${m.developer.level}"`,
      `"${m.developer.team_name}"`,
      m.latestMonth,
      m.leadTime,
      m.cycleTime,
      m.bugRate,
      m.signal,
      flaggedIds.has(m.developer.developer_id) ? 'Yes' : 'No'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'team_metrics_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (teamMetrics.length === 0) return <div className="p-8 flex items-center justify-center h-[60vh]"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;

  // Calculate aggregates
  const totalDevs = teamMetrics.length;
  const avgCycleTime = (teamMetrics.reduce((acc, m) => acc + m.cycleTime, 0) / totalDevs).toFixed(1);
  const avgLeadTime = (teamMetrics.reduce((acc, m) => acc + m.leadTime, 0) / totalDevs).toFixed(1);
  const totalWarnings = teamMetrics.filter(m => m.signal !== 'On Track').length;

  const filteredMetrics = teamMetrics.filter(m => 
    m.developer.developer_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.developer.team_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-1">Team Overview</h1>
        <p className="text-slate-500 dark:text-slate-400">Holistic view of engineering health and potential bottlenecks.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard title="Total Developers" value={totalDevs} icon={Users} />
        <MetricCard title="Avg Cycle Time" value={avgCycleTime} subtitle="days" icon={Target} />
        <MetricCard title="Avg Lead Time" value={avgLeadTime} subtitle="days" icon={Activity} />
        <MetricCard title="Active Alerts" value={totalWarnings} icon={Bell} className={totalWarnings > 0 ? "border-amber-200 bg-amber-50/50" : ""} />
      </div>

      <div className="premium-card overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
          <h2 className="font-semibold text-lg text-slate-900 dark:text-white">Developer Performance Matrix</h2>
          <button onClick={exportToCSV} className="text-sm text-primary font-medium hover:underline">Export CSV</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                <th className="p-4 pl-6">Developer</th>
                <th className="p-4">Latest Data</th>
                <th className="p-4">Lead Time</th>
                <th className="p-4">Cycle Time</th>
                <th className="p-4">Bug Rate</th>
                <th className="p-4">AI Signal</th>
                <th className="p-4 pr-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
              {filteredMetrics.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 dark:text-slate-400">
                    No developers match your search.
                  </td>
                </tr>
              ) : (
                filteredMetrics.map((m: any, idx: number) => {
                  const isFlagged = flaggedIds.has(m.developer.developer_id);
                  return (
                  <tr key={idx} className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group ${isFlagged ? 'bg-rose-50/40 dark:bg-rose-900/10' : ''}`}>
                    <td className="p-4 pl-6 font-medium">
                      <Link to={`/developer/${m.developer.developer_id}`} className="flex items-center space-x-3 text-slate-900 dark:text-white hover:text-primary transition-colors">
                        <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-600">
                          {m.developer.developer_name.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div>
                          <div className="group-hover:underline">{m.developer.developer_name}</div>
                          <div className="text-xs text-slate-500 font-normal">{m.developer.level}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="p-4 text-sm text-slate-500 dark:text-slate-400">{m.latestMonth}</td>
                    <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">{m.leadTime} <span className="text-slate-400 font-normal">days</span></td>
                    <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">{m.cycleTime} <span className="text-slate-400 font-normal">days</span></td>
                    <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">{m.bugRate}%</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${
                        m.signal === 'On Track' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50' 
                          : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50'
                      }`}>
                        {m.signal === 'On Track' ? <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></div> : <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></div>}
                        {m.signal}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button 
                        onClick={() => toggleFlag(m.developer.developer_id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border shadow-sm ${
                          isFlagged 
                          ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800' 
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hover:dark:bg-slate-700'
                        }`}
                      >
                        {isFlagged ? 'Unflag' : 'Flag Issue'}
                      </button>
                    </td>
                  </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default App;
