document.addEventListener('DOMContentLoaded', function() {

    from_storage = ['mustard_route', 'mustard_token', 'mustard_url', 'mustard_first_name'];
    root_route = '/pages/login/login';

    login_token_valid = function(url, token, callback){
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
                return false
            } else {
                callback()
            }
        });

    };

    navigate_to_route = function(route){
        $('.loading-overlay').show();

        $('#extension-content').load( route.split('?')[0] + ".html", function(r1, r2, r3){
            if (r3.status == 200){
                console.log("Navigate to: " + route);
                chrome.storage.sync.set({'mustard_route': route});
                $(document).trigger(route)
                $('.loading-overlay').hide();
            }else{
                console.log("Failed to navigate to: " + route);
                $('#extension-content').load( root_route + '.html');
                $('.loading-overlay').hide();
            }
        })
    };


    //Retrieve all storage variables
    router = function(){
        chrome.storage.sync.get(from_storage, function (result) {
            if (result.mustard_first_name){
                $('#user-first-name').text(result.mustard_first_name);
            }

            // Check for Route
            // If no route send to login screen.
            if (result.mustard_url && result.mustard_route && result.mustard_token){
                login_token_valid( result.mustard_url, result.mustard_token, function(){
                    navigate_to_route(result.mustard_route)
                })
            } else {
                console.log(result.mustard_url && result.mustard_route && result.mustard_token && login_token_valid( result.mustard_url, result.mustard_token ));
                console.log(result.mustard_url && result.mustard_route && result.mustard_token);
                console.log(result.mustard_url && result.mustard_route );
                navigate_to_route(root_route)
            }
        });
    };

    router();

    //Handle Logout
    $('.logout').click(function(e){

        //Clear User-Token
        chrome.storage.sync.remove('mustard_token');
        chrome.storage.sync.remove('mustard_route');

        //Display Popup page
        navigate_to_route(root_route);

    })

});