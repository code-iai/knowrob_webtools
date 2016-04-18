/**
 * JS class that represents the openEASE menu bar.
 * Menu bar can be dynamically created using this class based on following layout:
 * [ L FL .... FR R ], where L is the 'left-menu', FL is the 'frame-menu-left'.
 * Frame menus are used to display menu items for the active frame.
 **/

function KnowrobMenu(user, user_interfaces){
    var that = this;
    
    this.createMenuItem = function(item) {
        var a = document.createElement("a");
        if(item.href) a.href = item.href;
        var x = '';
        x += item.text;
        // TODO handle item.icon and item.shortcut
        //if(item.shortcut) x += '<div class="menu_item_shortcut">' + item.shortcut + '</div>';
        a.innerHTML = x;
        if(item.onclick) a.onclick = item.onclick;
        if(item.id) a.id = item.id;
        return a;
    };
    
    this.addMenuItem = function(menu, item) {
        var li = document.createElement("li");
        if(item.submenu_page) {
            li.innerHTML = item.submenu_page;
            li.className = 'zero_size';
            menu.style.border = 'none';
        }
        else {
            li.appendChild(that.createMenuItem(item));
        }
        menu.appendChild(li);
        return li;
    };
    
    this.addSubmenu = function(menu, item) {
        // Try to find existing submenu
        for(var i=0; i<menu.childElementCount; ++i) {
            var _li = menu.childNodes[i];
            var _item = _li.childNodes[0];
            if(_item.childNodes[0].nodeValue == item.text) {
                return _li.childNodes[1];
            }
        }
    
        var submenu = document.createElement("ul");
        var li = document.createElement("li");
        li.className = 'submenu';
        li.appendChild(that.createMenuItem(item));
        li.appendChild(submenu);
        menu.appendChild(li);
        return submenu;
    };
    
    this.addCommonMenuItems = function(left_menu, right_menu) {
        if(left_menu && user.isLoggedIn()) {
            // openEASE user interfaces
            for(var i in user_interfaces) {
                that.addMenuItem(left_menu, {
                    id:user_interfaces[i].id+"-menu",
                    text: user_interfaces[i].name,
                    href: "/#"+user_interfaces[i].id
                });
            };
        }
        if(left_menu) {
            that.addMenuItem(left_menu, { id:"tutorials-menu", text: 'Tutorials', href: "/tutorials" });
        }
        if(left_menu && user.isLoggedIn()) {
            // admin pages
            if(user.isAdmin()) {
                that.handleWebappMenu(left_menu, {
                    text: 'Admin',
                    submenu: [
                        {
                            text: 'Mongo',
                            submenu: [
                                { text: 'Synchronization', href: '/knowrob/admin/mongo' }
                            ]
                        },
                        {
                            text: 'SQL',
                            submenu: [
                                { text: 'Documentation', href: '/db/page/docu' },
                                { text: 'User', href: '/db/page/user' },
                                { text: 'Roles', href: '/db/page/role' },
                                { text: 'User Roles', href: '/db/page/user_roles' },
                                { text: 'Tags', href: '/db/page/tag' },
                                { text: 'Projects', href: '/db/page/project' },
                                { text: 'Platforms', href: '/db/page/platform' },
                                { text: 'Tutorials', href: '/db/page/tutorial' }
                            ]
                        },
                        {
                            text: 'Experiments',
                            submenu: [
                                { text: 'Meta Information', href: '/knowrob/admin/experiments' }
                            ]
                        }
                    ]
                });
                /*
                handleWebappMenu(left_menu, {
                    text: 'Admin',
                    submenu: [
                        {
                            text: 'Cookies',
                            href: '/knowrob/admin/cookie'
                        }
                    ]
                });
                */
            }
        }
        if(right_menu) {
            that.addMenuItem(right_menu, {
                text: "Logout "+user.username,
                href: "/user/sign-out"
            });
        }
    };
    
    this.handleWebappMenu = function(menu_root, item) {
        if(item.submenu) {
            var submenu = that.addSubmenu(menu_root, item);
            for(var i in item.submenu) {
                that.handleWebappMenu(submenu, item.submenu[i]);
            }
            return submenu;
        }
        else {
            return that.addMenuItem(menu_root, item);
        }
    };
    
    this.resizeMenus = function() {
        var menus = document.getElementsByClassName('mega_menu');
        for(var i = 0; i < menus.length; i++) {
            var m = menus[i];
            var padding = 10; // TODO: lookup from CSS
            var absWidth = padding;
            var numRows = Math.trunc(Math.sqrt(m.childNodes.length));
            
            for(var j = 0; j < m.childNodes.length; j++) {
                absWidth += m.childNodes[j].clientWidth;
            }
            absWidth /= numRows;
            // TODO ensure that absWidth is less then window width
            
            var targetWidth = padding;
            for(var j = 0; j < m.childNodes.length; j++) {
                targetWidth += m.childNodes[j].clientWidth;
                if(targetWidth>=absWidth) break;
            }
            document.getElementById(m.id).style.width = targetWidth+'px';
            
            var menuBar = m.parentNode.parentNode.parentNode;
            var menuBarWidth = -menuBar.clientWidth;
            document.getElementById(m.id).style.right = menuBarWidth+'px';
            
            // Set row heights
            targetWidth = padding;
            var maxRowHeight = 0;
            var rowStartIndex = 0;
            var setHeights = function(i, j, height) {
                for(var k = i; k <= j; k++) {
                    document.getElementById(m.childNodes[k].id).style.height = height+'px';
                }
            };
            for(var j = 0; j < m.childNodes.length; j++) {
                targetWidth += m.childNodes[j].clientWidth;
                maxRowHeight = Math.max(maxRowHeight, m.childNodes[j].clientHeight);
                if(targetWidth>=absWidth) {
                    targetWidth = padding;
                    setHeights(rowStartIndex, j, maxRowHeight);
                    rowStartIndex = j+1;
                    maxRowHeight = 0;
                }
            }
            setHeights(rowStartIndex, j-1, maxRowHeight);
        }
    }
    
    this.updateMenu = function() {
        var left_menu  = document.getElementById("menu-left");
        var right_menu = document.getElementById("menu-right");
        if(left_menu)  $('#menu-left').empty();
        if(right_menu) $('#menu-right').empty();
        
        $.ajax({
            url: "/knowrob/menu",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({}),  
            dataType: "json",
            success: function (data) {
                that.addCommonMenuItems(left_menu, undefined);
                if(left_menu) {
                    for(var i in data.menu_left) {
                        that.handleWebappMenu(left_menu, data.menu_left[i]);
                    }
                }
                if(right_menu) {
                    for(var i in data.menu_right) {
                        that.handleWebappMenu(right_menu, data.menu_right[i]);
                    }
                }
                that.addCommonMenuItems(undefined, right_menu);
                that.resizeMenus();
            }
        }).done( function (request) {});
    };
    
    this.updateFrameMenu = function(frame) {
        var left_menu  = document.getElementById("frame-menu-left");
        var right_menu = document.getElementById("frame-menu-right");
        if(left_menu)  $('#frame-menu-left').empty();
        if(right_menu) $('#frame-menu-right').empty();
        
        for(var i in frame.LEFT_MENU_LIST) {
            that.handleWebappMenu(left_menu, frame.LEFT_MENU_LIST[i]);
        }
        for(var i in frame.RIGHT_MENU_LIST) {
            that.handleWebappMenu(left_menu, frame.RIGHT_MENU_LIST[i]);
        }
    };
};
