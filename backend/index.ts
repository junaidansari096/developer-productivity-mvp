import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(cors());

// In-memory persistent flag storage
const flaggedDevelopers = new Set<string>();

// Load data
const dataPath = fs.existsSync(path.join(__dirname, 'data')) ? path.join(__dirname, 'data') : path.join(__dirname, '..', 'data');

const loadJson = (filename: string) => {
  const filePath = path.join(dataPath, filename);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
  return [];
};

const dimDevelopers = loadJson('Dim_Developers.json');
const factJiraIssues = loadJson('Fact_Jira_Issues.json');
const factPullRequests = loadJson('Fact_Pull_Requests.json');
const factCiDeployments = loadJson('Fact_CI_Deployments.json');
const factBugReports = loadJson('Fact_Bug_Reports.json');

app.get('/api/developers', (req, res) => {
  res.json(dimDevelopers);
});

app.get('/api/developer/:id/metrics', (req, res) => {
  const { id } = req.params;
  
  // Filter data for the developer
  const issues = factJiraIssues.filter((i: any) => i.developer_id === id);
  const prs = factPullRequests.filter((p: any) => p.developer_id === id);
  const bugs = factBugReports.filter((b: any) => b.developer_id === id);
  
  // Deployments linked to PRs by this developer
  const devPrIds = prs.map((p: any) => p.pr_id);
  const deployments = factCiDeployments.filter((d: any) => devPrIds.includes(d.pr_id));
  
  // Get unique months from issues
  const months = Array.from(new Set([
    ...issues.map((i: any) => i.month_done).filter(Boolean),
    ...prs.map((p: any) => p.month_merged).filter(Boolean),
    ...deployments.map((d: any) => d.month_deployed).filter(Boolean),
  ])).sort();

  const metricsByMonth = months.map((month: any) => {
    const monthIssues = issues.filter((i: any) => i.month_done === month);
    const monthPrs = prs.filter((p: any) => p.month_merged === month && p.status === 'Merged');
    const monthDeployments = deployments.filter((d: any) => d.month_deployed === month && d.status === 'Success');
    const monthBugs = bugs.filter((b: any) => b.month_found === month);
    
    // Cycle Time: Average of cycle_time_days in monthIssues
    const avgCycleTime = monthIssues.length > 0 
      ? monthIssues.reduce((sum: number, i: any) => sum + (i.cycle_time_days || 0), 0) / monthIssues.length 
      : 0;

    // Lead Time: Average of lead_time_days in monthDeployments
    const avgLeadTime = monthDeployments.length > 0
      ? monthDeployments.reduce((sum: number, d: any) => sum + (d.lead_time_days || 0), 0) / monthDeployments.length
      : 0;

    // PR Throughput: Count of merged PRs
    const prThroughput = monthPrs.length;

    // Deployment Frequency: Count of successful deployments
    const deploymentFrequency = monthDeployments.length;

    // Bug Rate: bugs / issues completed
    const bugRate = monthIssues.length > 0 ? monthBugs.length / monthIssues.length : 0;

    return {
      month,
      cycleTime: Number(avgCycleTime.toFixed(2)),
      leadTime: Number(avgLeadTime.toFixed(2)),
      prThroughput,
      deploymentFrequency,
      bugRate: Number((bugRate * 100).toFixed(2)), // as percentage
      issuesCompleted: monthIssues.length,
      bugsFound: monthBugs.length
    };
  });

  res.json({
    developer: dimDevelopers.find((d: any) => d.developer_id === id),
    metrics: metricsByMonth,
    recentIssues: issues.slice(-5),
    recentPrs: prs.slice(-5),
    recentDeployments: deployments.slice(-5),
    recentBugs: bugs.slice(-5),
  });
});

app.get('/api/team/metrics', (req, res) => {
  const teamMetrics = dimDevelopers.map((dev: any) => {
    const id = dev.developer_id;
    const issues = factJiraIssues.filter((i: any) => i.developer_id === id);
    const prs = factPullRequests.filter((p: any) => p.developer_id === id);
    const bugs = factBugReports.filter((b: any) => b.developer_id === id);
    
    const devPrIds = prs.map((p: any) => p.pr_id);
    const deployments = factCiDeployments.filter((d: any) => devPrIds.includes(d.pr_id));
    
    const months = Array.from(new Set([
      ...issues.map((i: any) => i.month_done).filter(Boolean),
      ...prs.map((p: any) => p.month_merged).filter(Boolean),
      ...deployments.map((d: any) => d.month_deployed).filter(Boolean),
    ])).sort();

    const latestMonth = months[months.length - 1];

    if (!latestMonth) {
      return { developer: dev, metrics: null };
    }

    const monthIssues = issues.filter((i: any) => i.month_done === latestMonth);
    const monthPrs = prs.filter((p: any) => p.month_merged === latestMonth && p.status === 'Merged');
    const monthDeployments = deployments.filter((d: any) => d.month_deployed === latestMonth && d.status === 'Success');
    const monthBugs = bugs.filter((b: any) => b.month_found === latestMonth);
    
    const avgCycleTime = monthIssues.length > 0 ? monthIssues.reduce((sum: number, i: any) => sum + (i.cycle_time_days || 0), 0) / monthIssues.length : 0;
    const avgLeadTime = monthDeployments.length > 0 ? monthDeployments.reduce((sum: number, d: any) => sum + (d.lead_time_days || 0), 0) / monthDeployments.length : 0;
    const bugRate = monthIssues.length > 0 ? monthBugs.length / monthIssues.length : 0;

    let signal = "On Track";
    if (bugRate > 0.15 || avgCycleTime > 5 || avgLeadTime > 4) {
      signal = "Needs Support";
    }

    return {
      developer: dev,
      latestMonth,
      cycleTime: Number(avgCycleTime.toFixed(2)),
      leadTime: Number(avgLeadTime.toFixed(2)),
      prThroughput: monthPrs.length,
      deploymentFrequency: monthDeployments.length,
      bugRate: Number((bugRate * 100).toFixed(2)),
      signal,
      isFlagged: flaggedDevelopers.has(id)
    };
  }).filter((m: any) => m.latestMonth); // Remove devs with no data

  res.json(teamMetrics);
});

app.post('/api/developer/:id/flag', (req, res) => {
  const { id } = req.params;
  if (flaggedDevelopers.has(id)) {
    flaggedDevelopers.delete(id);
  } else {
    flaggedDevelopers.add(id);
  }
  res.json({ success: true, isFlagged: flaggedDevelopers.has(id) });
});

// Serve frontend static files in production
const frontendPath = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
  app.use((req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

const PORT_NUM = Number(port);
app.listen(PORT_NUM, "0.0.0.0", () => {
  console.log(`Backend listening at http://0.0.0.0:${PORT_NUM}`);
});
