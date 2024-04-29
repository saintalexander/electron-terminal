// Function to add 'collapse' class and disable terminal, affecting visual appearance
function exit() {
    $('.tv').addClass('collapse');
    term.disable();
}

// Function to adjust visual effect properties based on window size
function set_size() {
    var height = $(window).height();
    var width = $(window).width();
    var time = (height * 2) / 170;
    $('.scanlines')[0].style.setProperty("--time", time);
    $('.tv')[0].style.setProperty("--width", width);
    $('.tv')[0].style.setProperty("--height", height);
}