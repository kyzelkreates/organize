import { generateId, createTimestamp } from '../storage.js';
export function getSampleData() {
  const now = new Date();
  const daysAgo = d => new Date(now.getTime()-d*86400000).toISOString();
  const ids = { bigv:generateId(), fourpaws:generateId(), ap3x:generateId(), quantum:generateId(), anxiety:generateId() };
  const projects = [
    { id:ids.bigv, name:"Big V's Best Routes", description:"Mapbox-powered routing platform for logistics and courier dispatch.", type:'Routing Platform', status:'Deployment Failed', priority:'Critical', repoUrl:'https://github.com/kyzelkreates/bigv-routes', liveUrl:'', buildTool:'Vite', techStack:'React, Mapbox GL JS, Supabase, Node.js', sector:'Logistics', notes:'Mapbox token error on Vercel. Local build works. Prod env var not set.', tags:['mapbox','routing','supabase','vercel'], createdAt:daysAgo(45), updatedAt:daysAgo(2) },
    { id:ids.fourpaws, name:'Four Paws Training & Enrichment Academy', description:'Dog training LMS with video lessons, progress tracking, and trainer booking.', type:'LMS', status:'Needs Fix', priority:'High', repoUrl:'https://github.com/kyzelkreates/fourpaws-lms', liveUrl:'', buildTool:'Vite', techStack:'React, Supabase, Stripe, TailwindCSS', sector:'Education', notes:'Video upload broken. RLS blocking lesson completion writes.', tags:['lms','supabase','rls','stripe'], createdAt:daysAgo(30), updatedAt:daysAgo(5) },
    { id:ids.ap3x, name:'AP3X VER5E', description:'AI-powered verse generation and lyric analysis tool.', type:'AI Tool', status:'Rebuild Candidate', priority:'Medium', repoUrl:'', liveUrl:'', buildTool:'Next.js', techStack:'Next.js, OpenAI API, Supabase', sector:'Creative / Music', notes:'Original repo lost. Needs full rebuild.', tags:['ai','nextjs','rebuild','openai'], createdAt:daysAgo(90), updatedAt:daysAgo(20) },
    { id:ids.quantum, name:'Quantum Compliance OS', description:'Enterprise compliance dashboard with automated audit trails and ISO/GDPR checklist tracking.', type:'Dashboard', status:'Portfolio Ready', priority:'Low', repoUrl:'https://github.com/kyzelkreates/quantum-compliance', liveUrl:'https://quantum-compliance.vercel.app', buildTool:'Vite', techStack:'React, Supabase, PDFLib, TailwindCSS', sector:'Legal / Compliance', notes:'Fully working. Used as portfolio piece. Minor mobile polish needed.', tags:['portfolio','compliance','saas','gdpr'], createdAt:daysAgo(120), updatedAt:daysAgo(10) },
    { id:ids.anxiety, name:'Anxiety Core AI', description:'Private mental wellness companion with mood journaling and AI-powered CBT exercises.', type:'AI Tool', status:'Broken', priority:'High', repoUrl:'https://github.com/kyzelkreates/anxiety-core', liveUrl:'https://anxiety-core.vercel.app', buildTool:'Vite', techStack:'React, OpenAI API, Supabase, Framer Motion', sector:'Health / Wellness', notes:'AI responses broken since OpenAI key was rotated. Auth returning 401 intermittently.', tags:['ai','wellness','broken','openai'], createdAt:daysAgo(60), updatedAt:daysAgo(1) }
  ];
  const prompts = [
    { id:generateId(), title:'Fix Mapbox Token on Vercel', category:'Deployment Prompt', body:'You are a senior deployment engineer. The Mapbox token is not loading in production.\n\n1. Confirm VITE_MAPBOX_TOKEN is set in Vercel environment variables.\n2. Verify token is prefixed with pk.\n3. Check Mapbox dashboard allowed URLs.\n4. Redeploy after fixing.\n5. Open browser console on live URL and confirm no token errors.', linkedProjectId:ids.bigv, favourite:true, createdAt:daysAgo(3), updatedAt:daysAgo(3) },
    { id:generateId(), title:'Supabase RLS Policy Debug', category:'Supabase Prompt', body:"You are a Supabase expert. A query is blocked by RLS.\n\n1. Run: SELECT * FROM pg_policies WHERE tablename = 'your_table';\n2. Confirm user role is 'authenticated'.\n3. Test with: SET role authenticated; SELECT * FROM your_table;\n4. Add policy if missing.\n5. Never disable RLS entirely.", linkedProjectId:ids.fourpaws, favourite:true, createdAt:daysAgo(7), updatedAt:daysAgo(7) },
    { id:generateId(), title:'Fix OpenAI 401 — Key Rotation', category:'Fix Prompt', body:'You are a security-focused developer. An OpenAI API key was rotated.\n\n1. Generate new key at platform.openai.com.\n2. Update env var in deployment platform.\n3. Never commit key to repo.\n4. Add to .env.local for local dev.\n5. Redeploy and test the AI endpoint.', linkedProjectId:ids.anxiety, favourite:false, createdAt:daysAgo(1), updatedAt:daysAgo(1) }
  ];
  const errors = [
    { id:generateId(), title:'Mapbox Token Not Loaded on Vercel', rawError:'Error: Invalid Mapbox access token. An API access token is required to use Mapbox GL.', source:'Vercel', severity:'Critical', linkedProjectId:ids.bigv, status:'Unresolved', diagnosis:'VITE_MAPBOX_TOKEN not set in Vercel environment variables.', suggestedFix:'Add VITE_MAPBOX_TOKEN to Vercel env vars. Whitelist domain in Mapbox. Redeploy.', createdAt:daysAgo(2), updatedAt:daysAgo(2) },
    { id:generateId(), title:'Supabase RLS Blocking Lesson Progress Write', rawError:'PostgrestError: new row violates row-level security policy for table "lesson_progress"', source:'Supabase', severity:'High', linkedProjectId:ids.fourpaws, status:'Investigating', diagnosis:'No RLS policy for INSERT on lesson_progress for authenticated users.', suggestedFix:"CREATE POLICY \"users_insert_own\" ON lesson_progress FOR INSERT WITH CHECK (auth.uid() = user_id);", createdAt:daysAgo(5), updatedAt:daysAgo(3) },
    { id:generateId(), title:'OpenAI 401 Unauthorized — Key Rotated', rawError:'openai.error.AuthenticationError: 401 - Incorrect API key provided.', source:'API', severity:'Critical', linkedProjectId:ids.anxiety, status:'Unresolved', diagnosis:'OpenAI API key rotated externally and production env var not updated.', suggestedFix:'Generate new key at platform.openai.com, update OPENAI_API_KEY in Vercel, redeploy.', createdAt:daysAgo(1), updatedAt:daysAgo(1) }
  ];
  const repairPlans = [
    { id:generateId(), title:"Fix Big V Routes — Vercel Deployment", linkedProjectId:ids.bigv, linkedErrorId:null, priority:'Critical', status:'In Progress', steps:[
      { id:generateId(), text:'Open Vercel dashboard for big-v-routes project.', done:true },
      { id:generateId(), text:'Navigate to Settings > Environment Variables.', done:true },
      { id:generateId(), text:'Add VITE_MAPBOX_TOKEN with the correct public token.', done:false },
      { id:generateId(), text:'Open Mapbox dashboard and add Vercel domain to allowed URLs.', done:false },
      { id:generateId(), text:'Trigger a fresh deployment.', done:false },
      { id:generateId(), text:'Test route creation and map rendering on the live site.', done:false }
    ], createdAt:daysAgo(2), updatedAt:daysAgo(1) }
  ];
  return { projects, prompts, errors, repairPlans };
}
