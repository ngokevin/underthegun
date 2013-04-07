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

            var mouseDown = false;

            element.bind('mousedown', function(evt) {
                mouseDown = true;
            });

            var offset = $bar.offset().left;
            var width = $bar.width();
            element.bind('mousemove', _.throttle(_pd(function(evt) {
                if (!mouseDown) {
                    return;
                }
                var diff = evt.pageX - offset;
                if (diff < 0 || diff > width) {
                    return;
                }
                var percent = (evt.pageX - offset) / width;
                $bar.width(percent * 100 + '%');
            }), 50));

            element.bind('mouseup', function(evt) {
                mouseDown = false;
            });
        }
    };
});
