$(document).ready(function(){

    /* preventing browser zoom */
    
    // prevent zoom using mouse wheel
    $(window).bind('mousewheel DOMMouseScroll', function (event) {
        if (event.ctrlKey == true) {
        event.preventDefault();
        }
    });
    // prevent zoom using keyboard
    $(document).keydown(function(event) {
        if (event.ctrlKey==true && (event.which == '61' || event.which == '107' || event.which == '173' || event.which == '109'  || event.which == '187'  || event.which == '189'  ) ) {
            event.preventDefault();
        }
    });
});