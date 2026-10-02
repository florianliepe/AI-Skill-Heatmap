"""Read-only import: private output stays in .local, never in the public build."""
import json, re, sys
from pathlib import Path
import openpyxl

source_dir = Path(sys.argv[1])
out = Path('.local/seed.json')
book = openpyxl.load_workbook(source_dir/'AI_Skill_Catalog_and_Value_Stream_Profiles_v1.xlsx', data_only=True)
kb = openpyxl.load_workbook(source_dir/'DEKRA_Skill_Knowledge_Base_v1.xlsx', data_only=True)
def clean(v):
    return re.sub(r'DEKRA(?:-owned)?', 'Value stream', str(v or ''), flags=re.I)
skills=[]
for r in list(book['AI Skill Catalogue'].values)[5:]:
    if not r[0]: continue
    skills.append(dict(id=r[0],name=clean(r[1]),family=clean(r[2]),definition=clean(r[3]),levels=[clean(v) for v in r[4:8]],relevance=r[8],impact=r[9],upskilling=r[10],horizon=clean(r[12]),status='Proposed',evidence=clean(r[13])))
# Enrich matching specialised skills from the broader knowledge base, without importing unrelated roles.
matches=0
for r in list(kb['New Candidates'].values)[5:]:
    for s in skills:
        if s['name'].casefold()==str(r[1]).casefold():
            s['evidence'] += '; Knowledge-base alignment: '+clean(r[5])
            matches+=1
roles=[]; assessments=[]; role_ids={}
for r in list(book['Role Profiles'].values)[5:]:
    if not r[0]: continue
    if r[0] not in role_ids:
        rid='role-'+str(len(roles)+1);role_ids[r[0]]=rid
        roles.append(dict(id=rid,name=clean(r[0]),accountability=clean(r[7]),workMode=clean(r[5])))
    assessments.append(dict(id=f'assessment-{len(assessments)+1}',roleId=role_ids[r[0]],skillId=r[1],target=r[3],current=None,evidence='',priority=r[4]))
nodes=[]
for i,r in enumerate(list(book['Value Stream'].values)[5:]):
    if not r[0]:continue
    nodes.append(dict(id=f'node-{i+1}',label=clean(r[0]),category='Value stream',description=clean(r[1]),currentState=clean(r[2]),targetState=clean(r[3]),owner=clean(r[5]),mode='AI-augmented',x=(i%4)*300,y=(i//4)*240))
nodes[0]['description']='Collect energy-efficiency, licence-management and associated-service needs from business partners.'
nodes[2].update(label='3. Domain & controls',description='Clarify energy, licensing and service constraints.',targetState='Identify data, rights, architecture and control gaps.')
seed=dict(visions=[dict(id='vision-1',title='From maker to architect',statement='By 2028, our value stream orchestrates human expertise and AI to turn business demand into reliable, measurable services for energy efficiency and licence management.',purpose='Close interpretation gaps, shorten request-to-ready time and build accountable AI product teams.',horizon='2027 / 2028',owner='Value Stream Lead')],objectives=[],keyResults=[],skills=skills,roles=roles,assessments=assessments,nodes=nodes,edges=[dict(id=f'edge-{i}',source=f'node-{i}',target=f'node-{i+1}',label='Handover') for i in range(1,len(nodes))],audit=[])
objectives=[('Deliver requirements ready for development','Reduce clarification loops between business partners, the value stream and development teams.','Flow & quality'),('Create measurable service value','Use evidence to improve energy-efficiency and licence-management services.','Business value'),('Build AI-ready product teams','Develop the skills, decision rights and human controls needed for AI-native work.','People & capability')]
for i,(title,description,pillar) in enumerate(objectives,1):seed['objectives'].append(dict(id=f'obj-{i}',title=title,description=description,owner='Value Stream Lead',period='2027',pillar=pillar))
krs=[('obj-1','Request-to-DoR lead time',100,65,'baseline index'),('obj-1','First-pass DoR acceptance',60,80,'%'),('obj-1','Requirements traceability',0,95,'%'),('obj-2','Lighthouse products with validated value cases',0,3,'products'),('obj-2','Portfolio applications assessed',0,33,'applications'),('obj-3','Role profiles validated by owners',0,10,'profiles'),('obj-3','Priority skills with assessed proficiency',0,100,'%')]
for i,(obj,title,base,target,unit) in enumerate(krs,1):seed['keyResults'].append(dict(id=f'kr-{i}',objectiveId=obj,title=title,baseline=base,target=target,current=None,unit=unit,owner='To be assigned',dueDate='2027-12-31',evidence='Planning hypothesis. Validate baseline and target with the accountable owner.'))
architecture=[
 ('Required AI capabilities','Capability','Shared skill language and evidence-based role targets.','Individual tool experience and implicit skill requirements.','Role-based AI proficiency, evaluation and context-engineering capabilities.','Value Stream Lead'),
 ('Team setup & decision rights','Team & organisation','Define product, platform and development responsibilities.','Task execution and handover coordination dominate.','Product teams act as challengers and architects with explicit human decision rights.','Product / Service Owner'),
 ('AI tools & shared systems','AI tools & systems','Connect a unified frontend, governed context storage and reusable workflows.','Fragmented documents and point solutions.','Versioned context, approved gateway, shared tools and observable n8n workflows.','Platform, System & AI Architect'),
 ('Service & product portfolio','Service / product','Prioritise opportunities across energy efficiency and licence management.','Application-level ideas with uneven value evidence.','A prioritised portfolio and up to three validated lighthouse candidates.','Program / Portfolio Manager'),
 ('Enablement & learning','Enablement','Turn role gaps into practical capability-building actions.','Ad-hoc AI learning and limited evidence of application.','Role-based learning, coached pilots and demonstrated proficiency.','Value Stream Lead'),
 ('Operating model & use-case funnel','Governance','Move ideas through evidence, design, readiness and impact review.','Inconsistent evaluation and unclear AI ownership.','Clear gates, accountable owners, measured outcomes and continuous portfolio learning.','Product Operations & Governance Specialist')]
for i,(label,category,description,current,target,owner) in enumerate(architecture):
 seed['nodes'].append(dict(id=f'architecture-{i+1}',label=label,category=category,description=description,currentState=current,targetState=target,owner=owner,mode='AI-augmented',x=(i%3)*320,y=800+(i//3)*250))
for i,(source,target,label) in enumerate([(1,2,'Enables'),(2,3,'Uses'),(2,4,'Owns'),(3,4,'Enables'),(5,1,'Develops'),(6,2,'Governs'),(6,4,'Prioritises')]):
 seed['edges'].append(dict(id=f'architecture-edge-{i+1}',source=f'architecture-{source}',target=f'architecture-{target}',label=label))
out.write_text(json.dumps(seed,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'skills':len(skills),'roles':len(roles),'roleTargets':len(assessments),'knowledgeBaseMatches':matches,'output':str(out)}))
