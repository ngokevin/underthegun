angular.module('poker-app.directives', [])


.directive('card', function() {
    return {
        restrict: 'E',  // on element: <card></card>
        replace: true,
        templateUrl: 'card.html',
        scope: {
            localCard: '@card',
        },
        link: function(scope, element, attrs) {
            scope.$watch('localCard', function(card) {
                if (card) {
                    var card = JSON.parse(card);
                    scope.rank = getRank(card.rank);
                    scope.suit = getSuit(card.suit);
                    scope.suitColor = suitColor(card.suit);

                    scope.undealt = false;
                    scope.facedown = false;
                } else {
                    scope.rank = '';
                    scope.suit = '';
                    if ('hole' in attrs) {
                        scope.facedown = true;
                    } else {
                        scope.undealt = true;
                    }
                }
            });
        },
    };
})


.directive('betSlider', function() {
    return {
        link: function(scope, element, attrs) {
            var $element = $(element);
            var $bar = $('span', $element);

            var step = $element.attr('step');

            // Scope/DOM elements that are not initialized out of game.
            var gs;
            var seat;
            var width;
            var offset;

            var mouseDown = false;
            element.on('mousedown touchstart', function(evt) {
                mouseDown = true;
                if (!width) {
                    width = $element.width();
                } if (!offset) {
                    offset = $bar.offset().left;
                } if (!gs) {
                    gs = scope.gs;
                } if (!seat) {
                    seat = scope.seat;
                }
            });

            element.on('mousemove touchmove', _.throttle(_pd(function(evt) {
                if (!mouseDown) {
                    return;
                }
                var diff;
                if (evt.pageX) {
                    diff = evt.pageX - offset;
                } else {
                    diff = evt.originalEvent.touches[0].pageX - offset;
                }

                if (diff < 0) {
                    scope.raiseAmount = scope.gs.minRaiseTo;
                    $bar.width('0%');
                } else if (diff > width) {
                    scope.raiseAmount = scope.maxRaiseTo;
                    $bar.width('100%');
                } else {
                    var percent = diff / width;
                    $bar.width(percent * 100 + '%');
                    scope.raiseAmount = (
                        // slider-fill/width ~ raiseAmount/maxRaiseTo
                        Math.round(percent * scope.maxRaiseTo / step) *
                        step);
                }
                scope.$apply();
            }), 25));

            element.on('mouseup touchend', function(evt) {
                mouseDown = false;
            });

            scope.$watch('raiseAmount', function(raiseAmount) {
                $bar.width(raiseAmount / scope.maxRaiseTo * 100 + '%');
            });
        }
    };
});
