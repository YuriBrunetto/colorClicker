$(function(){
    $(".about-close", ".about-wrap").click(function(){
        $(".about-wrap").removeClass("about-wrap-ativo");
        $(".about-container").removeClass("about-container-ativo");
    });

    //

    var window_height2 = 0;

    $fn_resize = (function(){
        window_height2 = $(window).height() / 2;

        $(".content-color").height(window_height2);
        $(".content-interface").height(window_height2);
        $(".store-wrap, .store").height($(".content-color").height() + $(".content-interface").height());
    });

    $(window).resize(function(){ $fn_resize(); });
    $fn_resize();

    //

    $("#play-the-game").click(function(){
        $(".new-game").addClass("new-game-disabled");
        setTimeout(function(){ $(".new-game").hide(); }, 500);
    });

    //

    // String.prototype.capitalize = function() {
    //     return this.charAt(0).toUpperCase() + this.slice(1);
    // }
    //
    // var $color_img  = $("#store-header-color-img"),
    //     masterColor = window.localStorage.getItem("masterColor");
    //
    // $color_img.attr("src", "http://ybrntt.com.br/colorClickerUltimate/img/" + masterColor + ".png");
    // $color_img.attr("alt", masterColor.capitalize());
});
