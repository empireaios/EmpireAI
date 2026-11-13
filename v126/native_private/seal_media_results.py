"""Independently reconcile only A10 preparation receipts before private sealing."""
import base64,copy,hashlib,json,pathlib,stat
STATUS='PASS_AUTHENTICATED_SOURCE_BOUND_RETAINED_MEDIA_PRESENTATION'
ASSETS={'image/jpeg':(149719,'4fe19c2fbe0907474d053181a5568489d842421e0dbd2b627e487cca61511048'),
        'image/png':(599818,'69f1f95ab622041332d5e5e1ee43a59a2c34bd017151a6bb45e260f69e035788')}
def digest(value):return hashlib.sha256(json.dumps(value,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
def verify_media_results(runtime,values,append,require,sha):
 result=values.get('connector-media-browser-result.json',{})
 if result.get('status')!=STATUS:return False
 admission=values['connector-source-admission.json'];record=admission['record']
 policy=values['connector-media-policy-binding.json'];binding=values['connector-media-binding-request.json']
 require(admission['status']=='ADMITTED_SOURCE_OBSERVATION_ONLY','MEDIA_SOURCE_ADMISSION')
 require(policy['actualNativePrincipalAndCandidateReadBack']is True and policy['candidateDigest']==record['digest']and policy['candidateId']==record['id'],'MEDIA_ACTUAL_SOURCE_BINDING')
 require(binding['candidate']==record and binding['principal']==policy['principal']and binding['ownerApproval']is False,'MEDIA_ACTUAL_PRINCIPAL_BINDING')
 require(result['sameCandidateAcrossViews']is True and result['sameMediaVersionAcrossViews']is True and result['noOwnerApproval']is True and result['browserClosed']is True,'MEDIA_BROWSER_COMPLETE')
 require(result['actualPreparedCommandCount']==2 and [x['action']for x in result['actualPreparedCommands']]==['REQUEST_EDIT','PROPOSE_RETAINED'],'MEDIA_PREPARED_COMMANDS_ONLY')
 require(result['network']['unexpectedMutationsBlocked']==0,'MEDIA_UNEXPECTED_MUTATIONS')
 require({v['name']for v in result['views']}=={'desktop','mobile'},'MEDIA_VIEW_SET')
 final=None
 def image(artifact):
  size,expected=ASSETS[artifact['mime']];require(artifact['bytes']==size and artifact['sha256']==expected,'MEDIA_EXPECTED_ASSET')
  raw=base64.b64decode(artifact['base64'],validate=True)
  require(len(raw)==size and sha(raw)==expected and base64.b64encode(raw).decode()==artifact['base64'],'MEDIA_ACTUAL_SERVED_BYTES')
  require(artifact['rights']=='PRIVATE_FACTUAL_PREPARATION_ONLY','MEDIA_RIGHTS')
 def response(receipt,version):
  name=receipt['path'];require(name in ['connector-media-portfolio-before.json','connector-media-portfolio-request.json','connector-media-portfolio-desktop.json','connector-media-portfolio-mobile.json'],'MEDIA_RESPONSE_NAME')
  raw=(runtime/'browser-output'/name).read_bytes();require(len(raw)==receipt['responseBytes']<=4194304 and sha(raw)==receipt['responseSHA256'],'MEDIA_RESPONSE_EXACT_BYTES')
  body=json.loads(raw);require(len(body['connectorSourceCandidates']['candidates'])==1 and body['connectorSourceCandidates']['candidates'][0]['digest']==record['digest'],'MEDIA_RESPONSE_SOURCE')
  media=body['connectorMedia'];require(media['candidateId']==record['id']and media['candidateDigest']==record['digest']and media['version']==version,'MEDIA_SOURCE_VERSION')
  require(media['ownerApproval']is False and media['current']['assets']==[]and media['publicPublicationAllowed']is False and media['externalEffects']==0 and media['paidInference']==0,'MEDIA_NO_OWNER_DECISION')
  require(len(media['history'])==version and len(media['original'])==1,'MEDIA_EVENT_COUNT');image(media['original'][0])
  previous=''
  for index,event in enumerate(media['history']):
   body=dict(event);actual=body.pop('digest');require(digest(body)==actual and event['previous']==previous and event['version']==index+1,'MEDIA_EVENT_CHAIN');previous=actual
   require(event['candidateDigest']==record['digest']and event['owner']==policy['principal']['id']and event['ownerApproval']is False and event['action']==['REQUEST_EDIT','PROPOSE_RETAINED'][index],'MEDIA_EVENT_ACTOR_ACTION')
   command=result['actualPreparedCommands'][index]
   require(command['id']==event['id']and command['expectedVersion']==index and command['reference']=={'candidateId':record['id'],'candidateDigest':record['digest']},'MEDIA_ACTUAL_COMMAND_IDENTITY')
   normalized={'id':command['id'],'reference':{'candidateId':record['id'],'candidateDigest':record['digest']},'expectedVersion':index,'action':command['action']}
   if index==0:normalized.update(instructions=command['instructions'],assetIds=command['assetIds'])
   require(event['requestDigest']==digest({'principal':{'workspace':policy['principal']['workspaceId'],'owner':policy['principal']['id']},'request':normalized,'bindingDigest':event['bindingDigest']}),'MEDIA_ACTUAL_COMMAND_DIGEST')
  if version==2:
   require(len(media['proposal']['assets'])==1 and media['proposal']['editRequestDigest']==media['history'][0]['digest'],'MEDIA_PROPOSAL_REQUEST');image(media['proposal']['assets'][0])
  return media
 def screenshot(item):
  require(item['path']in ['connector-media-request-desktop.png','connector-media-desktop.png','connector-media-mobile.png']and item['scope']=='ACTUAL_SOURCE_BOUND_PRIVATE_MEDIA_SECTION'and item['privateIdentityMaskApplied']is True,'MEDIA_SCREENSHOT_SCOPE')
  p=runtime/'browser-output'/item['path'];s=p.lstat();require(stat.S_ISREG(s.st_mode)and s.st_nlink==1 and s.st_size<=8388608,'MEDIA_SCREENSHOT_TYPE');b=p.read_bytes()
  require(len(b)==item['bytes']and sha(b)==item['sha256']and b[:8]==b'\x89PNG\r\n\x1a\n'and b[12:16]==b'IHDR','MEDIA_SCREENSHOT_BYTES')
  require(int.from_bytes(b[16:20],'big')==item['pixels']['width']and int.from_bytes(b[20:24],'big')==item['pixels']['height'],'MEDIA_SCREENSHOT_DIMENSIONS');append(item['path'],b,8388608)
 for view in result['views']:
  require(view['status']=='PASS_SOURCE_BOUND_PRIVATE_MEDIA_PREPARATION_AND_RENDERING'and view['canonicalCandidate']==record and view['contextClosed']is True and view['browserIdentityCleared']is True,'MEDIA_VIEW_COMPLETE')
  media=response(view['portfolioResponse'],2)
  if final is not None:require(media==final,'MEDIA_DURABLE_RELOAD');final=media
  else:final=media
  metadata=copy.deepcopy(media)
  for asset in metadata['original']+metadata['proposal']['assets']:asset.pop('base64')
  require(metadata==view['mediaRecord'],'MEDIA_METADATA_READBACK')
  require(view['archive']=={'initiallyCollapsed':True,'truthfulEmptyHistory':True,'openedAndCollapsed':True,'mutationRequests':0},'MEDIA_ARCHIVE')
  require(view['reload']['version']==2 and view['reload']['selectedAssets']==0 and view['reload']['archiveCollapsed']is True and view['readOnlyOriginalCardPreserved']is True,'MEDIA_RELOAD_SELECTION')
  screenshot(view['screenshot'])
  if view['name']=='desktop':response(view['beforeResponse'],0);response(view['requestResponse'],1);screenshot(view['requestScreenshot'])
 require(result['finalMedia']['mediaDigest']==digest(final)and result['finalMedia']['currentAssets']==0 and result['finalMedia']['ownerApproval']is False,'MEDIA_FINAL_DIGEST')
 return True
