const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  // Get git commit hash (short version)
  const gitHash = execSync('git rev-parse --short HEAD').toString().trim();

  // Get git remote URL and extract repo info
  const remoteUrl = execSync('git config --get remote.origin.url').toString().trim();

  // Extract owner/repo from URL (handles both HTTPS and SSH formats)
  // Examples:
  // - https://github.com/owner/repo.git
  // - git@github.com:owner/repo.git
  // - http://local_proxy@127.0.0.1:36255/git/owner/repo
  let repoPath = 'unknown/unknown';
  const httpsMatch = remoteUrl.match(/github\.com[/:]([\w-]+)\/([\w-]+)/);
  const localMatch = remoteUrl.match(/git\/([\w-]+)\/([\w-]+)/);

  if (httpsMatch) {
    repoPath = `${httpsMatch[1]}/${httpsMatch[2].replace('.git', '')}`;
  } else if (localMatch) {
    repoPath = `${localMatch[1]}/${localMatch[2].replace('.git', '')}`;
  }

  const buildInfo = {
    gitHash,
    repoPath,
    buildTime: new Date().toISOString(),
  };

  // Write to a file that can be imported
  const outputPath = path.join(__dirname, '..', 'lib', 'build-info.json');
  fs.writeFileSync(outputPath, JSON.stringify(buildInfo, null, 2));

  console.log('Build info generated:', buildInfo);
} catch (error) {
  console.error('Failed to generate build info:', error.message);
  // Write fallback info
  const fallbackInfo = {
    gitHash: 'dev',
    repoPath: 'unknown/unknown',
    buildTime: new Date().toISOString(),
  };
  const outputPath = path.join(__dirname, '..', 'lib', 'build-info.json');
  fs.writeFileSync(outputPath, JSON.stringify(fallbackInfo, null, 2));
}
