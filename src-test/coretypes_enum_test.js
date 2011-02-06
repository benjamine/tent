
TestCase("EnumTest", {

    testCreateWithStringsAndCSV: function () {

        var colors = new tent.coreTypes.Enum('RED', 'GREEN', 'BLUE', 'CYAN,MAGENTA,YELLOW');

        assertEquals(1, colors.RED);
        assertEquals(2, colors.GREEN);
        assertEquals(3, colors.BLUE);
        assertEquals(4, colors.CYAN);
        assertEquals(5, colors.MAGENTA);
        assertEquals(6, colors.YELLOW);

        assertEquals('RED', colors.getName(1));
        assertEquals('GREEN', colors.getName(2));
        assertEquals('BLUE', colors.getName(3));
        assertEquals('CYAN', colors.getName(4));
        assertEquals('MAGENTA', colors.getName(5));
        assertEquals('YELLOW', colors.getName(6));

    },

    testCreateFlagsWithStringsAndCSV: function () {

        var states = new tent.coreTypes.Enum('_FLAGS,READY,STARTED', 'PAUSED', 'COMPLETE,SUCCEED,ERRORS');
        states.add('FAILED', states.COMPLETE | states.ERRORS)
          .add('DEFAULT', states.READY);

        assertEquals(1, states.READY);
        assertEquals(2, states.STARTED);
        assertEquals(4, states.PAUSED);
        assertEquals(8, states.COMPLETE);
        assertEquals(16, states.SUCCEED);
        assertEquals(32, states.ERRORS);
        assertEquals(8 + 32, states.FAILED);
        assertEquals(1, states.DEFAULT);

        assertEquals(9, states.READY | states.COMPLETE);
        assertEquals(6, states.STARTED | states.PAUSED);

        assertEquals(states.FAILED, states.COMPLETE | states.ERRORS);
        assertEquals(states.ERRORS, states.FAILED & states.ERRORS);
        assertEquals(states.DEFAULT, states.READY);

        assertEquals('READY', states.getName(1));
        assertEquals('STARTED', states.getName(2));
        assertEquals('PAUSED', states.getName(4));
        assertEquals('COMPLETE', states.getName(8));
        assertEquals('SUCCEED', states.getName(16));
        assertEquals('ERRORS', states.getName(32));
        assertEquals('FAILED', states.getName(8 + 32));
        assertEquals('STARTED|SUCCEED', states.getName(2 + 16));
        assertEquals('STARTED|PAUSED|ERRORS', states.getName(2 + 4 + 32));
    }

});