const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function extractRepoPath(url) {
  // Extract owner/repo from URL (handles multiple formats)
  // Examples:
  // - https://github.com/owner/repo.git
  // - git@github.com:owner/repo.git
  // - http://local_proxy@127.0.0.1:36255/git/owner/repo
  const httpsMatch = url.match(/github\.com[/:]([\w-]+)\/([\w-]+)/);
  const localMatch = url.match(/git\/([\w-]+)\/([\w-]+)/);

  if (httpsMatch) {
    return `${httpsMatch[1]}/${httpsMatch[2].replace('.git', '')}`;
  } else if (localMatch) {
    return `${localMatch[1]}/${localMatch[2].replace('.git', '')}`;
  }
  return 'unknown/unknown';
}

try {
  let gitHash = 'dev';
  let repoPath = 'unknown/unknown';

  // NETLIFY ENVIRONMENT - use environment variables
  // Netlify provides: COMMIT_REF, REPOSITORY_URL, CONTEXT
  if (process.env.COMMIT_REF) {
    console.log('Detected Netlify build environment');
    // Get short hash from full commit ref (first 7 chars)
    gitHash = process.env.COMMIT_REF.substring(0, 7);

    // Extract repo path from Netlify's REPOSITORY_URL
    if (process.env.REPOSITORY_URL) {
      repoPath = extractRepoPath(process.env.REPOSITORY_URL);
    }

    console.log(`Using Netlify env vars: COMMIT_REF=${process.env.COMMIT_REF}, REPOSITORY_URL=${process.env.REPOSITORY_URL}`);
  }
  // LOCAL DEVELOPMENT - use git commands
  else {
    console.log('Using local git commands');
    try {
      gitHash = execSync('git rev-parse --short HEAD').toString().trim();
      const remoteUrl = execSync('git config --get remote.origin.url').toString().trim();
      repoPath = extractRepoPath(remoteUrl);
    } catch (gitError) {
      console.warn('Git commands failed, using fallback values:', gitError.message);
    }
  }

  const buildInfo = {
    gitHash,
    repoPath,
    buildTime: new Date().toISOString(),
  };

  // Write to a file that can be imported
  const outputPath = path.join(__dirname, '..', 'lib', 'build-info.json');
  fs.writeFileSync(outputPath, JSON.stringify(buildInfo, null, 2));

  console.log('Build info generated successfully:', buildInfo);
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
  console.log('Using fallback build info');
}
