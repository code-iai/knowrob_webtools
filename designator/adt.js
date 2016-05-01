// @author Daniel Beßler

function format_adt_designator(desig_js) {
  var div = $('<div class="adt"></div>');
  var adt_id = desig_js['adt-id'];
  var adt_action = desig_js['adt-action'];
  console.info(desig_js);
  
  div.append(format_adt_header(desig_js));
  div.append(format_adt_action_roles(desig_js['action-roles']));
  div.append(format_adt_objects(desig_js.objects));
  div.append(format_adt_action_chunks(desig_js['action-chunks']));
  
  return div[0].outerHTML;
};

function adt_table() {
  return $('<table class="adt-table table-hover row-clickable"></table>');
};

function adt_table_row(table, key, value, cls) {
  var row = $('<tr class="adt-table-row"></tr>');
  row.addClass(cls);
  row.append($('<td class="adt-table-elem adt-table-indicator-elem"><div class="adt-table-indicator"></div></tr>'));
  row.append($('<td class="adt-table-elem adt-table-key">'+key+'</tr>'));
  row.append($('<td class="adt-table-elem adt-table-value">'+value+'</tr>'));
  table.append(row);
  return row;
};

function adt_table_row_specific(table, key, value) {
  return adt_table_row(table, key, value, 'adt-table-row-specific');
};

function adt_table_row_general(table, key, value) {
  return adt_table_row(table, key, value, 'adt-table-row-general');
};

function unquote(str) {
  if (str[0] === "'" && str[str.length - 1] === "'") return str.slice(1, str.length - 1);
  else return str;
};

function format_owl_individual(x) {
  return x.slice(x.lastIndexOf("#")+1, x.length);
};

function format_adt_header(desig_js) {
  var div = $('<div class="adt-header"></div>');
  div.append($('<div class="adt-headline">Header</div>'));
  var table = adt_table();
  var interval = '' + desig_js.start + ':' + desig_js.end;
  adt_table_row_specific(table, 'adt',
      format_owl_individual(unquote(desig_js['adt-id']))
  ).on('click', function() {
    console.info('adt click');
  });
  adt_table_row_specific(table, 'action',
      format_owl_individual(unquote(desig_js['adt-action']))
  ).on('click', function() {
    console.info('action click');
  });
  adt_table_row_specific(table, 'interval', interval).on('click', function() {
    console.info('interval click');
  });
  adt_table_row_general(table, 'instruction', unquote(desig_js.instruction)).on('click', function() {
    console.info('instruction click');
  });
  adt_table_row_general(table, 'actioncore', unquote(desig_js.actioncore)).on('click', function() {
    console.info('actioncore click');
  });
  div.append(table);
  return div;
};

function format_adt_action_roles(desig_js) {
  var div = $('<div class="adt-action-roles"></div>');
  div.append($('<div class="adt-headline">Action-Roles</div>'));
  var table = adt_table();
  for (var key in desig_js) {
    if(key=='type') continue;
    adt_table_row_general(table, key, unquote(desig_js[key])).on('click', function() {
      console.info('role click');
    });
  }
  div.append(table);
  return div;
};

function format_adt_objects(desig_js) {
  var div = $('<div class="adt-objects"></div>');
  var count = 1;
  
  for (var key in desig_js) {
    if(key=='type') continue;
    var obj = desig_js[key];
    
    div.append($('<div class="adt-headline">Object-Description ('+count+')</div>'));
    var table = adt_table();
    for (var obj_key in obj) {
      adt_table_row_general(table, obj_key, unquote(obj[obj_key]));
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

function format_adt_action_chunks(desig_js) {
  var div = $('<div class="adt-action-chunks"></div>');
  var count = 1;
  
  for (var key in desig_js) {
    if(key=='type') continue;
    var obj = desig_js[key];
    var interval = '' + obj.start + ':' + obj.end;
    
    div.append($('<div class="adt-headline">Action-Chunk ('+count+')</div>'));
    var table = adt_table();
    adt_table_row_general(table, 'task', unquote(obj.task));
    adt_table_row_general(table, 'class', unquote(obj.class));
    adt_table_row_general(table, 'success', unquote(obj['success']));
    adt_table_row_general(table, 'frame', unquote(obj['trajectory-frame']));
    adt_table_row_general(table, 'trajectory', format_trajectory(unquote(obj['trajectory'])));
    adt_table_row_general(table, 'interval', interval);
    adt_table_row_specific(table, 'relative-to', format_owl_individual(unquote(obj['trajectory-reference'])));
    div.append(table);
    count += 1;
  }
  return div;
};
