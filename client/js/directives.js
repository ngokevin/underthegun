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
            var width;
            var offset;

            var mouseDown = false;
            element.on('mousedown', function(evt) {
                mouseDown = true;
                if (!width) {
                    // Slider is initially display:none, calc width if needed.
                    width = $bar.width();
                }
                if (!offset) {
                    offset = $bar.offset().left;
                }
            });

            element.on('mousemove', _.throttle(_pd(function(evt) {
                if (!mouseDown) {
                    return;
                }
                var diff = evt.pageX - offset;
                if (diff < 0 || diff > width) {
                    return;
                }
                var percent = diff / width;
                $bar.width(percent * 100 + '%');
                scope.raiseAmount = Math.round(percent * $element.attr('max'));
                scope.$apply();
            }), 25));

            element.on('mouseup', function(evt) {
                mouseDown = false;
            });
        }
    };
});
