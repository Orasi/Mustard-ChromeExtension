$(document).on('/pages/test_runner/test_runner', function(){
    root_route = '/pages/login/login';

    login_token_valid = function(url, token){
        $.ajax({
            type: "GET",
            url: url + '/users/token/valid',
            contentType: "application/json; charset=utf-8",
            beforeSend: function (request)
            {
                request.setRequestHeader("User-Token", token);
            }
        }).fail(function(r) {
            return false;
        }).done(function(r){
            if (r.Error){
                navigate_to_route(root_route)
            }
        });

    };

    add_test_to_page = function(test){
        $('#testcase_name').text(test.name);


        $("#result_testcase_id").val(test.validation_id);
        $("#result_execution_id").val(execution_id);
        $("#result_result_type").val("manual");



        $( "#testcase-form" ).unbind('submit').bind('submit', function( event ) {
            submit_form();
            event.preventDefault();
        });

        if (test.reproduction_steps){
            test.reproduction_steps.forEach(function(step){

                $('.table tr:last').after("<tr class='test-step-row'><td>" +
                    step.step_number + ". </td><td>" +
                    step.action + "</td><td>" +
                    step.step_number + ".  " + step.result + "</td></tr>");
            });
        }

        $('.no-tests').hide();
        $('.no-tests-slow').hide();
    };

    get_environments = function(project_id){

        $.ajax({
            type: "GET",
            async: false,
            url: mustard_url + '/projects/' + project_id + '/environments',
            contentType: "application/json; charset=utf-8",
            beforeSend: function (request)
            {
                request.setRequestHeader("User-Token", mustard_token);
            }
        }).fail(function(r) {
            $('.loading-overlay').hide();

        }).done(function(r){
            if ( r.environments == [] ){
                $('#testcase-area').hide();
                $('.no-tests').show();

                if(!$("#fast_execution").val()){
                    $('.hide-slow').hide();
                }
                chrome.storage.sync.set({"mustard_environments": []});
            } else {
                $('.no-tests').hide();
                // $('.hide-slow').show();
                //Set Test as current test
                chrome.storage.sync.set({"mustard_environments": r.environments});
                update_environments(r.environments, $("#result_environment_id").val())
            }
        });
    };

    update_environments = function(environments, selected_environment){
        select = $("select#result_environment_id");
        init_select = $("select#environment_select_init");
        select.empty();
        init_select.empty();
        environments.forEach(function(e){
            select.append( $("<option>")
                .val(e.uuid)
                .html(e.display_name ? e.display_name : e.uuid)
            );
            init_select.append( $("<option>")
                .val(e.uuid)
                .html(e.display_name ? e.display_name : e.uuid)
            );
        });
        select.val(selected_environment)
    };

    get_keywords = function(project_id){

        $.ajax({
            type: "GET",
            async: false,
            url: mustard_url + '/projects/' + project_id + '/keywords',
            contentType: "application/json; charset=utf-8",
            beforeSend: function (request)
            {
                request.setRequestHeader("User-Token", mustard_token);
            }
        }).fail(function(r) {
            $('.loading-overlay').hide();

        }).done(function(r){
            if ( r.keywords == [] ){
                $('#testcase-area').hide();
                $('.no-tests').show();

                if(!$("#fast_execution").val()){
                    $('.hide-slow').hide();
                }
                chrome.storage.sync.set({"mustard_keywords": []});
            } else {
                $('.hide-slow').show();
                //Set Test as current test
                chrome.storage.sync.set({"mustard_keywords": r.keywords});
                update_keywords(r.keywords, keyword)
            }
        });
    };

    update_keywords = function(keywords, selected_keyword){
        select = $("select#keyword");
        select.empty();

        keywords.forEach(function(e){
            select.append( $("<option>")
                .val(e.keyword)
                .html(e.keyword)
            );
        });
        select.val(selected_keyword)
    };


    get_next_test = function(callback, filter, env){

        filter = filter || false;

        //Get Next Test
        keyword_text = '';
        if(!(filter == null) && filter){
            filter.map(function(a){keyword_text += "keyword[]=" + a + "&"});
        }


        //Set Environment
        environment_text = ''
        if(!(env == null)){
            environment_text = 'environment=' + env + '&'
        }
        $.ajax({
            type: "GET",

            url: !(filter == null) && filter != 'All' ? mustard_url + '/executions/' + execution_id + '/next_test?' + environment_text + keyword_text : mustard_url + '/executions/' + execution_id + '/next_test?' + environment_text,
            contentType: "application/json; charset=utf-8",
            beforeSend: function (request)
            {
                request.setRequestHeader("User-Token", mustard_token);
            }
        }).fail(function(r) {
            $('.loading-overlay').hide();
        }).done(function(r){

            if ( r.testcase =='No remaining testcases' ){



                if(!$("#fast_execution").val()){
                    $('.hide-slow').hide();
                    $('.no-tests-slow').show();
                }else{
                    $('.no-tests').show();
                    $('#testcase-area').hide();
                    $('#testcase_name_area').hide();
                }
                chrome.storage.sync.set({"mustard_test_expire": Date()});
                chrome.storage.sync.set({"mustard_current_test": null});

            } else {
                $('.hide-slow').show();
                // $('.main-content').show()
                // $('.environment_selection').hide()
                $('#testcase-area').show();
                $('#testcase_name_area').show();
                $('.no-tests').hide();
                $('.no-tests-slow').hide();

                var d = new Date();
                d.setMinutes(d.getMinutes() + 5);

                //Set Test as current test
                chrome.storage.sync.set({"mustard_current_test": r.testcase});
                chrome.storage.sync.set({"mustard_project_id": r.testcase.project_id});
                chrome.storage.sync.set({"mustard_test_expire": d});
                get_environments(r.testcase.project_id);
                get_keywords(r.testcase.project_id);
                callback(r.testcase);
                $('.no-tests').hide();
                $('.no-tests-slow').hide();
            }
        });
    };


    chrome.storage.sync.get(['mustard_project_id', 'mustard_execution_id', 'mustard_current_test', 'mustard_test_expire', 'mustard_url', 'mustard_token', 'mustard_environments', 'mustard_environment_id','mustard_keywords', 'mustard_current_keyword', 'mustard_fast_execution'], function (result) {
        login_token_valid( result.mustard_url, result.mustard_token)
        project_id = result.mustard_project_id
        mustard_url = result.mustard_url;
        mustard_token = result.mustard_token;
        execution_id= result.mustard_execution_id;
        selected_env= result.mustard_environment_id;
        environments = result.mustard_environments;
        keyword = result.mustard_current_keyword;
        keywords = result.mustard_keywords;
        fast_execution = result.mustard_fast_execution;

        $("#fast_execution").val(fast_execution);
        $('.no-tests').hide();

        if(!selected_env && !fast_execution){
            alert('here')
            $('.hide-slow').hide();
            get_environments(project_id);
        }else{
            if ( result.mustard_current_test && result.mustard_test_expire && result.mustard_test_expire > Date() ){
                add_test_to_page(result.mustard_current_test)
            } else {
                get_next_test(add_test_to_page, keyword, selected_env);
            }
        }



        if (environments && environments != []){
            update_environments(environments, selected_env);
        }

        if (keywords && keywords != []){
            update_keywords(keywords, keyword);
        }

        $('#keyword').change(function(o){
            keyword = $(this).val();
            chrome.storage.sync.set({"mustard_current_keyword": keyword});
            get_next_test(add_test_to_page, keyword, selected_env);
        });

        $('#result_environment_id').change(function(o){
           environment = $(this).val();

           chrome.storage.sync.set({"mustard_environment_id": environment});
            $("#result_environment_id").val(environment);
           if(!$("#fast_execution").val()){
               get_next_test(add_test_to_page, [], environment)
           }

        });

        $('.keyword_select').select2({ width: '100%'})
        $('#result_environment_id').select2()
        $('#environment_select_init').select2()
    });

    $('.back-btn').click(function(){
        navigate_to_route('/pages/projects/projects')
    });

    $('#init_environment').click(function(){
        get_next_test(add_test_to_page, [], $('#environment_select_init').val());
    });

    clear_page = function(){
        $('.test-step-row').remove();
        $('#result_comment').val('');
        $('.result-status').prop('checked', false);

    };

    send_to_mustard = function(image){

        if (image){
            options = {
                type: "POST",
                url: mustard_url + '/results',
                data: JSON.stringify({
                    "result": {
                        "status": status,
                        "environment_id": env_id,
                        "testcase_id": tc_id,
                        "result_type": r_type,
                        "execution_id": exc_id,
                        "comment": comment,
                        "screenshot": image
                    }
                }),
                contentType: "application/json; charset=utf-8",
                dataType   : "json",
                beforeSend: function (request)
                {
                    request.setRequestHeader("User-Token", mustard_token);
                }
            }
        } else {
            options = {
                type: "POST",
                url: mustard_url + '/results',
                data: JSON.stringify({
                    "result": {
                        "status": status,
                        "environment_id": env_id,
                        "testcase_id": tc_id,
                        "result_type": r_type,
                        "execution_id": exc_id,
                        "comment": comment
                    }
                }),
                contentType: "application/json; charset=utf-8",
                dataType   : "json",
                beforeSend: function (request)
                {
                    request.setRequestHeader("User-Token", mustard_token);
                }
            }
        }



        $.ajax(options).fail(function(r) {
            alert('fail');
        }).done(function(r){
            $('.loading-overlay').show();
            clear_page();
            get_next_test(add_test_to_page, keyword, env_id);
            $('.loading-overlay').hide();
        })
    };

    submit_form = function(){
        env_id = $("#result_environment_id").val();
        tc_id = $("#result_testcase_id").val();
        exc_id = $("#result_execution_id").val();
        r_type = $("#result_result_type").val();
        comment = $('#result_comment').val();
        status = $('.result-status:checked').val() ;
        keyword = $('#keyword').val() ;

        chrome.storage.sync.set({"mustard_environment_id": env_id});
        chrome.storage.sync.set({"mustard_current_keyword": keyword});
        selected_env = env_id;

        if( status == 'undefined'){
            $('.required-status').show();
            $('.required-comment').hide();
        } else if (status == 'fail' && comment == ''){
            $('.required-comment').show();
            $('.required-status').hide();
        }else{
            $('.required-comment').hide();
            $('.required-status').hide();
            if ($('#add-screenshot').is(':checked')) {
                chrome.tabs.captureVisibleTab(null, function(img) {
                    send_to_mustard(img);
                });
            } else {
                send_to_mustard(false);
            }




        }
    };

    $('#keyword-btn').click(function(){
        $('#keyword-btn').fadeOut('slow', function(){
            $('#keyword-area').fadeIn();
        });
    });


});
