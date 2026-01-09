
async function testSearch() {
    const queries = ['Budget', 'Finance', 'Climat'];
    for (const q of queries) {
        console.log(`\nTesting search for: "${q}"`);
        const res = await fetch(`http://localhost:3000/api/search?q=${q}`);
        const data = await res.json();
        console.log(`Results - Dossiers: ${data.dossiers?.length || 0}, Amendments: ${data.amendments?.length || 0}`);
        if (data.dossiers?.length > 0) {
            console.log(`First dossier: ${data.dossiers[0].title}`);
        }
    }
}

testSearch();
