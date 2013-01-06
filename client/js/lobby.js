$(document).ready(function() {
    $('.button').mousedown(function() { $(this).addClass('clicked'); });
    $('.button').mouseup(function() { $(this).removeClass('clicked'); });
    playerId = null;
    socket = null;
    enableFindGame = true;
    lobby();
});

function lobby() {
    $('#find-game').text('Find Game').removeClass('inactive');
    notify('Welcome to Versus Poker!');
    enableFindGame = true;
}

