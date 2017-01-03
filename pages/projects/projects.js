$(document).on('/pages/projects/projects', function(){



    $('.welcome-msg').show()
    chrome.storage.sync.get(['mustard_token', 'mustard_url', 'mustard_first_name'], function (result) {

        mustard_url = result.mustard_url;
        mustard_token = result.mustard_token;


        $.ajax({
            type: "GET",
            url: mustard_url + '/projects',
            contentType: "application/json; charset=utf-8",
            beforeSend: function (request)
            {
                request.setRequestHeader("User-Token", mustard_token);
            }
        }).fail(function(r) {
            $('.loading-overlay').hide();

        }).done(function(r){

            $("#select-projects").select2({
                placeholder: 'Select Projects',
                width: '100%',
                data: $.map(r.projects, function(val, i){
                    return {id: val.execution_id, text: val.project_name}
                })

            });
        });
    });

    $('#test_runner').click(function(){
        if ($('#select-projects').val()) {
            chrome.storage.sync.set({'mustard_execution_id': $('#select-projects').val()});
            chrome.storage.sync.set({"mustard_test_expire": Date()});
            navigate_to_route('/pages/test_runner/test_runner');
        } else {
            $('.project-error').show()
        }
    })
});
