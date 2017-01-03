$(document).on('/pages/login/login', function(){
    $('.welcome-msg').hide()
    //Set Default Options
    chrome.storage.sync.get(['mustard_url', 'mustard_user'], function (result) {
        $('#server-url').val(result.mustard_url);
        $('#server-username').val(result.mustard_user);
    });

    $( "#login-form" ).unbind('submit').bind('submit', function( event ) {

        $('.error').hide();
        $('.loading-overlay').show();
        var mustard_url = $('#server-url').val();
        var mustard_user = $('#server-username').val();
        var mustard_pass = $('#server-password').val();

        window.mustard_url = mustard_url;

        chrome.storage.sync.set({'mustard_url': mustard_url}, function(){
            console.log('Set URL to Storage')
        });

        chrome.storage.sync.set({'mustard_user': mustard_user}, function(){
            console.log('Set Username to Storage')
        });


        $.ajax({
            type: "POST",
            url: mustard_url + '/authenticate?token_type=extension',
            data: JSON.stringify({"username": mustard_user,"password": mustard_pass}),
            contentType: "application/json; charset=utf-8",
            dataType   : "json"
        }).fail(function(r) {
            $('.loading-overlay').hide();
            if(r.status == 401)
            {
                $('#user-pass-error').show()
            }else{
                $('#unknown-error').show()

            }
        }).done(function(r){
            $('.loading-overlay').hide();
            chrome.storage.sync.set({'mustard_token': r.token}, function(){
                console.log('Set Token to Storage')
            });
            chrome.storage.sync.set({'mustard_first_name': r.first_name}, function(){
                console.log('Set FirstName to Storage')
                $('#user-first-name').text(r.first_name);
            });
            navigate_to_route("/pages/projects/projects");
        });

        event.preventDefault();
    });
});