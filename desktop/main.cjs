require('./launcher.cjs').main().catch(error => {
  console.error(`Local Table could not start: ${error.message}`);
  process.exitCode = 1;
});
