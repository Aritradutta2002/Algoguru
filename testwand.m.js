const fetch = require('node-fetch');

async function go() {
  const code = '#include <iostream>\\nint main() { std::cout << "Hello C++" << std::endl; return 0; }';
  const res = await fetch('https://wandbox.org/api/compile.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      compiler: 'gcc-head',
      code: code,
      save: false
    })
  });
  console.log(await res.json());
}
go();
