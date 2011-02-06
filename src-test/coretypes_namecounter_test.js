
TestCase("NameCounterTest", {

    testNestedCount: function () {

        var counter = new tent.coreTypes.NameCounter();

        counter.add('mammals.dogs.labrador_r', 2);
        counter.add('mammals.dogs.golden_r', 1);
        counter.add('mammals.cats', 1);
        counter.add('fishes', 8);
        counter.add('birds', 2);

        assertEquals('(14){mammals(4){dogs(3){labrador_r(2), golden_r}, cats}, fishes(8), birds(2)}', counter + '');

    },

    testNestedCountWithReset: function () {

        var counter = new tent.coreTypes.NameCounter();

        counter.add('mammals.dogs.labrador_r', 2);
        counter.add('mammals.dogs.golden_r', 1);
        counter.add('mammals.cats', 1);
        counter.add('fishes', 8);
        counter.add('birds', 2);

        assertEquals('(14){mammals(4){dogs(3){labrador_r(2), golden_r}, cats}, fishes(8), birds(2)}', counter + '');

        counter.reset();

        counter.add('mammals.dogs.labrador_r', 2);
        counter.add('mammals.dogs.golden_r', 1);
        counter.add('mammals.cats', 1);

        assertEquals('(4){mammals(4){dogs(3){labrador_r(2), golden_r}, cats}}', counter + '');

    }

});
