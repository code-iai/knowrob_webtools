
function SelectionDialog() {
    var dialog = document.getElementById('dialog');
    dialog.innerHTML = '';

    var header_container = document.createElement("div");
    header_container.className = 'content-box-header';
    var header = document.createElement("h2");
    header_container.appendChild(header);
    dialog.appendChild(header_container);

    var body = document.createElement("div");
    dialog.appendChild(body);

    var footer = document.createElement("div");
    dialog.appendChild(footer);
    
    $("#dialog").dialog( "open" );

    return {header: header, body: body, footer: footer, dialog: dialog};
};

function CourseSelectorDialog(then) {
    var dialog = SelectionDialog();
    CourseSelector(dialog.header, dialog.body, dialog.footer, function(course) {
        $("#dialog").dialog( "close" );
        then(course);
    });
};

function ExerciseSelectorDialog(then) {
    var dialog = SelectionDialog();
    ExerciseSelector(dialog.header, dialog.body, dialog.footer, function(course, exercise) {
        $("#dialog").dialog( "close" );
        then(course, exercise);
    });
};

function CourseSelector(header, body, footer, then) {
    header.innerHTML = "Please specify a course";
    footer.innerHTML = '';
    
    body.innerHTML = '';
    var form = document.createElement("div");
    //var form = document.createElement("form");
    form.id = "course-search-form";
    form.className = "form";
    form.role = "form";
    var input_field = document.createElement("div"); {
        input_field.id = "course-field";
        input_field.className = "form-group";
        input_field.innerHTML = '<input placeholder="Course Description" class="form-control" id="course" name="course" type="text" value="" required autofocus style="margin: 0px;" />';
        form.append(input_field);
    }
    var button_field = document.createElement("div"); {
        button_field.id = "course-field-btn";
        button_field.className = "form-group";
        var button = document.createElement("button");
        button.id = "course-selector-button";
        button.className = "btn btn-lg btn-primary btn-block";
        button.onclick = function() { searchCourse(); };
        button.innerHTML = "Search";
        button_field.append(button);
        form.append(button_field);
    }
    var list = document.createElement("div");
    list.id = "course-list";
    var nav = document.createElement("div");
    nav.id = "course-list-navigation";
    
    body.append(form);
    body.append(list);
    body.append(nav);
    
    function courseInput() {
        return document.getElementById('course').value;
    };
    
    function searchCourse() {
        $.ajax({
            url: "/teaching/search",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({course: courseInput()}),  
            dataType: "json"
        }).done( function (data) {
          var course_list = document.createElement("ul");
          course_list.className = 'course_list';
          
          for(var i in data) {
              var li = document.createElement("li");
              var a = document.createElement("a");
              a.innerHTML = data[i].name + " " + data[i].term;
              a.course = data[i];
              a.onclick = function() { then(this.course); };
              li.className = 'course_entry';
              li.appendChild(a);
              course_list.appendChild(li);
          }
          
          var list = document.getElementById('course-list');
          list.innerHTML = ''; // clear
          list.appendChild(course_list);
        });
    };
};

function ExerciseSelector(header, body, footer, then) {
    CourseSelector(header, body, footer, showCourse);
    
    function showCourse(course) {
        $.ajax({
            url: "/teaching/get_exercises",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({
                  course_id: course.id}),  
            dataType: "json"
        }).done( function (data) {
          var exercise_list = document.createElement("ul");
          exercise_list.className = 'exercise_list';
          
          for(var i in data) {
              var li = document.createElement("li");
              var a = document.createElement("a");
              a.innerHTML = "" + data[i].number + ". " + data[i].title;
              a.course = course;
              a.exercise = data[i];
              a.onclick = function() { then(this.course, this.exercise); };
              li.className = 'course_entry';
              li.appendChild(a);
              exercise_list.appendChild(li);
          }
          
          var list = document.createElement("div");
          list.id = 'exercise-list';
          list.appendChild(exercise_list);
          
          body.innerHTML = ''; // clear
          body.appendChild(list);
          
          header.innerHTML  = 'Please select an exercise';
          // TODO: show course name instead
          //header.innerHTML  = course_name;D
          footer.innerHTML = '';
        });
    };
};
