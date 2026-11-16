// Pure decisions used by the client and tests. Live output is never shared.
(function(root) {
  function same(a,b) { return JSON.stringify(a)===JSON.stringify(b); }
  function changed(base,next) {
    const changes=[];
    if(!base)return ['Initial shared service'];
    if(base.title!==next.title)changes.push('Service title changed');
    const before=new Map(base.items.map(i=>[i.id,i]));
    const after=new Map(next.items.map(i=>[i.id,i]));
    for(const i of next.items) {
      if(!before.has(i.id))changes.push('Added: '+i.title);
      else if(!same(before.get(i.id),i))changes.push('Updated: '+i.title);
    }
    for(const i of base.items)if(!after.has(i.id))changes.push('Removed: '+i.title);
    if(!same(base.items.map(i=>i.id),next.items.map(i=>i.id)))changes.push('Service order changed');
    return changes;
  }
  function receive({baseRevision,local,dirty,live,editing},version) {
    if(!version || version.revision<=baseRevision)return 'ignore';
    if(same(local,version.service))return 'acknowledge';
    if(dirty)return 'conflict';
    return live||editing?'review':'apply';
  }
  root.WorshipSyncCore={same,changed,receive};
})(globalThis);
