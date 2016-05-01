// @author Daniel Beßler

function format_adt_designator(ui,desig_js) {
  var div = $('<div class="adt"></div>');
  var adt_id = desig_js['adt-id'];
  var adt_action = desig_js['adt-action'];
  
  div.append(format_adt_header(ui,desig_js));
  div.append(format_adt_action_roles(ui,desig_js['action-roles']));
  div.append(format_adt_objects(ui,desig_js.objects));
  div.append(format_adt_action_chunks(ui,desig_js['action-chunks']));
  
  return div;
};

function adt_table() {
  return $('<table class="adt-table table-hover row-clickable"></table>');
};

var __adtActiveRow__ = undefined;

function adt_table_row(ui, table, key, value, queries, cls) {
  var row = $('<tr class="adt-table-row"></tr>');
  row.addClass(cls);
  row.append($('<td class="adt-table-elem adt-table-indicator-elem"><div class="adt-table-indicator"></div></td>'));
  row.append($('<td class="adt-table-elem adt-table-key">'+key+'</td>'));
  row.append($('<td class="adt-table-elem adt-table-value">'+value+'</td>'));
  table.append(row);
  row.bind('click', function() {
    row.addClass('adt-table-row-active');
    if(__adtActiveRow__) {
      __adtActiveRow__.removeClass('adt-table-row-active');
    }
    __adtActiveRow__ = row;
    if(queries && queries.length>0) {
      if(ui && ui.initQueryLibrary) ui.initQueryLibrary(queries);
    }
    else {
      if(ui && ui.initQueryLibrary) ui.initQueryLibrary();
    }
  });
  return row;
};
$('#adt-table').on('click', '.clickable-row', function(event) {
  $(this).addClass('active').siblings().removeClass('active');
});

function adt_table_row_specific(ui,table, key, value, queries) {
  return adt_table_row(ui,table, key, value, queries, 'adt-table-row-specific');
};

function adt_table_row_general(ui,table, key, value, queries) {
  return adt_table_row(ui,table, key, value, queries, 'adt-table-row-general');
};

function unquote(str) {
  if (str[0] === "'" && str[str.length - 1] === "'") return str.slice(1, str.length - 1);
  else return str;
};

function format_owl_individual(x) {
  return x.slice(x.lastIndexOf("#")+1, x.length);
};

function format_adt_header(ui,desig_js) {
  var div = $('<div class="adt-header"></div>');
  div.append($('<div class="adt-headline">Header</div>'));
  var table = adt_table();
  var interval = '' + desig_js.start + ':' + desig_js.end;
  adt_table_row_specific(ui,table, 'adt',
      format_owl_individual(unquote(desig_js['adt-id'])), [
      { text: 'just testing', q: 'member(X,[a,b])' }
  ]);
  adt_table_row_specific(ui,table, 'action',
      format_owl_individual(unquote(desig_js['adt-action'])), []);
  adt_table_row_specific(ui,table, 'interval', interval, []);
  adt_table_row_general(ui,table, 'instruction', unquote(desig_js.instruction), []);
  adt_table_row_general(ui,table, 'actioncore', unquote(desig_js.actioncore), []);
  div.append(table);
  return div;
};

function format_adt_action_roles(ui,desig_js) {
  var div = $('<div class="adt-action-roles"></div>');
  div.append($('<div class="adt-headline">Action-Roles</div>'));
  var table = adt_table();
  for (var key in desig_js) {
    if(key=='type') continue;
    adt_table_row_general(ui,table, key, unquote(desig_js[key]), []);
  }
  div.append(table);
  return div;
};

function format_adt_objects(ui,desig_js) {
  var div = $('<div class="adt-objects"></div>');
  var count = 1;
  
  for (var key in desig_js) {
    if(key=='type') continue;
    var obj = desig_js[key];
    
    div.append($('<div class="adt-headline">Object-Description ('+count+')</div>'));
    var table = adt_table();
    for (var obj_key in obj) {
      adt_table_row_general(ui,table, obj_key, unquote(obj[obj_key]), []);
    }
    div.append(table);
    count += 1;
  }
  return div;
};

function format_trajectory(traj) {
  // TODO: do something fancy here
  return traj;
};

function format_adt_action_chunks(ui,desig_js) {
  var div = $('<div class="adt-action-chunks"></div>');
  var count = 1;
  
  for (var key in desig_js) {
    if(key=='type') continue;
    var obj = desig_js[key];
    var interval = '' + obj.start + ':' + obj.end;
    
    div.append($('<div class="adt-headline">Action-Chunk ('+count+')</div>'));
    var table = adt_table();
    adt_table_row_general(ui,table, 'task', unquote(obj.task), []);
    adt_table_row_general(ui,table, 'class', unquote(obj.class), []);
    adt_table_row_general(ui,table, 'success', unquote(obj['success']), []);
    adt_table_row_general(ui,table, 'frame', unquote(obj['trajectory-frame']), []);
    adt_table_row_general(ui,table, 'trajectory',
        format_trajectory(unquote(obj['trajectory'])), []);
    adt_table_row_general(ui,table, 'interval', interval, []);
    adt_table_row_specific(ui,table, 'relative-to',
        format_owl_individual(unquote(obj['trajectory-reference'])), []);
    div.append(table);
    count += 1;
  }
  return div;
};
