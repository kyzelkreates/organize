export function validateProject(data) {
  const e=[];
  if (!data.name||data.name.trim()==='') e.push('Project name is required.');
  if (data.name&&data.name.length>120) e.push('Project name must be under 120 characters.');
  if (data.repoUrl&&!isValidUrl(data.repoUrl)) e.push('Repo URL is not valid.');
  if (data.liveUrl&&!isValidUrl(data.liveUrl)) e.push('Live URL is not valid.');
  return e;
}
export function validatePrompt(data) {
  const e=[];
  if (!data.title||data.title.trim()==='') e.push('Prompt title is required.');
  if (!data.body||data.body.trim()==='') e.push('Prompt body is required.');
  return e;
}
export function validateError(data) {
  const e=[];
  if (!data.title||data.title.trim()==='') e.push('Error title is required.');
  if (!data.rawError||data.rawError.trim()==='') e.push('Error text is required.');
  return e;
}
export function validateRepairPlan(data) {
  const e=[];
  if (!data.title||data.title.trim()==='') e.push('Repair plan title is required.');
  if (!data.steps||data.steps.length===0) e.push('At least one step is required.');
  return e;
}
export function validateImportedState(data) {
  const e=[];
  if (typeof data!=='object'||data===null) { e.push('Invalid JSON structure.'); return e; }
  if (!data.app) e.push('Missing app metadata.');
  if (!Array.isArray(data.projects)) e.push('Projects must be an array.');
  if (!Array.isArray(data.prompts)) e.push('Prompts must be an array.');
  if (!Array.isArray(data.errors)) e.push('Errors must be an array.');
  if (!Array.isArray(data.repairPlans)) e.push('Repair plans must be an array.');
  return e;
}
function isValidUrl(str) { try { new URL(str); return true; } catch { return false; } }
