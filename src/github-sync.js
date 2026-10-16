/**
 * GitHub REST API integration for in-browser visual editing and publishing.
 * Operates entirely client-side using browser fetch with fine-grained personal access tokens.
 * No secrets are ever stored in code or sent to third-party servers.
 */

const GITHUB_API = 'https://api.github.com';

function getHeaders(token) {
  return {
    Accept: 'application/vnd.github.v3+json',
    Authorization: `Bearer ${token.trim()}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Validates a GitHub Personal Access Token and verifies repository write permissions.
 */
export async function verifyGitHubAccess(token, owner = 'lian0-0mochi', repo = 'LWang.github.io') {
  if (!token || !token.trim()) {
    throw new Error('Please enter a GitHub Personal Access Token.');
  }

  // 1. Check user identity
  const userRes = await fetch(`${GITHUB_API}/user`, {
    headers: getHeaders(token),
  });

  if (!userRes.ok) {
    if (userRes.status === 401) {
      throw new Error('Invalid GitHub token. Please check that you copied the complete token.');
    }
    throw new Error(`GitHub authentication failed: ${userRes.statusText}`);
  }

  const user = await userRes.json();

  // 2. Check repository permissions
  const repoRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, {
    headers: getHeaders(token),
  });

  if (!repoRes.ok) {
    if (repoRes.status === 404) {
      throw new Error(`Repository ${owner}/${repo} not found or token lacks access to it.`);
    }
    throw new Error(`Failed to access repository: ${repoRes.statusText}`);
  }

  const repoData = await repoRes.json();
  const permissions = repoData.permissions || {};

  if (!permissions.push && !permissions.admin) {
    throw new Error(
      `Token authenticated as ${user.login}, but lacks Write/Push permissions on ${owner}/${repo}. Please grant 'Contents: Read and write' in token settings.`
    );
  }

  return {
    username: user.login,
    name: user.name || user.login,
    avatarUrl: user.avatar_url,
    canWrite: true,
    defaultBranch: repoData.default_branch || 'main',
  };
}

/**
 * Commits multiple files atomically to a target branch using GitHub's Git Data API.
 * Creates the branch from baseBranch if it does not already exist.
 */
export async function commitFilesToBranch({
  token,
  owner = 'lian0-0mochi',
  repo = 'LWang.github.io',
  branch,
  baseBranch = 'main',
  files, // array of { path: string, content: string }
  commitMessage,
}) {
  const headers = getHeaders(token);

  // 1. Get base branch latest commit
  const baseRefRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`, {
    headers,
  });

  if (!baseRefRes.ok) {
    throw new Error(`Could not find base branch '${baseBranch}': ${baseRefRes.statusText}`);
  }

  const baseRef = await baseRefRes.json();
  const baseCommitSha = baseRef.object.sha;

  // 2. Check if target branch exists; create if not
  let parentCommitSha = baseCommitSha;
  const targetRefRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/ref/heads/${branch}`, {
    headers,
  });

  if (targetRefRes.ok) {
    const targetRef = await targetRefRes.json();
    parentCommitSha = targetRef.object.sha;
  } else if (targetRefRes.status === 404) {
    // Create branch from base commit
    const createBranchRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ref: `refs/heads/${branch}`,
        sha: baseCommitSha,
      }),
    });
    if (!createBranchRes.ok) {
      const errData = await createBranchRes.json().catch(() => ({}));
      throw new Error(`Failed to create branch '${branch}': ${errData.message || createBranchRes.statusText}`);
    }
  } else {
    throw new Error(`Failed to check branch '${branch}': ${targetRefRes.statusText}`);
  }

  // 3. Get the parent commit's tree SHA
  const parentCommitRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/commits/${parentCommitSha}`, {
    headers,
  });
  if (!parentCommitRes.ok) throw new Error('Could not retrieve commit tree.');
  const parentCommit = await parentCommitRes.json();
  const baseTreeSha = parentCommit.tree.sha;

  // 4. Create blobs for each file
  const treeItems = [];
  for (const file of files) {
    const blobRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/blobs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        content: file.content,
        encoding: 'utf-8',
      }),
    });
    if (!blobRes.ok) {
      throw new Error(`Failed to create Git blob for ${file.path}: ${blobRes.statusText}`);
    }
    const blob = await blobRes.json();
    treeItems.push({
      path: file.path,
      mode: '100644',
      type: 'blob',
      sha: blob.sha,
    });
  }

  // 5. Create new tree
  const treeRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/trees`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: treeItems,
    }),
  });
  if (!treeRes.ok) {
    const err = await treeRes.json().catch(() => ({}));
    throw new Error(`Failed to create Git tree: ${err.message || treeRes.statusText}`);
  }
  const newTree = await treeRes.json();

  // 6. Create commit
  const commitRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/commits`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message: commitMessage,
      tree: newTree.sha,
      parents: [parentCommitSha],
    }),
  });
  if (!commitRes.ok) {
    const err = await commitRes.json().catch(() => ({}));
    throw new Error(`Failed to create commit: ${err.message || commitRes.statusText}`);
  }
  const newCommit = await commitRes.json();

  // 7. Update branch ref
  const updateRefRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      sha: newCommit.sha,
      force: false,
    }),
  });
  if (!updateRefRes.ok) {
    const err = await updateRefRes.json().catch(() => ({}));
    throw new Error(`Failed to update branch ref '${branch}': ${err.message || updateRefRes.statusText}`);
  }

  return {
    commitSha: newCommit.sha,
    branch,
    commitUrl: `https://github.com/${owner}/${repo}/commit/${newCommit.sha}`,
  };
}

/**
 * Creates or retrieves an existing Pull Request for a draft branch.
 */
export async function createOrGetPullRequest({
  token,
  owner = 'lian0-0mochi',
  repo = 'LWang.github.io',
  branch,
  baseBranch = 'main',
  title = 'CMS Content Draft Updates',
  body = 'Automated content draft created via the website Visual Editor.',
}) {
  const headers = getHeaders(token);

  // Check if open PR already exists
  const existingRes = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/pulls?head=${owner}:${branch}&base=${baseBranch}&state=open`,
    { headers }
  );

  if (existingRes.ok) {
    const list = await existingRes.json();
    if (list.length > 0) {
      return {
        number: list[0].number,
        htmlUrl: list[0].html_url,
        isNew: false,
      };
    }
  }

  // Create new PR
  const createRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/pulls`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title,
      body,
      head: branch,
      base: baseBranch,
      draft: false,
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(`Failed to create Pull Request: ${err.message || createRes.statusText}`);
  }

  const pr = await createRes.json();
  return {
    number: pr.number,
    htmlUrl: pr.html_url,
    isNew: true,
  };
}
