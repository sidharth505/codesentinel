import { 
  Repository, 
  AnalysisReport, 
  JobProgress, 
  CodeSnippet
} from '../types/index.ts';

const API_BASE = '/api';

export async function fetchRepositories(): Promise<Repository[]> {
  const res = await fetch(`${API_BASE}/repositories`);
  if (!res.ok) {
    throw new Error(`Failed to load repositories (${res.status})`);
  }
  return await res.json();
}

export async function fetchReport(reportId: string): Promise<AnalysisReport> {
  const res = await fetch(`${API_BASE}/reports/${reportId}`);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Failed to load report (${res.status})`);
  }
  return await res.json();
}

export async function uploadArchive(file: File): Promise<{ jobId: string; repository: Repository }> {
  const formData = new FormData();
  formData.append('archive', file);

  const res = await fetch(`${API_BASE}/analyze/upload`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Upload failed with status ${res.status}`);
  }

  return await res.json();
}

export async function analyzeGitHub(repoUrl: string, branch?: string): Promise<{ jobId: string; repository: Repository }> {
  const res = await fetch(`${API_BASE}/analyze/github`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repoUrl, branch })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `GitHub analysis request failed: ${res.statusText}`);
  }

  return await res.json();
}

export async function fetchLatestReport(repositoryId: string): Promise<AnalysisReport> {
  const res = await fetch(`${API_BASE}/reports/latest/${repositoryId}`);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Failed to load latest report (${res.status})`);
  }
  return await res.json();
}

export function subscribeToAnalysisProgress(
  jobId: string,
  onProgress: (progress: JobProgress) => void,
  onComplete: (reportId: string) => void,
  onError: (err: any) => void
): () => void {
  // Use Server-Sent Events (SSE)
  let eventSource: EventSource | null = null;
  let pollInterval: any = null;

  try {
    eventSource = new EventSource(`${API_BASE}/analyze/stream/${jobId}`);

    eventSource.onmessage = (event) => {
      try {
        const data: JobProgress = JSON.parse(event.data);
        onProgress(data);

        if (data.status === 'completed' && data.reportId) {
          eventSource?.close();
          onComplete(data.reportId);
        } else if (data.status === 'failed') {
          eventSource?.close();
          onError(new Error(data.error || 'Analysis failed'));
        }
      } catch (e) {
        console.warn('Failed to parse SSE message:', e);
      }
    };

    eventSource.onerror = (err) => {
      console.warn('SSE stream error, falling back to REST polling:', err);
      eventSource?.close();
      startPolling();
    };
  } catch (err) {
    startPolling();
  }

  function startPolling() {
    if (pollInterval) return;
    pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/analyze/status/${jobId}`);
        if (res.ok) {
          const data: JobProgress = await res.json();
          onProgress(data);
          if (data.status === 'completed' && data.reportId) {
            clearInterval(pollInterval);
            onComplete(data.reportId);
          } else if (data.status === 'failed') {
            clearInterval(pollInterval);
            onError(new Error(data.error || 'Analysis failed'));
          }
        }
      } catch (e) {
        console.warn('Poll error:', e);
      }
    }, 800);
  }

  return () => {
    if (eventSource) eventSource.close();
    if (pollInterval) clearInterval(pollInterval);
  };
}

export async function toggleFindingReview(findingId: string, reviewed: boolean): Promise<void> {
  try {
    await fetch(`${API_BASE}/findings/${findingId}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewed })
    });
  } catch (err) {
    console.warn('Failed to persist finding review status:', err);
  }
}

export async function requestRemediation(findingId: string): Promise<{ explanation: string; refactoredSnippet: CodeSnippet }> {
  const res = await fetch(`${API_BASE}/findings/${findingId}/refactor`, {
    method: 'POST'
  });
  if (!res.ok) {
    throw new Error('Remediation request failed');
  }
  return await res.json();
}
