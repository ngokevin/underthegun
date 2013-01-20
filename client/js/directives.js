angular.module('poker-app.directives', []).directive('card', function() {
    return {
        restrict: 'E',
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
});
