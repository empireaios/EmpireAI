"""Fail-closed provenance and HTTP-result gate for actual compiled-guard events."""
def verify_origin_observations(observations, phase, package, image, require_contract=False):
 assert phase in {'NORMAL','RECOVERY','NORMAL_RETURN'}
 role='recovery' if phase=='RECOVERY' else 'normal'
 identity={'schema':'work8-safe-origin-observation-v2','phase':phase,'nodeVersion':'v22.23.2',
           'role':role,'frontendImage':image,'frontendCommit':package['commit'],'frontendTree':package['tree'],
           'buildId':package['buildId'],'requestModuleId':package['webpackRequestModuleId'],
           'adapterModuleId':package['webpackAdapterModuleId'],'compiledGuardFile':package['guard']['file'],
           'compiledGuardSha256':package['files'][package['guard']['file']]}
 assert package['image']==image and len(observations)<=161,'ORIGIN_OBSERVER_IDENTITY_MISMATCH'
 for row in observations:
  assert all(row.get(k)==v for k,v in identity.items()),'ORIGIN_OBSERVER_IDENTITY_MISMATCH'
  assert type(row.get('pid')) is int and row['pid']>0,'ORIGIN_OBSERVER_PROCESS_REFUSED'
  allowed=set(identity)|{'kind','pid'}
  allowed|=({'configuredHostname','requestedDnsResultOrder','separatePrototypeProved','guardSourceUnchanged'} if row.get('kind')=='observer-installed' else {'sequence','method','routeClass','origin','requestUrlOrigin','originEqualsRequestUrlOrigin','guardWouldRefuse','httpStatus','responseFinished','originReadColumn','urlReadColumn','originalGetterResultUnchanged','originalHeaderResultUnchanged'})
  assert set(row)==allowed,'ORIGIN_OBSERVER_UNREVIEWED_FIELD'
 installed=[r for r in observations if r.get('kind')=='observer-installed']
 rows=[r for r in observations if r.get('kind')=='actual-guard-comparison-operands']
 assert len(installed)+len(rows)==len(observations),'ORIGIN_OBSERVER_EVENT_KIND_REFUSED'
 if observations:
  assert len(installed)==1 and installed[0]['configuredHostname']=='localhost' and installed[0]['guardSourceUnchanged'] is True and installed[0]['separatePrototypeProved'] is True,'ORIGIN_OBSERVER_NOT_INSTALLED'
  assert all(row['pid']==installed[0]['pid'] for row in rows),'ORIGIN_OBSERVER_PROCESS_MISMATCH'
 for row in rows:
  assert row['origin'] in {None,'[OMITTED]','http://localhost:43117','http://localhost:43119'} and row['requestUrlOrigin'] in {'[OMITTED]','http://localhost:43117','http://localhost:43119'},'ORIGIN_OBSERVER_UNSAFE_ORIGIN'
  assert row['method']=='POST' and row['routeClass']=='OWNER_ADVISOR_MEMORY','ORIGIN_OBSERVER_ROUTE_REFUSED'
  assert row['responseFinished'] is True and type(row['httpStatus']) is int and 100<=row['httpStatus']<=599,'ORIGIN_OBSERVER_RESPONSE_UNBOUND'
  assert row['originalGetterResultUnchanged'] is True and row['originalHeaderResultUnchanged'] is True,'ORIGIN_OBSERVER_CHANGED_OPERAND'
  assert type(row['sequence']) is int and 1<=row['sequence']<=40
  assert type(row['originEqualsRequestUrlOrigin']) is bool and row['guardWouldRefuse'] is (not row['originEqualsRequestUrlOrigin'])
  for key in ['originReadColumn','urlReadColumn']:
   assert type(row[key]) is int and package['guard']['columnStart']<=row[key]<=package['guard']['columnEnd'],'ORIGIN_OBSERVER_CALLSITE_REFUSED'
 if require_contract:
  assert len(installed)==1,'ORIGIN_OBSERVER_NOT_INSTALLED'
  status={'NORMAL':401,'RECOVERY':423,'NORMAL_RETURN':200}[phase]
  assert any(r['origin']=='http://localhost:43117' and r['requestUrlOrigin']=='http://localhost:43117' and r['originEqualsRequestUrlOrigin'] is True and r['httpStatus']==status for r in rows),'ACTUAL_SAME_ORIGIN_OPERANDS_NOT_OBSERVED'
  if phase=='NORMAL':
   assert any(r['origin']=='http://localhost:43119' and r['requestUrlOrigin']=='http://localhost:43117' and r['originEqualsRequestUrlOrigin'] is False and r['httpStatus']==403 for r in rows),'ACTUAL_HOSTILE_ORIGIN_OPERANDS_NOT_OBSERVED'
