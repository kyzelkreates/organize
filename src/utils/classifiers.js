export function classifyError(rawError) {
  if (!rawError) return { category:'Unknown', diagnosis:'No error text provided.', suggestedFix:'Paste the full error message.', severity:'Low' };
  const text = rawError.toLowerCase();
  if (text.includes('401')||text.includes('unauthorized')) return { category:'Auth Error', diagnosis:'API key or auth token is missing or invalid.', suggestedFix:'Check key name, verify production env var, check headers, rotate key if exposed, retest.', severity:'High' };
  if (text.includes('403')||text.includes('forbidden')) return { category:'Permission Error', diagnosis:'Authenticated user lacks required permissions.', suggestedFix:'Check RLS policies, role assignments, and permission scopes.', severity:'High' };
  if (text.includes('404')||text.includes('not found')) return { category:'Not Found', diagnosis:'Resource or endpoint does not exist.', suggestedFix:'Verify the URL, route, or resource ID.', severity:'Medium' };
  if (text.includes('500')||text.includes('internal server error')) return { category:'Server Error', diagnosis:'Internal server error on the backend.', suggestedFix:'Check server logs, review recent deployments, check env vars.', severity:'Critical' };
  if (text.includes('rls')||text.includes('row level security')||text.includes('new row violates')||text.includes('policy')) return { category:'RLS / Policy Error', diagnosis:'Supabase Row Level Security policy blocking the query.', suggestedFix:'Confirm RLS enabled, check policy exists and is correctly scoped, run policy migration, retest.', severity:'High' };
  if (text.includes('relation')&&text.includes('does not exist')) return { category:'Database Schema Error', diagnosis:'Queried table or relation does not exist.', suggestedFix:'Check migration history, verify table name, confirm migration ran.', severity:'Critical' };
  if (text.includes('cannot find module')||text.includes('module not found')||text.includes('npm err')) return { category:'Module / Dependency Error', diagnosis:'Required npm package is missing.', suggestedFix:'Run npm install, check package.json, clear node_modules and reinstall.', severity:'High' };
  if (text.includes('mapbox')||text.includes('access token')) return { category:'Mapbox Token Error', diagnosis:'Mapbox access token missing or invalid.', suggestedFix:'Check VITE_MAPBOX_TOKEN env var, confirm allowed URLs in Mapbox dashboard, redeploy.', severity:'High' };
  if (text.includes('cors')||text.includes('cross-origin')) return { category:'CORS Error', diagnosis:'CORS is blocking the request.', suggestedFix:'Add frontend origin to backend CORS allow-list.', severity:'Medium' };
  if (text.includes('build failed')||text.includes('build error')||text.includes('compilation')) return { category:'Build Failure', diagnosis:'Build process failed — syntax errors, missing imports, or misconfigured build tool.', suggestedFix:'Read build log, identify failing file, fix syntax/imports, run local build.', severity:'Critical' };
  return { category:'Unknown Error', diagnosis:'Error pattern not recognized.', suggestedFix:'Paste full error and review logs manually.', severity:'Medium' };
}
export function classifyProject(project, linkedErrors=[]) {
  const unresolvedCritical = linkedErrors.filter(e=>e.status!=='Fixed'&&e.status!=='Ignored'&&(e.severity==='Critical'||e.severity==='High'));
  const unresolvedAny = linkedErrors.filter(e=>e.status!=='Fixed'&&e.status!=='Ignored');
  const hasLiveUrl=!!project.liveUrl, hasRepoUrl=!!project.repoUrl;
  if (project.status==='Deployment Failed') return { suggestedStatus:'Deployment Failed', reason:'Project is marked as deployment failed.', nextBestAction:'Generate a Deployment Repair Plan: check logs, env vars, dependencies, run local build, redeploy.' };
  if (unresolvedCritical.length>=2) return { suggestedStatus:'Broken', reason:`${unresolvedCritical.length} unresolved critical/high errors.`, nextBestAction:'Generate a Repair Plan for the most critical error.' };
  if (hasLiveUrl&&unresolvedCritical.length===0) {
    if (['Portfolio Ready','Investor Ready'].includes(project.status)) return { suggestedStatus:project.status, reason:'Live URL present, no critical errors.', nextBestAction:'Keep polishing and document for portfolio/investors.' };
    return { suggestedStatus:'Working', reason:'Live URL present, no critical errors.', nextBestAction:'Consider promoting to Portfolio Ready.' };
  }
  if (hasRepoUrl&&!hasLiveUrl) return { suggestedStatus:'Needs Fix', reason:'Repo exists but no live URL.', nextBestAction:'Set up deployment and create a Repair Plan.' };
  if (!hasRepoUrl&&!hasLiveUrl) return { suggestedStatus:'Rebuild Candidate', reason:'No repo URL and no live URL.', nextBestAction:'Decide: archive, rebuild, or recover from local files.' };
  if (unresolvedAny.length>0) return { suggestedStatus:'Needs Fix', reason:`${unresolvedAny.length} unresolved error(s) linked.`, nextBestAction:'Fix errors and re-classify.' };
  return { suggestedStatus:project.status||'Needs Fix', reason:'No specific rule matched.', nextBestAction:'Review project status and update fields.' };
}
export function generateRepairSteps(type) {
  const plans = {
    'Deployment Failed': ['Open the deployment platform and read the full deployment log.','Identify the specific failing command or step.','Check all required environment variables are set.','Verify all dependencies in package.json.','Run the build command locally.','Fix any local build errors.','Commit, push, and trigger a fresh deployment.','Monitor the deployment log for the same or new errors.'],
    'RLS / Policy Error': ['Open Supabase dashboard > Authentication > Policies.','Confirm RLS is enabled on the affected table.','Verify the table exists in the correct schema.','Check a policy exists for the required operation.','Verify policy is scoped to the correct role.','Write and apply a safe policy migration via SQL editor.','Retest the query from your frontend.','Check Supabase logs if still failing.'],
    'Auth Error': ['Identify which provider is returning 401.','Check environment variable name (case-sensitive).','Confirm production env var is set in deployment platform.','Verify Authorization header format (Bearer token).','Test with a fresh API key from the provider dashboard.','Rotate the key if it may have been leaked.','Redeploy after updating env vars.','Retest the endpoint with new credentials.'],
    'Module / Dependency Error': ['Delete node_modules and package-lock.json.','Run npm install for a clean install.','Check package.json for correct package name and version.','Search npm if the package name may be wrong.','Check for peer dependency conflicts.','Run the build command again.','Commit updated package-lock.json.'],
    'Build Failure': ['Read the full build log output.','Find the first error line — fix it first.','Check the referenced file and line for syntax/import errors.','Verify all imports resolve to existing files.','Run locally: npm run build.','Fix the error and rebuild locally.','Push the fix and redeploy.','Verify the deployment log shows a clean build.'],
    default: ['Document the full error message and context.','Search the error online or in the issue tracker.','Isolate the failing component or module.','Reproduce in a minimal environment.','Apply the fix and test in isolation.','Run the full test suite if available.','Deploy fix to staging before production.','Monitor for recurrence after deploying.']
  };
  return plans[type] || plans['default'];
}
