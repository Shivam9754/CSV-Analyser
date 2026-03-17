fetch('http://localhost:3001/api/generate-insights', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
        fileName: "test.csv",
        columns: [{name: "Hello", type: "string"}],
        data: [{"Hello": "World"}]
    })
})
.then(r => r.text())
.then(console.log)
.catch(console.error);
