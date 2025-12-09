const { createClient } = require('@supabase/supabase-js');

// Hardcoded creds from previous context (which were confirmed working)
const URL = "https://cvxipneapzvkwjtjjskt.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2eGlwbmVhcHp2a3dqdGpqc2t0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwODk4MTcsImV4cCI6MjA4MDY2NTgxN30.OdPr9Z_QtwfCUEpDCgVuGniOFRJDJKNjwsjYZNwHERU";

async function verifyFeatures() {
    const supabase = createClient(URL, KEY, { auth: { persistSession: false } });

    console.log("1. Checking for Test Project...");
    // Get or Create a project
    let { data: project } = await supabase.from('projects').select('id').eq('name', 'Test Feature Project').maybeSingle();

    if (!project) {
        const { data: newProj, error } = await supabase.from('projects').insert({
            name: 'Test Feature Project',
            total_budget: 1000,
            start_date: '2024-01-01',
            deadline: '2024-12-31'
        }).select().single();

        if (error) {
            console.error("Failed to create project:", error.message);
            process.exit(1);
        }
        project = newProj;
    }

    console.log("Project ID:", project.id);

    console.log("2. Testing Transaction Insert with Notes...");
    const noteContent = "This is a test note " + Date.now();
    const { data: tx, error: txError } = await supabase.from('transactions').insert({
        project_id: project.id,
        amount: 50,
        vendor: "Test Bot",
        notes: noteContent,
        status: 'spent'
    }).select().single();

    if (txError) {
        if (txError.message.includes('notes')) {
            console.error("FAILURE: Database column 'notes' missing. Please run the SQL migration.");
        } else {
            console.error("FAILURE: Insert failed:", txError.message);
        }
        process.exit(1);
    }

    console.log("SUCCESS: Transaction inserted with note.");
    console.log("Transaction ID:", tx.id);
    console.log("Project URL:", `http://localhost:3000/p/${project.id}`);
}

verifyFeatures();
