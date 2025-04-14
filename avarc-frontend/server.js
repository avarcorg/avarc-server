const { exec } = require('child_process');

// Start the Next.js application
exec('npm start', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
  console.log(stdout);
  console.error(stderr);
});
