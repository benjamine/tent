
var overrideNative = false;

TestCase("ArraysTest", {

    testNamespaceExists: function() {
        assertNotNull(tent);
        assertNotNull(tent.arrays);
    },

    testExtend: function() {

        var a = [1, 2, 6];

        assertSame(a, tent.arrays.extend(a, overrideNative));

        assertFunction(a.pushUnique);
        assertFunction(a.indexOf);
        assertFunction(a.lastIndexOf);
        assertFunction(a.filter);
        assertFunction(a.set);
        assertFunction(a.remove);
        assertFunction(a.clone);

    },

    testIndexOf: function() {
        var a = tent.arrays.extend([1, 2, 5, 6, 1, 2, 8, 1, 3], overrideNative);
        var b = a.clone();

        assertEquals(0, a.indexOf(1));
        assertEquals(3, a.indexOf(6));
        a.splice(2, 1);
        assertEquals(2, a.indexOf(6));

        a.splice(2, 0, 5);

        assertTrue(a.isCloneOf(b));
    },

    testLastIndexOf: function() {
        var a = tent.arrays.extend([1, 2, 5, 6, 1, 2, 8, 1, 3], overrideNative);
        var b = a.clone();

        assertEquals(7, a.lastIndexOf(1));
        assertEquals(3, a.lastIndexOf(6));
        a.splice(7, 1);
        assertEquals(4, a.lastIndexOf(1));

        a.splice(7, 0, 1);

        assertTrue(a.isCloneOf(b));
    },

    testIndexOfByRef: function() {
        var c = { prop: 'value' };
        var a = tent.arrays.extend([12, 0, false, '', null, undefined, c, 3], overrideNative);
        var b = a.clone();

        assertEquals(1, a.indexOf(0));
        assertEquals(2, a.indexOf(false));
        assertEquals(3, a.indexOf(''));
        assertEquals(4, a.indexOf(null));
        assertEquals(5, a.indexOf(undefined));
        assertEquals(6, a.indexOf(c));

        assertTrue(a.isCloneOf(b));
    },

    testLastIndexOfByRef: function() {
        var c = { prop: 'value' };
        var a = tent.arrays.extend([12, 0, false, '', null, undefined, c, 3], overrideNative);
        var b = a.clone();

        assertEquals(1, a.lastIndexOf(0));
        assertEquals(2, a.lastIndexOf(false));
        assertEquals(3, a.lastIndexOf(''));
        assertEquals(4, a.lastIndexOf(null));
        assertEquals(5, a.lastIndexOf(undefined));
        assertEquals(6, a.lastIndexOf(c));

        assertTrue(a.isCloneOf(b));
    },

    testFilter: function() {
        var a = tent.arrays.extend([1, 2, 5, 6, 1, 2, 8, 1, 3], overrideNative);
        var b = a.clone();

        var f = a.filter(function(item) { return item % 2 === 0; });
        tent.arrays.extend(f, overrideNative);

        assertTrue(f.isCloneOf([2, 6, 2, 8]));

        assertTrue(a.isCloneOf(b));
    },

    testRemove: function() {
        var a = tent.arrays.extend([1, 2, 5, 6, 1, 2, 8, 1, 3], overrideNative);
        var b = a.clone();

        a.remove(1);
        assertTrue(a.isCloneOf([2, 5, 6, 2, 8, 3]));
        a.remove(2);
        assertTrue(a.isCloneOf([5, 6, 8, 3]));
        a.remove(3);
        assertTrue(a.isCloneOf([5, 6, 8]));
    },

    testSet: function() {
        var a = tent.arrays.extend([1, 2, 5, 6, 1, 2, 8, 1, 3], overrideNative);
        var b = a.clone();

        a.set(2, 115);
        assertTrue(a.isCloneOf([1, 2, 115, 6, 1, 2, 8, 1, 3]));
        a.set(4, 111);
        assertTrue(a.isCloneOf([1, 2, 115, 6, 111, 2, 8, 1, 3]));
        a.set(6, 118);
        assertTrue(a.isCloneOf([1, 2, 115, 6, 111, 2, 118, 1, 3]));
        a.set(2, 5);
        a.set(4, 1);
        a.set(6, 8);

        assertTrue(a.isCloneOf(b));
    },

    testPushUnique: function() {
        var a = tent.arrays.extend([1, 2, 5, 6, 1, 2, 8, 1, 3], overrideNative);
        var b = a.clone();

        a.pushUnique(1);
        assertTrue(a.isCloneOf(b));
        a.pushUnique(2);
        assertTrue(a.isCloneOf(b));
        a.pushUnique(1, 2, 5, 6, 6, 8, 3);
        assertTrue(a.isCloneOf(b));

        a.pushUnique(43);
        a.pushUnique(43, 43, 44);
        a.pushUnique(5, 6, 44);

        b.push(43, 44);

        assertTrue(a.isCloneOf(b));
    },

    testCloneAndIsCloneOf: function() {
        var a = tent.arrays.extend([1, 2, 5, 6, 1, 2, 8, 1, 3], overrideNative);
        var b = a.clone();
        assertTrue(a.isCloneOf(b));
    }

});