'use strict';


var foldButton = '#actions span:first-child';

describe('Pass-and-play poker', function() {

    beforeEach(function() {
        browser().navigateTo('/');
    });

    it('fold preflop', function() {
        element('#pnp').click();
        element(foldButton).click();
        expect(element(inactive(foldButton)).count()).toEqual(1);
    });
});

function inactive(selector) {
    return selector + '.inactive';
}