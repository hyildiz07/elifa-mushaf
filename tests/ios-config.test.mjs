import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const script=path.resolve('scripts/configure-ios-firebase.mjs');
test('Firebase iOS setup is repeatable and rejects a mismatched bundle',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'elifa-ios-config-'));
  try{
    const app=path.join(root,'ios','App','App');
    fs.mkdirSync(app,{recursive:true});
    fs.writeFileSync(path.join(root,'capacitor.config.json'),JSON.stringify({appId:'com.elifaplatform.mushaf'}));
    fs.writeFileSync(path.join(app,'Info.plist'),'<dict>\n<key>CFBundleExecutable</key><string>App</string>\n</dict>');
    const source=path.join(root,'firebase.plist');
    const plist=id=>`<dict><key>BUNDLE_ID</key><string>${id}</string><key>REVERSED_CLIENT_ID</key><string>com.googleusercontent.apps.test123</string></dict>`;
    fs.writeFileSync(source,plist('wrong.bundle'));
    let result=spawnSync(process.execPath,[script,source],{cwd:root,encoding:'utf8'});
    assert.notEqual(result.status,0);
    assert.equal(fs.existsSync(path.join(app,'GoogleService-Info.plist')),false);

    fs.writeFileSync(source,plist('com.elifaplatform.mushaf'));
    for(let i=0;i<2;i++){
      result=spawnSync(process.execPath,[script,source],{cwd:root,encoding:'utf8'});
      assert.equal(result.status,0,result.stderr);
    }
    const info=fs.readFileSync(path.join(app,'Info.plist'),'utf8');
    assert.equal((info.match(/<key>CFBundleURLTypes<\/key>/g)||[]).length,1);
    assert.match(info,/<string>com\.googleusercontent\.apps\.test123<\/string>/);
  }finally{
    const resolved=path.resolve(root);
    if(path.dirname(resolved)===path.resolve(os.tmpdir())&&path.basename(resolved).startsWith('elifa-ios-config-'))
      fs.rmSync(resolved,{recursive:true,force:true});
  }
});
