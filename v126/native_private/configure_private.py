#!/usr/bin/env python3
"""Provision owner-named private native bootstrap without credential disclosure.

This creates fresh native-only credentials, never reads Google/ChatGPT credentials,
never logs a password, and performs no native login, owner click, or business approval.
Usage: directory exactAuthoritySHA256 absoluteExpiryUnixMs
"""
import datetime,hashlib,json,os,pathlib,re,secrets,sys,time
assert len(sys.argv)==4 and os.getuid()==0
root=pathlib.Path(sys.argv[1]);authority=sys.argv[2];expiry=int(sys.argv[3]);now=int(time.time()*1000)
assert root.is_absolute()and root.parent.resolve(strict=True)==root.parent and not root.exists()and not root.is_symlink()
assert re.fullmatch('[a-f0-9]{64}',authority)and now<expiry<=now+1200000
root.mkdir(mode=0o700)
control=pathlib.Path(__file__).resolve().parent
marker=root.parent/'private-phase-started.json';ms=marker.lstat()
assert marker.is_file()and not marker.is_symlink()and ms.st_uid==0 and ms.st_mode&0o777==0o400
assert json.loads(marker.read_text())['sourceCommit']==os.environ['GITHUB_SHA']
build=json.loads((control/'connector-build-manifest.json').read_text())
assert build['applicationCommit']=='6c1e63ba20619ee480742fd87dc810ca93152e22'
adapter=next(p for p in build['backendOverlays']if p['destination']=='backend/dist/runtime/commerce-runtime/governed/work8-connector-source.js')
assert re.fullmatch('[a-f0-9]{64}',adapter['sha256'])
publication=os.environ['GITHUB_SHA'];assert re.fullmatch('[a-f0-9]{40}',publication)
operation=json.loads((control/'authority.json').read_text())['operationIdentity']
assert operation=='V128-CONNECTOR-OWNER-NATIVE-A03-20261113'
owner=os.environ.get('EMPIREAI_WORK8_NATIVE_OWNER_EMAIL','').strip().lower()
assert hashlib.sha256(owner.encode()).hexdigest()=='a437be3d7f2e7927959c2be2040016464de75d69529d9abd197e47a8caa21267','PRIVATE_OWNER_BINDING_REQUIRED'
config={'mode':'PRIVATE_LOOPBACK','origin':'http://127.0.0.1:43117','founderEmail':owner,
 'founderPassword':secrets.token_urlsafe(48),'adminPassword':secrets.token_urlsafe(48),
 'authoritySHA256':authority,'expiresAtMs':expiry,'adapterPublicationCommit':publication,
 'connectorOperationIdentity':operation,'connectorModuleSHA256':adapter['sha256']}
policy={'schema':1,'mode':'RELEASED','approvalSha256':authority,
 'expiresAt':datetime.datetime.fromtimestamp(expiry/1000,datetime.timezone.utc).isoformat(timespec='milliseconds').replace('+00:00','Z')}
connector_policy={'schema':'WORK8_CONNECTOR_SOURCE_ADMISSION_V1','operationId':operation,
 'workspace':'ws_empire_1','authoritySHA256':authority,'expiresAtUTC':policy['expiresAt'],
 'expectedCurrentCount':0,'applicationCommit':build['applicationCommit'],
 'adapterPublicationCommit':publication,'adapterModuleSHA256':adapter['sha256']}
for name,data in [('native-bootstrap.json',config),('owner-policy.json',policy),('connector-policy.json',connector_policy)]:
 fd=os.open(root/name,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,0o400)
 with os.fdopen(fd,'w')as f:json.dump(data,f,separators=(',',':'));f.write('\n');f.flush();os.fsync(f.fileno())
print(json.dumps({'schema':'v126-legitimate-private-native-provisioning-v1','ownerEmailSHA256':hashlib.sha256(config['founderEmail'].encode()).hexdigest(),
 'credentialType':'FRESH_NATIVE_ONLY_RANDOM_BOOTSTRAP','priorCredentialsReused':False,
 'credentialDisclosed':False,'nativeLoginPerformed':False,'ownerActionObserved':False,
 'inputActor':'DELEGATED_TECHNICAL_OPERATOR','authoritySHA256':authority,'expiresAtMs':expiry,
 'publicIngress':False,'wholeRowAccepted':False}))
