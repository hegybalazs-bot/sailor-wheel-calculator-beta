'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const workflow=fs.readFileSync(path.join(__dirname,'../.github/workflows/deploy-public-hook.yml'),'utf8');
test('public deployment fallback requires green main push browser AND Node CI at exact commit',()=>{
 assert.match(workflow,/workflow_run:/);
 assert.match(workflow,/Browser QA \(Chromium, Firefox, WebKit\)/);
 assert.match(workflow,/head_branch == 'main'/);
 assert.match(workflow,/workflow_run\.event == 'push'/);
 assert.match(workflow,/workflow_run\.conclusion == 'success'/);
 assert.match(workflow,/head_repository\.full_name == github\.repository/);
 assert.match(workflow,/head_sha:sha/);
 assert.match(workflow,/workflow_id:'wheel-tests\.yml'/);
 assert.match(workflow,/testRun\.conclusion!=='success'/);
 assert.match(workflow,/latest\.data\.commit\.sha!==sha/);
 assert.match(workflow,/again\.data\.commit\.sha!==sha/);
});
test('deploy hook is optional, secret-only, and never deployed when the secret is missing',()=>{
 assert.match(workflow,/secrets\.RENDER_PUBLIC_DEPLOY_HOOK_URL/);
 assert.match(workflow,/\[\[ -z "\$\{RENDER_PUBLIC_DEPLOY_HOOK_URL\}" \]\]/);
 assert.match(workflow,/https:\/\/api\.render\.com\/deploy\/\*/);
 assert.match(workflow,/curl --fail --silent --show-error/);
 assert.doesNotMatch(workflow,/https:\/\/api\.render\.com\/deploy\/srv-[a-z0-9]+\?key=/);
 assert.doesNotMatch(workflow,/\bref=\$\{\{/);
});
