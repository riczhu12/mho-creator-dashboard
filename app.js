(() => {
  const D = window.MHO_PUBLIC_DATA || {posts:[],live:[],comments:[],commentCoverage:{}};
  const POSTS = D.posts || [], COMMENTS = D.comments || [], LIVE = D.live || [];
  const REGIONS = ['LATAM','KR','TWHK','SEA','MEA'];
  const STAGES = ['上线前','上线后3天','上线后7天','上线后14天'];
  const $ = id => document.getElementById(id);
  const num = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const known = value => value !== null && value !== '' && Number.isFinite(Number(value));
  const fmt = value => num(value).toLocaleString('zh-CN');
  const compact = value => new Intl.NumberFormat('zh-CN',{notation:'compact',maximumFractionDigits:1}).format(num(value));
  const pct = value => `${(num(value)*100).toFixed(1)}%`;
  const esc = value => String(value ?? '').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const heat = item => num(item.viewCount)+num(item.interactionCount);
  const rate = item => num(item.viewCount)>0 ? num(item.interactionCount)/num(item.viewCount) : 0;
  const addOptions = (select, values) => [...new Set(values.filter(Boolean))].sort().forEach(value=>{const o=document.createElement('option');o.value=value;o.textContent=value;select.appendChild(o)});
  const total = rows => {const views=rows.reduce((s,x)=>s+num(x.viewCount),0), interactions=rows.reduce((s,x)=>s+num(x.interactionCount),0);return {views,interactions,heat:views+interactions,rate:views?interactions/views:0,viewCoverage:rows.filter(x=>known(x.viewCount)).length,interactionCoverage:rows.filter(x=>known(x.interactionCount)).length}};
  const median = values => {const a=values.filter(Number.isFinite).sort((x,y)=>x-y);if(!a.length)return 0;const m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2};
  const thumbnail = item => item.coverUrl || '';
  const platformCode = value => ({YouTube:'YT',TikTok:'TT',Twitch:'TW',Facebook:'FB',Instagram:'IG'}[value] || String(value||'MHO').slice(0,2).toUpperCase());
  const coverMarkup = item => `<div class="cover-fallback platform-${esc(String(item.platform||'other').toLowerCase())}"><b>${esc(platformCode(item.platform))}</b><span>${esc(item.creator||'Creator')}</span><small>${esc(item.region||'')} · ${esc(item.sourceClass||'')}</small></div>${thumbnail(item)?`<img src="${esc(thumbnail(item))}" alt="${esc(item.creator||'内容')}封面" loading="lazy" onerror="this.remove()">`:''}`;

  let overviewRegion='', rankingMode='views', commentsShown=8, postPage=1, sortMode='views', sortDirection='desc';
  const overviewInputs={platform:$('platformFilter'),source:$('sourceFilter'),stage:$('stageFilter')};
  const voiceInputs={region:$('voiceRegion'),platform:$('voicePlatform'),type:$('voiceType'),source:$('voiceSource'),sentiment:$('voiceSentiment')};
  const liveInputs={region:$('liveRegion'),platform:$('livePlatform'),source:$('liveSource')};
  const postInputs={region:$('postRegion'),platform:$('postPlatform'),type:$('postType'),source:$('postSource'),stage:$('postStage'),search:$('postSearch')};

  addOptions(overviewInputs.platform, POSTS.map(x=>x.platform));
  addOptions(voiceInputs.platform, COMMENTS.map(x=>x.platform)); addOptions(voiceInputs.type, COMMENTS.map(x=>x.publishType));
  addOptions(liveInputs.platform, LIVE.map(x=>x.platform));
  addOptions(postInputs.platform, POSTS.map(x=>x.platform)); addOptions(postInputs.type, POSTS.map(x=>x.publishType));
  $('updatedAt').textContent=D.generatedAt || '—';

  function overviewBaseRows(){return POSTS.filter(x=>(!overviewInputs.platform.value||x.platform===overviewInputs.platform.value)&&(!overviewInputs.source.value||x.sourceClass===overviewInputs.source.value)&&(!overviewInputs.stage.value||x.publishStage===overviewInputs.stage.value))}
  function overviewRows(){return overviewBaseRows().filter(x=>!overviewRegion||x.region===overviewRegion)}
  function bestGroup(rows,key){return [...new Set(rows.map(x=>x[key]).filter(Boolean))].map(name=>{const r=rows.filter(x=>x[key]===name);return {name,rows:r,...total(r)}}).sort((a,b)=>b.heat-a.heat)}
  function renderOverview(){
    const rows=overviewRows(), baseRows=overviewBaseRows(), t=total(rows), baseTotal=total(baseRows), regionGroups=bestGroup(baseRows,'region'), platformGroups=bestGroup(rows,'platform');
    const topRegion=regionGroups[0], topPlatform=platformGroups[0];
    const valid=rows.filter(x=>known(x.viewCount)&&num(x.viewCount)>0&&known(x.interactionCount));
    const topTen=[...valid].sort((a,b)=>b.viewCount-a.viewCount).slice(0,10); const concentration=t.views?topTen.reduce((s,x)=>s+num(x.viewCount),0)/t.views:0;
    const topEngagement=[...regionGroups].filter(x=>x.views>0).sort((a,b)=>b.rate-a.rate)[0];
    const scope=[overviewRegion||'五区域合计',overviewInputs.platform.value||'全部平台',overviewInputs.source.value||'全部来源',overviewInputs.stage.value||'全部阶段'].join(' · '); $('scopeText').textContent=scope;
    $('totalViews').textContent=compact(t.views); $('totalInteractions').textContent=compact(t.interactions); $('overallRate').textContent=pct(t.rate); $('postCount').textContent=rows.length; $('creatorCount').textContent=`${new Set(rows.map(x=>x.creator)).size} 位创作者`; $('viewCoverage').textContent=`${t.viewCoverage}/${rows.length} 条公开`; $('interactionCoverage').textContent=`${t.interactionCoverage}/${rows.length} 条公开`;
    const selectedShare=baseTotal.heat?t.heat/baseTotal.heat:0, averageHeat=baseTotal.heat/REGIONS.length, vsAverage=averageHeat?t.heat/averageHeat-1:0, topPlatformShare=t.heat&&topPlatform?topPlatform.heat/t.heat:0;
    if(overviewRegion){
      $('headline').textContent=t.heat?`${overviewRegion}贡献五区域${pct(selectedShare)}热度，较单区域平均${vsAverage>=0?'高':'低'}${pct(Math.abs(vsAverage))}`:`${overviewRegion}当前筛选暂无公开热度`;
      $('headlineDetail').textContent=t.heat?`${topPlatform?.name||'—'}贡献该区域${pct(topPlatformShare)}热度；头部10条内容贡献${pct(concentration)}播放。当前互动率${pct(t.rate)}，五区域同口径为${pct(baseTotal.rate)}。`:'请调整平台、来源或阶段筛选。';
      $('insightGrid').innerHTML=[['区域占比',`${pct(selectedShare)}五区域热度`,'按相同平台、来源和阶段口径计算。'],['对比均值',`较单区域平均${vsAverage>=0?'高':'低'}${pct(Math.abs(vsAverage))}`,'单区域平均＝当前筛选五区域总热度÷5。'],['互动质量',`${pct(t.rate)} vs 全区${pct(baseTotal.rate)}`,'互动率用于观察公开回应强度，不等同于留存或付费。']].map(x=>`<article><span>${x[0]}</span><strong>${x[1]}</strong><p>${x[2]}</p></article>`).join('');
    }else{
      const regionShare=baseTotal.heat&&topRegion?topRegion.heat/baseTotal.heat:0;
      $('headline').textContent=topRegion?`${topRegion.name}贡献五区域最多热度`:'当前筛选暂无公开数据';
      $('headlineDetail').textContent=topRegion?`${topRegion.name}占五区域${pct(regionShare)}热度；${topPlatform?.name||'—'}是贡献最高的平台。头部10条内容贡献${pct(concentration)}播放，传播规模${concentration>.65?'较集中':'有一定集中'}。`:'请调整筛选条件。';
      $('insightGrid').innerHTML=[['区域结构',topRegion?`${topRegion.name}占${pct(regionShare)}`:'—','区域贡献并不平均，整体结果需结合区域结构解释。'],['内容集中',`${pct(concentration)}来自头部10条`,'少数高播放内容会显著抬高总量。'],['互动质量',topEngagement?`${topEngagement.name}互动率${pct(topEngagement.rate)}`:'—','互动率用于观察公开回应强度，不等同于留存或付费。']].map(x=>`<article><span>${x[0]}</span><strong>${x[1]}</strong><p>${x[2]}</p></article>`).join('');
    }
    document.querySelectorAll('#regionTabs button').forEach(b=>b.classList.toggle('active',b.dataset.region===overviewRegion));
    renderBreakdown(rows);
  }

  function renderBars(id,groups){const max=Math.max(1,...groups.map(x=>x.heat));$(id).innerHTML=groups.map(g=>`<div class="bar-row"><div class="bar-label">${esc(g.name)}</div><div class="bar-track"><i style="width:${g.heat/max*100}%"></i></div><div class="bar-meta"><strong>${compact(g.heat)}</strong> 热度 · ${pct(g.rate)} · ${g.rows.length}条</div></div>`).join('')||'<p>暂无数据</p>'}
  function renderTrend(rows){
    const start=new Date('2026-10-29T00:00:00+08:00'),series=Array.from({length:15},(_,i)=>{const d=new Date(start.getTime()+i*86400000),key=`2026-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,daily=rows.filter(x=>x.publishDate===key);return{label:`${d.getMonth()+1}/${d.getDate()}`,value:daily.reduce((s,x)=>s+heat(x),0),count:daily.length}}),w=900,h=190,p={l:50,r:18,t:14,b:30},actual=Math.max(...series.map(x=>x.value)),max=Math.max(actual,1),x=i=>p.l+i*(w-p.l-p.r)/(series.length-1),y=v=>p.t+(h-p.t-p.b)*(1-v/max),line=series.map((d,i)=>`${i?'L':'M'}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(' '),area=`${line} L${x(series.length-1)},${h-p.b} L${x(0)},${h-p.b} Z`;
    $('trendTitle').textContent=`${overviewRegion||'五区域'}上线以来热度变化`; $('trendPeak').textContent=actual?`峰值 ${compact(actual)}`:'当前筛选无上线后数据'; $('trendChart').innerHTML=`<svg viewBox="0 0 ${w} ${h}" role="img"><defs><linearGradient id="tf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0a241" stop-opacity=".3"/><stop offset="1" stop-color="#f0a241" stop-opacity="0"/></linearGradient></defs><line x1="${p.l}" x2="${w-p.r}" y1="${h-p.b}" y2="${h-p.b}" class="grid-line"/><path d="${area}" fill="url(#tf)"/><path d="${line}" class="trend-line"/>${series.map((d,i)=>`<circle cx="${x(i)}" cy="${y(d.value)}" r="3"><title>${d.label} · ${fmt(d.value)}热度 · ${d.count}条</title></circle>`).join('')}${series.filter((_,i)=>[0,4,9,14].includes(i)).map(d=>{const i=series.indexOf(d);return`<text x="${x(i)}" y="${h-8}" text-anchor="middle">${d.label}</text>`}).join('')}</svg>`;
  }
  function renderBreakdown(rows){
    renderTrend(rows);
    const comparisonRows=overviewBaseRows();
    renderBars('regionChart',REGIONS.map(name=>{const r=comparisonRows.filter(x=>x.region===name);return{name,rows:r,...total(r)}}));
    renderBars('platformChart',bestGroup(rows,'platform'));
    $('stageChart').innerHTML=STAGES.map(name=>{const r=rows.filter(x=>x.publishStage===name),t=total(r);return `<div class="stage-card"><span>${name}</span><strong>${compact(t.heat)}</strong><small>${r.length}条 · ${pct(t.rate)}互动率</small></div>`}).join('');
    const valid=rows.filter(x=>known(x.viewCount)&&num(x.viewCount)>0&&known(x.interactionCount)); const mv=median(valid.map(x=>num(x.viewCount))),mr=median(valid.map(rate));
    $('quadrantThresholds').textContent=valid.length?`当前判断线：播放量 ${compact(mv)}，互动率 ${pct(mr)}；高于判断线记为“较高”`:'当前筛选缺少可比较的播放和互动数据';
    const quads=[{c:'q1',n:'播放高，互动也高',rows:valid.filter(x=>num(x.viewCount)>=mv&&rate(x)>=mr),d:'既能触达，也能带来回应'},{c:'q2',n:'播放高，互动偏低',rows:valid.filter(x=>num(x.viewCount)>=mv&&rate(x)<mr),d:'触达较广，但观众回应较少'},{c:'q3',n:'播放较低，互动较高',rows:valid.filter(x=>num(x.viewCount)<mv&&rate(x)>=mr),d:'覆盖不大，但受众回应更强'},{c:'q4',n:'播放和互动都较低',rows:valid.filter(x=>num(x.viewCount)<mv&&rate(x)<mr),d:'当前内容尚未形成规模或回应'}];
    $('quadrant').innerHTML=quads.map(q=>`<div class="quad ${q.c}"><h4>${q.n}</h4><strong>${q.rows.length} 条</strong><p>${q.d}<br>热度最高：${esc(q.rows.sort((a,b)=>heat(b)-heat(a))[0]?.creator||'—')}</p></div>`).join('');
    renderRanking(rows);
  }
  function renderRanking(rows=overviewRows()){
    const valid=rows.filter(x=>known(x.viewCount)&&num(x.viewCount)>0&&known(x.interactionCount));
    valid.sort(rankingMode==='rate'?(a,b)=>rate(b)-rate(a)||num(b.viewCount)-num(a.viewCount):(a,b)=>num(b.viewCount)-num(a.viewCount));
    $('ranking').innerHTML=valid.slice(0,5).map((x,i)=>`<a class="rank-card" href="${esc(x.originalUrl)}" target="_blank" rel="noopener"><div class="rank-cover">${coverMarkup(x)}<span class="rank-no">${i+1}</span></div><div class="rank-body"><h4>${esc(x.creator)}</h4><p>${esc(x.region)} · ${esc(x.platform)} · ${esc(x.sourceClass)} · ${esc(x.publishStage)}</p><div class="rank-metrics"><span>播放 <strong>${compact(x.viewCount)}</strong></span><span>互动率 <strong>${pct(rate(x))}</strong></span></div></div></a>`).join('')||'<p>暂无可比较数据</p>';
    document.querySelectorAll('[data-ranking]').forEach(b=>b.classList.toggle('active',b.dataset.ranking===rankingMode));
  }

  function voiceRows(){return COMMENTS.filter(x=>(!voiceInputs.region.value||x.region===voiceInputs.region.value)&&(!voiceInputs.platform.value||x.platform===voiceInputs.platform.value)&&(!voiceInputs.type.value||x.publishType===voiceInputs.type.value)&&(!voiceInputs.source.value||x.sourceClass===voiceInputs.source.value)&&(voiceInputs.sentiment.value===''||String(x.sentiment)===voiceInputs.sentiment.value))}
  function renderVoice(){
    const rows=voiceRows(),counts=[rows.filter(x=>x.sentiment===1).length,rows.filter(x=>x.sentiment===0).length,rows.filter(x=>x.sentiment===-1).length],den=rows.length||1;
    $('voiceCount').textContent=rows.length; $('voiceCoverage').textContent=`${D.commentCoverage.videos||0}条视频 · ${fmt(D.commentCoverage.sampled||COMMENTS.length)}条评论样本`;
    $('sentimentBar').innerHTML=counts.map(x=>`<span style="width:${x/den*100}%"></span>`).join(''); $('sentimentLegend').innerHTML=['正面','中立','负面'].map((n,i)=>`<div><span>${n}</span><strong>${rows.length?pct(counts[i]/rows.length):'0.0%'}</strong></div>`).join('');
    const themes={}; rows.forEach(x=>(x.themes||[]).forEach(t=>themes[t]=(themes[t]||0)+1)); const top=Object.entries(themes).sort((a,b)=>b[1]-a[1]).slice(0,7); $('themes').innerHTML=top.map(([n,v])=>`<span>${esc(n)} <strong>${v}</strong></span>`).join('')||'<span>暂无主题样本</span>';
    const dominant=counts.indexOf(Math.max(...counts)),labels=['正面','中立','负面']; $('voiceFinding').textContent=rows.length?`当前筛选中${labels[dominant]}评论占比最高（${pct(counts[dominant]/rows.length)}）。讨论最多的主题是${top[0]?.[0]||'未分类'}。评论样本说明讨论方向，不代表全部玩家。`:'当前筛选暂无已匹配评论。';
    const tag={1:'正面',0:'中立','-1':'负面'}; $('commentList').innerHTML=[...rows].sort((a,b)=>b.votes-a.votes).slice(0,commentsShown).map(x=>`<a class="comment" href="${esc(x.permalink)}" target="_blank" rel="noopener"><div class="comment-head"><span class="sentiment s${x.sentiment}">${tag[x.sentiment]}</span><strong>${esc(x.creator)}</strong><small>${esc(x.region)} · ${esc(x.sourceClass)} · 👍 ${fmt(x.votes)}</small></div><p class="translation"><b>中文要点</b>${esc(x.chineseSummary||'暂无中文摘要')}</p><p class="original"><b>评论原文</b>${esc(x.original)}</p><em>查看原评论 ↗</em></a>`).join('')||'<p>暂无评论</p>'; $('moreComments').hidden=rows.length<=commentsShown;
  }

  function renderLive(){const rows=LIVE.filter(x=>(!liveInputs.region.value||x.region===liveInputs.region.value)&&(!liveInputs.platform.value||x.platform===liveInputs.platform.value)&&(!liveInputs.source.value||x.sourceClass===liveInputs.source.value));$('liveMeta').textContent=`${rows.length}路 · 抓取于 ${D.liveCapturedAt||'—'}`;$('liveGrid').innerHTML=rows.map(x=>`<a class="live-card" href="${esc(x.url)}" target="_blank" rel="noopener"><div class="live-cover">${coverMarkup(x)}<span>LIVE</span><span class="viewer">◉ ${x.viewers==null?'—':fmt(x.viewers)}</span></div><div class="live-body"><h3>${esc(x.title)}</h3><p>${esc(x.creator)} · ${esc(x.region)} · ${esc(x.platform)} · ${esc(x.sourceClass)}</p></div></a>`).join('')||'<p>当前筛选暂无直播</p>'}

  function filteredPosts(){const q=postInputs.search.value.trim().toLowerCase(),d=sortDirection==='asc'?1:-1;const rows=POSTS.filter(x=>(!postInputs.region.value||x.region===postInputs.region.value)&&(!postInputs.platform.value||x.platform===postInputs.platform.value)&&(!postInputs.type.value||x.publishType===postInputs.type.value)&&(!postInputs.source.value||x.sourceClass===postInputs.source.value)&&(!postInputs.stage.value||x.publishStage===postInputs.stage.value)&&(!q||[x.creator,x.title,x.originalUrl].join(' ').toLowerCase().includes(q)));const compare=sortMode==='interactions'?(a,b)=>num(a.interactionCount)-num(b.interactionCount):sortMode==='rate'?(a,b)=>rate(a)-rate(b):sortMode==='date'?(a,b)=>String(a.publishDate).localeCompare(String(b.publishDate)):(a,b)=>num(a.viewCount)-num(b.viewCount);return rows.sort((a,b)=>d*compare(a,b))}
  function renderPosts(){const rows=filteredPosts(),size=20,pages=Math.max(1,Math.ceil(rows.length/size));postPage=Math.min(postPage,pages);$('resultCount').textContent=rows.length;$('postGrid').innerHTML=rows.slice((postPage-1)*size,postPage*size).map(x=>`<article class="post-card"><div class="post-cover">${coverMarkup(x)}<span class="platform-badge">${esc(x.platform)}</span></div><div class="post-body"><h3>${esc(x.creator)}</h3><p class="post-title">${esc(x.title||'公开投稿')}</p><div class="chips"><span>${esc(x.region)}</span><span>${esc(x.sourceClass)}</span><span>${esc(x.publishType)}</span><span>${esc(x.publishStage)}</span></div><div class="card-metrics"><div><span>播放</span><strong>${known(x.viewCount)?compact(x.viewCount):'—'}</strong></div><div><span>互动</span><strong>${known(x.interactionCount)?compact(x.interactionCount):'—'}</strong></div><div><span>互动率</span><strong>${known(x.viewCount)&&known(x.interactionCount)&&num(x.viewCount)>0?pct(rate(x)):'—'}</strong></div></div><div class="card-foot"><span>${esc(x.publishDate||'日期未公开')}</span><a href="${esc(x.originalUrl)}" target="_blank" rel="noopener">原帖 ↗</a></div></div></article>`).join('')||'<p>暂无内容</p>';
    const buttons=[];buttons.push(`<button data-page="${postPage-1}" ${postPage===1?'disabled':''}>‹</button>`);for(let i=Math.max(1,postPage-2);i<=Math.min(pages,postPage+2);i++)buttons.push(`<button data-page="${i}" class="${i===postPage?'active':''}">${i}</button>`);buttons.push(`<button data-page="${postPage+1}" ${postPage===pages?'disabled':''}>›</button>`);$('pagination').innerHTML=buttons.join('');$('pagination').querySelectorAll('button:not([disabled])').forEach(b=>b.onclick=()=>{postPage=Number(b.dataset.page);renderPosts()});document.querySelectorAll('#sortTabs [data-sort]').forEach(b=>b.classList.toggle('active',b.dataset.sort===sortMode));$('sortDirection').textContent=sortDirection==='desc'?'↓ 降序':'↑ 升序';
  }

  document.querySelectorAll('#regionTabs button').forEach(b=>b.onclick=()=>{overviewRegion=b.dataset.region;renderOverview()}); Object.values(overviewInputs).forEach(x=>x.onchange=renderOverview);$('clearOverview').onclick=()=>{overviewRegion='';Object.values(overviewInputs).forEach(x=>x.value='');renderOverview()};
  document.querySelectorAll('[data-ranking]').forEach(b=>b.onclick=()=>{rankingMode=b.dataset.ranking;renderRanking()});
  Object.values(voiceInputs).forEach(x=>x.onchange=()=>{commentsShown=8;renderVoice()});$('clearVoice').onclick=()=>{Object.values(voiceInputs).forEach(x=>x.value='');commentsShown=8;renderVoice()};$('moreComments').onclick=()=>{commentsShown+=8;renderVoice()};
  Object.values(liveInputs).forEach(x=>x.onchange=renderLive);$('clearLive').onclick=()=>{Object.values(liveInputs).forEach(x=>x.value='');renderLive()};
  Object.values(postInputs).forEach(x=>x.addEventListener(x===postInputs.search?'input':'change',()=>{postPage=1;renderPosts()}));$('clearPosts').onclick=()=>{Object.values(postInputs).forEach(x=>x.value='');postPage=1;renderPosts()};document.querySelectorAll('#sortTabs [data-sort]').forEach(b=>b.onclick=()=>{sortMode=b.dataset.sort;postPage=1;renderPosts()});$('sortDirection').onclick=()=>{sortDirection=sortDirection==='desc'?'asc':'desc';postPage=1;renderPosts()};
  renderOverview();renderVoice();renderLive();renderPosts();
})();
