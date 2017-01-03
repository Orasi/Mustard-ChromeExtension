$(document).on('/pages/test_runner/test_runner', function(){

    add_test_to_page = function(test){
        $('#testcase_name').text(test.name);

        $("#result_environment_id").val(-1);
        $("#result_testcase_id").val(test.validation_id);
        $("#result_execution_id").val(execution_id);
        $("#result_result_type").val("manual");

        $( "#testcase-form" ).unbind('submit').bind('submit', function( event ) {
            submit_form();
            event.preventDefault();
        });

        test.reproduction_steps.forEach(function(step){
            action = 'Some Action';
            expected_result = 'Some Expected Result';
            $('.table tr:last').after("<tr class='test-step-row'><td>" +
                step.step_number + ". </td><td>" +
                step.action + "</td><td>" +
                step.step_number + ".  " + step.result + "</td></tr>");
        });

    };

    get_next_test = function(callback){
        //Get Next Test
        $.ajax({
            type: "GET",
            url: mustard_url + '/executions/' + execution_id + '/next_test',
            contentType: "application/json; charset=utf-8",
            beforeSend: function (request)
            {
                request.setRequestHeader("User-Token", mustard_token);
            }
        }).fail(function(r) {
            $('.loading-overlay').hide();

        }).done(function(r){

            if ( r.testcase =='No remaining testcases' ){
                $('#testcase-area').hide();
                $('.no-tests').show();
                chrome.storage.sync.set({"mustard_test_expire": Date()});
            } else {

                var d = new Date();
                d.setMinutes(d.getMinutes() + 5);

                //Set Test as current test
                chrome.storage.sync.set({"mustard_current_test": r.testcase});
                chrome.storage.sync.set({"mustard_test_expire": d});

                callback(r.testcase);
            }
        });
    };


    chrome.storage.sync.get(['mustard_execution_id', 'mustard_current_test', 'mustard_test_expire', 'mustard_url', 'mustard_token'], function (result) {

        mustard_url = result.mustard_url;
        mustard_token = result.mustard_token;
        execution_id= result.mustard_execution_id;


        if ( result.mustard_current_test && result.mustard_test_expire && result.mustard_test_expire > Date() ){
            add_test_to_page(result.mustard_current_test)
        } else {
            get_next_test(add_test_to_page);
        }
    });


    $('.back-btn').click(function(){
        navigate_to_route('/pages/projects/projects')
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
            get_next_test(add_test_to_page);
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
    }
});
