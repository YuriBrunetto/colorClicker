$(function(){
    $(".about-close", ".about-wrap").click(function(){
        $(".about-wrap").removeClass("about-wrap-ativo");
        $(".about-container").removeClass("about-container-ativo");
    });

    //
    var window_height = 0,
        content_interface_height = 0,
        store_height = 0;

    $fn_resize = (function(){
        window_height = $(window).height() / 2;
        content_interface_height = window_height;

        $(".content-color").height(window_height);
        $(".content-interface").height(content_interface_height);
        $(".store-wrap").height(window_height);
    });

    $(window).resize(function(){ $fn_resize(); });
    $fn_resize();

    //

    $("#play-the-game").click(function(){
        $(".new-game").addClass("new-game-disabled");
        setTimeout(function(){ $(".new-game").hide(); }, 500);
    });
});
