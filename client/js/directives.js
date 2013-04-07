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
        restrict: 'E',
        link: function(scope, element, attrs) {
            element.bind('mousemove', function(evt) {
                evt.preventDefault();
                var touches = evt.changedTouches;
                $(touches).each(function(idx, touch) {
                    console.log(touch.pageX);
                });
            });
        }
    };
});
